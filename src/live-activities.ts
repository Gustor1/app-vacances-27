import type { Day, StoredState } from './types.ts';
import { activeSteps } from './day-preparation.ts';

/** Minutes between UTC and the civil time of `timezone` at `instant` (e.g. +540 for Asia/Tokyo). */
export function zoneOffsetMinutes(timezone: string, instant: Date): number {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(instant).map(part => [part.type, part.value]));
    const civil = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    return Math.round((civil - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
  } catch { return 0; }
}

const NNBSP = ' ';
/** Signed difference "stage minus home", formatted like "+8 h", "−5 h 30" or "" when identical. */
export function formatZoneGap(minutes: number): string {
  if (!minutes) return '';
  const sign = minutes > 0 ? '+' : '−', abs = Math.abs(minutes), h = Math.floor(abs / 60), m = abs % 60;
  return `${sign}${h}${NNBSP}h${m ? `${NNBSP}${String(m).padStart(2, '0')}` : ''}`;
}

export type DayPhase = 'dawn' | 'day' | 'evening' | 'night';
/** Local hour (0–24, fractional) of `timezone` at `instant`. */
export function localHour(timezone: string, instant: Date): number {
  const utc = instant.getUTCHours() * 60 + instant.getUTCMinutes();
  const minutes = ((utc + zoneOffsetMinutes(timezone, instant)) % 1440 + 1440) % 1440;
  return minutes / 60;
}
export function dayPhase(hour: number): DayPhase { return hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'evening' : 'night'; }
/** Sun position on its arc, 0 at 6:00 and 1 at 18:00, clamped. */
export function sunProgress(hour: number): number { return Math.min(1, Math.max(0, (hour - 6) / 12)); }

export type DetourStep = { id: string; title: string; index: number; done: boolean; detour: boolean };
export type DetourSummary = { total: number; done: number; detours: number; steps: DetourStep[]; lived: DetourStep[] };
/**
 * Compares the planned order of a day with the order in which its steps were ticked off.
 * A step counts as a detour when it was ticked while an earlier planned step was still open.
 * `state.done` keeps the ticking order (toggleValue appends), which is the only signal used: no location.
 */
export function detourSummary(state: Pick<StoredState, 'done'>, day: Day): DetourSummary {
  const planned = activeSteps(day);
  const indexOf = new Map(planned.map((step, index) => [step.id, index]));
  const lived: DetourStep[] = [];
  const ticked = new Set<number>();
  for (const id of state.done) {
    const index = indexOf.get(id);
    if (index === undefined || ticked.has(index)) continue;
    let detour = false;
    for (let j = 0; j < index; j++) if (!ticked.has(j)) { detour = true; break; }
    ticked.add(index);
    lived.push({ id, title: planned[index].title, index, done: true, detour });
  }
  const byIndex = new Map(lived.map(step => [step.index, step]));
  const steps = planned.map((step, index) => byIndex.get(index) || { id: step.id, title: step.title, index, done: false, detour: false });
  return { total: planned.length, done: lived.length, detours: lived.filter(step => step.detour).length, steps, lived };
}

/** Counts shown on the offline card: what this journal holds, not a proof of offline availability. */
export function journalCounts(state: Pick<StoredState, 'cities' | 'stays'>) {
  return { steps: state.cities.reduce((sum, city) => sum + city.days.reduce((n, day) => n + day.steps.length, 0), 0), stays: (state.stays || []).filter(stay => stay.name.trim() || stay.address.trim()).length };
}
