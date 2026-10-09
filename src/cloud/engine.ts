import { archive, parseTrip, recoveryKey, TRIP_PREFIX } from '../journeys.ts';
import { validateState, uid } from '../lib.ts';
import { validWorld, WORLD_KEY } from '../world.ts';
import { mergeWithConflicts } from './merge.ts';
import { joinContent, splitContent, type TripContent } from './projection.ts';
import { AccountStorage, type Role, type SyncRecord } from './storage.ts';

export type RemoteRecord = { content: unknown; revision: number; private_revision: number; deleted: boolean; role: Role; fullSharing?: boolean; allowedFields?: string[] };
export type SaveResult = { status: 'saved' | 'conflict' | 'revoked'; record?: RemoteRecord };
export type SyncTransport = { save: (key: string, record: SyncRecord, content: unknown) => Promise<SaveResult> };
export function recordContent(key: string, raw: string) { return key === WORLD_KEY ? JSON.parse(raw) as unknown : splitContent(parseTrip(raw).state); }
export function contentRaw(key: string, content: unknown) {
  if (key === WORLD_KEY) { if (!validWorld(content)) throw new Error('Souvenirs distants invalides.'); return JSON.stringify(content); }
  const state = joinContent(content as TripContent);
  if (!validateState(state)) throw new Error('Carnet distant invalide. La copie locale est conservée.');
  return JSON.stringify(archive(state));
}
export function acceptRemote(storage: AccountStorage, key: string, remote: RemoteRecord) {
  const current = storage.record(key);
  if (current?.revoked && !remote.deleted) {
    if (key.startsWith(TRIP_PREFIX)) storage.setItem(recoveryKey(key.slice(TRIP_PREFIX.length)), JSON.stringify({ savedAt: new Date().toISOString(), raw: current.raw }));
    storage.put(key, { ...current, raw: contentRaw(key, remote.content), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, pending: false, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, revoked: false, conflict: undefined }); return;
  }
  if (remote.deleted && !current?.pending) { if (current) storage.put(key, { ...current, deleted: true, pending: false, revision: remote.revision }); return; }
  if (!current) {
    storage.put(key, { version: 1, raw: contentRaw(key, remote.content), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, pending: false, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, operation: uid('operation'), lastSynced: new Date().toISOString() }); return;
  }
  // A changed sharing perimeter never merges stale personal details into the
  // common notebook. Preserve pending work before loading the authorized view.
  const perimeterChanged = !!current.fullSharing !== !!remote.fullSharing ||
    (remote.fullSharing && JSON.stringify([...(current.allowedFields || [])].sort()) !== JSON.stringify([...(remote.allowedFields || [])].sort()));
  if (current.pending && perimeterChanged && !remote.deleted) {
    const backupKey = recoveryKey(key.slice(TRIP_PREFIX.length) + '~access-' + current.operation);
    const backup = JSON.stringify({ savedAt: new Date().toISOString(), raw: current.raw });
    storage.setItem(backupKey, backup);
    if (storage.getItem(backupKey) !== backup) throw new Error('Sauvegarde de récupération impossible.');
    storage.put(key, { ...current, raw: contentRaw(key, remote.content), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, pending: false, conflict: undefined, accessChanged: true }); return;
  }
  if (current.revision === remote.revision && current.privateRevision === remote.private_revision && !remote.deleted) return;
  if (!current.pending) {
    storage.put(key, { ...current, raw: contentRaw(key, remote.content), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, lastSynced: new Date().toISOString(), conflict: undefined }); return;
  }
  const local = recordContent(key, current.raw);
  const merged = current.base ? mergeWithConflicts(current.base, local, remote.content) : { value: local, conflicts: [{ path: '$attachment', base: null, local, remote: remote.content, kind: 'field' as const }] };
  if (remote.deleted || current.deleted) merged.conflicts.push({ path: '$deleted', base: false, local: !!current.deleted, remote: remote.deleted, kind: 'deletion' });
  if (merged.conflicts.length) {
    storage.put(key, { ...current, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, conflict: { remote: remote.content, revision: remote.revision, privateRevision: remote.private_revision, fields: merged.conflicts, remoteDeleted: remote.deleted } });
  } else {
    storage.put(key, { ...current, raw: contentRaw(key, merged.value), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, operation: uid('operation'), conflict: undefined });
  }
}
/** The pending capsule survives reloads and failed/repeated requests. New edits
 * made during an upload remain pending, rather than being marked acknowledged.
 */
export async function syncRecord(storage: AccountStorage, key: string, transport: SyncTransport) {
  const sent = storage.record(key);
  if (!sent?.pending || sent.conflict || sent.revoked) return;
  const content = recordContent(key, sent.raw);
  const result = await transport.save(key, sent, content);
  const current = storage.record(key);
  if (!current || current.revoked) return;
  if (result.status === 'revoked') { storage.put(key, { ...current, revoked: true, pending: false }); return; }
  if (!result.record) throw new Error('Réponse de synchronisation incomplète.');
  if (result.status === 'conflict') { acceptRemote(storage, key, result.record); return; }
  const remote = result.record;
  const unchanged = current.operation === sent.operation;
  storage.put(key, { ...current, ...(unchanged ? { raw: contentRaw(key, remote.content), action: undefined } : {}), base: remote.content, revision: remote.revision, privateRevision: remote.private_revision, pending: !unchanged, role: remote.role, fullSharing: remote.fullSharing, allowedFields: remote.allowedFields, lastSynced: new Date().toISOString(), conflict: undefined });
}
export function resolveRecord(storage: AccountStorage, key: string, choices: Record<string, 'local' | 'remote'>) {
  const current = storage.record(key);
  if (!current?.conflict) return;
  const c = current.conflict;
  if (!c.remoteDeleted && c.fields.some(field => !choices[field.path])) throw new Error('Choisis une version pour chaque différence.');
  // A resolution never discards either source: both stay exportable as recovery copies.
  const savedAt = new Date().toISOString();
  const backupPrefix = key.startsWith(TRIP_PREFIX) ? recoveryKey(key.slice(TRIP_PREFIX.length) + '~conflict-' + current.operation) : 'detours-world-conflict-' + current.operation;
  for (const [side, raw] of [['local', current.raw], ['remote', contentRaw(key, c.remote)]]) {
    const backup = JSON.stringify({ savedAt, raw });
    storage.setItem(backupPrefix + '-' + side, backup);
    if (storage.getItem(backupPrefix + '-' + side) !== backup) throw new Error('Sauvegarde de récupération impossible. Exporte les versions avant de continuer.');
  }
  if (c.remoteDeleted) {
    // A tombstone is never resurrected. The local raw remains downloadable.
    storage.put(key, { ...current, pending: false, deleted: true, conflict: undefined, revision: c.revision }); return;
  }
  const local = recordContent(key, current.raw);
  const value = !current.base ? (choices.$attachment === 'remote' ? c.remote : local) : mergeWithConflicts(current.base, local, c.remote, choices).value;
  const deleted = current.deleted ? choices.$deleted !== 'remote' : false;
  storage.put(key, { ...current, raw: contentRaw(key, value), base: c.remote, revision: c.revision, privateRevision: c.privateRevision, pending: true, deleted, operation: uid('operation'), conflict: undefined });
}
