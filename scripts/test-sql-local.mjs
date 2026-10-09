/** Optional isolated PostgreSQL/WASM check. Install PGlite outside the repository
 * and pass its dist directory. This does not validate Supabase Auth/PostgREST.
 * No crypto stubs: pgcrypto runs as a real PostgreSQL extension.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { blankTrip } from '../src/journeys.ts';
import { splitContent } from '../src/cloud/projection.ts';
import { emptyWorld, confirmVisits } from '../src/world.ts';

if (!process.argv[2]) { console.error('NON EXÉCUTÉ : fournir le dossier dist de @electric-sql/pglite installé hors dépôt.'); process.exit(2); }
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], 'index.js')).href);
const { pgcrypto } = await import(pathToFileURL(resolve(process.argv[2], 'contrib/pgcrypto.js')).href);
const db = new PGlite({ extensions: { pgcrypto } });
const A = '10000000-0000-4000-8000-000000000001', B = '10000000-0000-4000-8000-000000000002';
let count = 0;
try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon;
    insert into auth.users(id) values('${A}'),('${B}');`);
  await db.exec(await readFile('supabase/migrations/202610060001_detours.sql', 'utf8')); count++;
  async function user(id, fn) {
    await db.exec('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    try { return await fn(); } finally { await db.exec('reset role'); }
  }
  const call = async (name, args = []) => (await db.query(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as value`, args)).rows[0].value;
  const reject = async action => { await assert.rejects(action); count++; };
  const state = blankTrip({ id: 'sql-trip', title: 'Deux comptes', countries: ['FR'], status: 'completed' }); state.notes.general = 'PERSONAL SECRET';
  const content = splitContent(state);
  await user(B, () => reject(() => call('detours_save_trip', [A + '~legacy', 0, 0, { ...content, shared: { ...content.shared, journey: { ...content.shared.journey, id: A + '~legacy' } } }, crypto.randomUUID(), false, 'edit'])));
  const save = (revision, personalRevision, value = content, operation = crypto.randomUUID(), deleted = false, action = 'edit') => call('detours_save_trip', ['sql-trip', revision, personalRevision, value, operation, deleted, action]);
  const op = crypto.randomUUID();
  const first = await user(A, () => save(0, 0, content, op)); assert.equal(first.status, 'saved'); count++;
  const repeated = await user(A, () => save(0, 0, content, op)); assert.equal(repeated.record.private_revision, first.record.private_revision); count++;
  await user(B, async () => {
    assert.deepEqual((await db.query('select * from public.detours_trips')).rows, []); count++;
    assert.deepEqual((await db.query('select * from public.detours_personal')).rows, []); count++;
    await reject(() => call('detours_get_trip', ['sql-trip']));
    await reject(() => db.query('insert into public.detours_members(trip_id,user_id,role) values($1,$2,$3)', ['sql-trip', B, 'editor']));
  });
  const invite = await user(A, () => call('detours_invite', ['sql-trip'])); assert.equal(invite.token.length, 64); count++;
  await user(B, async () => {
    assert.equal(await call('detours_accept_invite', [invite.token]), 'sql-trip'); count++;
    assert.equal(await call('detours_accept_invite', [invite.token]), 'sql-trip'); count++;
    const read = await call('detours_get_trip', ['sql-trip']); assert.equal(read.role, 'reader'); assert.equal(JSON.stringify(read).includes('PERSONAL SECRET'), false); count++;
    assert.deepEqual((await db.query('select * from public.detours_personal')).rows, []); count++;
    await reject(() => save(1, 0)); await reject(() => call('detours_invite', ['sql-trip'])); await reject(() => call('detours_set_member', ['sql-trip', B, 'editor']));
  });
  await user(A, async () => {
    await reject(() => call('detours_accept_invite', [invite.token]));
    const cancelled = await call('detours_invite', ['sql-trip']); await call('detours_manage_invite', [cancelled.id]);
    await user(B, () => reject(() => call('detours_accept_invite', [cancelled.token])));
  });
  const expired = await user(A, () => call('detours_invite', ['sql-trip']));
  await db.query("update detours_private.invitations set expires_at=now()-interval '1 second' where id=$1", [expired.id]);
  await user(B, () => reject(() => call('detours_accept_invite', [expired.token])));
  const newer = structuredClone(content); newer.shared.journey.title = 'Nouvelle révision';
  const edited = await user(A, () => save(1, 1, newer)); assert.equal(edited.record.revision, 2); count++;
  const stale = await user(A, () => save(1, 1)); assert.equal(stale.status, 'conflict'); count++;
  const retryAfterEdit = await user(A, () => save(0, 0, content, op)); assert.equal(retryAfterEdit.status, 'conflict'); count++;
  const restored = await user(A, () => save(2, 2, newer, crypto.randomUUID(), false, 'restore')); assert.equal(restored.record.revision, 3); count++;
  assert.equal((await db.query("select count(*)::int n from public.detours_versions where action='restore'")).rows[0].n, 1); count++;
  await user(A, () => reject(() => call('detours_set_member', ['sql-trip', B, 'editor']))); // gate closed
  await db.exec('update detours_private.settings set editors_enabled=true');
  await user(A, () => call('detours_set_member', ['sql-trip', B, 'editor']));
  const editorContent = { shared: { ...newer.shared, journey: { ...newer.shared.journey, title: 'Éditeur' } }, private: { notes: {}, favorites: [], done: [], bookings: [], cityNotes: {}, stayNotes: {}, transferPrivate: {}, bonusPrivate: {} } };
  const editorSaved = await user(B, () => save(3, 0, editorContent)); assert.equal(editorSaved.record.role, 'editor'); count++;
  await user(B, () => reject(() => save(4, 1, editorContent, crypto.randomUUID(), true)));
  await user(A, () => reject(() => save(4, 3, { ...content, shared: { ...content.shared, notes: { general: 'LEAK' } } })));
  await user(A, () => call('detours_set_member', ['sql-trip', B, 'remove']));
  await user(B, async () => { await reject(() => call('detours_get_trip', ['sql-trip'])); assert.equal((await save(4, 1, editorContent)).status, 'revoked'); count++; });
  const deletion = await user(A, () => save(4, 3, content, crypto.randomUUID(), true)); assert.equal(deletion.record.deleted, true); count++;
  const oldDevice = await user(A, () => save(4, 3)); assert.equal(oldDevice.status, 'conflict'); assert.equal(oldDevice.record.deleted, true); count++;
  const world = confirmVisits(emptyWorld(), state, ['FR']);
  const worldOp = crypto.randomUUID();
  await user(A, async () => { const w = await call('detours_save_world', [0, world, worldOp]); assert.equal(w.record.revision, 1); count++; assert.equal((await call('detours_save_world', [0, world, worldOp])).record.revision, 1); count++; });
  await user(B, async () => { assert.deepEqual((await db.query('select * from public.detours_world')).rows, []); count++; });
  console.log(`${count} contrôles SQL locaux réussis (PostgreSQL/WASM + pgcrypto, deux identités JWT simulées). Supabase Auth, PostgREST et les appareils réels restent non vérifiés.`);
} catch (error) { console.error('ÉCHEC SQL LOCAL :', error.message, error.detail || '', error.where || ''); process.exitCode = 1; }
finally { await db.close(); }
