import type { PersonalWorld, StoredState } from './types.ts';
import type { Storage } from './journeys.ts';
import { archive, chinaTrip, parseTrip, TRIP_PREFIX, RECOVERY_PREFIX, LEGACY_COPY_KEY, LEGACY_RECOVERY_COPY_KEY, tripKey } from './journeys.ts';
import { BACKUP_KEY, STORAGE_KEY, isObj, validateState } from './lib.ts';
import { emptyWorld, validWorld, WORLD_KEY } from './world.ts';
import { PREFERENCES_KEY, parsePreferences } from './locale-utils.ts';
import { MONEY_PREFERENCES_KEY, parseMoneyPreferences } from './money-preferences.ts';
import { notificationKey, parseNotificationPreferences } from './notifications.ts';

function safeNotificationBackup(raw: string): string {
  const p = parseNotificationPreferences(raw);
  return JSON.stringify({ ...p, activityPush: false, recapPush: false, email: false });
}

export const MAX_BACKUP_BYTES = 64_000_000;
export const SEGMENT_CHARACTERS = 250_000;
export const RESTORE_PREFIX = 'detours-restore-v1:';
export const SOURCE_PREFIX = 'detours-restored-source-v1:';
const MAX_ENTRIES = 1103;
const encoder = new TextEncoder();
export const byteSize = (raw: string) => encoder.encode(raw).byteLength;
async function digest(raw: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(raw))), b => b.toString(16).padStart(2, '0')).join('');
}
type Kind = 'trip' | 'world' | 'preferences' | 'money' | 'notifications' | 'source';
type ReadStorage = Pick<Storage, 'getItem' | 'key' | 'length'>;
type Entry = { kind: Kind; key: string; bytes: number; sha256: string; segments: { text: string; sha256: string }[] };
export type Backup = { version: 3; scope: 'backup'; createdAt: string; exclusions: string[]; entries: Entry[]; sha256: string };
type Contents = { trips: StoredState[]; world?: PersonalWorld; preferences?: string; money?: string; notifications?: { tripId: string; raw: string }[]; sources: { key: string; raw: string }[]; exclusions: string[] };
export type RestoreWrite = { key: string; before: string | null; after: string; sha256: string };
export type RestorePlan = { id: string; writes: RestoreWrite[]; trips: number; visits: number; sources: number; collisions: number; keptPreferences: number; bytes: number; exclusions: string[] };
export type PendingRestore = Omit<RestorePlan, 'writes'> & { writes: Omit<RestoreWrite, 'after'>[] };
type Journal = { version: 1; status: 'pending'; plan: PendingRestore } | { version: 1; status: 'complete'; id: string };
function compact(plan: RestorePlan): PendingRestore {
  return { ...plan, writes: plan.writes.map(({ key, before, sha256 }) => ({ key, before, sha256 })) };
}
const kinds = new Set(['trip', 'world', 'preferences', 'money', 'notifications', 'source']);
const rawKey = (key: string) => key === STORAGE_KEY || key === BACKUP_KEY || key === LEGACY_COPY_KEY || key === LEGACY_RECOVERY_COPY_KEY || key.startsWith(RECOVERY_PREFIX) || key.startsWith(SOURCE_PREFIX);
function parsed(raw: string): unknown { try { return JSON.parse(raw); } catch { throw new Error('backup-invalid'); } }
function validPreference(raw: string, money = false) {
  const value = parsed(raw);
  const normalized = money ? parseMoneyPreferences(raw) : parsePreferences(raw);
  if (!isObj(value) || Object.keys(value).length !== 2 || Object.entries(normalized).some(([key, v]) => value[key] !== v)) throw new Error('backup-invalid');
}
// Explicit state fields exclude session, role, revision and queue metadata even in old files.
function contentState(state: StoredState): StoredState {
  const fields = ['version','cities','favorites','done','bookings','notes','departureDate','customBonus','expenses','budgetCny','cnyPerEuro','stays','transfers','packing','catalogBase','journey','bonusCatalog','phrases','documents','budget','budgetCurrency','exchangeRates','rateQuotes','budgetConversions','resume'];
  return Object.fromEntries(fields.filter(key => Object.hasOwn(state, key)).map(key => [key, state[key as keyof StoredState]])) as StoredState;
}
async function entry(kind: Kind, key: string, raw: string): Promise<Entry> {
  if (byteSize(raw) > MAX_BACKUP_BYTES) throw new Error('backup-size');
  const segments: Entry['segments'] = [];
  if (raw.length === 0) segments.push({ text: '', sha256: await digest('') });
  let start = 0;
  while (start < raw.length) {
    // Keep surrogate pairs together so byte counts and hashes match the original text.
    let end = Math.min(start + SEGMENT_CHARACTERS, raw.length);
    if (end < raw.length && /[\uD800-\uDBFF]/.test(raw[end - 1])) end--;
    const text = raw.slice(start, end);
    segments.push({ text, sha256: await digest(text) });
    start = end;
  }
  return { kind, key, bytes: byteSize(raw), sha256: await digest(raw), segments };
}
export async function exportBackup(storage: Storage, preferences: Storage, unreadable: (key: string) => string | null = () => null, exclusions: string[] = []) {
  const entries: Entry[] = [];
  let trips = 0, sources = 0, payloadBytes = 0;
  async function add(kind: Kind, key: string, raw: string) {
    payloadBytes += byteSize(raw);
    if (payloadBytes > MAX_BACKUP_BYTES || entries.length >= MAX_ENTRIES) throw new Error('backup-size');
    entries.push(await entry(kind, key, raw));
  }
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((key): key is string => key !== null).sort();
  for (const key of keys) {
    if (!key.startsWith(TRIP_PREFIX) && !key.startsWith('detours-notifications-v1:') && key !== WORLD_KEY && key !== MONEY_PREFERENCES_KEY && !rawKey(key)) continue;
    let raw: string | null;
    try { raw = storage.getItem(key); } catch { raw = unreadable(key); if (raw === null) throw new Error('backup-unreadable-cache'); }
    if (raw === null) continue;
    let kind: Kind = 'source';
    try {
      if (key.startsWith(TRIP_PREFIX)) {
        const trip = parseTrip(raw);
        if (trip.id !== key.slice(TRIP_PREFIX.length)) throw new Error('backup-invalid');
        raw = JSON.stringify(archive(contentState(trip.state))); kind = 'trip';
      } else if (key === WORLD_KEY) { if (!validWorld(parsed(raw))) throw new Error('backup-invalid'); kind = 'world'; }
      else if (key === MONEY_PREFERENCES_KEY) { validPreference(raw, true); kind = 'money'; }
      else if (key.startsWith('detours-notifications-v1:')) { raw = safeNotificationBackup(raw); kind = 'notifications'; }
    } catch { kind = 'source'; }
    if (kind === 'trip' && ++trips > 100 || kind === 'source' && ++sources > 1000) throw new Error('backup-size');
    await add(kind, key, raw);
  }
  const pref = preferences.getItem(PREFERENCES_KEY);
  if (pref) { try { validPreference(pref); await add('preferences', PREFERENCES_KEY, pref); } catch (error) { if (error instanceof Error && error.message === 'backup-size') throw error; if (sources + 1 > 1000) throw new Error('backup-size', { cause: error }); await add('source', PREFERENCES_KEY, pref); } }
  const body = { version: 3 as const, scope: 'backup' as const, createdAt: new Date().toISOString(), exclusions, entries };
  const raw = JSON.stringify({ ...body, sha256: await digest(JSON.stringify(body)) });
  if (byteSize(raw) > MAX_BACKUP_BYTES) throw new Error('backup-size');
  return raw;
}
export async function parseFullBackup(raw: string): Promise<Contents> {
  if (byteSize(raw) > MAX_BACKUP_BYTES) throw new Error('backup-size');
  const value = parsed(raw);
  const result: Contents = { trips: [], sources: [], exclusions: [] };
  if (isObj(value) && value.version !== 3) {
    // Full restoration is bounded to 64 MB; the separate historical copy import stays at 5 MB.
    if (value.version === 1 && validateState(value)) result.trips = [chinaTrip(contentState(value), 'china-legacy-archive')];
    else if (value.version === 2 && value.scope === 'trip') result.trips = [parseTrip(raw).state];
    else if (value.version === 2 && value.scope === 'collection' && Array.isArray(value.trips) && value.trips.length <= 100) result.trips = value.trips.map(trip => parseTrip(JSON.stringify(trip)).state);
    else throw new Error('backup-invalid');
    if (new Set(result.trips.map(t => t.journey!.id)).size !== result.trips.length) throw new Error('backup-invalid');
    result.exclusions.push('backup-legacy-exclusions');
    return result;
  }
  if (!isObj(value) || value.version !== 3 || value.scope !== 'backup' || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || typeof value.sha256 !== 'string' || !Array.isArray(value.exclusions) || value.exclusions.length > 100 || !value.exclusions.every(x => typeof x === 'string' && x.length <= 1000) || !Array.isArray(value.entries) || value.entries.length > MAX_ENTRIES) throw new Error('backup-invalid');
  const { sha256, ...body } = value;
  if (await digest(JSON.stringify(body)) !== sha256) throw new Error('backup-integrity');
  const identities = new Set<string>();
  for (const row of value.entries) {
    if (!isObj(row) || !kinds.has(String(row.kind)) || typeof row.key !== 'string' || row.key.length > 1000 || !Number.isInteger(row.bytes) || Number(row.bytes) < 0 || Number(row.bytes) > MAX_BACKUP_BYTES || typeof row.sha256 !== 'string' || !Array.isArray(row.segments) || !row.segments.length || row.segments.length > 256) throw new Error('backup-invalid');
    const identity = `${row.kind}:${row.key}`;
    if (identities.has(identity)) throw new Error('backup-invalid');
    identities.add(identity);
    let content = '';
    for (const segment of row.segments) {
      if (!isObj(segment) || typeof segment.text !== 'string' || segment.text.length > SEGMENT_CHARACTERS || typeof segment.sha256 !== 'string') throw new Error('backup-invalid');
      if (await digest(segment.text) !== segment.sha256) throw new Error('backup-integrity');
      content += segment.text;
    }
    if (byteSize(content) !== row.bytes || await digest(content) !== row.sha256) throw new Error('backup-integrity');
    if (row.kind === 'trip') { const trip = parseTrip(content); if (row.key !== tripKey(trip.id) || result.trips.length >= 100) throw new Error('backup-invalid'); result.trips.push(contentState(trip.state)); }
    else if (row.kind === 'world') { const world = parsed(content); if (row.key !== WORLD_KEY || !validWorld(world) || result.world) throw new Error('backup-invalid'); result.world = world; }
    else if (row.kind === 'preferences') { if (row.key !== PREFERENCES_KEY || result.preferences) throw new Error('backup-invalid'); validPreference(content); result.preferences = content; }
    else if (row.kind === 'money') { if (row.key !== MONEY_PREFERENCES_KEY || result.money) throw new Error('backup-invalid'); validPreference(content, true); result.money = content; }
    else if (row.kind === 'notifications') { if (!row.key.startsWith('detours-notifications-v1:') || !row.key.slice('detours-notifications-v1:'.length)) throw new Error('backup-invalid'); (result.notifications ??= []).push({ tripId: row.key.slice('detours-notifications-v1:'.length), raw: safeNotificationBackup(content) }); }
    else { if (!rawKey(row.key) && row.key !== WORLD_KEY && row.key !== MONEY_PREFERENCES_KEY && row.key !== PREFERENCES_KEY && !row.key.startsWith(TRIP_PREFIX) && !row.key.startsWith('detours-notifications-v1:') || result.sources.length >= 1000) throw new Error('backup-invalid'); result.sources.push({ key: row.key, raw: content }); }
  }
  result.exclusions = value.exclusions as string[];
  return result;
}
function validSummary(value: unknown): value is PendingRestore {
  if (!isObj(value) || typeof value.id !== 'string' || !/^[a-f0-9]{64}$/.test(value.id) || !Array.isArray(value.writes) || value.writes.length > MAX_ENTRIES || ![value.trips,value.visits,value.sources,value.collisions,value.keptPreferences,value.bytes].every(x => typeof x === 'number' && Number.isInteger(x) && x >= 0) || !Array.isArray(value.exclusions) || !value.exclusions.every(x => typeof x === 'string')) return false;
  if (new Set(value.writes.map(w => isObj(w) ? w.key : null)).size !== value.writes.length) return false;
  return value.writes.every(w => isObj(w) && typeof w.key === 'string' && (w.before === null || typeof w.before === 'string') && typeof w.sha256 === 'string' && /^[a-f0-9]{64}$/.test(w.sha256) && (w.key.startsWith(`${TRIP_PREFIX}restored-${value.id}-`) || w.key.startsWith(`detours-notifications-v1:restored-${value.id}-`) || w.key.startsWith(`${SOURCE_PREFIX}${value.id}:`) || w.key === WORLD_KEY || w.key === PREFERENCES_KEY || w.key === MONEY_PREFERENCES_KEY));
}
function validPlan(value: unknown): value is RestorePlan {
  if (!validSummary(value)) return false;
  return (value.writes as unknown[]).every(w => {
    if (!isObj(w) || typeof w.key !== 'string' || (w.before !== null && typeof w.before !== 'string') || typeof w.after !== 'string') return false;
    try {
      if (w.key.startsWith(`${TRIP_PREFIX}restored-${value.id}-`)) return w.before === null && parseTrip(w.after).id === w.key.slice(TRIP_PREFIX.length);
      if (w.key.startsWith(`${SOURCE_PREFIX}${value.id}:`)) { const source = parsed(w.after); return w.before === null && isObj(source) && typeof source.key === 'string' && typeof source.raw === 'string'; }
      if (w.key === WORLD_KEY) return validWorld(parsed(w.after));
      if (w.key.startsWith(`detours-notifications-v1:restored-${value.id}-`)) return w.before === null && safeNotificationBackup(w.after) === w.after;
      if (w.key === PREFERENCES_KEY || w.key === MONEY_PREFERENCES_KEY) { validPreference(w.after, w.key === MONEY_PREFERENCES_KEY); return w.before === null; }
    } catch { return false; }
    return false;
  });
}
export function pendingRestores(storage: ReadStorage): PendingRestore[] {
  const plans: PendingRestore[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(RESTORE_PREFIX)) continue;
    const value = parsed(storage.getItem(key) || 'null');
    if (!isObj(value) || value.version !== 1 || !['pending','complete'].includes(String(value.status))) throw new Error('backup-journal');
    if (value.status === 'pending') { if (!validSummary(value.plan) || key !== RESTORE_PREFIX + value.plan.id) throw new Error('backup-journal'); plans.push(value.plan); }
  }
  return plans;
}
export async function prepareRestore(raw: string, storage: ReadStorage): Promise<RestorePlan> {
  const content = await parseFullBackup(raw);
  const id = await digest(raw);
  const pending = pendingRestores(storage);
  const same = pending.find(p => p.id === id);
  if (pending.some(p => p.id !== id)) throw new Error('backup-pending');
  const receipt = storage.getItem(RESTORE_PREFIX + id);
  if (receipt && !same) throw new Error('backup-complete');
  // Rebuild from the original file and the pre-restore snapshots, never from partially merged data.
  const originalStorage = storage;
  if (same) storage = { getItem: key => { const saved = same.writes.find(w => w.key === key); return saved ? saved.before : originalStorage.getItem(key); }, get length() { return originalStorage.length; }, key: i => originalStorage.key(i) };
  const writes: Omit<RestoreWrite, 'sha256'>[] = [];
  const mapping = new Map<string,string>();
  let collisions = 0, keptPreferences = 0;
  for (const [index, original] of content.trips.entries()) {
    if (mapping.has(original.journey!.id)) throw new Error('backup-invalid');
    const restored = `restored-${id}-${index}`;
    mapping.set(original.journey!.id, restored);
    if (storage.getItem(tripKey(original.journey!.id)) !== null) collisions++;
    const state = structuredClone(original);
    state.journey!.id = restored;
    // No server identity or following-catalog behavior is inferred from a restored file.
    const key = tripKey(restored);
    if (storage.getItem(key) !== null) throw new Error('backup-conflict');
    writes.push({ key, before: null, after: JSON.stringify(archive(state)) });
  }
  if (content.world) {
    const before = storage.getItem(WORLD_KEY);
    const current = before === null ? emptyWorld() : parsed(before);
    if (!validWorld(current)) throw new Error('backup-world-invalid');
    const imported = structuredClone(content.world);
    for (const visit of imported.visits) {
      visit.stayId = mapping.get(visit.stayId) || visit.stayId;
      if (visit.journeyId) visit.journeyId = mapping.get(visit.journeyId) || visit.journeyId;
      if (current.visits.some(v => v.id === visit.id)) { collisions++; visit.id = `restored-${id}-${visit.id}`; }
    }
    const visits = [...current.visits];
    for (const visit of imported.visits) { if (visits.some(v => v.stayId === visit.stayId && v.country === visit.country)) { collisions++; continue; } visits.push(visit); }
    const merged = { ...imported, ...(before !== null ? { palette: current.palette } : {}), visits, wishes: [...new Set([...current.wishes, ...imported.wishes])], participation: [...new Set([...(current.participation || []), ...(imported.participation || []).map(key => mapping.get(key) || key)])] };
    if (!validWorld(merged)) throw new Error('backup-invalid');
    writes.push({ key: WORLD_KEY, before, after: JSON.stringify(merged) });
  }
  for (const preference of content.notifications || []) {
    const tripId = mapping.get(preference.tripId);
    if (!tripId) continue; // Never attach an orphan setting to an unrelated trip.
    const key = notificationKey(tripId);
    if (storage.getItem(key) !== null) throw new Error('backup-conflict');
    writes.push({ key, before: null, after: safeNotificationBackup(preference.raw) });
  }
  const preferences: [string, string | undefined][] = [[PREFERENCES_KEY, content.preferences], [MONEY_PREFERENCES_KEY, content.money]];
  for (const [key, rawPreference] of preferences) {
    if (!rawPreference) continue;
    if (storage.getItem(key) !== null) { keptPreferences++; continue; }
    writes.push({ key, before: null, after: rawPreference });
  }
  content.sources.forEach((source, index) => writes.push({ key: `${SOURCE_PREFIX}${id}:${index}`, before: null, after: JSON.stringify(source) }));
  const verifiedWrites = await Promise.all(writes.map(async write => ({ ...write, sha256: await digest(write.after) })));
  const plan: RestorePlan = { id, writes: verifiedWrites, trips: content.trips.length, visits: content.world?.visits.length || 0, sources: content.sources.length, collisions, keptPreferences, bytes: 0, exclusions: content.exclusions };
  plan.bytes = writes.reduce((sum, w) => sum + byteSize(w.key) + byteSize(w.after), 0) + byteSize(JSON.stringify({ version: 1, status: 'pending', plan: compact(plan) }));
  if (same && JSON.stringify(same.writes) !== JSON.stringify(compact(plan).writes)) throw new Error('backup-conflict');
  if (!validPlan(plan)) throw new Error('backup-invalid');
  return plan;
}
/** Durable forward recovery. A quota error never erases an original or hides partial progress. */
export function applyRestore(storage: Storage, proposed: RestorePlan) {
  if (!validPlan(proposed)) throw new Error('backup-invalid');
  const key = RESTORE_PREFIX + proposed.id;
  const previous = storage.getItem(key);
  const plan = proposed;
  if (previous) {
    const journal = parsed(previous);
    if (isObj(journal) && journal.version === 1 && journal.status === 'complete' && journal.id === proposed.id) return;
    if (!isObj(journal) || journal.version !== 1 || journal.status !== 'pending' || !validSummary(journal.plan) || journal.plan.id !== proposed.id) throw new Error('backup-journal');
    if (JSON.stringify(journal.plan.writes) !== JSON.stringify(compact(plan).writes)) throw new Error('backup-conflict');
  }
  if (pendingRestores(storage).some(p => p.id !== plan.id)) throw new Error('backup-pending');
  // Preflight all expected originals before committing even the journal.
  for (const write of plan.writes) {
    const current = storage.getItem(write.key);
    if (current !== write.before && (previous === null || current !== write.after)) throw new Error('backup-conflict');
  }
  if (!previous) {
    const journal: Journal = { version: 1, status: 'pending', plan: compact(plan) };
    const raw = JSON.stringify(journal);
    storage.setItem(key, raw);
    if (storage.getItem(key) !== raw) throw new Error('backup-journal');
  }
  for (const write of plan.writes) {
    const current = storage.getItem(write.key);
    if (current === write.after) continue;
    if (current !== write.before) throw new Error('backup-conflict');
    storage.setItem(write.key, write.after);
    if (storage.getItem(write.key) !== write.after) throw new Error('backup-write');
  }
  const receipt = JSON.stringify({ version: 1, status: 'complete', id: plan.id } satisfies Journal);
  storage.setItem(key, receipt);
  if (storage.getItem(key) !== receipt) throw new Error('backup-journal');
}
