import type { StoredState } from './types';
import { amapLink } from './lib.ts';

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
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//A l Est//Carnet de voyage//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  for (const city of state.cities) for (const day of city.days) {
    if (!day.date || !validCalendarDate(day.date) || day.date === '9999-12-31') continue;
    const description = [city.chineseName, ...city.notes, ...day.steps.map(step => [
      `${step.period ? step.period + ' · ' : ''}${step.title}${step.chineseName ? ' · ' + step.chineseName : ''}`,
      step.description, step.address || '',
      state.notes[step.id] ? `Note : ${state.notes[step.id]}` : '',
      state.bookings.includes(step.id) ? 'Réservation confirmée' : step.booking ? 'Réservation à prévoir' : '',
      amapLink(city, step),
    ].filter(Boolean).join('\n')), state.notes[day.id] || '', state.notes[city.id] || ''].filter(Boolean).join('\n\n');
    lines.push('BEGIN:VEVENT', `UID:${calendarUid(day.id)}`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${followingDate(day.date).replace(/-/g, '')}`,
      `SUMMARY:${escapeCalendarText(`${city.name} · ${day.title}`)}`,
      `LOCATION:${escapeCalendarText([city.name, city.chineseName].filter(Boolean).join(' · '))}`,
      `DESCRIPTION:${escapeCalendarText(description)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldCalendarLine).join('\r\n') + '\r\n';
}
