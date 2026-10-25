import test from 'node:test';
import assert from 'node:assert/strict';
import { MASCOT_KEY, defaultMascotPreferences, parseMascotPreferences } from '../src/mascot.ts';
import { mascotDictionary } from '../src/locales/mascot.ts';
import { AccountStorage, localTripStorage } from '../src/cloud/storage.ts';

test('mascot preference validates booleans and keeps old, corrupt and future data harmless', () => {
  for (const raw of [null, '', 'null', '[]', '{', '{"version":2,"enabled":false}']) assert.deepEqual(parseMascotPreferences(raw), defaultMascotPreferences);
  assert.deepEqual(parseMascotPreferences('{"version":1,"enabled":false,"welcomeSeen":true}'), { version:1, enabled:false, welcomeSeen:true });
  assert.deepEqual(parseMascotPreferences('{"version":1,"enabled":"false","welcomeSeen":"true"}'), defaultMascotPreferences);
});

test('personal mascot settings never enter trip records or another account', () => {
  const data = new Map();
  const backing = { get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
  const a = new AccountStorage(backing, 'a'), b = new AccountStorage(backing, 'b'), local = localTripStorage(backing);
  a.setItem(MASCOT_KEY, JSON.stringify({version:1, enabled:false, welcomeSeen:true}));
  assert.equal(parseMascotPreferences(a.getItem(MASCOT_KEY)).enabled, false);
  assert.equal(parseMascotPreferences(b.getItem(MASCOT_KEY)).enabled, true);
  assert.equal(parseMascotPreferences(local.getItem(MASCOT_KEY)).welcomeSeen, false);
  assert.deepEqual(a.records(), []);
  assert.deepEqual([...data.keys()], [a.physicalKey(MASCOT_KEY)]);
});

test('every mascot message and preference has all four language versions', () => {
  const en = mascotDictionary(0);
  for (const index of [0,1,2]) {
    const dictionary = mascotDictionary(index);
    assert.deepEqual(Object.keys(dictionary), Object.keys(en));
    for (const [source, target] of Object.entries(dictionary)) { assert.ok(target.length); assert.notEqual(source, target); }
  }
});
