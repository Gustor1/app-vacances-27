import type { City } from './types.ts';

export type MapProvider = 'google' | 'amap';
export const MAP_PREFERENCES_KEY = 'detours-map-preferences-v1';
export function parseMapPreference(raw: string | null): MapProvider {
  try { return JSON.parse(raw || 'null')?.provider === 'amap' ? 'amap' : 'google'; }
  catch { return 'google'; }
}
/** Personal view only: never update the shared city or its legacy provider. */
export function preferredMapCity(city: City, provider: MapProvider): City {
  return { ...city, mapProvider: provider };
}
