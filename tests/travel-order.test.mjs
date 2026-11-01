import test from 'node:test';
import assert from 'node:assert/strict';
import { commitStepOrderUndo } from '../src/travel-write.ts';
import { AccountStorage, localTripStorage } from '../src/cloud/storage.ts';
import { readTrip, writeTrip, tripKey, recoveryKey } from '../src/journeys.ts';
import { fixture } from '../scripts/companion-fixture.mjs';

function setup(account = false) {
  const map = new Map();
  const backing = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), key: index => [...map.keys()][index] ?? null, get length() { return map.size; } };
  const storage = account ? new AccountStorage(backing, 'account') : localTripStorage(backing);
  const state = fixture(), day = state.cities[0].days[0];
  const before = structuredClone(day.steps), after = structuredClone([before[1], before[0], ...before.slice(2)]);
  day.steps = structuredClone(after); writeTrip(storage, state);
  return { storage, map, state, undo: { city: 'c', day: 'd', before, after }, context: { tripId: state.journey.id, readOnly: false, active: true } };
}

test('order undo preserves concurrent changes outside the affected steps and is idempotent', () => {
  const { storage, state, undo, context } = setup();
  state.notes.concurrent = 'Keep this note'; state.cities[0].days[0].title = 'A corrected day title';
  writeTrip(storage, state);
  commitStepOrderUndo(storage, context, undo);
  const saved = readTrip(storage, context.tripId);
  assert.deepEqual(saved.cities[0].days[0].steps, undo.before);
  assert.equal(saved.notes.concurrent, 'Keep this note');
  assert.equal(saved.cities[0].days[0].title, 'A corrected day title');
  assert.ok(storage.getItem(recoveryKey(context.tripId)));
  assert.deepEqual(commitStepOrderUndo(storage, context, undo).state, saved);
});

test('concurrent edits, deletion, invalid order and read-only context cannot be overwritten', () => {
  for (const kind of ['edited', 'added', 'deleted', 'malformed', 'reader', 'inactive']) {
    const { storage, state, undo, context } = setup();
    if (kind === 'edited') state.cities[0].days[0].steps[0].title = 'Changed elsewhere';
    if (kind === 'added') state.cities[0].days[0].steps.push({ id: 'new', title: 'New step', category: 'visit', description: '' });
    if (kind === 'malformed') undo.before[0].description = 'Not an order-only change';
    if (kind === 'reader') context.readOnly = true;
    if (kind === 'inactive') context.active = false;
    writeTrip(storage, state);
    if (kind === 'deleted') storage.removeItem(tripKey(context.tripId));
    const raw = storage.getItem(tripKey(context.tripId));
    assert.throws(() => commitStepOrderUndo(storage, context, undo));
    assert.equal(storage.getItem(tripKey(context.tripId)), raw);
  }
});

test('interrupted readback can retry without repeating the write or losing the recovery', () => {
  const { storage, undo, context } = setup();
  const write = storage.setItem; let interrupted = true;
  storage.setItem = (key, raw) => { write(key, raw); if (interrupted && key === tripKey(context.tripId)) { interrupted = false; throw new Error('interrupted'); } };
  assert.throws(() => commitStepOrderUndo(storage, context, undo), /interrupted/);
  const recovery = storage.getItem(recoveryKey(context.tripId));
  assert.deepEqual(commitStepOrderUndo(storage, context, undo).state.cities[0].days[0].steps, undo.before);
  assert.equal(storage.getItem(recoveryKey(context.tripId)), recovery);
});

test('account access changes and other account data remain protected', () => {
  for (const patch of [{ role: 'reader' }, { revoked: true }, { deleted: true }, { accessChanged: true }]) {
    const { storage, undo, context } = setup(true);
    storage.put(tripKey(context.tripId), { ...storage.record(tripKey(context.tripId)), ...patch });
    const before = storage.getItem(tripKey(context.tripId));
    assert.throws(() => commitStepOrderUndo(storage, context, undo));
    assert.equal(storage.getItem(tripKey(context.tripId)), before);
  }
});
