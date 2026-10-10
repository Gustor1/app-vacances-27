import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarUid, createProgramCalendar, createTripCalendar, datedDayCount, escapeCalendarText, foldCalendarLine, followingDate, validCalendarDate } from '../src/calendar.ts';

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

const timedState = () => {
  const trip = state();
  trip.journey = { id: 'trip-1', timezone: 'Europe/Paris' };
  trip.cities[0].timezone = 'Asia/Shanghai';
  trip.cities[0].days[0].preparation = { timings: { step: { startTime: '09:30', durationMinutes: 45 } } };
  return trip;
};
const unfold = calendar => calendar.replace(/\r\n /g, '');
const stamp = new Date('2026-10-10T00:00:00Z');

test('export historique conservé à l’identique et nouveaux horaires en UTC avec durée connue', () => {
  const trip = timedState();
  assert.equal(createProgramCalendar(trip, { scope: 'days' }, stamp).content, createTripCalendar(trip, stamp));
  const result = createProgramCalendar(trip, { scope: 'combined', appUrl: 'https://detours.example/' }, stamp);
  assert.equal(result.dayCount, 1); assert.equal(result.timedCount, 1);
  const calendar = unfold(result.content);
  assert.match(calendar, /DTSTART:20280229T013000Z\r\nDTEND:20280229T021500Z/);
  assert.match(calendar, /URL:https:\/\/detours.example\/\?trip=trip-1&kind=step&object=step/);
  assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(!calendar.includes('BEGIN:VALARM'));
});

test('identités stables par voyage/type/objet, pas par horaire; périmètre explicite', () => {
  const trip = timedState();
  const uid = () => unfold(createProgramCalendar(trip, { scope: 'timed' }, stamp).content).match(/UID:(.*)\r\n/)[1];
  const initial = uid();
  trip.cities[0].days[0].preparation.timings.step.startTime = '11:00';
  assert.equal(uid(), initial);
  trip.journey.id = 'trip-2'; assert.notEqual(uid(), initial);
  const empty = createProgramCalendar(trip, { scope: 'timed', selectedKeys: [] }, stamp);
  assert.equal(empty.timedCount, 0); assert.equal(empty.dayCount, 0);
  assert.equal(createProgramCalendar(trip, { scope: 'timed', selectedKeys: ['step:step'] }, stamp).timedCount, 1);
});

test('les heures libres et fuseaux manquants ne créent pas d’événement à minuit', () => {
  const trip = timedState(); const day = trip.cities[0].days[0];
  day.steps.push({ ...day.steps[0], id: 'untimed', period: '09:00 matin' });
  let result = createProgramCalendar(trip, { scope: 'timed' }, stamp);
  assert.equal(result.timedCount, 1); assert.equal(result.missingTime, 1);
  delete trip.journey.timezone; delete trip.cities[0].timezone;
  result = createProgramCalendar(trip, { scope: 'combined' }, stamp);
  assert.equal(result.dayCount, 1); assert.equal(result.timedCount, 0);
  assert.equal(result.missingTimezone, 1); assert.equal(result.missingTime, 1);
  assert.ok(!result.content.includes('DTSTART:'));
});

test('alternatives actives, identités dupliquées dédupliquées et absence de fin inventée', () => {
  const trip = timedState(); const day = trip.cities[0].days[0];
  day.steps.push({ ...day.steps[0], id: 'alternative' });
  day.preparation.alternatives = [{ id: 'rain', label: 'Pluie', reason: 'rain', stepIds: ['alternative'] }];
  day.preparation.activeAlternativeId = 'rain';
  day.preparation.timings.alternative = { startTime: '12:00' };
  trip.cities[0].days.push({ ...day, id: 'same-object-other-day' });
  const result = createProgramCalendar(trip, { scope: 'timed', includeAlarms: true, offsets: [1440, 30, 30] }, stamp);
  assert.equal(result.timedCount, 1);
  const calendar = unfold(result.content);
  assert.ok(!calendar.includes('DTEND:'));
  assert.equal((calendar.match(/BEGIN:VALARM/g) || []).length, 2);
  assert.match(calendar, /TRIGGER:-PT1440M/); assert.match(calendar, /TRIGGER:-PT30M/);
  assert.throws(() => createProgramCalendar(trip, { scope: 'timed', includeAlarms: true, offsets: [0] }, stamp));
});

test('transport avec arrivée et départ dans des fuseaux différents, identité distincte d’une activité', () => {
  const trip = timedState();
  trip.transfers = [{ id: 'step', label: 'Avion', departure: '2028-02-29T10:00', arrival: '2028-02-29T11:30', departureTimezone: 'Asia/Shanghai', arrivalTimezone: 'Europe/Paris', fromCityId: 'shanghai', toCityId: 'paris', fromStation: 'PVG', toStation: 'CDG', booked: true }];
  const calendar = unfold(createProgramCalendar(trip, { scope: 'timed' }, stamp).content);
  assert.match(calendar, /DTSTART:20280229T020000Z\r\nDTEND:20280229T103000Z/);
  const uids = [...calendar.matchAll(/UID:(.*)\r\n/g)].map(match => match[1]);
  assert.equal(uids.length, 2); assert.notEqual(uids[0], uids[1]);
});

test('DST et URL malveillante : première heure répétée, prochain instant valide, pas d’injection', () => {
  const trip = timedState(); trip.cities[0].timezone = 'Europe/Paris';
  const day = trip.cities[0].days[0]; day.date = '2027-03-28'; day.preparation.timings.step.startTime = '02:30';
  let result = createProgramCalendar(trip, { scope: 'timed', appUrl: 'javascript:alert(1)' }, stamp);
  assert.match(result.content, /DTSTART:20270328T010000Z/); assert.ok(!result.content.includes('URL:'));
  day.date = '2027-10-31';
  result = createProgramCalendar(trip, { scope: 'timed' }, stamp);
  assert.match(result.content, /DTSTART:20271031T003000Z/);
  day.steps[0].title = '上海😀;\nEND:VEVENT';
  const calendar = createProgramCalendar(trip, { scope: 'timed', includeAlarms: true }, stamp).content;
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  assert.equal((calendar.match(/(?:^|\r\n)END:VEVENT\r\n/g) || []).length, 1);
});
