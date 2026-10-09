import type { City, Day, StoredState } from './types.ts';
import { dateInTimezone, validTimezone } from './time.ts';
import { activeSteps } from './day-preparation.ts';

export function stageTimezone(state: StoredState, city: City): string {
  return validTimezone(city.timezone) ? city.timezone : validTimezone(state.journey?.timezone) ? state.journey.timezone : 'UTC';
}
export function nowDays(state: StoredState, date: string | null, instant = new Date()) {
  return state.cities.flatMap(city => city.days.filter(day => day.date === (date || dateInTimezone(stageTimezone(state, city), instant))).map(day => ({ city, day })));
}
export function nowDetails(state: StoredState, city: City, day: Day) {
  const stay = state.stays?.find(item => item.cityId === city.id);
  const steps = activeSteps(day);
  const next = steps.find(step => !state.done.includes(step.id));
  const following = next ? steps.slice(steps.indexOf(next)+1).find(step => !state.done.includes(step.id)) : undefined;
  const reservation = day.steps.find(step => state.bookings.includes(step.id) && !state.done.includes(step.id)) || day.steps.find(step => state.bookings.includes(step.id));
  const transfer = day.date ? state.transfers?.find(item => item.fromCityId === city.id && item.booked && item.departure.slice(0, 10) === day.date) : undefined;
  const stayDateMatches = !stay || !day.date || ((!stay.checkIn || day.date >= stay.checkIn) && (!stay.checkOut || day.date < stay.checkOut));
  return { stay, stayDateMatches, next, following, reservation, transfer, note: state.notes[day.id] || '' };
}
