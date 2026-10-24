import type { Day, Step, StoredState } from './types.ts';
import { isObj, normalizeSearch, validateState } from './lib.ts';
import { activeSteps } from './day-preparation.ts';
import { dateInTimezone } from './time.ts';

// This is a closed command vocabulary, never an evaluator or a language model tool API.
export const assistantFields = { title: 100, description: 5000, address: 500, chineseName: 200, period: 200 } as const;
export type AssistantField = keyof typeof assistantFields;
export type AssistantAction =
  | { kind: 'note'; stepId: string; text: string }
  | { kind: 'field'; stepId: string; field: AssistantField; value: string }
  | { kind: 'move'; stepId: string; destinationDayId: string }
  | { kind: 'lighten'; dayId: string; keep: string[]; label: string; alternativeId: string };
export type AssistantChange = { location: string; field: string; before: string; after: string };
export type AssistantProposal = { scope: string; action: AssistantAction; before: StoredState; after: StoredState; changes: AssistantChange[] };
export const assistantRevision = (state: StoredState) => JSON.stringify(state);
const fail = (message = 'Action invalide ou non autorisée.') : never => { throw new Error(message); };
const exact = (v: Record<string, unknown>, fields: string[]) => Object.keys(v).length === fields.length && Object.keys(v).every(k => fields.includes(k));
const id = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.length <= 200;
const bounded = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
function validAction(v: unknown): v is AssistantAction {
  if (!isObj(v)) return false;
  switch (v.kind) {
    case 'note': return exact(v, ['kind','stepId','text']) && id(v.stepId) && bounded(v.text, 4000) && !!v.text.trim();
    case 'field': return exact(v, ['kind','stepId','field','value']) && id(v.stepId) && typeof v.field === 'string' && Object.hasOwn(assistantFields,v.field) && bounded(v.value,assistantFields[v.field as AssistantField]) && (v.field !== 'title' || !!v.value.trim());
    case 'move': return exact(v, ['kind','stepId','destinationDayId']) && id(v.stepId) && id(v.destinationDayId);
    case 'lighten': return exact(v, ['kind','dayId','keep','label','alternativeId']) && id(v.dayId) && id(v.alternativeId) && bounded(v.label,100) && !!v.label.trim() && Array.isArray(v.keep) && v.keep.length > 0 && v.keep.length <= 1000 && v.keep.every(id) && new Set(v.keep).size === v.keep.length;
    default: return false;
  }
}
export const assistantCategory = (action: AssistantAction) => action.kind === 'note' ? 'notes' : action.kind === 'lighten' ? 'preparation' : undefined;
const dayLocation = (city: string, day: Day) => `${city} · ${day.title}${day.date ? ' · '+day.date : ''}`;
export function prepareAssistant(state: StoredState, scope: string, raw: unknown): AssistantProposal {
  if (!state.journey || !validateState(state) || !id(scope) || !validAction(raw)) return fail();
  const action = structuredClone(raw), before = structuredClone(state), after = structuredClone(state);
  const days = after.cities.flatMap(city => city.days.map(day => ({city,day})));
  const changes: AssistantChange[] = [];
  const target = 'stepId' in action ? days.flatMap(({city,day}) => day.steps.filter(step => step.id === action.stepId).map(step => ({city,day,step})))[0] : undefined;
  if ('stepId' in action && !target) return fail();
  if (action.kind === 'lighten') {
    const item = days.find(d => d.day.id === action.dayId);
    if (!item) return fail();
    const {city,day} = item, p = day.preparation || {};
    if (p.activeAlternativeId || (p.alternatives?.length || 0) >= 8 || p.alternatives?.some(a => a.id === action.alternativeId) || action.keep.some(key => !day.steps.some(s => s.id === key)) || action.keep.length >= day.steps.length) return fail('Choisis une partie des activités du plan initial.');
    if (day.steps.some(s => (s.booking || state.bookings.includes(s.id) || p.anchorStepId === s.id) && !action.keep.includes(s.id))) return fail('Conserve les activités réservées, à réserver et l’activité principale.');
    // Order is inherited from the actual day, never from generated instructions.
    const stepIds = day.steps.filter(s => action.keep.includes(s.id)).map(s => s.id);
    day.preparation = {...p, alternatives:[...(p.alternatives || []), {id:action.alternativeId,label:action.label,reason:'fatigue',stepIds}], activeAlternativeId:action.alternativeId};
    changes.push({location:dayLocation(city.name,day),field:'Programme actif',before:day.steps.map(s => s.title).join('\n'),after:stepIds.map(key => day.steps.find(s => s.id === key)!.title).join('\n')});
  } else if (target) {
    const {city,day,step} = target, location = dayLocation(city.name,day)+' · '+step.title;
    if (action.kind === 'note') {
      const previous = Object.hasOwn(after.notes,step.id) ? after.notes[step.id] : '', next = [previous,action.text.trim()].filter(Boolean).join('\n');
      if (next.length > 10000) return fail('La note complète est limitée à 10 000 caractères.');
      // defineProperty also handles imported identifiers such as __proto__ safely.
      Object.defineProperty(after.notes,step.id,{value:next,enumerable:true,configurable:true,writable:true});
      changes.push({location,field:'Note',before:previous,after:next});
    } else if (action.kind === 'field') {
      if ((action.field === 'title' && step.place?.values.title) || (action.field === 'chineseName' && (step.place?.values.chineseName || step.place?.values.localName))) return fail('Retire d’abord l’association du lieu pour modifier ce champ.');
      changes.push({location,field:action.field,before:step[action.field] || '',after:action.value});
      step[action.field] = action.value;
    } else {
      const destination = days.find(d => d.day.id === action.destinationDayId);
      if (!destination || destination.day.id === day.id || destination.day.steps.length >= 1000) return fail('Choisis une autre journée de destination.');
      if (step.booking || state.bookings.includes(step.id)) return fail('Cette activité est réservée ou à réserver. Modifie son programme manuellement.');
      // Do not drop timings, anchors, alternatives or transfer evidence on a move.
      const p = day.preparation;
      if (p?.activeAlternativeId || destination.day.preparation?.activeAlternativeId || p?.anchorStepId === step.id || p?.timings?.[step.id] || Object.values(p?.timings || {}).some(t => t.fromStepId === step.id) || p?.alternatives?.some(a => a.stepIds.includes(step.id))) return fail('Cette activité dépend d’une préparation. Modifie son programme manuellement.');
      day.steps = day.steps.filter(s => s.id !== step.id);
      destination.day.steps.push(step);
      changes.push({location,field:'Journée',before:dayLocation(city.name,day),after:dayLocation(destination.city.name,destination.day)});
    }
  }
  if (!validateState(after) || assistantRevision(before) === assistantRevision(after)) return fail('Aucun changement à appliquer.');
  return {scope,action,before,after,changes};
}

export type SearchHit = { location: string; text: string; cityId?: string; dayId?: string };
/** Literal local search. Sources are inert text, including prompt injection strings. */
export function searchNotebook(state: StoredState, query: string): SearchHit[] {
  const q = normalizeSearch(query.trim().slice(0,200));
  if (!q) return [];
  const hits: SearchHit[] = [];
  const add = (location: string, text: string, cityId?: string, dayId?: string) => {
    const index = normalizeSearch(location+'\n'+text).indexOf(q);
    if (index >= 0 && hits.length < 40) { const start = Math.max(0,index-location.length-100); hits.push({location,text:text.slice(start,start+500),cityId,dayId}); }
  };
  add(state.journey?.title || '',[state.journey?.destinations,state.journey?.description,state.journey?.highlights,state.notes.general].filter(Boolean).join('\n'));
  for (const c of state.cities) {
    add(c.name,[c.subtitle,c.chineseName,...c.notes,state.notes[c.id]].filter(Boolean).join('\n'),c.id);
    for (const d of c.days) {
      add(dayLocation(c.name,d),state.notes[d.id] || '',c.id,d.id);
      for (const s of d.steps) add(dayLocation(c.name,d)+' · '+s.title,[s.description,s.chineseName,s.address,s.period,state.notes[s.id],s.place?.values.title,s.place?.values.localName].filter(Boolean).join('\n'),c.id,d.id);
    }
  }
  for (const s of state.stays || []) add(s.name,[s.chineseName,s.address,s.notes,s.checkIn,s.checkOut].join('\n'),s.cityId);
  for (const t of state.transfers || []) add(t.label,[t.departure,t.arrival,t.fromStation,t.toStation,t.reference,t.notes].join('\n'),t.fromCityId);
  for (const b of [...state.bonusCatalog || [],...state.customBonus || []]) add(b.title,[b.description,b.address,b.chineseName,b.tip,state.notes[b.id]].filter(Boolean).join('\n'),b.cityId);
  for (const d of state.documents || []) add(d.title,d.content);
  for (const e of state.expenses || []) add(e.label,[e.amount,e.currency,e.date,e.category].filter(v=>v!==undefined).join(' '),e.cityId);
  for (const p of state.packing || []) add(p.label,'');
  for (const p of state.phrases || []) add(p.meaning,[p.local,p.pronunciation].join('\n'));
  return hits;
}
/** Calendar addition in each destination's zone; never add 24h to a local instant. */
export function tomorrowDays(state: StoredState, now = new Date()) {
  return state.cities.flatMap(city => {
    const zone = city.timezone || state.journey!.timezone, today = dateInTimezone(zone,now);
    const date = new Date(today+'T12:00:00Z'); date.setUTCDate(date.getUTCDate()+1);
    const tomorrow = date.toISOString().slice(0,10);
    return city.days.filter(day => day.date === tomorrow).map(day => ({city,day,zone}));
  });
}
export function lightKeep(day: Day, bookings: string[]): Step[] {
  return activeSteps(day).filter(s => !s.optional || s.booking || bookings.includes(s.id) || day.preparation?.anchorStepId === s.id);
}
