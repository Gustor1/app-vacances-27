import type { Bonus, City, Day, Step, StoredState } from './types.ts';
import { activeSteps, clockMinutes } from './day-preparation.ts';
import { placeStep } from './places/model.ts';

export type RequiredField = 'address' | 'chineseName' | 'duration';
export type CompanionState = {
  requirements: { id: string; stepId: string; field: RequiredField }[];
  dismissed: { id: string; fingerprint: string }[];
  excluded: string[];
};
export const emptyCompanion = (): CompanionState => ({ requirements: [], dismissed: [], excluded: [] });
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function validCompanion(v: unknown): v is CompanionState {
  if (v === undefined) return true;
  if (!obj(v) || Object.keys(v).some(k => !['requirements', 'dismissed', 'excluded'].includes(k))) return false;
  return Array.isArray(v.requirements) && v.requirements.length <= 500 && v.requirements.every(r => obj(r) && Object.keys(r).every(k => ['id','stepId','field'].includes(k)) && text(r.id) && text(r.stepId) && typeof r.field === 'string' && ['address','chineseName','duration'].includes(r.field)) && new Set(v.requirements.map(r => r.id)).size === v.requirements.length
    && Array.isArray(v.dismissed) && v.dismissed.length <= 2000 && v.dismissed.every(r => obj(r) && Object.keys(r).every(k => ['id','fingerprint'].includes(k)) && text(r.id, 1000) && text(r.fingerprint, 16000)) && new Set(v.dismissed.map(r => r.id)).size === v.dismissed.length
    && Array.isArray(v.excluded) && v.excluded.length <= 2000 && v.excluded.every(id => text(id));
}
export type DepartureIssue = { id: string; fingerprint: string; kind: 'booking' | 'required' | 'overlap'; city: City; day: Day; step: Step; other?: Step; field?: RequiredField };
/** Only explicit evidence is a warning. Free text periods and missing optional fields prove nothing. */
export function departureIssues(state: StoredState, includeDismissed = false): DepartureIssue[] {
  const issues: DepartureIssue[] = [];
  for (const city of state.cities) for (const day of city.days) {
    const steps = activeSteps(day).filter(s => !state.done.includes(s.id));
    const context = [city.id, day.id, day.date, city.timezone || state.journey?.timezone];
    const add = (kind: DepartureIssue['kind'], step: Step, evidence: unknown, extra: Partial<DepartureIssue> = {}) => {
      const id = JSON.stringify([kind, step.id, extra.other?.id, extra.field]);
      issues.push({ id, fingerprint: JSON.stringify([context, step.title, evidence]), kind, city, day, step, ...extra });
    };
    for (const step of steps) {
      if (step.booking && !state.bookings.includes(step.id)) add('booking', step, [step.booking, false]);
      for (const r of state.companion?.requirements || []) if (r.stepId === step.id) {
        const value = r.field === 'duration' ? day.preparation?.timings?.[step.id]?.durationMinutes : placeStep(step)[r.field];
        if (value === undefined || (typeof value === 'string' && !value.trim())) add('required', step, [r.id, r.field, value], {field:r.field});
      }
    }
    // Pairwise intervals catch non-adjacent overlaps, even if a middle activity has unknown timing.
    steps.forEach((step, index) => {
      const a = day.preparation?.timings?.[step.id], start = clockMinutes(a?.startTime);
      if (start === undefined || a?.durationMinutes === undefined || a.durationMinutes === 0) return;
      for (const other of steps.slice(index + 1)) {
        const b = day.preparation?.timings?.[other.id], next = clockMinutes(b?.startTime);
        if (next !== undefined && b?.durationMinutes !== undefined && b.durationMinutes > 0 && start < next + b.durationMinutes && next < start + a.durationMinutes) add('overlap', step, [a.startTime, a.durationMinutes, other.title, b.startTime, b.durationMinutes], {other});
      }
    });
  }
  const unique = [...new Map(issues.map(i => [i.id, i])).values()];
  return includeDismissed ? unique : unique.filter(i => !state.companion?.dismissed.some(d => d.id === i.id && d.fingerprint === i.fingerprint));
}
export function dismissIssue(state: StoredState, issue: DepartureIssue): StoredState {
  if (!departureIssues(state, true).some(i => i.id === issue.id && i.fingerprint === issue.fingerprint)) return state;
  const p = state.companion || emptyCompanion();
  return {...state, companion:{...p, dismissed:[...p.dismissed.filter(d => d.id !== issue.id), {id:issue.id,fingerprint:issue.fingerprint}].slice(-2000)}};
}
const normalized = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
/** Conservative duplicate guard: identical names in a city need manual review, not a second automatic visit. */
const samePlace = (a: Pick<Step,'title'|'chineseName'|'address'>, b: Pick<Step,'title'|'chineseName'|'address'>) => normalized(a.title) === normalized(b.title) || !!(a.chineseName?.trim() && b.chineseName?.trim() && normalized(a.chineseName) === normalized(b.chineseName)) || !!(a.address?.trim() && b.address?.trim() && normalized(a.address) === normalized(b.address));
export type LocalIdea = { id: string; step: Step; favorite: boolean; duration?: number; sourceDayId?: string };
export function localIdeas(state: StoredState, city: City, day: Day): LocalIdea[] {
  const planned = city.days.flatMap(d => d.steps.map(s => ({day:d,step:s})));
  const bonuses: LocalIdea[] = [...(state.bonusCatalog || []), ...(state.customBonus || [])].filter(b => b.cityId === city.id).map((b: Bonus) => ({id:b.id, favorite:state.favorites.includes(b.id),step:{id:b.id,title:b.title,chineseName:b.chineseName,address:b.address,description:b.description,category:b.category === 'photo' ? 'visit' : b.category,amapUrl:b.amapUrl}}));
  const optional: LocalIdea[] = city.days.filter(d => d.id !== day.id).flatMap(d => d.steps.filter(s => s.optional).map(s => ({id:s.id,step:s,favorite:state.favorites.includes(s.id),duration:d.preparation?.timings?.[s.id]?.durationMinutes,sourceDayId:d.id})));
  const candidates = [...bonuses, ...optional].filter(i => !state.done.includes(i.id) && !state.companion?.excluded.includes(i.id) && !planned.some(p => (p.day.id === day.id || state.done.includes(p.step.id) || !i.sourceDayId) && samePlace(i.step,p.step)));
  return candidates.filter((idea,index) => candidates.findIndex(i => samePlace(i.step,idea.step)) === index);
}
export function addIdea(state: StoredState, cityId: string, dayId: string, idea: LocalIdea, stepId: string): StoredState {
  const city = state.cities.find(c => c.id === cityId), day = city?.days.find(d => d.id === dayId);
  if (!city || !day || day.preparation?.activeAlternativeId || day.steps.length >= 1000 || state.cities.some(c => c.days.some(d => d.steps.some(s => s.id === stepId)))) return state;
  const latest = localIdeas(state,city,day).find(i => i.id === idea.id);
  if (!latest || JSON.stringify(latest) !== JSON.stringify(idea)) return state;
  // Do not copy private notes, tips, reservation flags, or completed state into a shared programme.
  const s = latest.step;
  const step: Step = {id:stepId,title:s.title,chineseName:s.chineseName,address:s.address,description:s.description,category:s.category,amapUrl:s.amapUrl,coordinates:s.coordinates};
  return {...state,cities:state.cities.map(c => c.id !== cityId ? c : {...c,days:c.days.map(d => d.id !== dayId ? d : {...d,steps:[...d.steps,step]})})};
}
/** Undo just this addition. Never erase a later note, booking, completion, edit or preparation. */
export function undoIdea(state: StoredState, inserted: Step): StoredState {
  if (state.notes[inserted.id] || state.bookings.includes(inserted.id) || state.done.includes(inserted.id)) return state;
  const day = state.cities.flatMap(c => c.days).find(d => d.steps.some(s => s.id === inserted.id));
  const p = day?.preparation;
  if (!day || JSON.stringify(day.steps.find(s => s.id === inserted.id)) !== JSON.stringify(inserted) || p?.timings?.[inserted.id] || p?.anchorStepId === inserted.id || p?.alternatives?.some(a => a.stepIds.includes(inserted.id))) return state;
  return {...state,cities:state.cities.map(c => ({...c,days:c.days.map(d => d.id !== day.id ? d : {...d,steps:d.steps.filter(s => s.id !== inserted.id)})}))};
}
/** Explicit whitelist for the screen handed to somebody else. Never spread a Stay/Step. */
export function showCard(place: {name?: string;title?: string;chineseName?: string;address?: string}) {
  return {title:place.title || place.name || '',chineseName:place.chineseName || '',address:place.address || ''};
}
