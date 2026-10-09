import type { PersonalWorld, PersonalVisit, StoredState } from './types.ts';
import { countryCodes } from './countries.ts';
import { isObj, isValidDate } from './lib.ts';
import type { Storage } from './journeys.ts';

export const WORLD_KEY = 'detours-world-v1';
export const emptyWorld = (): PersonalWorld => ({ version: 1, visits: [], wishes: [], palette: 'forest', participation: [] });
export function validWorld(value: unknown): value is PersonalWorld {
  if (!isObj(value) || value.version !== 1 || !['forest', 'ocean', 'sunset'].includes(String(value.palette)) || !Array.isArray(value.wishes) || !value.wishes.every(c => countryCodes.has(c)) || new Set(value.wishes).size !== value.wishes.length || !Array.isArray(value.visits) || value.visits.length > 10000) return false;
  if (value.participation !== undefined && (!Array.isArray(value.participation) || value.participation.length > 1000 || !value.participation.every(id => typeof id === 'string' && !!id) || new Set(value.participation).size !== value.participation.length)) return false;
  return value.visits.every(v => isObj(v) && typeof v.id === 'string' && !!v.id && typeof v.stayId === 'string' && !!v.stayId && countryCodes.has(String(v.country)) && typeof v.label === 'string' && v.label.length <= 300 && (v.journeyId === undefined || typeof v.journeyId === 'string') && (v.year === undefined || (Number.isInteger(v.year) && Number(v.year) >= 1 && Number(v.year) <= 9999)) && (v.date === undefined || isValidDate(v.date))) && new Set(value.visits.map(v => v.id)).size === value.visits.length && new Set(value.visits.map(v => `${v.stayId}:${v.country}`)).size === value.visits.length;
}
export function readWorld(storage: Storage): PersonalWorld {
  const raw = storage.getItem(WORLD_KEY);
  if (!raw) return emptyWorld();
  const value: unknown = JSON.parse(raw);
  if (!validWorld(value)) throw new Error('Les souvenirs sont illisibles. La source est conservée.');
  return value;
}
export function writeWorld(storage: Storage, value: PersonalWorld) {
  if (!validWorld(value)) throw new Error('Séjour invalide.');
  const raw = JSON.stringify(value);
  storage.setItem(WORLD_KEY, raw);
  if (storage.getItem(WORLD_KEY) !== raw) throw new Error('Sauvegarde locale impossible.');
}
/** Completion is an invitation to confirm, never evidence of a real visit. */
export function confirmVisits(world: PersonalWorld, trip: StoredState, selected: string[]): PersonalWorld {
  if (trip.journey?.status !== 'completed') throw new Error('Termine le voyage avant de confirmer les visites.');
  const journeyId = trip.journey.id;
  const visits = world.visits.filter(v => v.stayId !== journeyId || selected.includes(v.country));
  for (const country of new Set(selected)) {
    if (!countryCodes.has(country) || !trip.journey.countries?.includes(country)) throw new Error('Pays invalide.');
    if (!visits.some(v => v.stayId === journeyId && v.country === country)) visits.push({ id: `visit:${journeyId}:${country}`, stayId: journeyId, journeyId, country, label: trip.journey.title, ...(trip.departureDate ? { date: trip.departureDate, year: Number(trip.departureDate.slice(0, 4)) } : {}) });
  }
  return { ...world, visits };
}
export function countrySummary(code: string, world: PersonalWorld, trips: StoredState[]) {
  const visits: PersonalVisit[] = world.visits.filter(v => v.country === code);
  const upcoming = trips.filter(t => t.journey?.countries?.includes(code) && ['planning', 'ongoing'].includes(t.journey.status || 'idea'));
  return { visits, count: visits.length, upcoming, wished: world.wishes.includes(code) };
}
