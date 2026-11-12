import test from 'node:test';
import assert from 'node:assert/strict';
import { dayPhase, detourSummary, formatZoneGap, journalCounts, localHour, sunProgress, zoneOffsetMinutes } from '../src/live-activities.ts';
import { nowDictionary } from '../src/locales/now.ts';

const instant = new Date('2026-11-12T22:42:00Z');
test('Live Activities : décalage des fuseaux et heure locale de l’étape', () => {
  assert.equal(zoneOffsetMinutes('Asia/Tokyo', instant), 540);
  assert.equal(zoneOffsetMinutes('Europe/Paris', instant), 60);
  assert.equal(zoneOffsetMinutes('Asia/Kolkata', instant), 330);
  assert.equal(zoneOffsetMinutes('zone/invalide', instant), 0);
  assert.equal(formatZoneGap(540 - 60), '+8 h');
  assert.equal(formatZoneGap(330 - 540), '−3 h 30');
  assert.equal(formatZoneGap(0), '');
  assert.equal(localHour('Asia/Tokyo', instant), 7 + 42 / 60);
  assert.equal(dayPhase(7.7), 'dawn'); assert.equal(dayPhase(12), 'day'); assert.equal(dayPhase(19), 'evening'); assert.equal(dayPhase(23.7), 'night'); assert.equal(dayPhase(2), 'night');
  assert.equal(sunProgress(6), 0); assert.equal(sunProgress(12), .5); assert.equal(sunProgress(23), 1);
});

const day = { id: 'd', title: 'D', steps: ['a', 'b', 'c', 'd'].map(id => ({ id, title: id.toUpperCase(), description: '', category: 'visit' })) };
test('Live Activities : le détour du jour suit l’ordre de coche, pas la position', () => {
  assert.deepEqual(detourSummary({ done: [] }, day), { total: 4, done: 0, detours: 0, steps: day.steps.map((s, index) => ({ id: s.id, title: s.title, index, done: false, detour: false })), lived: [] });
  const inOrder = detourSummary({ done: ['a', 'b'] }, day);
  assert.equal(inOrder.done, 2); assert.equal(inOrder.detours, 0);
  const skipped = detourSummary({ done: ['a', 'c', 'other-day', 'b', 'c'] }, day);
  assert.equal(skipped.done, 3); assert.equal(skipped.detours, 1);
  assert.deepEqual(skipped.lived.map(s => [s.id, s.detour]), [['a', false], ['c', true], ['b', false]]);
  const alternative = { ...day, preparation: { activeAlternativeId: 'rain', alternatives: [{ id: 'rain', label: 'Pluie', reason: 'rain', stepIds: ['d', 'a'] }] } };
  const rain = detourSummary({ done: ['a'] }, alternative);
  assert.equal(rain.total, 2); assert.equal(rain.detours, 1);
});

test('Live Activities : compteurs du carnet et traductions complètes', () => {
  const state = { cities: [{ days: [day, { ...day, id: 'e', steps: day.steps.slice(0, 1) }] }], stays: [{ name: 'Ryokan', address: '' }, { name: ' ', address: ' ' }] };
  assert.deepEqual(journalCounts(state), { steps: 5, stays: 1 });
  assert.deepEqual(journalCounts({ cities: [] }), { steps: 0, stays: 0 });
  const fields = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const index of [0, 1, 2]) for (const [source, value] of Object.entries(nowDictionary(index))) { assert.ok(value?.trim(), `Traduction vide : ${source}`); assert.deepEqual(fields(value), fields(source), source); }
});
