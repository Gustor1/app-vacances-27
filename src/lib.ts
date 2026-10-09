import type { City, Step, StoredState } from './types';
import { validTimezone, transferTimeError } from './time.ts';
import { countryCodes, statuses } from './countries.ts';
import { validPreparation, cleanPreparation } from './day-preparation.ts';

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
  if (city.mapProvider === 'google') return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([city.chineseName || city.name, step.chineseName || step.title, step.address].filter(Boolean).join(' '))}`;
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
export function validCurrency(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value) && Intl.supportedValuesOf('currency').includes(value);
}
const text = (x: unknown): x is string => typeof x === 'string';
const id = (x: unknown): x is string => text(x) && x.trim().length > 0;
const texts = (x: unknown): x is string[] => Array.isArray(x) && x.every(text);
const coords = (x: unknown) => Array.isArray(x) && x.length === 2 && x.every(n => typeof n === 'number' && Number.isFinite(n)) && Math.abs(x[0]) <= 90 && Math.abs(x[1]) <= 180;
const optionalText = (x: unknown) => x === undefined || text(x);
const date = (x: unknown) => x === '' || isValidDate(x);
const optionalDate = (x: unknown) => x === undefined || date(x);
const optionalBool = (x: unknown) => x === undefined || typeof x === 'boolean';
const finitePositive = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const validRateQuotes = (x: unknown): boolean => isObj(x) && Object.entries(x).every(([currency, quote]) => validCurrency(currency) && isObj(quote) && finitePositive(quote.rate) && ['manual','frankfurter','legacy'].includes(quote.source as string) && (isValidDate(quote.date) || (quote.source === 'legacy' && quote.date === '')));
const uniqueIds = (rows: { id: string }[]) => new Set(rows.map(x => x.id)).size === rows.length;
function validCities(value: unknown, allowEmpty = false): value is City[] {
  if (!Array.isArray(value) || (!allowEmpty && !value.length) || value.length > 100) return false;
  if (!value.every(c => isObj(c) && id(c.id) && id(c.name) && text(c.chineseName) && text(c.subtitle) && text(c.color) && text(c.image) && (c.coordinates === undefined || coords(c.coordinates)) && (c.mapProvider === undefined || ['amap','google'].includes(c.mapProvider as string)) && (c.timezone === undefined || validTimezone(c.timezone)) && texts(c.notes) && (c.nights === undefined || (typeof c.nights === 'number' && Number.isFinite(c.nights) && Number.isInteger(c.nights) && c.nights >= 0)) && Array.isArray(c.days) && c.days.length <= 365 && c.days.every(d => isObj(d) && id(d.id) && id(d.title) && optionalDate(d.date) && Array.isArray(d.steps) && d.steps.length <= 1000 && d.steps.every(s => isObj(s) && id(s.id) && id(s.title) && text(s.description) && ['visit','food','transport','hotel','walk','shopping'].includes(s.category as string) && optionalText(s.chineseName) && optionalText(s.address) && optionalText(s.period) && optionalText(s.amapUrl) && optionalBool(s.optional) && optionalBool(s.booking) && (s.coordinates === undefined || coords(s.coordinates)))))) return false;
  const cities = value as City[];
  const days = cities.flatMap(c => c.days);
  const steps = days.flatMap(d => d.steps);
  return uniqueIds(cities) && uniqueIds(days) && uniqueIds(steps) && days.every(day=>validPreparation(day.preparation,day.steps));
}
export function validateState(value: unknown): value is StoredState {
  if (!isObj(value) || value.version !== 1 || !validCities(value.cities, true) || !texts(value.favorites) || !texts(value.done) || !texts(value.bookings) || !isObj(value.notes) || !Object.values(value.notes).every(text) || !date(value.departureDate)) return false;
  if (value.journey !== undefined && (!isObj(value.journey) || !id(value.journey.id) || !id(value.journey.title) || ![value.journey.destinations,value.journey.description,value.journey.cover].every(text) || !validCurrency(value.journey.currency) || !validTimezone(value.journey.timezone) || !['china','custom'].includes(value.journey.source as string) || typeof value.journey.followsCatalog !== 'boolean')) return false;
  if (isObj(value.journey) && ((value.journey.status !== undefined && !Object.hasOwn(statuses, String(value.journey.status))) || (value.journey.countries !== undefined && (!texts(value.journey.countries) || !value.journey.countries.every(c => countryCodes.has(c)) || new Set(value.journey.countries).size !== value.journey.countries.length)) || !optionalDate(value.journey.endDate) || !optionalText(value.journey.highlights) || (value.departureDate && value.journey.endDate && String(value.journey.endDate) < value.departureDate))) return false;
  if (value.budget !== undefined && !finitePositive(value.budget)) return false;
  if (value.budgetCurrency !== undefined && !validCurrency(value.budgetCurrency)) return false;
  if (value.exchangeRates !== undefined && (!isObj(value.exchangeRates) || !Object.entries(value.exchangeRates).every(([currency, rate]) => validCurrency(currency) && finitePositive(rate)))) return false;
  if (value.rateQuotes !== undefined && !validRateQuotes(value.rateQuotes)) return false;
  if (value.budgetConversions !== undefined && !validRateQuotes(value.budgetConversions)) return false;
  if (value.phrases !== undefined && (!Array.isArray(value.phrases) || !value.phrases.every(p => isObj(p) && id(p.id) && [p.category,p.meaning,p.local,p.pronunciation].every(text)) || !uniqueIds(value.phrases))) return false;
  if (value.documents !== undefined && (!Array.isArray(value.documents) || value.documents.length > 100 || !value.documents.every(d => isObj(d) && id(d.id) && id(d.title) && text(d.content) && d.content.length <= 500_000) || !uniqueIds(value.documents))) return false;
  if (value.resume !== undefined && (!isObj(value.resume) || !text(value.resume.cityId) || !text(value.resume.dayId) || !['now','planning','map','bonus','transport','notebook','practical','overview'].includes(value.resume.view as string))) return false;
  const cityIds = new Set(value.cities.map(c => c.id));
  if (value.catalogBase !== undefined && !validCities(value.catalogBase, true)) return false;
  if (value.customBonus !== undefined && (!Array.isArray(value.customBonus) || value.customBonus.length > 2000 || !value.customBonus.every(b => isObj(b) && id(b.id) && text(b.cityId) && cityIds.has(b.cityId) && id(b.title) && ['food','photo','visit','shopping'].includes(b.category as string) && text(b.description) && [b.chineseName,b.address,b.budget,b.tip,b.amapUrl,b.sourceUrl].every(optionalText)) || !uniqueIds(value.customBonus))) return false;
  if (value.bonusCatalog !== undefined && (!Array.isArray(value.bonusCatalog) || !value.bonusCatalog.every(b => isObj(b) && id(b.id) && cityIds.has(b.cityId as string) && id(b.title) && ['food','photo','visit','shopping'].includes(b.category as string) && text(b.description) && [b.chineseName,b.address,b.budget,b.tip,b.amapUrl,b.sourceUrl].every(optionalText)) || !uniqueIds(value.bonusCatalog))) return false;
  if (value.expenses !== undefined && (!Array.isArray(value.expenses) || value.expenses.length > 10000 || !value.expenses.every(e => isObj(e) && id(e.id) && (e.cityId === '' || cityIds.has(e.cityId as string)) && id(e.label) && finitePositive(e.amount) && validCurrency(e.currency) && ['food','transport','hotel','visit','shopping','other'].includes(e.category as string) && optionalDate(e.date) && (e.conversions === undefined || validRateQuotes(e.conversions))) || !uniqueIds(value.expenses))) return false;
  if ((value.budgetCny !== undefined && !finitePositive(value.budgetCny)) || (value.cnyPerEuro !== undefined && !finitePositive(value.cnyPerEuro))) return false;
  if (value.stays !== undefined && (!Array.isArray(value.stays) || !value.stays.every(s => isObj(s) && cityIds.has(s.cityId as string) && [s.name,s.chineseName,s.address,s.notes].every(text) && date(s.checkIn) && date(s.checkOut) && (!s.checkIn || !s.checkOut || (s.checkOut as string) >= (s.checkIn as string))) || new Set(value.stays.map(s=>s.cityId)).size !== value.stays.length)) return false;
  if (value.transfers !== undefined && (!Array.isArray(value.transfers) || !value.transfers.every(t => isObj(t) && id(t.id) && cityIds.has(t.fromCityId as string) && cityIds.has(t.toCityId as string) && id(t.label) && ['train','plane','bus','car','other'].includes(t.mode as string) && [t.fromStation,t.toStation,t.reference,t.notes].every(text) && (t.departure === '' || isValidDateTime(t.departure)) && (t.arrival === '' || isValidDateTime(t.arrival)) && !transferTimeError(t.departure as string, t.arrival as string, (t.departureTimezone || (isObj(value.journey) ? value.journey.timezone : 'Asia/Shanghai')) as string, (t.arrivalTimezone || (isObj(value.journey) ? value.journey.timezone : 'Asia/Shanghai')) as string) && typeof t.booked === 'boolean') || !uniqueIds(value.transfers))) return false;
  if (value.packing !== undefined && (!Array.isArray(value.packing) || !value.packing.every(p=>isObj(p) && id(p.id) && id(p.label) && typeof p.packed==='boolean') || !uniqueIds(value.packing))) return false;
  return true;
}
export function parseBackup(raw: string): StoredState {
  if (new TextEncoder().encode(raw).length > 5_000_000) throw new Error('Le fichier est trop volumineux (5 Mo maximum).');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Ce fichier ne contient pas un JSON valide.'); }
  if (!validateState(value)) throw new Error('Ce fichier ne correspond pas à une sauvegarde Détours valide.');
  return value;
}
export function toggleValue(values: string[], id: string) { return values.includes(id) ? values.filter(x => x !== id) : [...values, id]; }
export function downloadText(contents: string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function cleanReferences(state: StoredState): StoredState {
  const stepIds = new Set([...state.cities.flatMap(c => c.days.flatMap(d => d.steps.map(s => s.id))), ...(state.bonusCatalog || []).map(b => b.id), ...(state.customBonus || []).map(b => b.id)]);
  return { ...state, cities: state.cities.map(city=>({...city,days:city.days.map(cleanPreparation)})), done: state.done.filter(id => stepIds.has(id)), bookings: state.bookings.filter(id => stepIds.has(id)) };
}
