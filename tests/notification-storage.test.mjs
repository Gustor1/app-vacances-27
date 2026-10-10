import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultNotificationPreferences, notificationKey } from '../src/notifications.ts';
import { markRecapRead, mergeRemoteRecaps, readRecapCache, recapCacheKey, updateRecapCache, writeNotificationPreferences, writeRecapCache } from '../src/notification-storage.ts';

const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), key: n => [...values.keys()][n] ?? null, get length() { return values.size; } }; };
const recap = (date, revision = 'A') => ({ id: JSON.stringify(['trip', date]), tripId: 'trip', tripTitle: 'Test', date, timezone: 'Europe/Paris', revision, items: [{ id: 'visit', kind: 'step', cityId: 'city', dayId: 'day', date, title: revision, category: 'visit', location: 'Paris', timezone: 'Europe/Paris', booked: false, done: false }], checklist: [], weather: [] });
const prefs = defaultNotificationPreferences('Europe/Paris');
test('remote evening snapshot preserves authoritative revision, local read state and past content', () => {
  const local=[{recap:recap('2026-10-10','new-program'),capturedAt:'2026-10-10T10:00Z',readAt:'2026-10-10T10:00Z',referenceRevision:'local-estimate'}];
  const remote=[{recap:recap('2026-10-10','evening-program'),capturedAt:'2026-10-09T20:00Z',referenceRevision:'evening-program'},{recap:recap('2026-10-09','past'),capturedAt:'2026-10-08T20:00Z',referenceRevision:'past'}];
  const merged=mergeRemoteRecaps(local,remote,'trip');
  assert.equal(merged[0].recap.revision,'new-program');assert.equal(merged[0].referenceRevision,'evening-program');assert.equal(merged[0].readAt,local[0].readAt);
  assert.equal(merged[1].recap.revision,'past');assert.throws(()=>mergeRemoteRecaps(local,remote,'other-trip'));
});

test('one recap per date, evening reference and read status survive program/weather updates', () => {
  const now = new Date('2026-10-10T21:00:00Z');
  const initial = updateRecapCache([], [recap('2026-10-11')], prefs, '2026-10-10', now);
  assert.equal(initial[0].referenceRevision, 'A');
  const read = markRecapRead(initial, '2026-10-11', now);
  const changed = updateRecapCache(read, [recap('2026-10-11', 'B')], prefs, '2026-10-10', now);
  assert.equal(changed.length, 1); assert.equal(changed[0].recap.revision, 'B');
  assert.equal(changed[0].referenceRevision, 'A'); assert.equal(changed[0].readAt, now.toISOString());
  const weather = { ...changed[0].recap, weather: [{ date: '2026-10-11', place: 'Paris', fetchedAt: now.toISOString(), source: 'Open-Meteo', rainProbability: 80 }] };
  const refreshed = updateRecapCache(changed, [weather], prefs, '2026-10-10', now);
  assert.equal(refreshed[0].readAt, read[0].readAt); assert.equal(refreshed[0].referenceRevision, 'A');
});

test('opening before evening does not invent an evening reference; capture once due', () => {
  const before = new Date('2026-10-10T10:00:00Z');
  const first = updateRecapCache([], [recap('2026-10-11')], prefs, '2026-10-10', before);
  assert.equal(first[0].referenceRevision, undefined);
  const evening = updateRecapCache(first, [recap('2026-10-11', 'B')], prefs, '2026-10-10', new Date('2026-10-10T21:00:00Z'));
  assert.equal(evening[0].referenceRevision, 'B');
});

test('unchanged recap is stable across renders and past snapshots never rewrite', () => {
  const initial = updateRecapCache([], [recap('2026-10-10')], prefs, '2026-10-10', new Date('2026-10-10T10:00:00Z'));
  const repeated = updateRecapCache(initial, [recap('2026-10-10')], prefs, '2026-10-10', new Date('2026-10-10T11:00:00Z'));
  assert.deepEqual(repeated, initial);
  const past = updateRecapCache(initial, [recap('2026-10-10', 'B')], prefs, '2026-10-11', new Date('2026-10-11T11:00:00Z'));
  assert.equal(past[0].recap.revision, 'A');
});

test('bounded past history and empty/deleted current schedule', () => {
  const old = Array.from({ length: 35 }, (_, i) => ({ recap: recap(`2026-09-${String(i % 30 + 1).padStart(2, '0')}`), capturedAt: '2026-10-10T10:00:00Z' }));
  old.push({ recap: recap('2026-10-10'), capturedAt: '2026-10-10T10:00:00Z' });
  const next = updateRecapCache(old, [], prefs, '2026-10-10', new Date('2026-10-10T10:00:00Z'));
  assert.ok(next.every(r => r.recap.date >= '2026-09-11' && r.recap.date < '2026-10-10')); assert.ok(next.length <= 29);
});

test('preferences and recaps isolated by storage scope and trip, validate before writing', () => {
  const a = memory(), b = memory();
  writeNotificationPreferences(a, 'trip', prefs);
  assert.equal(b.getItem(notificationKey('trip')), null); assert.equal(a.getItem(notificationKey('other')), null);
  assert.throws(() => writeNotificationPreferences(a, 'trip', { ...prefs, offsets: [0] }));
  assert.equal(JSON.parse(a.getItem(notificationKey('trip'))).offsets[0], 30);
  const records = updateRecapCache([], [recap('2026-10-10')], prefs, '2026-10-10', new Date('2026-10-10T10:00:00Z'));
  writeRecapCache(a, 'trip', records); assert.deepEqual(readRecapCache(a, 'trip'), records);
  assert.throws(() => writeRecapCache(a, 'other', records)); assert.equal(a.getItem(recapCacheKey('other')), null);
});

test('unreadable source preserved, interrupted write is detected', () => {
  const s = memory(); s.setItem(recapCacheKey('trip'), '{bad');
  assert.throws(() => readRecapCache(s, 'trip')); assert.equal(s.getItem(recapCacheKey('trip')), '{bad');
  assert.throws(() => writeNotificationPreferences({ ...s, setItem: () => {} }, 'trip', prefs));
  const record = { recap: recap('2026-10-10'), capturedAt: '2026-10-10T10:00:00Z' };
  record.recap.items[0].title = { dangerous: true };
  assert.throws(() => writeRecapCache(s, 'trip', [record])); assert.equal(s.getItem(recapCacheKey('trip')), '{bad');
});
