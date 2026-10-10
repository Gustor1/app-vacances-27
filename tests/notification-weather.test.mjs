import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRecapWeather, weatherTargets, WEATHER_SOURCE, weatherCacheKey } from '../src/notification-weather.ts';

const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), key: () => null, length: 0 }; };
const now = new Date('2026-10-10T10:00:00Z');
const item = (date = '2026-10-11') => ({ id: 'visit', kind: 'step', cityId: 'paris', date, title: 'Walk', category: 'walk', location: 'Paris', timezone: 'Europe/Paris', coordinates: [48.8, 2.3], booked: false, done: false });
const response = (date = '2026-10-11') => ({ ok: true, json: async () => ({ daily: { time: [date], temperature_2m_min: [10], temperature_2m_max: [20], precipitation_probability_max: [70], uv_index_max: [4] } }) });

test('horizon16 days, strict coordinates, no GPS, duplicate locations deduplicated', () => {
  assert.equal(weatherTargets([item('2026-10-10'), item('2026-10-25')], now).length, 2);
  assert.equal(weatherTargets([item('2026-10-26'), item('2026-10-09'), { ...item(), coordinates: [NaN, 0] }, { ...item(), timezone: '' }], now).length, 0);
  assert.equal(weatherTargets([item(), { ...item(), id: 'second' }], now).length, 1);
});

test('requests exact program date/zone/coordinates and caches successful response per trip', async () => {
  const storage = memory(); let calls = 0;
  const fetcher = async url => { calls++; const u = new URL(url); assert.equal(u.searchParams.get('latitude'), '48.8'); assert.equal(u.searchParams.get('start_date'), '2026-10-11'); assert.equal(u.searchParams.get('timezone'), 'Europe/Paris'); return response(); };
  const result = await loadRecapWeather(storage, 'trip', [item(), item()], { now, fetcher });
  assert.equal(calls, 1); assert.equal(result.weather[0].source, WEATHER_SOURCE); assert.equal(result.weather[0].rainProbability, 70);
  await loadRecapWeather(storage, 'trip', [item()], { now, fetcher }); assert.equal(calls, 1);
  await loadRecapWeather(storage, 'other', [item()], { now, fetcher }); assert.equal(calls, 2);
});

test('offline serves stale cache, no network and no invented forecast', async () => {
  const storage = memory(); await loadRecapWeather(storage, 'trip', [item()], { now, fetcher: async () => response() });
  let calls = 0;
  const result = await loadRecapWeather(storage, 'trip', [item()], { now: new Date('2026-10-10T20:00:00Z'), online: false, fetcher: async () => { calls++; return response(); } });
  assert.equal(calls, 0); assert.equal(result.weather.length, 1); assert.equal(result.stale, true);
  const absent = await loadRecapWeather(memory(), 'other', [item()], { now, online: false }); assert.equal(absent.weather.length, 0); assert.equal(absent.unavailable, true);
});

test('failure, wrong date or empty numbers do not block recap', async () => {
  for (const fetcher of [async () => { throw Error('offline'); }, async () => ({ ok: false }), async () => response('2026-10-12'), async () => ({ ok: true, json: async () => ({ daily: { time: ['2026-10-11'] } }) })]) {
    const result = await loadRecapWeather(memory(), 'trip', [item()], { now, fetcher });
    assert.equal(result.unavailable, true); assert.deepEqual(result.weather, []);
  }
});

test('abort prevents writes on account switch/panel close', async () => {
  const storage = memory(), controller = new AbortController();
  const fetcher = async (_, { signal }) => new Promise((_, reject) => { signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }); controller.abort(); });
  await loadRecapWeather(storage, 'trip', [item()], { now, fetcher, signal: controller.signal });
  assert.equal(storage.getItem(weatherCacheKey('trip')), null);
});
