import type { City, Step, StoredState } from './types';

export const STORAGE_KEY = 'a-l-est-v1';
export const BACKUP_KEY = 'a-l-est-recovery-v1';
export const categoryLabels = { visit: 'Visite', food: 'À table', transport: 'Transport', hotel: 'Hébergement', walk: 'Balade', shopping: 'Shopping', photo: 'Photo' };
export function amapSearch(city: string, name: string, address = '') {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent([city, name, address].filter(Boolean).join(' '))}&view=list&callnative=1`;
}
export function safeExternalUrl(url?: string): string | undefined {
  if (!url) return;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : undefined; } catch { return; }
}
export function amapLink(city: City, step: Pick<Step, 'title' | 'chineseName' | 'amapUrl' | 'address'>) {
  const safe = safeExternalUrl(step.amapUrl);
  if (safe && /(^|\.)amap\.com$/.test(new URL(safe).hostname)) return safe;
  return amapSearch(city.chineseName || city.name, step.chineseName || step.title, step.address);
}
export function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0,4)) < 1) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function isValidDateTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !isValidDate(value.slice(0, 10))) return false;
  return Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60;
}
export function normalizeSearch(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[’']/g, "'"); }
export const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const text = (x: unknown): x is string => typeof x === 'string';
const id = (x: unknown): x is string => text(x) && x.trim().length > 0;
const texts = (x: unknown): x is string[] => Array.isArray(x) && x.every(text);
const coords = (x: unknown) => Array.isArray(x) && x.length === 2 && x.every(n => typeof n === 'number' && Number.isFinite(n)) && Math.abs(x[0]) <= 90 && Math.abs(x[1]) <= 180;
const optionalText = (x: unknown) => x === undefined || text(x);
const date = (x: unknown) => x === '' || isValidDate(x);
const optionalDate = (x: unknown) => x === undefined || date(x);
const optionalBool = (x: unknown) => x === undefined || typeof x === 'boolean';
const finitePositive = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const uniqueIds = (rows: { id: string }[]) => new Set(rows.map(x => x.id)).size === rows.length;
function validCities(value: unknown, allowEmpty = false): value is City[] {
  if (!Array.isArray(value) || (!allowEmpty && !value.length) || value.length > 100) return false;
  if (!value.every(c => isObj(c) && id(c.id) && id(c.name) && text(c.chineseName) && text(c.subtitle) && text(c.color) && text(c.image) && (c.coordinates === undefined || coords(c.coordinates)) && texts(c.notes) && (c.nights === undefined || (typeof c.nights === 'number' && Number.isFinite(c.nights) && Number.isInteger(c.nights) && c.nights >= 0)) && Array.isArray(c.days) && c.days.length <= 365 && c.days.every(d => isObj(d) && id(d.id) && id(d.title) && optionalDate(d.date) && Array.isArray(d.steps) && d.steps.length <= 1000 && d.steps.every(s => isObj(s) && id(s.id) && id(s.title) && text(s.description) && ['visit','food','transport','hotel','walk','shopping'].includes(s.category as string) && optionalText(s.chineseName) && optionalText(s.address) && optionalText(s.period) && optionalText(s.amapUrl) && optionalBool(s.optional) && optionalBool(s.booking) && (s.coordinates === undefined || coords(s.coordinates)))))) return false;
  const cities = value as City[];
  const days = cities.flatMap(c => c.days);
  const steps = days.flatMap(d => d.steps);
  return uniqueIds(cities) && uniqueIds(days) && uniqueIds(steps);
}
export function validateState(value: unknown): value is StoredState {
  if (!isObj(value) || value.version !== 1 || !validCities(value.cities) || !texts(value.favorites) || !texts(value.done) || !texts(value.bookings) || !isObj(value.notes) || !Object.values(value.notes).every(text) || !date(value.departureDate)) return false;
  const cityIds = new Set(value.cities.map(c => c.id));
  if (value.catalogBase !== undefined && !validCities(value.catalogBase, true)) return false;
  if (value.customBonus !== undefined && (!Array.isArray(value.customBonus) || value.customBonus.length > 2000 || !value.customBonus.every(b => isObj(b) && id(b.id) && text(b.cityId) && cityIds.has(b.cityId) && id(b.title) && ['food','photo','visit','shopping'].includes(b.category as string) && text(b.description) && [b.chineseName,b.address,b.budget,b.tip,b.amapUrl,b.sourceUrl].every(optionalText)) || !uniqueIds(value.customBonus))) return false;
  if (value.expenses !== undefined && (!Array.isArray(value.expenses) || value.expenses.length > 10000 || !value.expenses.every(e => isObj(e) && id(e.id) && (e.cityId === '' || cityIds.has(e.cityId as string)) && id(e.label) && finitePositive(e.amount) && ['CNY','EUR'].includes(e.currency as string) && ['food','transport','hotel','visit','shopping','other'].includes(e.category as string) && optionalDate(e.date)) || !uniqueIds(value.expenses))) return false;
  if ((value.budgetCny !== undefined && !finitePositive(value.budgetCny)) || (value.cnyPerEuro !== undefined && !finitePositive(value.cnyPerEuro))) return false;
  if (value.stays !== undefined && (!Array.isArray(value.stays) || !value.stays.every(s => isObj(s) && cityIds.has(s.cityId as string) && [s.name,s.chineseName,s.address,s.notes].every(text) && date(s.checkIn) && date(s.checkOut) && (!s.checkIn || !s.checkOut || (s.checkOut as string) >= (s.checkIn as string))) || new Set(value.stays.map(s=>s.cityId)).size !== value.stays.length)) return false;
  if (value.transfers !== undefined && (!Array.isArray(value.transfers) || !value.transfers.every(t => isObj(t) && id(t.id) && cityIds.has(t.fromCityId as string) && cityIds.has(t.toCityId as string) && id(t.label) && ['train','plane','bus','car','other'].includes(t.mode as string) && [t.fromStation,t.toStation,t.reference,t.notes].every(text) && (t.departure === '' || isValidDateTime(t.departure)) && (t.arrival === '' || isValidDateTime(t.arrival)) && (!t.departure || !t.arrival || (t.arrival as string) >= (t.departure as string)) && typeof t.booked === 'boolean') || !uniqueIds(value.transfers))) return false;
  if (value.packing !== undefined && (!Array.isArray(value.packing) || !value.packing.every(p=>isObj(p) && id(p.id) && id(p.label) && typeof p.packed==='boolean') || !uniqueIds(value.packing))) return false;
  return true;
}
export function parseBackup(raw: string): StoredState {
  if (new TextEncoder().encode(raw).length > 5_000_000) throw new Error('Le fichier est trop volumineux (5 Mo maximum).');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Ce fichier ne contient pas un JSON valide.'); }
  if (!validateState(value)) throw new Error('Ce fichier ne correspond pas à une sauvegarde À l’Est valide.');
  return value;
}
export function toggleValue(values: string[], id: string) { return values.includes(id) ? values.filter(x => x !== id) : [...values, id]; }
export function downloadText(contents: string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function cleanReferences(state: StoredState): StoredState {
  const stepIds = new Set(state.cities.flatMap(c => c.days.flatMap(d => d.steps.map(s => s.id))));
  return { ...state, done: state.done.filter(id => stepIds.has(id)), bookings: state.bookings.filter(id => stepIds.has(id)) };
}
