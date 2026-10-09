import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/** Only the internally generated ID can be created or cleaned up. No broad query. */
export async function withRemoteTripFixture(owner, run) {
  const id = `rls-check-${randomUUID()}`;
  const marker = `[test-fixture:${randomUUID()}]`;
  let attempted = false, primaryError, cleanupError, result;
  const fixture = {
    id,
    async create(args) {
      assert.equal(args.p_trip, id, 'Refuse an unrelated fixture ID');
      assert.equal(args.p_expected, 0);
      assert.equal(attempted, false, 'Fixture creation must be attempted once');
      assert.equal(args.p_content?.shared?.journey?.id, id, 'Fixture content identity mismatch');
      // Keep this marker through updates/restores; it also proves a committed write
      // after a lost response and prevents cleanup if creation collided with a record.
      args.p_content.shared.journey.description = `${marker} ${args.p_content.shared.journey.description || ''}`;
      attempted = true; // A timeout could occur after the server committed the write.
      const response = await owner.rpc('detours_save_trip', args);
      assert.equal(response.error, null, 'Fixture creation RPC failed');
      assert.equal(response.data?.status, 'saved', 'Fixture creation was not acknowledged');
      return response.data;
    },
  };
  try { result = await run(fixture); }
  catch (error) { primaryError = error; }
  finally {
    if (attempted) {
      try {
        const get = await owner.rpc('detours_get_trip', { p_trip: id });
        assert.equal(get.error, null, 'Fixture cannot be read for cleanup');
        const record = get.data;
        assert.equal(record?.role, 'owner', 'Cleanup requires fixture ownership');
        assert.equal(record.content?.shared?.journey?.id, id, 'Refuse cleanup of an unrelated record');
        assert.ok(record.content.shared.journey.description?.startsWith(marker), 'Fixture creation cannot be proven');
        if (!record.deleted) {
          const remove = await owner.rpc('detours_save_trip', {
            p_trip: id, p_expected: record.revision, p_private_expected: record.private_revision,
            p_content: record.content, p_operation: `cleanup-${randomUUID()}`, p_deleted: true,
          });
          assert.equal(remove.error, null, 'Fixture cleanup RPC failed');
          assert.equal(remove.data?.status, 'saved', 'Cleanup conflict; no forced overwrite');
          assert.equal(remove.data.record?.deleted, true, 'Fixture tombstone missing');
        }
        const verify = await owner.rpc('detours_get_trip', { p_trip: id });
        assert.equal(verify.error, null, 'Fixture cleanup cannot be verified');
        assert.equal(verify.data?.deleted, true, 'Fixture cleanup did not persist');
        const members = await owner.rpc('detours_list_members', { p_trip: id });
        assert.equal(members.error, null); assert.deepEqual(members.data, [], 'Fixture members remain');
        const invites = await owner.rpc('detours_list_invites', { p_trip: id });
        assert.equal(invites.error, null);
        assert.ok(Array.isArray(invites.data) && invites.data.every(invite => invite.cancelled), 'Active fixture invitations remain');
        console.log(`Fixture ${id}: tombstone verified, members removed, invitations cancelled; retained server history.`);
      } catch {
        cleanupError = new Error(`Fixture ${id}: cleanup impossible or unverified; inspect this ID only. No forced deletion was attempted.`);
      }
    }
  }
  if (cleanupError) throw primaryError ? new AggregateError([primaryError, cleanupError], 'Scenario failed and fixture cleanup failed') : cleanupError;
  if (primaryError) throw primaryError;
  return result;
}
