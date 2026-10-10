import { parseTrip, TRIP_PREFIX, type Storage } from '../journeys.ts';
import { WORLD_KEY } from '../world.ts';
import { uid } from '../lib.ts';
import type { FieldConflict } from './merge.ts';

export type Role = 'owner' | 'editor' | 'reader';
export type SyncRecord = { version: 1; raw: string; base: unknown; revision: number; privateRevision: number; pending: boolean; operation: string; role: Role; fullSharing?: boolean; accessChanged?: boolean; allowedFields?: string[]; action?: 'restore'; deleted?: boolean; revoked?: boolean; lastSynced?: string; conflict?: { remote: unknown; revision: number; privateRevision: number; fields: FieldConflict[]; remoteDeleted?: boolean } };
export type TripStorage = Storage & { removeItem: (key: string) => void; physicalKey: (key: string) => string; accountId: string | null };
export function localTripStorage(storage: globalThis.Storage): TripStorage {
  return { accountId: null, physicalKey: key => key, get length() { return storage.length; }, key: i => storage.key(i), getItem: key => storage.getItem(key), setItem: (key, raw) => storage.setItem(key, raw), removeItem: key => { storage.removeItem(key); if(key.startsWith(TRIP_PREFIX)) for(const prefix of ['detours-notification-form-v1:','detours-notifications-v1:','detours-recaps-v1:','detours-weather-v1:'])storage.removeItem(prefix+key.slice(TRIP_PREFIX.length)); } };
}
/** A single localStorage write commits both the state and its pending operation.
 * There is no second queue to drift from the content. Legacy local keys stay intact.
 */
export class AccountStorage implements TripStorage {
  readonly accountId: string;
  private readonly backing: globalThis.Storage;
  readonly prefix: string;
  readonly changed: () => void;
  constructor(backing: globalThis.Storage, accountId: string, changed = () => {}) {
    this.backing = backing; this.accountId = accountId; this.prefix = `detours-account-v1:${accountId}:`; this.changed = changed;
  }
  physicalKey(key: string) { return this.prefix + key; }
  private keys() { return Array.from({ length: this.backing.length }, (_, i) => this.backing.key(i)).filter((key): key is string => !!key?.startsWith(this.prefix)).map(key => key.slice(this.prefix.length)); }
  get length() { return this.keys().length; }
  key(i: number) { return this.keys()[i] ?? null; }
  isRecord(key: string) { return key.startsWith(TRIP_PREFIX) || key === WORLD_KEY; }
  record(key: string): SyncRecord | null {
    const raw = this.backing.getItem(this.physicalKey(key));
    if (!raw) return null;
    const value = JSON.parse(raw) as SyncRecord;
    if (value.version !== 1 || typeof value.raw !== 'string' || typeof value.pending !== 'boolean' || !Number.isInteger(value.revision) || !['owner', 'reader', 'editor'].includes(value.role)) throw new Error('Cache du compte illisible. La source est conservée.');
    return value;
  }
  getItem(key: string) { return this.isRecord(key) ? (() => { const r = this.record(key); return r?.deleted || r?.revoked ? null : r?.raw ?? null; })() : this.backing.getItem(this.physicalKey(key)); }
  put(key: string, record: SyncRecord) {
    const raw = JSON.stringify(record);
    const previousRaw = this.backing.getItem(this.physicalKey(key));
    const previous = previousRaw ? JSON.parse(previousRaw) as SyncRecord : null;
    const accessChanged = previous && (previous.fullSharing !== record.fullSharing || JSON.stringify([...(previous.allowedFields || [])].sort()) !== JSON.stringify([...(record.allowedFields || [])].sort()));
    if(key.startsWith(TRIP_PREFIX) && (record.revoked || record.deleted || accessChanged)) {
      // Only derived personal data is purged; original carnet/recovery copies stay intact.
      const id=key.slice(TRIP_PREFIX.length);
      for(const prefix of ['detours-recaps-v1:','detours-weather-v1:',...((record.revoked || record.deleted)?['detours-notification-form-v1:','detours-notifications-v1:']:[])])this.backing.removeItem(this.physicalKey(prefix+id));
    }
    if (previousRaw === raw) return;
    this.backing.setItem(this.physicalKey(key), raw);
    if (this.backing.getItem(this.physicalKey(key)) !== raw) throw new Error('Sauvegarde du compte impossible.');
    this.changed();
  }
  setItem(key: string, raw: string) {
    if (!this.isRecord(key)) { this.backing.setItem(this.physicalKey(key), raw); return; }
    const previous = this.record(key);
    if (previous?.deleted || previous?.revoked) throw new Error('Accès retiré. Ton exemplaire reste exportable.');
    if (key.startsWith(TRIP_PREFIX)) parseTrip(raw);
    if (previous?.raw === raw) return;
    if (previous?.role === 'reader') throw new Error('Lecture seule. Crée ta copie pour modifier ce carnet.');
    this.put(key, { version: 1, base: null, revision: 0, privateRevision: 0, role: 'owner', ...previous, raw, pending: true, operation: uid('operation') });
  }
  removeItem(key: string) {
    if (!this.isRecord(key)) { this.backing.removeItem(this.physicalKey(key)); return; }
    const record = this.record(key);
    if (!record) return;
    if (record.role !== 'owner') throw new Error('Seul le propriétaire peut supprimer ce carnet.');
    this.put(key, { ...record, pending: true, deleted: true, operation: uid('operation') });
  }
  records(): [string, SyncRecord][] {
    return this.keys().filter(key => this.isRecord(key)).map(key => [key, this.record(key)!]);
  }
}

