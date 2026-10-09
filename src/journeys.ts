import type { CollectionArchive, Journey, StoredState, TripArchive } from './types';
import { BACKUP_KEY, STORAGE_KEY, isObj, parseBackup, uid, validateState } from './lib.ts';
import { initialCities } from './data/trip.ts';
import { legacyCatalog } from './data/legacy-catalog.ts';
import { chinaPhrases } from './data/china-phrases.ts';
import { bonusItems } from './data/bonus.ts';
import { mergeCatalog } from './persistence.ts';

export const TRIP_PREFIX = 'a-l-est-trip-v2:';
export const RECOVERY_PREFIX = 'a-l-est-recovery-v2:';
export const MIGRATION_KEY = 'a-l-est-migration-v2';
export const LEGACY_COPY_KEY = 'a-l-est-legacy-source-v1';
export const LEGACY_RECOVERY_COPY_KEY = 'a-l-est-legacy-recovery-v1';
export const tripKey = (id: string) => TRIP_PREFIX + id;
export const recoveryKey = (id: string) => RECOVERY_PREFIX + id;
export type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'key' | 'length'>;

export function archive(state: StoredState): TripArchive {
  if (!state.journey || !validateState(state)) throw new Error('Carnet invalide.');
  return { version: 2, scope: 'trip', id: state.journey.id, state };
}
export function parseTrip(raw: string): TripArchive {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('La sauvegarde locale est illisible. La source originale est conservée.'); }
  if (!isObj(value) || value.version !== 2 || value.scope !== 'trip' || !validateState(value.state) || !value.state.journey || value.id !== value.state.journey.id) throw new Error('Format de carnet inconnu ou invalide.');
  return value as TripArchive;
}
export function readTrip(storage: Storage, id: string): StoredState {
  const raw = storage.getItem(tripKey(id));
  if (!raw) throw new Error('Ce carnet est introuvable.');
  const value = parseTrip(raw);
  if (value.id !== id) throw new Error('L’identité du carnet ne correspond pas à sa sauvegarde.');
  return value.state;
}
export function writeTrip(storage: Storage, state: StoredState) {
  const raw = JSON.stringify(archive(state));
  const key = tripKey(state.journey!.id);
  storage.setItem(key, raw);
  if (storage.getItem(key) !== raw) throw new Error('La sauvegarde n’a pas pu être relue.');
  return raw;
}
export function listTrips(storage: Storage): StoredState[] {
  const result: StoredState[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(TRIP_PREFIX)) result.push(readTrip(storage, key.slice(TRIP_PREFIX.length)));
  }
  return result;
}
export function blankTrip(settings: Partial<Journey> & Pick<Journey, 'title'>): StoredState {
  return { version: 1, cities: [], favorites: [], done: [], bookings: [], notes: {}, departureDate: '', bonusCatalog: [], phrases: [], journey: { id: uid('trip'), destinations: '', description: '', cover: '/travel-landscape.svg', currency: 'EUR', timezone: 'UTC', source: 'custom', followsCatalog: false, ...settings } };
}
export function chinaTrip(state?: StoredState, id = uid('trip')): StoredState {
  const base = state ? mergeCatalog({ ...state, bonusCatalog: structuredClone(bonusItems).filter(b => state.cities.some(c => c.id === b.cityId)), catalogBase: state.catalogBase || legacyCatalog }, initialCities) : { version: 1 as const, cities: structuredClone(initialCities), catalogBase: structuredClone(initialCities), favorites: [], done: [], bookings: [], notes: {}, departureDate: '' };
  return { ...base, journey: { id, title: 'Chine 2027', destinations: 'Chine', description: 'Des villes qui ne dorment jamais aux paysages qui invitent à ralentir.', cover: '/china-landscape.svg', currency: 'CNY', timezone: 'Asia/Shanghai', source: 'china', followsCatalog: true }, bonusCatalog: structuredClone(bonusItems).filter(b => base.cities.some(c => c.id === b.cityId)), phrases: structuredClone(chinaPhrases), budget: base.budgetCny, budgetCurrency: 'CNY', exchangeRates: base.cnyPerEuro ? { EUR: base.cnyPerEuro } : {}, transfers: base.transfers?.map(t => ({ ...t, departureTimezone: 'Asia/Shanghai', arrivalTimezone: 'Asia/Shanghai' })) };
}
/** Stable identity plus a verified write makes retries idempotent, even after a partial failure. */
export function migrateLegacy(storage: Storage): string | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const id = 'china-legacy';
  if (storage.getItem(tripKey(id))) { readTrip(storage, id); return id; }
  const state = chinaTrip(parseBackup(raw), id);
  if (!validateState(state)) throw new Error('Migration invalide. La source originale est conservée.');
  if (!storage.getItem(LEGACY_COPY_KEY)) storage.setItem(LEGACY_COPY_KEY, raw);
  if (storage.getItem(LEGACY_COPY_KEY) !== raw) throw new Error('Copie de migration impossible. La source originale est conservée.');
  const previous = storage.getItem(BACKUP_KEY);
  if (previous && !storage.getItem(LEGACY_RECOVERY_COPY_KEY)) storage.setItem(LEGACY_RECOVERY_COPY_KEY, previous);
  if (previous && !storage.getItem(recoveryKey(id))) {
    // Preserve the original recovery payload, including an unreadable one.
    storage.setItem(recoveryKey(id), previous);
  }
  writeTrip(storage, state);
  storage.setItem(MIGRATION_KEY, raw);
  return id;
}
export function legacyDiverged(storage: Storage): boolean {
  const baseline = storage.getItem(MIGRATION_KEY) || storage.getItem(LEGACY_COPY_KEY);
  return Boolean(baseline && storage.getItem(STORAGE_KEY) !== baseline);
}
/** Remap every identity and relation; copied dates, bookings and amounts stay explicit. */
export function duplicateTrip(original: StoredState, title = `${original.journey?.title || 'Voyage'} — copie`): StoredState {
  const state = structuredClone(original);
  const ids = new Map<string, string>();
  const register = (id: string) => { if (!ids.has(id)) ids.set(id, uid('copy')); };
  for (const c of state.cities) { register(c.id); for (const d of c.days) { register(d.id); for (const s of d.steps) register(s.id); } }
  for (const item of [...state.bonusCatalog || [], ...state.customBonus || [], ...state.expenses || [], ...state.transfers || [], ...state.packing || []]) register(item.id);
  const ref = (id: string) => ids.get(id) || id;
  for (const c of state.cities) { c.id = ref(c.id); for (const d of c.days) { d.id = ref(d.id); for (const s of d.steps) s.id = ref(s.id); if(d.preparation){const p=d.preparation;p.anchorStepId=p.anchorStepId?ref(p.anchorStepId):undefined;p.timings=p.timings?Object.fromEntries(Object.entries(p.timings).map(([id,timing])=>[ref(id),{...timing,fromStepId:timing.fromStepId?ref(timing.fromStepId):undefined}])):undefined;p.alternatives=p.alternatives?.map(a=>({...a,stepIds:a.stepIds.map(ref)}));} } }
  for (const item of [...state.bonusCatalog || [], ...state.customBonus || [], ...state.expenses || []]) { item.id = ref(item.id); item.cityId = ref(item.cityId); }
  for (const item of state.stays || []) item.cityId = ref(item.cityId);
  for (const item of state.transfers || []) { item.id = ref(item.id); item.fromCityId = ref(item.fromCityId); item.toCityId = ref(item.toCityId); }
  for (const item of state.packing || []) item.id = ref(item.id);
  for (const item of state.phrases || []) item.id = uid('phrase');
  for (const item of state.documents || []) item.id = uid('document');
  state.favorites = state.favorites.map(ref); state.done = state.done.map(ref); state.bookings = state.bookings.map(ref);
  state.notes = Object.fromEntries(Object.entries(state.notes).map(([key, value]) => [ref(key), value]));
  if (state.resume) state.resume = { ...state.resume, cityId: ref(state.resume.cityId), dayId: ref(state.resume.dayId) };
  state.journey = { ...original.journey!, id: uid('trip'), title, status: 'planning', highlights: '', followsCatalog: false };
  delete state.catalogBase;
  return state;
}
/** A return trip reuses addresses, without old reservations or completed actions. */
export function returnTrip(original: StoredState, title: string): StoredState {
  const state = duplicateTrip(original, title);
  state.departureDate = ''; state.journey!.endDate = '';
  state.done = []; state.bookings = []; state.expenses = []; state.budget = undefined;
  state.stays = []; state.transfers = []; state.packing = state.packing?.map(p => ({ ...p, packed: false }));
  state.cities.forEach(c => c.days.forEach(d => { delete d.date; if(d.preparation)delete d.preparation.activeAlternativeId; }));
  state.notes = {}; state.documents = [];
  return state;
}
export function parseImport(raw: string): StoredState[] {
  if (new TextEncoder().encode(raw).length > 5_000_000) throw new Error('Le fichier est trop volumineux (5 Mo maximum).');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Ce fichier ne contient pas un JSON valide.'); }
  if (isObj(value) && value.version === 1) return [duplicateTrip(chinaTrip(parseBackup(raw)), 'Chine 2027 — import')];
  if (isObj(value) && value.version === 2 && value.scope === 'trip') return [duplicateTrip(parseTrip(raw).state, parseTrip(raw).state.journey!.title)];
  if (isObj(value) && value.version === 2 && value.scope === 'collection' && Array.isArray(value.trips) && value.trips.length <= 100) return value.trips.map(trip => { const parsed = parseTrip(JSON.stringify(trip)); return duplicateTrip(parsed.state, parsed.state.journey!.title); });
  throw new Error('Format inconnu. Choisis une sauvegarde JSON Détours.');
}
export function collectionArchive(trips: StoredState[]): CollectionArchive {
  return { version: 2, scope: 'collection', trips: trips.map(archive) };
}
