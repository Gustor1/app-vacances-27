import { activeSteps } from './day-preparation.ts';
import type { StoredState } from './types';
import { amapLink } from './lib.ts';
import { normalizeOffsets, notificationInstant, projectProgram } from './notifications.ts';
import { validTimezone } from './time.ts';

/** Calendar dates have no timezone; parse without local Date rollover. */
export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function followingDate(value: string): string {
  if (!validCalendarDate(value)) throw new Error('Date invalide.');
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const result = date.toISOString().slice(0, 10);
  if (!validCalendarDate(result)) throw new Error('Date hors des limites du calendrier.');
  return result;
}

export function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

/** RFC 5545 folds by UTF-8 octets, including continuation whitespace. */
export function foldCalendarLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let part = '';
  let bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) { parts.push(part); part = ' '; bytes = 1; }
    part += character;
    bytes += length;
  }
  parts.push(part);
  return parts.join('\r\n');
}

// UTF-8 hex is stable and injective, even for imported IDs containing CR/LF.
export function calendarUid(id: string): string {
  return `day-${Array.from(new TextEncoder().encode(id), n => n.toString(16).padStart(2, '0')).join('')}@a-l-est`;
}

export function datedDayCount(state: StoredState): number {
  return state.cities.flatMap(city => city.days).filter(day => day.date && validCalendarDate(day.date) && day.date !== '9999-12-31').length;
}

export function createTripCalendar(state: StoredState, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Detours//Carnet de voyage//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  for (const city of state.cities) for (const day of city.days) {
    if (!day.date || !validCalendarDate(day.date) || day.date === '9999-12-31') continue;
    const description = [city.chineseName, ...city.notes, ...activeSteps(day).map(step => [
      `${step.period ? step.period + ' · ' : ''}${step.title}${step.chineseName ? ' · ' + step.chineseName : ''}`,
      step.description, step.address || '',
      state.notes[step.id] ? `Note : ${state.notes[step.id]}` : '',
      state.bookings.includes(step.id) ? 'Réservation confirmée' : step.booking ? 'Réservation à prévoir' : '',
      amapLink(city, step),
    ].filter(Boolean).join('\n')), state.notes[day.id] || '', state.notes[city.id] || ''].filter(Boolean).join('\n\n');
    lines.push('BEGIN:VEVENT', `UID:${calendarUid(`${state.journey?.id || "legacy"}:${day.id}`)}`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${followingDate(day.date).replace(/-/g, '')}`,
      `SUMMARY:${escapeCalendarText(`${city.name} · ${day.title}`)}`,
      `LOCATION:${escapeCalendarText([city.name, city.chineseName].filter(Boolean).join(' · '))}`,
      `DESCRIPTION:${escapeCalendarText(description)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldCalendarLine).join('\r\n') + '\r\n';
}

export type CalendarExportOptions = {
  scope: 'days' | 'combined' | 'timed';
  /** Undefined selects all; an empty list explicitly selects none. */
  selectedKeys?: string[];
  includeAlarms?: boolean;
  offsets?: number[];
  appUrl?: string;
};
const calendarStamp = (instant: number) => new Date(instant).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export const calendarItemKey = (item: { kind: string; id: string }) => `${item.kind}:${item.id}`;

/** The legacy function remains byte-compatible. Timed events use absolute UTC
 * instants so imports do not depend on the calendar client's current timezone. */
export function createProgramCalendar(state: StoredState, options: CalendarExportOptions, now = new Date()) {
  const legacy = createTripCalendar(state, now);
  const lines = options.scope === 'timed'
    ? ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Detours//Carnet de voyage//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
    : legacy.trimEnd().split('\r\n').slice(0, -1);
  let timedCount = 0, missingTime = 0, missingTimezone = 0;
  const selected = options.selectedKeys === undefined ? undefined : new Set(options.selectedKeys);
  const seen = new Set<string>();
  const offsets = options.includeAlarms ? normalizeOffsets(options.offsets ?? [30]) : [];
  if (options.scope !== 'days') for (const item of projectProgram(state)) {
    const key = calendarItemKey(item);
    if (seen.has(key) || (selected && !selected.has(key))) continue;
    seen.add(key);
    if (!item.time || !/^\d{2}:\d{2}$/.test(item.time)) { missingTime++; continue; }
    if (!validTimezone(item.timezone)) { missingTimezone++; continue; }
    if (item.instant === undefined || !Number.isFinite(item.instant) || !validCalendarDate(item.date)) { missingTime++; continue; }
    let end: number | undefined;
    if (item.kind === 'step' && item.durationMinutes !== undefined && Number.isFinite(item.durationMinutes) && item.durationMinutes > 0) end = item.instant + item.durationMinutes * 60000;
    if (item.kind === 'transfer') {
      const transfer = state.transfers?.find(t => t.id === item.id);
      const city = state.cities.find(c => c.id === transfer?.toCityId);
      const zone = transfer?.arrivalTimezone || city?.timezone || state.journey?.timezone || '';
      if (transfer?.arrival && validTimezone(zone)) {
        try { const arrival = notificationInstant(transfer.arrival, zone); if (arrival > item.instant) end = arrival; } catch { /* No invented arrival. */ }
      }
    }
    if (end !== undefined && (!Number.isFinite(end) || end > Date.parse('9999-12-31T23:59:59Z'))) end = undefined;
    const tripId = state.journey?.id || 'legacy';
    let url: string | undefined;
    if (options.appUrl) {
      try {
        const target = new URL(options.appUrl);
        if (['https:', 'http:'].includes(target.protocol)) {
          target.searchParams.set('trip', tripId); target.searchParams.set('kind', item.kind); target.searchParams.set('object', item.id);
          url = target.toString();
        }
      } catch { /* Invalid base URL is never inserted into ICS. */ }
    }
    const description = [`${item.date} ${item.time} (${item.timezone})`, url || ''].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${calendarUid(JSON.stringify([tripId, item.kind, item.id]))}`, `DTSTAMP:${calendarStamp(now.getTime())}`,
      `DTSTART:${calendarStamp(item.instant)}`, ...(end !== undefined ? [`DTEND:${calendarStamp(end)}`] : []),
      `SUMMARY:${escapeCalendarText(item.title)}`, `LOCATION:${escapeCalendarText(item.location)}`, `DESCRIPTION:${escapeCalendarText(description)}`,
      ...(url ? [`URL:${url}`] : []), 'TRANSP:OPAQUE');
    for (const offset of offsets) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `TRIGGER:-PT${offset}M`, `DESCRIPTION:${escapeCalendarText(item.title)}`, 'END:VALARM');
    lines.push('END:VEVENT'); timedCount++;
  }
  lines.push('END:VCALENDAR');
  // Legacy lines are already folded. Folding each physical line preserves them.
  return { content: lines.map(foldCalendarLine).join('\r\n') + '\r\n', timedCount, dayCount: options.scope === 'timed' ? 0 : datedDayCount(state), missingTime, missingTimezone };
}
