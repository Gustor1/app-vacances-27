import { dateInTimezone, validTimezone } from './time.ts';
import type { Journey, JourneyStatus } from './types';

export type TimingInput = { departureDate?: string; journey?: Pick<Journey, 'id' | 'timezone' | 'endDate' | 'status'> };
export type TripTiming = { phase: 'upcoming' | 'during' | 'past' | 'completed' | 'cancelled' | 'missing' | 'invalid'; timezone: string; fallback: boolean; start?: number; end?: number; before?: number; day?: number; total?: number; since?: number };
export function civilDay(value?: string): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const instant = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== value) return;
  return instant / 86400000;
}
export function tripTiming(trip: TimingInput, instant = new Date()): TripTiming {
  const journey = trip.journey;
  const fallback = !validTimezone(journey?.timezone);
  const timezone = fallback ? 'UTC' : journey!.timezone;
  const base = { timezone, fallback, start: civilDay(trip.departureDate), end: civilDay(journey?.endDate) };
  const status: JourneyStatus | undefined = journey?.status;
  if (status === 'cancelled' || status === 'completed') return { ...base, phase: status };
  const { start, end } = base;
  if ((trip.departureDate && start === undefined) || (journey?.endDate && end === undefined) || (start !== undefined && end !== undefined && end < start)) return { ...base, phase: 'invalid' };
  if (start === undefined) return { ...base, phase: 'missing' };
  const today = civilDay(dateInTimezone(timezone, instant))!;
  const total = end === undefined ? undefined : end - start + 1;
  if (today < start) return { ...base, total, phase: 'upcoming', before: start - today };
  if (end !== undefined && today > end) return { ...base, total, phase: 'past', since: today - end };
  return { ...base, total, phase: 'during', day: today - start + 1 };
}
/** Call with visible trips only. Shared access alone is not participation. */
export function eligibleTimingTrips<T extends TimingInput>(trips: T[], participates: (id: string) => boolean, instant: Date): T[] {
  return trips.filter(trip => participates(trip.journey!.id) && ['upcoming', 'during', 'past', 'completed'].includes(tripTiming(trip, instant).phase));
}
export function selectTimingTrip<T extends TimingInput>(trips: T[], instant: Date): T | undefined {
  const rank = (t: TripTiming) => t.phase === 'during' ? 0 : t.phase === 'upcoming' ? 1 : 2;
  return [...trips].filter(trip => { const t = tripTiming(trip, instant); return ['during', 'upcoming', 'past', 'completed'].includes(t.phase) && (t.start !== undefined || t.end !== undefined); }).sort((a, b) => {
    const x = tripTiming(a, instant), y = tripTiming(b, instant);
    return rank(x) - rank(y) || (x.phase === 'upcoming' ? x.start! - y.start! : x.phase === 'during' ? y.start! - x.start! : (y.end ?? y.start!) - (x.end ?? x.start!)) || a.journey!.id.localeCompare(b.journey!.id);
  })[0];
}
