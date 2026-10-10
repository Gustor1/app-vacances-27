import { shiftDate } from './notifications.ts';
import { dateInTimezone, validTimezone } from './time.ts';
import type { ProgramItem, Weather } from './notifications.ts';
type Storage = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

export const WEATHER_TTL = 3 * 60 * 60 * 1000;
export const WEATHER_SOURCE = 'Open-Meteo (CC BY 4.0)';
type WeatherEntry = { key: string; weather: Weather };
export const weatherCacheKey = (tripId: string) => `detours-weather-v1:${tripId}`;
const coordinatesValid = (c?: [number, number]) => !!c && c.length === 2 && c.every(Number.isFinite) && Math.abs(c[0]) <= 90 && Math.abs(c[1]) <= 180;
export function weatherTargets(items: ProgramItem[], now: Date): ProgramItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!coordinatesValid(item.coordinates) || !validTimezone(item.timezone)) return false;
    const today = dateInTimezone(item.timezone, now);
    if (item.date < today || item.date > shiftDate(today, 15)) return false;
    const key = JSON.stringify([item.date, item.coordinates, item.timezone]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 8);
}
const targetKey = (item: ProgramItem) => JSON.stringify([item.date, item.coordinates, item.timezone]);
export function cachedWeather(storage: Storage, tripId: string): WeatherEntry[] {
  try {
    const raw = storage.getItem(weatherCacheKey(tripId));
    if (!raw || raw.length > 200_000) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is WeatherEntry => !!entry && typeof entry.key === 'string' && !!entry.weather && typeof entry.weather.date === 'string' && typeof entry.weather.place === 'string' && typeof entry.weather.fetchedAt === 'string' && Number.isFinite(Date.parse(entry.weather.fetchedAt)) && entry.weather.source === WEATHER_SOURCE && ['rainProbability','uv','min','max'].every(k => entry.weather[k] === undefined || typeof entry.weather[k] === 'number' && Number.isFinite(entry.weather[k]))).slice(-64).map(entry=>({...entry,weather:{...entry.weather,targetKey:entry.key}}));
  } catch { return []; }
}
/** Called only from the opened recap panel or its explicit refresh action. No GPS. */
export async function loadRecapWeather(storage: Storage, tripId: string, items: ProgramItem[], options: { now?: Date; online?: boolean; fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<{ weather: Weather[]; unavailable: boolean; stale: boolean }> {
  const now = options.now || new Date(), entries = cachedWeather(storage, tripId), targets = weatherTargets(items, now);
  const result: Weather[] = [];
  let unavailable = targets.length === 0 || targets.length < new Set(items.map(i => `${i.date}:${i.cityId}`)).size;
  let stale = false;
  for (const item of targets) {
    if (options.signal?.aborted) break;
    const key = targetKey(item), previous = entries.find(e => e.key === key)?.weather;
    if (previous && now.getTime() - Date.parse(previous.fetchedAt) < WEATHER_TTL) { result.push(previous); continue; }
    if (options.online === false) { if (previous) result.push(previous); else unavailable = true; stale = true; continue; }
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 6000);
    try {
      const query = new URLSearchParams({ latitude: String(item.coordinates![0]), longitude: String(item.coordinates![1]), timezone: item.timezone, start_date: item.date, end_date: item.date, daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,uv_index_max' });
      const response = await (options.fetcher || fetch)(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Forecast unavailable');
      const data = await response.json();
      if (data.daily?.time?.[0] !== item.date) throw new Error('Invalid forecast date');
      const number = (field: string, min: number, max: number) => { const value = data.daily[field]?.[0]; return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : undefined; };
      const weather: Weather = { date: item.date, place: item.location, fetchedAt: now.toISOString(), source: WEATHER_SOURCE, targetKey:key, min: number('temperature_2m_min', -100, 70), max: number('temperature_2m_max', -100, 70), rainProbability: number('precipitation_probability_max', 0, 100), uv: number('uv_index_max', 0, 30) };
      if ([weather.min, weather.max, weather.rainProbability, weather.uv].every(v => v === undefined)) throw new Error('Empty forecast');
      result.push(weather);
      const index = entries.findIndex(e => e.key === key);
      if (index >= 0) entries.splice(index, 1);
      entries.push({ key, weather });
    } catch { unavailable = true; if (previous) { result.push(previous); stale = true; } }
    finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
  }
  if (!options.signal?.aborted) {
    // Keep at most 64 forecasts within the recap retention window.
    const oldest = shiftDate(now.toISOString().slice(0, 10), -30);
    try { storage.setItem(weatherCacheKey(tripId), JSON.stringify(entries.filter(e => e.weather.date >= oldest).slice(-64))); } catch { /* Recap remains usable when cache is full. */ }
  }
  return { weather: result, unavailable, stale };
}
