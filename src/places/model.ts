import type { Step } from '../types.ts';

export type CommonsPhoto = { url: string; source: string; author: string; license: string; licenseUrl: string; width: number; height: number; mime: string };
export type PlaceValues = { title?: string; chineseName?: string; localName?: string; website?: string; coordinates?: [number, number]; photo?: CommonsPhoto };
export type PlaceAssociation = { qid: string; source: string; checkedAt: string; values: PlaceValues };
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 500): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function safeUrl(v: unknown): v is string {
  if (!text(v, 2048)) return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export function coordinates(v: unknown): v is [number, number] { return Array.isArray(v) && v.length === 2 && v.every(n => typeof n === 'number' && Number.isFinite(n)) && Math.abs(v[0]) <= 90 && Math.abs(v[1]) <= 180; }
export function validPhoto(v: unknown): v is CommonsPhoto {
  if (!obj(v) || !safeUrl(v.url) || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(v.url).hostname) || !new URL(v.url).pathname.includes('/thumb/') || !safeUrl(v.source) || new URL(v.source).hostname !== 'commons.wikimedia.org' || !text(v.author, 2000) || !text(v.license) || !safeUrl(v.licenseUrl)) return false;
  const licenses: Record<string, string> = { 'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/', 'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/', 'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/', 'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/' };
  return licenses[v.license] === v.licenseUrl && ['image/jpeg', 'image/png', 'image/webp'].includes(String(v.mime)) && typeof v.width === 'number' && Number.isInteger(v.width) && v.width > 0 && v.width <= 640 && typeof v.height === 'number' && Number.isInteger(v.height) && v.height > 0 && v.height <= 1280;
}
export function validAssociation(v: unknown): v is PlaceAssociation {
  if (!obj(v) || !text(v.qid) || !/^Q[1-9]\d*$/.test(v.qid) || v.source !== `https://www.wikidata.org/wiki/${v.qid}` || !text(v.checkedAt) || !/^\d{4}-\d{2}-\d{2}T/.test(v.checkedAt) || !Number.isFinite(Date.parse(v.checkedAt)) || !obj(v.values)) return false;
  const x = v.values;
  return Object.keys(x).every(k => ['title', 'chineseName', 'localName', 'website', 'coordinates', 'photo'].includes(k)) && (x.title === undefined || text(x.title, 180)) && (x.chineseName === undefined || text(x.chineseName, 180)) && (x.localName === undefined || text(x.localName, 180)) && (x.website === undefined || safeUrl(x.website)) && (x.coordinates === undefined || coordinates(x.coordinates)) && (x.photo === undefined || validPhoto(x.photo));
}
/** Personal overlay. The original fields remain editable and are never overwritten. */
export function placeStep(step: Step): Step {
  const values = step.place?.values;
  return values ? { ...step, title: values.title ?? step.title, chineseName: values.localName ?? values.chineseName ?? step.chineseName, coordinates: values.coordinates ?? step.coordinates } : step;
}
