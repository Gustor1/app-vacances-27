import { notificationKey, parseNotificationPreferences, notificationInstant, shiftDate } from './notifications.ts';
import type { NotificationPreferences, Recap } from './notifications.ts';
import type { Storage } from './journeys.ts';

export type RecapRecord = { recap: Recap; readAt?: string; referenceRevision?: string; capturedAt: string };
export const recapCacheKey = (tripId: string) => `detours-recaps-v1:${tripId}`;
export function writeNotificationPreferences(storage: Storage, tripId: string, value: NotificationPreferences) {
  const raw = JSON.stringify(parseNotificationPreferences(JSON.stringify(value)));
  storage.setItem(notificationKey(tripId), raw);
  if (storage.getItem(notificationKey(tripId)) !== raw) throw new Error('Notification preferences were not saved');
}
export function readRecapCache(storage: Storage, tripId: string): RecapRecord[] {
  const raw = storage.getItem(recapCacheKey(tripId));
  if (!raw) return [];
  if (raw.length > 4_000_000) throw new Error('Recap cache too large');
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values) || values.length > 32) throw new Error('Invalid recap cache');
  for (const v of values) {
    if (!v || typeof v !== 'object' || !v.recap || v.recap.tripId !== tripId || typeof v.recap.tripTitle !== 'string' || typeof v.recap.timezone !== 'string' || typeof v.recap.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.recap.date) || !Array.isArray(v.recap.items) || v.recap.items.length > 2000 || !Array.isArray(v.recap.weather) || v.recap.weather.length > 64 || !Array.isArray(v.recap.checklist) || v.recap.checklist.some((text: unknown) => typeof text !== 'string') || typeof v.recap.revision !== 'string' || typeof v.capturedAt !== 'string' || !Number.isFinite(Date.parse(v.capturedAt)) || (v.readAt !== undefined && (typeof v.readAt !== 'string' || !Number.isFinite(Date.parse(v.readAt)))) || (v.referenceRevision !== undefined && typeof v.referenceRevision !== 'string')) throw new Error('Invalid recap cache');
    for (const item of v.recap.items) if (!item || !['step', 'transfer'].includes(item.kind) || !['visit','food','transport','hotel','walk','shopping'].includes(item.category) || ['id','cityId','date','title','location','timezone'].some(k => typeof item[k] !== 'string') || typeof item.booked !== 'boolean' || typeof item.done !== 'boolean' || (item.time !== undefined && typeof item.time !== 'string') || (item.instant !== undefined && !Number.isFinite(item.instant))) throw new Error('Invalid recap item');
    for (const weather of v.recap.weather) if (!weather || ['date','place','fetchedAt','source'].some(k => typeof weather[k] !== 'string') || !Number.isFinite(Date.parse(weather.fetchedAt)) || ['rainProbability','uv','min','max'].some(k => weather[k] !== undefined && !Number.isFinite(weather[k]))) throw new Error('Invalid recap weather');
  }
  return values as RecapRecord[];
}
/** One record per civil day. Past snapshots are never regenerated from today's plan. */
export function updateRecapCache(records: RecapRecord[], recaps: Recap[], preferences: NotificationPreferences, today: string, now: Date): RecapRecord[] {
  const oldest = shiftDate(today, -29), newest = shiftDate(today, 1);
  const result = new Map(records.filter(r => r.recap.date >= oldest && r.recap.date <= newest).map(r => [r.recap.date, r]));
  for (const recap of recaps) {
    const previous = result.get(recap.date);
    if (recap.date < today && previous) continue;
    let referenceRevision = previous?.referenceRevision;
    if (!referenceRevision && preferences.timezone) {
      try {
        const evening = notificationInstant(`${shiftDate(recap.date, -1)}T${preferences.recapTime}`, preferences.timezone);
        if (now.getTime() >= evening) referenceRevision = recap.revision;
      } catch { /* A preference currently being edited does not block the recap. */ }
    }
    const unchanged = previous && JSON.stringify(previous.recap) === JSON.stringify(recap);
    result.set(recap.date, { recap, capturedAt: unchanged ? previous.capturedAt : now.toISOString(), ...(previous?.readAt ? { readAt: previous.readAt } : {}), ...(referenceRevision ? { referenceRevision } : {}) });
  }
  // Remove today's deleted/empty program, rather than showing an obsolete schedule.
  for (const date of [today, newest]) if (!recaps.some(r => r.date === date)) result.delete(date);
  return [...result.values()].sort((a, b) => b.recap.date.localeCompare(a.recap.date));
}
export function writeRecapCache(storage: Storage, tripId: string, records: RecapRecord[]) {
  const raw = JSON.stringify(records);
  // Validation precedes the atomic write, followed by a readback.
  readRecapCache({ getItem: () => raw, setItem: () => {}, key: () => null, length: 0 }, tripId);
  storage.setItem(recapCacheKey(tripId), raw);
  if (storage.getItem(recapCacheKey(tripId)) !== raw) throw new Error('Recap cache was not saved');
}
export function markRecapRead(records: RecapRecord[], date: string, now = new Date()): RecapRecord[] {
  return records.map(r => r.recap.date === date ? { ...r, readAt: r.readAt || now.toISOString() } : r);
}
export function mergeRemoteRecaps(local: RecapRecord[], remote: RecapRecord[], tripId: string): RecapRecord[] {
  readRecapCache({ getItem: () => JSON.stringify(remote), setItem: () => {}, key: () => null, length: 0 }, tripId);
  const merged=new Map(local.map(r=>[r.recap.date,r]));
  for(const record of remote){const previous=merged.get(record.recap.date);merged.set(record.recap.date,previous?{...previous,referenceRevision:record.referenceRevision}:{...record});}
  return [...merged.values()].sort((a,b)=>b.recap.date.localeCompare(a.recap.date)).slice(0,32);
}
