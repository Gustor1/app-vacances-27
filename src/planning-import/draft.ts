import { isObj, isValidDate, isValidDateTime, uid, validateState, validCurrency } from '../lib.ts';
import { blankTrip } from '../journeys.ts';
import { validTimezone } from '../time.ts';
import type { StoredState } from '../types';
import { MAX_SOURCE_LENGTH, type DraftItem, type PlanningDraft, type Provenance } from './types.ts';
import { isSourceNormalization } from './normalizations.ts';
import { hasConfirmedBooking } from './booking.ts';

const categories = ['visit', 'food', 'transport', 'hotel', 'walk', 'shopping'];
const itemKeys = ['title','category','description','address','period','time','optional','booked','kind','coordinates','checkIn','checkOut','departure','arrival','toCity','mode','reference','excluded','evidence'];
const literalFields = new Set(['title','name','description','address','date','time','period','checkIn','checkOut','departure','arrival','toCity','reference']);
const error = () => { throw new Error('Le brouillon contient une valeur invalide ou sans source vérifiable.'); };
function object(value: unknown, keys: string[]) {
  if (!isObj(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(value, key))) error();
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2000, required = false): asserts value is string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) error();
}
function evidence(record: Record<string, unknown>, source: string, allowUser: boolean, allowed: string[]) {
  if (!isObj(record.evidence)) error();
  const result = record.evidence as Provenance;
  for (const [field, raw] of Object.entries(result)) {
    if (!allowed.includes(field) || field === 'evidence') error();
    const e = object(raw, ['origin', 'quote']);
    text(e.quote, MAX_SOURCE_LENGTH);
    if (!['source','missing','conflict','suggestion', ...(allowUser ? ['user'] : [])].includes(String(e.origin))) error();
    if (e.origin !== 'user' && e.origin !== 'missing' && (!e.quote || !source.includes(e.quote))) error();
    const value = record[field];
    if (e.origin === 'missing' && value !== '' && value !== null && value !== false) error();
    if (e.origin !== 'user' && e.origin !== 'missing' && literalFields.has(field) && typeof value === 'string' && value && !e.quote.includes(value) && !isSourceNormalization(field,value,e.quote)) error();
    if (e.origin !== 'user' && e.origin !== 'missing' && field === 'coordinates' && Array.isArray(value)) {
      const numbers = (e.quote.match(/[+-]?\d+(?:\.\d+)?/g) || []).map(Number);
      if (!value.every(n => numbers.includes(n))) error();
    }
  }
  for (const field of [...literalFields, 'coordinates', 'booked']) {
    const value = record[field];
    if (Object.hasOwn(record, field) && value !== '' && value !== null && value !== false && !result[field]) error();
  }
  if (record.booked === true && result.booked?.origin !== 'user') {
    const quote = result.booked?.quote || '';
    if (result.booked?.origin !== 'source' || !hasConfirmedBooking(quote)) error();
  }
}
export function blankItem(title = ''): DraftItem {
  return { title, category:'visit', description:'', address:'', period:'', time:'', optional:false, booked:false,
    kind:'activity', coordinates:null, checkIn:'', checkOut:'', departure:'', arrival:'', toCity:'', mode:'other', reference:'', excluded:false,
    evidence: title ? { title: { origin:'user', quote:'' } } : {} };
}
export function validateSource(source: string) {
  if (typeof source !== 'string' || !source.trim() || source.length > MAX_SOURCE_LENGTH) throw new Error('Le programme doit contenir entre 1 et 50 000 caractères.');
}
/** Validate the untrusted response before it can enter a review or a trip. */
export function validateDraft(value: unknown, source: string, allowUser = false, allowIncomplete = false): PlanningDraft {
  if (allowUser && (allowIncomplete || source === '')) { if (typeof source !== 'string' || source.length > MAX_SOURCE_LENGTH) error(); }
  else validateSource(source);
  const root = object(value, ['version','title','cities','notes','evidence']);
  if (root.version !== 1) error();
  text(root.title, 140, !allowIncomplete); evidence(root, source, allowUser, ['title']);
  if (!Array.isArray(root.notes) || root.notes.length > 300) error();
  for (const note of root.notes as unknown[]) { text(note, MAX_SOURCE_LENGTH); if (!allowUser && !source.includes(note as string)) error(); }
  if (!Array.isArray(root.cities) || !root.cities.length || root.cities.length > 100) error();
  let total = 0;
  for (const city of root.cities as unknown[]) {
    const c = object(city, ['name','days','evidence']); text(c.name, 200, !allowIncomplete); evidence(c, source, allowUser, ['name']);
    if (!Array.isArray(c.days) || c.days.length > 365) error();
    for (const day of c.days as unknown[]) {
      const d = object(day, ['title','date','items','evidence']); text(d.title, 200, !allowIncomplete); text(d.date, 10);
      if (d.date && !isValidDate(d.date)) error(); evidence(d, source, allowUser, ['title','date']);
      if (!Array.isArray(d.items) || d.items.length > 1000) error();
      for (const item of d.items as unknown[]) {
        if (++total > 2000) error();
        const i = object(item, itemKeys);
        for (const key of ['title','description','address','period','time','checkIn','checkOut','departure','arrival','toCity','reference']) text(i[key], key === 'description' ? 10000 : key === 'title' ? 300 : 2000, key === 'title' && !allowIncomplete && !i.excluded);
        if (!categories.includes(String(i.category)) || !['activity','stay','transfer','suggestion','alternative'].includes(String(i.kind)) || !['train','plane','bus','car','other'].includes(String(i.mode))) error();
        if (['optional','booked','excluded'].some(key => typeof i[key] !== 'boolean')) error();
        if (!allowUser && i.excluded) error();
        if (allowUser && i.excluded) { if (!isObj(i.evidence)) error(); continue; }
        for (const key of ['checkIn','checkOut']) if (i[key] && !isValidDate(i[key])) error();
        for (const key of ['departure','arrival']) if (i[key] && !isValidDateTime(i[key])) error();
        if (i.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(i.time))) error();
        if (i.coordinates !== null && (!Array.isArray(i.coordinates) || i.coordinates.length !== 2 || !i.coordinates.every(n => typeof n === 'number' && Number.isFinite(n)) || Math.abs(i.coordinates[0]) > 90 || Math.abs(i.coordinates[1]) > 180)) error();
        if (i.checkIn && i.checkOut && String(i.checkOut) < String(i.checkIn)) error();
        evidence(i, source, allowUser, itemKeys);
      }
    }
  }
  return structuredClone(value) as PlanningDraft;
}
export function correctField<T extends { evidence: Provenance }>(record: T, field: keyof T, value: T[keyof T]): T {
  return { ...record, [field]: value, evidence: { ...record.evidence, [field]: { origin:'user', quote:'' } } };
}
export function applyDepartureDate(draft: PlanningDraft, date: string): PlanningDraft {
  if (!isValidDate(date)) error();
  let index = 0;
  return { ...draft, cities:draft.cities.map(c => ({ ...c, days:c.days.map(day => {
    const shifted = new Date(date + 'T00:00:00Z'); shifted.setUTCDate(shifted.getUTCDate() + index++);
    return day.date ? day : correctField(day, 'date', shifted.toISOString().slice(0,10));
  }) })) };
}
export function unstructuredNotes(draft: PlanningDraft, source: string): string[] {
  const notes = [...draft.notes];
  for (const city of draft.cities) {
    let stays = 0;
    for (const item of city.days.flatMap(day => day.items).filter(item => !item.excluded)) {
      const details = [item.description,item.reference,item.departure,item.arrival].filter(Boolean).join('\n');
      if (item.kind === 'stay' && ++stays > 1) notes.push([item.title,item.address,item.checkIn,item.checkOut,details].filter(Boolean).join('\n'));
      if (item.kind === 'transfer' && draft.cities.filter(c => c.name === item.toCity).length !== 1) notes.push([item.title,item.toCity,item.mode,details].filter(Boolean).join('\n'));
    }
  }
  const records = [draft, ...draft.cities, ...draft.cities.flatMap(c => c.days), ...draft.cities.flatMap(c => c.days.flatMap(d => d.items))];
  const mappedValues = new Set(records.flatMap(r => Object.entries(r).filter(([key,value]) => literalFields.has(key) && typeof value === 'string' && value).map(([,value]) => value as string)));
  // A broad citation proves provenance, not that every detail inside it was mapped.
  const uncovered = source.split(/\r?\n/).filter(line => line.trim() && !mappedValues.has(line.trim()) && !notes.some(note => note.includes(line.trim())));
  return [...new Set([...notes,...uncovered])];
}
export function draftSummary(draft: PlanningDraft, source?: string) {
  const days = draft.cities.flatMap(c => c.days);
  const items = days.flatMap(d => d.items).filter(i => !i.excluded);
  const records = [draft, ...draft.cities, ...days, ...items];
  return { days:days.length, activities:items.filter(i => !['suggestion','alternative'].includes(i.kind)).length,
    suggestions:items.filter(i => ['suggestion','alternative'].includes(i.kind)).length,
    unstructured:source === undefined ? draft.notes.length : unstructuredNotes(draft,source).length,
    missing:days.filter(d => !d.date).length + items.filter(i => !i.address).length,
    conflicts:records.reduce((n,r) => n + Object.values(r.evidence).filter(e => e.origin === 'conflict').length,0),
    unknownPlaces:items.filter(i => !i.coordinates).length };
}

/** Keep unmappable material in readable documents, never in money or booking fields. */
export function draftToTrip(draft: PlanningDraft, options: { id?: string; source: string; keepSource: boolean; departureDate: string; currency: string; timezone: string }): StoredState {
  draft = validateDraft(draft, options.source, true);
  if (draftSummary(draft).conflicts) throw new Error('Corrige ou écarte les conflits avant de créer le carnet.');
  if (!validCurrency(options.currency) || !validTimezone(options.timezone) || (options.departureDate && !isValidDate(options.departureDate))) error();
  const state = blankTrip({ title:draft.title, ...(options.id ? { id:options.id } : {}), currency:options.currency, timezone:options.timezone, status:'planning', destinations:draft.cities.map(c => c.name).join(', ') });
  state.departureDate = options.departureDate;
  state.cities = draft.cities.map(c => ({ id:uid('city'), name:c.name, chineseName:'', subtitle:'', color:'#367967', image:'/travel-landscape.svg', notes:[], days:c.days.map(d => ({ id:uid('day'), title:d.title, ...(d.date ? { date:d.date } : {}), steps:[] })) }));
  state.stays = []; state.transfers = []; state.customBonus = [];
  draft.cities.forEach((city, ci) => city.days.forEach((day, di) => {
    const destination = state.cities[ci], target = destination.days[di];
    for (const item of day.items.filter(i => !i.excluded)) {
      const id = uid('step');
      const details = [item.description, item.reference, item.departure, item.arrival].filter(Boolean).join('\n');
      if (item.kind === 'suggestion' || item.kind === 'alternative') {
        const description = [item.kind === 'alternative' ? '[Alternative]' : '[Suggestion]', details, item.period, item.time, item.checkIn, item.checkOut, item.toCity].filter(Boolean).join('\n');
        state.customBonus!.push({ id, cityId:destination.id, title:item.title, category:['food','shopping'].includes(item.category) ? item.category as 'food'|'shopping' : 'visit', description, address:item.address });
        continue;
      }
      target.steps.push({ id, title:item.title, category:item.kind === 'stay' ? 'hotel' : item.kind === 'transfer' ? 'transport' : item.category, description:details, ...(item.address ? { address:item.address } : {}), ...(item.period || item.time ? { period:[item.period,item.time].filter(Boolean).join(' · ') } : {}), optional:item.optional, ...(item.coordinates ? { coordinates:item.coordinates } : {}) });
      if (item.time) target.preparation = { ...target.preparation, timings: { ...target.preparation?.timings, [id]: { startTime:item.time, source:'Planning importé' } } };
      if (item.booked) state.bookings.push(id);
      if (item.kind === 'stay') {
        if (!state.stays!.some(s => s.cityId === destination.id)) state.stays!.push({ cityId:destination.id, name:item.title, chineseName:'', address:item.address, checkIn:item.checkIn, checkOut:item.checkOut, notes:details });
      }
      if (item.kind === 'transfer') {
        const matches = state.cities.filter(c => c.name === item.toCity);
        if (matches.length === 1) state.transfers!.push({ id:uid('transfer'), fromCityId:destination.id, toCityId:matches[0].id, label:item.title, mode:item.mode, departure:item.departure, arrival:item.arrival, fromStation:item.address, toStation:'', reference:item.reference, notes:item.description, booked:item.booked });
      }
    }
  }));
  const unmapped = unstructuredNotes(draft,options.source);
  state.documents = [];
  if (unmapped.length) state.documents.push({ id:uid('document'), title:'Planning — notes non structurées', content:[...new Set(unmapped)].join('\n\n') });
  if (options.keepSource) state.documents.push({ id:uid('document'), title:'Planning — texte original', content:options.source });
  if (!validateState(state)) error();
  return state;
}
