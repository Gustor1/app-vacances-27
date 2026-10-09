import test from 'node:test';
import assert from 'node:assert/strict';
import { buildId, validateIdentity, checkServedBuild, sha256 } from '../scripts/build-identity.mjs';
import { runChecks } from '../scripts/verify-runner.mjs';
import { withRemoteTripFixture } from '../scripts/remote-fixture.mjs';

test('gate : un échec conserve son code et empêche les contrôles suivants', async () => {
  const called = [];
  const result = await runChecks(['types', 'distant simulé', 'build'].map(name => ({ name })), async step => { called.push(step.name); return step.name === 'distant simulé' ? 17 : 0; });
  assert.equal(result.exitCode, 17); assert.deepEqual(called, ['types', 'distant simulé']);
  assert.deepEqual(result.notRun, ['build']); assert.equal(result.checks[1].status, 'failed');
  const thrown = await runChecks([{ name: 'exception' }], async () => { throw new Error('injected'); });
  assert.equal(thrown.exitCode, 1);
});

test('build : identité nouvelle acceptée, bundle ancien, manifeste altéré et chemin dangereux refusés', () => {
  const files = [{ path: '/assets/index-new.js', bytes: 3, sha256: 'a'.repeat(64) }];
  const info = { version: 1, id: buildId(files), entry: files[0].path, files };
  assert.equal(validateIdentity(info, info.id), info);
  assert.throws(() => validateIdentity(info, 'old-id'));
  assert.throws(() => validateIdentity({ ...info, files: [{ ...files[0], bytes: 4 }] }));
  assert.throws(() => validateIdentity({ ...info, entry: '/assets/index-old.js' }));
  assert.throws(() => validateIdentity({ ...info, files: [{ ...files[0], path: '/../outside.js' }] }));
});

test('build servi : URL absolue sans baseURL, entrée et octets vérifiés', async () => {
  const bytes = Buffer.from('new compiled entry');
  const files = [{ path: '/assets/index-next.js', bytes: bytes.length, sha256: sha256(bytes) }];
  const info = { version: 1, id: buildId(files), entry: files[0].path, files };
  let entry = info.entry, body = bytes;
  const page = {
    url: () => 'http://127.0.0.1:1234/',
    locator: () => ({ getAttribute: async () => entry }),
    request: { async get(url) {
      assert.match(url, /^http:\/\/127\.0\.0\.1:1234\//);
      return { status: () => 200, json: async () => info, body: async () => body };
    } },
  };
  assert.equal(await checkServedBuild(page, info.id), info);
  entry = '/assets/index-old.js'; await assert.rejects(checkServedBuild(page), /entry mismatch/);
  entry = info.entry; body = Buffer.from('tampered'); await assert.rejects(checkServedBuild(page), /hash mismatch/);
});

function fakeOwner({ failCleanup = false, foreign = false, conflict = false, lostResponse = false, collision = false } = {}) {
  const records = new Map([['real-trip', { deleted: false }]]), calls = [], invites = new Set();
  const owner = { async rpc(name, args) {
    calls.push({ name, args });
    const id = args.p_trip;
    if (name === 'detours_invite') { invites.add(id); return { data: { token: 'simulated-invite' }, error: null }; }
    if (name === 'detours_get_trip') return { data: records.get(id), error: null };
    if (name === 'detours_list_members') return { data: records.get(id).deleted ? [] : ['test-member'], error: null };
    if (name === 'detours_list_invites') return { data: invites.has(id) ? [{ cancelled: records.get(id).deleted }] : [], error: null };
    if (args.p_deleted && failCleanup) return { error: { message: 'injected cleanup refusal' } };
    if (args.p_deleted && conflict) return { data: { status: 'conflict' }, error: null };
    const record = { content: { shared: { journey: { ...args.p_content.shared.journey, id: foreign ? 'real-trip' : id, ...(collision ? { description: 'unrelated existing trip' } : {}) } } }, revision: 1, private_revision: 1, role: 'owner', deleted: !!args.p_deleted };
    records.set(id, record);
    return { data: { status: collision && !args.p_deleted ? 'conflict' : 'saved', record }, error: lostResponse && !args.p_deleted ? { message: 'lost creation response' } : null };
  } };
  return { owner, records, calls };
}

test('distant simulé : échec après création/invitation nettoie seulement la fixture', async () => {
  const { owner, records, calls } = fakeOwner(); let id;
  const failure = new Error('injected scenario failure after invitation');
  await assert.rejects(withRemoteTripFixture(owner, async fixture => {
    id = fixture.id;
    await fixture.create({ p_trip: id, p_expected: 0, p_content: { shared: { journey: { id } } } });
    await owner.rpc('detours_invite', { p_trip: id });
    throw failure;
  }), error => error === failure);
  assert.equal(records.get(id).deleted, true); assert.equal(records.get('real-trip').deleted, false);
  assert.ok(calls.every(call => call.args.p_trip === id));
  assert.ok(calls.some(call => call.name === 'detours_list_members'));
  assert.ok(calls.some(call => call.name === 'detours_list_invites'));
});

test('distant simulé : nettoyage impossible conserve les deux erreurs et refuse conflit ou identité étrangère', async () => {
  for (const options of [{ failCleanup: true }, { conflict: true }, { foreign: true }]) {
    const { owner, records, calls } = fakeOwner(options);
    const failure = new Error('scenario failed');
    await assert.rejects(withRemoteTripFixture(owner, async fixture => {
      await fixture.create({ p_trip: fixture.id, p_expected: 0, p_content: { shared: { journey: { id: fixture.id } } } }); throw failure;
    }), error => error instanceof AggregateError && error.errors[0] === failure && /cleanup impossible/.test(error.errors[1].message));
    assert.equal(records.get('real-trip').deleted, false);
    if (options.foreign) assert.ok(!calls.some(call => call.args.p_deleted));
  }
});

test('distant simulé : réponse perdue nettoyée si la création est prouvée ; collision jamais supprimée', async () => {
  const lost = fakeOwner({ lostResponse: true }); let id;
  await assert.rejects(withRemoteTripFixture(lost.owner, async fixture => {
    id = fixture.id;
    await fixture.create({ p_trip: id, p_expected: 0, p_content: { shared: { journey: { id } } } });
  }), /creation RPC failed/);
  assert.equal(lost.records.get(id).deleted, true);
  const collision = fakeOwner({ collision: true });
  await assert.rejects(withRemoteTripFixture(collision.owner, fixture => fixture.create({ p_trip: fixture.id, p_expected: 0, p_content: { shared: { journey: { id: fixture.id } } } })), AggregateError);
  assert.ok(!collision.calls.some(call => call.args.p_deleted));
});

test('distant simulé : sans création, pas de nettoyage ; identifiant arbitraire refusé', async () => {
  const { owner, calls } = fakeOwner();
  await assert.rejects(withRemoteTripFixture(owner, fixture => fixture.create({ p_trip: 'real-trip', p_expected: 0 })), /unrelated fixture/);
  assert.deepEqual(calls, []);
  assert.equal(await withRemoteTripFixture(owner, async () => 'done'), 'done');
  assert.deepEqual(calls, []);
});
