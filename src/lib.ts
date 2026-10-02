import type { City, Step, StoredState } from './types';

export const STORAGE_KEY = 'a-l-est-v1';
export const categoryLabels = { visit: 'Visite', food: 'À table', transport: 'Transport', hotel: 'Hébergement', walk: 'Balade', shopping: 'Shopping', photo: 'Photo' };
export function amapSearch(city: string, name: string, address = '') {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent([city, name, address].filter(Boolean).join(' '))}&view=list&callnative=1`;
}
export function safeExternalUrl(url?: string): string | undefined {
  if (!url) return;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : undefined; } catch { return; }
}
export function amapLink(city: City, step: Pick<Step, 'title' | 'chineseName' | 'amapUrl'>) {
  const safe = safeExternalUrl(step.amapUrl);
  if (safe && /(^|\.)amap\.com$/.test(new URL(safe).hostname)) return safe;
  return amapSearch(city.chineseName || city.name, step.chineseName || step.title);
}
export function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isText = (x: unknown): x is string => typeof x === 'string';
const texts = (x: unknown): x is string[] => Array.isArray(x) && x.every(isText);
const coords = (x: unknown) => Array.isArray(x) && x.length === 2 && x.every(n => typeof n === 'number' && Number.isFinite(n)) && Math.abs(x[0]) <= 90 && Math.abs(x[1]) <= 180;
const optionalText = (x: unknown) => x === undefined || isText(x);
const uniqueIds = (rows: {id: string}[]) => new Set(rows.map(x => x.id)).size === rows.length;
export function validateState(value: unknown): value is StoredState {
  if (!isObj(value) || value.version !== 1 || !Array.isArray(value.cities) || !value.cities.length || value.cities.length > 100) return false;
  const citiesValid = value.cities.every(c => isObj(c) && isText(c.id) && c.id.length > 0 && isText(c.name) && c.name.trim().length > 0 && isText(c.chineseName) && isText(c.subtitle) && isText(c.color) && isText(c.image) && coords(c.coordinates) && texts(c.notes) && (c.nights === undefined || (typeof c.nights === 'number' && c.nights >= 0)) && Array.isArray(c.days) && c.days.every(d => isObj(d) && isText(d.id) && isText(d.title) && Array.isArray(d.steps) && d.steps.every(s => isObj(s) && isText(s.id) && isText(s.title) && isText(s.description) && ['visit','food','transport','hotel','walk','shopping'].includes(s.category as string) && optionalText(s.chineseName) && optionalText(s.period) && optionalText(s.amapUrl) && (s.optional === undefined || typeof s.optional === 'boolean') && (s.booking === undefined || typeof s.booking === 'boolean') && (s.coordinates === undefined || coords(s.coordinates)))));
  if (!citiesValid) return false;
  const cities = value.cities as City[];
  const days = cities.flatMap(c => c.days);
  const steps = days.flatMap(d => d.steps);
  return uniqueIds(cities) && uniqueIds(days) && uniqueIds(steps) && texts(value.favorites) && texts(value.done) && texts(value.bookings) && isObj(value.notes) && Object.values(value.notes).every(isText) && isText(value.departureDate) && (!value.departureDate || /^\d{4}-\d{2}-\d{2}$/.test(value.departureDate));
}
export function parseBackup(raw: string): StoredState {
  if (raw.length > 5_000_000) throw new Error('Le fichier est trop volumineux (5 Mo maximum).');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Ce fichier ne contient pas un JSON valide.'); }
  if (!validateState(value)) throw new Error('Ce fichier ne correspond pas à une sauvegarde À l’Est valide.');
  return value;
}
export function toggleValue(values: string[], id: string) { return values.includes(id) ? values.filter(x => x !== id) : [...values, id]; }
