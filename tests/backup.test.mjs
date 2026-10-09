import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRestore, byteSize, exportBackup, MAX_BACKUP_BYTES, parseFullBackup, pendingRestores, prepareRestore, RESTORE_PREFIX, SEGMENT_CHARACTERS, SOURCE_PREFIX } from '../src/backup.ts';
import { archive, blankTrip, chinaTrip, parseImport, readTrip, tripKey, writeTrip } from '../src/journeys.ts';
import { emptyWorld, WORLD_KEY } from '../src/world.ts';
import { MONEY_PREFERENCES_KEY } from '../src/money-preferences.ts';
import { PREFERENCES_KEY } from '../src/locale-utils.ts';
import { AccountStorage } from '../src/cloud/storage.ts';
import { backupDictionary } from '../src/locales/backup.ts';
import { translate } from '../src/locale-utils.ts';

class Memory {
  values = new Map();
  fail = () => false;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.fail(key)) throw new Error('QuotaExceededError'); this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
function fixture() {
  const storage = new Memory();
  const trip = chinaTrip(undefined, 'original');
  trip.journey.status = 'completed';
  trip.notes.general = '中文 · España · été 😀';
  trip.documents = [{ id: 'doc', title: 'Billet.md', content: 'Réservation 中文 😀' }];
  trip.stays = [{ cityId: trip.cities[0].id, name: 'Hôtel', chineseName: '酒店', address: '街道 1', checkIn: '', checkOut: '', notes: 'ABC' }];
  writeTrip(storage, trip);
  storage.setItem(WORLD_KEY, JSON.stringify({ ...emptyWorld(), palette: 'ocean', wishes: ['ES'], participation: ['original'], visits: [{ id: 'visit', stayId: 'original', journeyId: 'original', country: 'CN', label: '中文', year: 2027 }] }));
  storage.setItem(PREFERENCES_KEY, JSON.stringify({ language: 'zh-CN', theme: 'dark' }));
  storage.setItem(MONEY_PREFERENCES_KEY, JSON.stringify({ country: 'ES', currency: 'EUR' }));
  storage.setItem('a-l-est-trip-v2:broken', '{broken 中文');
  storage.setItem('a-l-est-recovery-v2:old', '');
  storage.setItem('sb-test-auth-token', 'SECRET_SESSION');
  return { storage, trip: readTrip(storage, trip.journey.id) };
}

test('sauvegarde complète : tous les champs et relations dans un espace vierge, sans jetons', async () => {
  const { storage, trip } = fixture();
  const raw = await exportBackup(storage, storage);
  assert.equal(raw.includes('SECRET_SESSION'), false);
  const target = new Memory(), plan = await prepareRestore(raw, target);
  assert.equal(target.length, 0); // Preview never writes.
  assert.equal(plan.sources, 2);
  applyRestore(target, plan);
  const restored = readTrip(target, `restored-${plan.id}-0`);
  assert.deepEqual({ ...restored, journey: { ...restored.journey, id: trip.journey.id } }, trip);
  const world = JSON.parse(target.getItem(WORLD_KEY));
  assert.equal(world.visits[0].journeyId, restored.journey.id);
  assert.equal(world.visits[0].stayId, restored.journey.id);
  assert.deepEqual(world.participation, [restored.journey.id]);
  assert.equal(world.visits[0].label, '中文');
  assert.equal(world.palette, 'ocean');
  assert.equal(target.getItem(PREFERENCES_KEY), storage.getItem(PREFERENCES_KEY));
  assert.equal(target.getItem(MONEY_PREFERENCES_KEY), storage.getItem(MONEY_PREFERENCES_KEY));
  assert.ok([...target.values.keys()].some(key => key.startsWith(SOURCE_PREFIX)));
  assert.deepEqual(pendingRestores(target), []);
  const before = [...target.values];
  applyRestore(target, plan);
  assert.deepEqual([...target.values], before);
  await assert.rejects(prepareRestore(raw, target), /backup-complete/);
});

test('un carnet et une collection dépassant 5 Mo restent segmentés et restaurables, limites anciennes inchangées', async () => {
  for (const single of [true, false]) {
    const source = new Memory();
    for (let i = 0; i < (single ? 1 : 11); i++) {
      const trip = blankTrip({ title: 'Grand carnet 中文' });
      trip.documents = Array.from({ length: single ? 11 : 1 }, (_, j) => ({ id: `doc-${j}`, title: 'Document', content: 'é'.repeat(single ? 240_000 : 245_000) }));
      writeTrip(source, trip);
    }
    const raw = await exportBackup(source, source);
    assert.ok(byteSize(raw) > 5_000_000);
    if (single) assert.ok(JSON.parse(raw).entries.some(row => row.segments.length > 1));
    const target = new Memory(), plan = await prepareRestore(raw, target);
    applyRestore(target, plan);
    assert.equal(readTrip(target, `restored-${plan.id}-0`).documents[0].content.length, single ? 240_000 : 245_000);
    assert.throws(() => parseImport(raw), /5 Mo/);
    const historical = JSON.stringify({ version: 2, scope: 'collection', trips: [...source.values.values()].map(value => JSON.parse(value)) });
    assert.ok(byteSize(historical) > 5_000_000);
    const historicalTarget = new Memory(), historicalPlan = await prepareRestore(historical, historicalTarget);
    applyRestore(historicalTarget, historicalPlan);
    assert.equal(historicalPlan.trips, single ? 1 : 11);
  }
});

test('segment coupé à une paire Unicode, octets exacts et corruption rejetée avant toute écriture', async () => {
  const source = new Memory(), trip = blankTrip({ title: 'Unicode' });
  trip.notes.general = 'a'.repeat(SEGMENT_CHARACTERS - 100) + '😀'.repeat(200);
  writeTrip(source, trip);
  const raw = await exportBackup(source, source), decoded = await parseFullBackup(raw);
  assert.equal(decoded.trips[0].notes.general, trip.notes.general);
  const damaged = JSON.parse(raw);
  damaged.entries[0].segments[0].text += 'X';
  await assert.rejects(prepareRestore(JSON.stringify(damaged), new Memory()), /backup-integrity/);
  await assert.rejects(parseFullBackup('x'.repeat(MAX_BACKUP_BYTES + 1)), /backup-size/);
});

test('quota avant journal ne modifie rien ; interruption après carnet reprend sans duplication', async () => {
  const { storage } = fixture(), raw = await exportBackup(storage, storage), target = new Memory();
  target.setItem('existing', 'intact');
  const plan = await prepareRestore(raw, target);
  target.fail = key => key.startsWith(RESTORE_PREFIX);
  assert.throws(() => applyRestore(target, plan), /Quota/);
  assert.deepEqual([...target.values], [['existing', 'intact']]);
  target.fail = key => key === WORLD_KEY;
  assert.throws(() => applyRestore(target, plan), /Quota/);
  assert.equal(pendingRestores(target).length, 1);
  assert.equal(target.getItem(RESTORE_PREFIX + plan.id).includes('Réservation 中文'), false);
  assert.ok(target.getItem(tripKey(`restored-${plan.id}-0`)));
  const resumed = await prepareRestore(raw, target);
  target.fail = () => false;
  applyRestore(target, resumed);
  assert.equal([...target.values.keys()].filter(key => key.startsWith('a-l-est-trip-v2:')).length, 1);
  assert.equal(target.getItem('existing'), 'intact');
});

test('collision, souvenirs et préférences existants conservés ; changement concurrent bloque', async () => {
  const { storage, trip } = fixture(), raw = await exportBackup(storage, storage), target = new Memory();
  writeTrip(target, trip);
  target.setItem(PREFERENCES_KEY, JSON.stringify({ language: 'en', theme: 'system' }));
  const originalWorld = { ...emptyWorld(), visits: [{ id: 'visit', stayId: 'past', country: 'FR', label: 'Voyage précédent' }] };
  target.setItem(WORLD_KEY, JSON.stringify(originalWorld));
  const plan = await prepareRestore(raw, target);
  assert.equal(plan.collisions, 2);
  assert.equal(plan.keptPreferences, 1);
  target.setItem(WORLD_KEY, JSON.stringify({ ...originalWorld, wishes: ['JP'] }));
  assert.throws(() => applyRestore(target, plan), /backup-conflict/);
  assert.equal(target.getItem(RESTORE_PREFIX + plan.id), null);
  const next = await prepareRestore(raw, target);
  applyRestore(target, next);
  assert.deepEqual(readTrip(target, 'original'), trip);
  const world = JSON.parse(target.getItem(WORLD_KEY));
  assert.equal(world.visits.length, 2);
  assert.deepEqual(world.wishes, ['JP', 'ES']);
  assert.equal(JSON.parse(target.getItem(PREFERENCES_KEY)).language, 'en');
});

test('modification après interruption ne se fait pas écraser ; autre opération bloquée', async () => {
  const { storage } = fixture(), raw = await exportBackup(storage, storage), target = new Memory();
  const plan = await prepareRestore(raw, target);
  target.fail = key => key === WORLD_KEY;
  assert.throws(() => applyRestore(target, plan));
  target.fail = () => false;
  const trip = readTrip(target, `restored-${plan.id}-0`); trip.notes.general = 'Modification ultérieure'; writeTrip(target, trip);
  assert.throws(() => applyRestore(target, plan), /backup-conflict/);
  await assert.rejects(prepareRestore(JSON.stringify(archive(blankTrip({ title: 'Autre' }))), target), /backup-pending/);
  assert.equal(readTrip(target, trip.journey.id).notes.general, 'Modification ultérieure');
});

test('v1/v2 compatibles ; compte exporté seul, aucun droit ou file restauré', async () => {
  const legacy = chinaTrip(); delete legacy.journey;
  for (const raw of [JSON.stringify(legacy), JSON.stringify(archive(chinaTrip())), JSON.stringify({ version: 2, scope: 'collection', trips: [archive(chinaTrip())] })]) {
    const target = new Memory(), plan = await prepareRestore(raw, target); applyRestore(target, plan); assert.equal(plan.trips, 1);
  }
  const backing = new Memory(), account = new AccountStorage(backing, 'account-A');
  const trip = blankTrip({ title: 'Compte A' }); writeTrip(account, trip);
  new AccountStorage(backing, 'account-B').setItem(tripKey('foreign'), JSON.stringify(archive(blankTrip({ id: 'foreign', title: 'SECRET_B' }))));
  const raw = await exportBackup(account, backing);
  assert.equal(raw.includes('SECRET_B'), false);
  assert.equal(raw.includes('operation'), false);
  assert.equal(raw.includes('account-A'), false);
  const target = new Memory(), plan = await prepareRestore(raw, target); applyRestore(target, plan);
  assert.equal([...target.values.keys()].some(key => key.startsWith('detours-account')), false);
  assert.equal(readTrip(target, `restored-${plan.id}-0`).journey.title, 'Compte A');
});

test('octets autour des limites historiques et v3, journal compact sous quota', async () => {
  const old = JSON.stringify(archive(blankTrip({ title: 'Limite' })));
  await parseFullBackup(old.padEnd(5_000_000, ' '));
  await parseFullBackup(old.padEnd(5_000_001, ' '));
  assert.throws(() => parseImport(old.padEnd(5_000_001, ' ')), /5 Mo/);
  const raw = await exportBackup(new Memory(), new Memory());
  await parseFullBackup(raw.padEnd(MAX_BACKUP_BYTES, ' '));
  await assert.rejects(parseFullBackup(raw.padEnd(MAX_BACKUP_BYTES + 1, ' ')), /backup-size/);
  const source = new Memory(), trip = blankTrip({ title: 'Sous quota' });
  trip.documents = [{ id: 'doc', title: 'Large', content: 'a'.repeat(450_000) }];
  writeTrip(source, trip);
  const target = new Memory(), plan = await prepareRestore(await exportBackup(source, source), target);
  const originalSet = target.setItem.bind(target);
  target.setItem = (key, value) => {
    const other = [...target.values].filter(([k]) => k !== key).reduce((sum, [k, v]) => sum + k.length + v.length, 0);
    if (other + key.length + value.length > 500_000) throw new Error('Quota');
    originalSet(key, value);
  };
  applyRestore(target, plan);
  assert.equal(readTrip(target, `restored-${plan.id}-0`).documents[0].content.length, 450_000);
});

test('quatre langues couvrent les messages de sauvegarde et leurs variables', () => {
  for (const [index, language] of ['en', 'zh-CN', 'es'].entries()) {
    for (const [original, translated] of Object.entries(backupDictionary(index))) {
      assert.equal(typeof translated, 'string');
      assert.equal(translate(original, language), translated);
      assert.deepEqual([...translated.matchAll(/\{\w+\}/g)].map(m => m[0]), [...original.matchAll(/\{\w+\}/g)].map(m => m[0]));
    }
  }
});
