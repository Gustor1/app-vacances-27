import type { City, Step } from './types.ts';
import { amapLink } from './lib.ts';

export type TravelMode = 'walking' | 'driving' | 'transit';
export type Place = Pick<Step, 'title' | 'chineseName' | 'address' | 'amapUrl'> & { coordinates?: [number, number] };
export function placeDestination(city: City, place: Place): string {
  const coordinates = place.coordinates;
  if (coordinates?.length === 2 && coordinates.every(Number.isFinite) && Math.abs(coordinates[0]) <= 90 && Math.abs(coordinates[1]) <= 180) return coordinates.join(',');
  return [place.chineseName || place.title, city.chineseName || city.name, place.address].filter(Boolean).join(' ');
}
/** No origin means Google determines the current departure; no browser geolocation. */
export function directionsLink(city: City, place: Place, mode: TravelMode = 'walking', origin?: Place): string {
  if (city.mapProvider !== 'google') return amapLink(city, place); // Never send WGS84 coordinates to Amap.
  const params = new URLSearchParams({ api: '1', destination: placeDestination(city, place), travelmode: mode });
  if (origin) params.set('origin', placeDestination(city, origin));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
export function placeLink(city: City, place: Place) {
  if (city.mapProvider !== 'google') return amapLink(city, place);
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: placeDestination(city, place) })}`;
}
