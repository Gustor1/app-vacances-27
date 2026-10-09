/** Run only against a configured test/beta project with two authorized test users.
 * Tokens stay in process environment; there is no service_role bypass.
 */
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { blankTrip } from '../src/journeys.ts';
import { splitContent } from '../src/cloud/projection.ts';
import { withRemoteTripFixture } from './remote-fixture.mjs';

const names = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'DETOURS_TEST_A_TOKEN', 'DETOURS_TEST_B_TOKEN'];
if (process.env.DETOURS_ALLOW_NETWORK !== '1' || names.some(name => !process.env[name])) { console.error('Contrôle Supabase NON EXÉCUTÉ : DETOURS_ALLOW_NETWORK=1 et ' + names.join(', ') + ' requis (deux comptes de test distincts).'); process.exit(2); }
const client = token => createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const a = client(process.env.DETOURS_TEST_A_TOKEN), b = client(process.env.DETOURS_TEST_B_TOKEN);
const rpc = async (c, name, args) => { const result = await c.rpc(name, args); assert.equal(result.error, null, name + ': ' + result.error?.message); return result.data; };
const reject = async (c, name, args) => { const result = await c.rpc(name, args); assert.ok(result.error, name + ' must be denied'); };
const [au, bu] = await Promise.all([a.auth.getUser(process.env.DETOURS_TEST_A_TOKEN), b.auth.getUser(process.env.DETOURS_TEST_B_TOKEN)]);
assert.equal(au.error, null); assert.equal(bu.error, null); assert.notEqual(au.data.user.id, bu.data.user.id);
await withRemoteTripFixture(a, async fixture => {
const id = fixture.id;
const state = blankTrip({ id, title: 'Contrôle RLS à supprimer', countries: ['FR'], status: 'planning' });
state.notes.general = 'PRIVATE-' + randomUUID();
const content = splitContent(state);
const args = { p_trip: id, p_expected: 0, p_private_expected: 0, p_content: content, p_operation: 'operation-' + randomUUID(), p_deleted: false };
const saved = await fixture.create(args); assert.equal(saved.status, 'saved');
const repeated = await rpc(a, 'detours_save_trip', args); assert.equal(repeated.record.revision, saved.record.revision); assert.equal(repeated.record.private_revision, saved.record.private_revision);
for (const table of ['detours_trips', 'detours_personal', 'detours_versions', 'detours_members']) {
  const result = await b.from(table).select('*').eq(table === 'detours_trips' ? 'id' : 'trip_id', id); assert.equal(result.error, null); assert.deepEqual(result.data, [], table);
}
await reject(b, 'detours_get_trip', { p_trip: id });
const directWrite = await b.from('detours_members').insert({ trip_id: id, user_id: bu.data.user.id, role: 'editor' }); assert.ok(directWrite.error);
const invite = await rpc(a, 'detours_invite', { p_trip: id });
const accepted = await rpc(b, 'detours_accept_invite', { p_token: invite.token }); assert.equal(accepted, id);
assert.equal(await rpc(b, 'detours_accept_invite', { p_token: invite.token }), id); // Safe retry by the same recipient.
await reject(a, 'detours_accept_invite', { p_token: invite.token });
const reader = await rpc(b, 'detours_get_trip', { p_trip: id }); assert.equal(reader.role, 'reader'); assert.equal(JSON.stringify(reader).includes(state.notes.general), false);
const sharedTable = await b.from('detours_trips').select('content').eq('id', id).single(); assert.equal(sharedTable.error, null); assert.equal(JSON.stringify(sharedTable.data).includes(state.notes.general), false);
const privateTable = await b.from('detours_personal').select('*').eq('trip_id', id); assert.deepEqual(privateTable.data, []);
await reject(b, 'detours_save_trip', { ...args, p_expected: saved.record.revision, p_private_expected: 0, p_operation: 'operation-' + randomUUID() });
await reject(b, 'detours_invite', { p_trip: id });
await reject(b, 'detours_set_member', { p_trip: id, p_user: bu.data.user.id, p_role: 'editor' });
await reject(b, 'detours_list_members', { p_trip: id });
const members = await rpc(a, 'detours_list_members', { p_trip: id });
assert.equal(members.length, 1); assert.equal(members[0].user_id, bu.data.user.id);
assert.equal(typeof members[0].display_name, 'string'); assert.equal('email' in members[0], false);
const cancelled = await rpc(a, 'detours_invite', { p_trip: id }); await rpc(a, 'detours_manage_invite', { p_id: cancelled.id }); await reject(b, 'detours_accept_invite', { p_token: cancelled.token });
await reject(b, 'detours_accept_invite', { p_token: '0'.repeat(64) });
const update = await rpc(a, 'detours_save_trip', { ...args, p_expected: saved.record.revision, p_private_expected: saved.record.private_revision, p_content: { ...content, shared: { ...content.shared, journey: { ...content.shared.journey, title: 'Révision récente' } } }, p_operation: 'operation-' + randomUUID() });
assert.equal(update.record.revision, saved.record.revision + 1);
const stale = await rpc(a, 'detours_save_trip', { ...args, p_expected: saved.record.revision, p_private_expected: saved.record.private_revision, p_operation: 'operation-' + randomUUID() }); assert.equal(stale.status, 'conflict'); assert.equal(stale.record.content.shared.journey.title, 'Révision récente');
const restored = await rpc(a, 'detours_save_trip', { ...args, p_expected: update.record.revision, p_private_expected: update.record.private_revision, p_operation: 'operation-' + randomUUID(), p_action: 'restore' }); assert.equal(restored.record.revision, update.record.revision + 1);
const history = await a.from('detours_versions').select('revision,action,content').eq('trip_id', id); assert.equal(history.error, null); assert.ok(history.data.some(v => v.action === 'restore')); assert.equal(JSON.stringify(history.data).includes(state.notes.general), false);
let finalRecord = restored.record;
if (process.env.DETOURS_TEST_EDITORS === 'true') {
  await rpc(a, 'detours_set_member', { p_trip: id, p_user: bu.data.user.id, p_role: 'editor' });
  const editorPrivate = 'EDITOR-PRIVATE-' + randomUUID();
  const editorContent = { shared: { ...content.shared, journey: { ...content.shared.journey, title: 'Planning modifié ensemble' } }, private: { ...reader.content.private, notes: { general: editorPrivate } } };
  const editorArgs = { ...args, p_expected: finalRecord.revision, p_private_expected: 0, p_content: editorContent, p_operation: 'operation-' + randomUUID() };
  const edited = await rpc(b, 'detours_save_trip', editorArgs); assert.equal(edited.status, 'saved'); assert.equal(edited.record.role, 'editor');
  const ownerAfterEdit = await rpc(a, 'detours_get_trip', { p_trip: id });
  assert.equal(ownerAfterEdit.content.shared.journey.title, 'Planning modifié ensemble');
  assert.equal(ownerAfterEdit.content.private.notes.general, state.notes.general);
  assert.equal(JSON.stringify(ownerAfterEdit).includes(editorPrivate), false);
  const personal = await b.from('detours_personal').select('user_id,content').eq('trip_id', id);
  assert.equal(personal.error, null); assert.ok(personal.data.every(row => row.user_id === bu.data.user.id));
  assert.equal(JSON.stringify(personal.data).includes(state.notes.general), false);
  await reject(b, 'detours_save_trip', { ...editorArgs, p_expected: edited.record.revision, p_private_expected: edited.record.private_revision, p_operation: 'operation-' + randomUUID(), p_deleted: true });
  await reject(b, 'detours_list_members', { p_trip: id });
  const concurrent = await rpc(a, 'detours_save_trip', { ...args, p_expected: finalRecord.revision, p_private_expected: finalRecord.private_revision, p_operation: 'operation-' + randomUUID() }); assert.equal(concurrent.status, 'conflict');
  await rpc(a, 'detours_set_member', { p_trip: id, p_user: bu.data.user.id, p_role: 'reader' });
  await reject(b, 'detours_save_trip', { ...editorArgs, p_expected: edited.record.revision, p_private_expected: edited.record.private_revision, p_operation: 'operation-' + randomUUID() });
  finalRecord = ownerAfterEdit;
  console.log('Contrôles réseau éditeur réussis : modification, notes isolées, RLS, conflit, rétrogradation, gestion réservée au propriétaire.');
}
await rpc(a, 'detours_set_member', { p_trip: id, p_user: bu.data.user.id, p_role: 'remove' }); await reject(b, 'detours_get_trip', { p_trip: id });
const revoked = await rpc(b, 'detours_save_trip', { ...args, p_expected: finalRecord.revision, p_operation: 'operation-' + randomUUID() }); assert.equal(revoked.status, 'revoked');
const deletion = await rpc(a, 'detours_save_trip', { ...args, p_expected: finalRecord.revision, p_private_expected: finalRecord.private_revision, p_operation: 'operation-' + randomUUID(), p_deleted: true }); assert.equal(deletion.record.deleted, true);
const oldDevice = await rpc(a, 'detours_save_trip', { ...args, p_expected: finalRecord.revision, p_private_expected: finalRecord.private_revision, p_operation: 'operation-' + randomUUID() }); assert.equal(oldDevice.status, 'conflict'); assert.equal(oldDevice.record.deleted, true);
console.log('Contrôles Supabase réussis : deux comptes, RLS directe, confidentialité, idempotence, invitations, lecteur, révocation, révisions, restauration et tombstone.');
console.log('Encore à vérifier sur appareils réels : OAuth Google, expiration réelle du lien, session expirée, deux éditeurs et mobile hors ligne.');
});
