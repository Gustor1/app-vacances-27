import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarUid, createTripCalendar, datedDayCount, escapeCalendarText, foldCalendarLine, followingDate, validCalendarDate } from '../src/calendar.ts';

const state = () => ({ version: 1, departureDate: '2027-04-01', favorites: [], bookings: [], done: [], notes: {}, cities: [{ id: 'shanghai', name: 'Shanghai', chineseName: '上海', notes: ['Ville\nConseil'], days: [{ id: 'day-一', title: 'Découverte', date: '2028-02-29', steps: [{ id: 'step', title: 'Temple', chineseName: '寺庙', description: 'Visiter', category: 'visit', booking: true }] }, { id: 'undated', title: 'Libre', steps: [] }] }] });

test('dates calendaires réelles, années bissextiles et limites', () => {
  for (const date of ['2028-02-29', '2000-02-29', '0001-01-01', '9999-12-31']) assert.equal(validCalendarDate(date), true, date);
  for (const date of ['1900-02-29', '2027-02-29', '2027-04-31', '2027-13-01', '2027-01-00', '2027-1-1', '0000-01-01', '', '2027-03-01\r\nBEGIN:VEVENT']) assert.equal(validCalendarDate(date), false, date);
});

test('lendemain UTC : changements de mois, année et DST sans décalage', () => {
  assert.equal(followingDate('2028-02-29'), '2028-03-01');
  assert.equal(followingDate('2027-12-31'), '2028-01-01');
  assert.equal(followingDate('0099-12-31'), '0100-01-01');
  const original = process.env.TZ;
  try {
    for (const zone of ['Pacific/Kiritimati', 'America/Los_Angeles', 'Europe/Paris']) {
      process.env.TZ = zone;
      assert.equal(followingDate('2027-03-28'), '2027-03-29');
      assert.equal(followingDate('2027-10-31'), '2027-11-01');
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
  assert.throws(() => followingDate('2027-02-30'));
  assert.throws(() => followingDate('9999-12-31'));
});

test('échappement des champs et identifiants stables sans injection', () => {
  assert.equal(escapeCalendarText('a\\b,c;d\r\nBEGIN:VEVENT\rfin'), 'a\\\\b\\,c\\;d\\nBEGIN:VEVENT\\nfin');
  const id = 'x\r\nEND:VEVENT\nBEGIN:VEVENT:上海';
  assert.equal(calendarUid(id), calendarUid(id));
  assert.match(calendarUid(id), /^day-[0-9a-f]*@a-l-est$/);
  assert.notEqual(calendarUid('一'), calendarUid('二'));
  assert.notEqual(calendarUid('a-b'), calendarUid('ab'));
});

test('pliage RFC 5545 à 75 octets UTF-8 sans casser les caractères chinois ou emoji', () => {
  const line = 'DESCRIPTION:' + '上海😀 éè'.repeat(50);
  const folded = foldCalendarLine(line);
  assert.equal(folded.replace(/\r\n /g, ''), line);
  for (const physicalLine of folded.split('\r\n')) assert.ok(Buffer.byteLength(physicalLine, 'utf8') <= 75);
  assert.equal(foldCalendarLine('a'.repeat(75)), 'a'.repeat(75));
  assert.equal(foldCalendarLine('a'.repeat(76)), 'a'.repeat(75) + '\r\n a');
});

test('ICS exporte uniquement les jours explicitement datés et inclut les notes chinoises et Amap', () => {
  const trip = state(); trip.notes.step = 'Attention, entrée; à réserver'; trip.bookings = ['step'];
  const calendar = createTripCalendar(trip, new Date('2026-10-02T12:30:00Z')).replace(/\r\n /g, '');
  assert.equal(datedDayCount(trip), 1);
  assert.equal((calendar.match(/BEGIN:VEVENT\r\n/g) || []).length, 1);
  assert.ok(calendar.includes('DTSTART;VALUE=DATE:20280229\r\n'));
  assert.ok(calendar.includes('DTEND;VALUE=DATE:20280301\r\n'));
  assert.ok(calendar.includes('DTSTAMP:20261002T123000Z'));
  assert.ok(calendar.includes('寺庙'));
  assert.ok(calendar.includes('Attention\\, entrée\\; à réserver'));
  assert.ok(calendar.includes('Réservation confirmée'));
  assert.ok(calendar.includes('https://uri.amap.com/search'));
  assert.ok(!calendar.includes('SUMMARY:Shanghai · Libre'));
});

test('un champ importé ne crée jamais un événement et une date invalide est ignorée', () => {
  const trip = state();
  trip.cities[0].name = 'Shanghai\r\nEND:VEVENT\r\nBEGIN:VEVENT';
  trip.cities[0].days[0].id = 'id\r\nBEGIN:VEVENT';
  trip.cities[0].days.push({ id: 'bad', title: 'Impossible', date: '2027-02-29', steps: [] }, { id: 'limit', title: 'Limite', date: '9999-12-31', steps: [] });
  const calendar = createTripCalendar(trip).replace(/\r\n /g, '');
  assert.equal((calendar.match(/(?:^|\r\n)BEGIN:VEVENT\r\n/g) || []).length, 1);
  assert.equal(datedDayCount(trip), 1);
  assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
});
