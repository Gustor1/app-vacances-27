import { readTrip, tripKey, writeTrip, type Storage } from '../journeys.ts';
import { isObj, isValidDate, uid, validateState } from '../lib.ts';
import { AccountStorage } from '../cloud/storage.ts';
import { draftToTrip, validateDraft } from './draft.ts';
import { MAX_SOURCE_LENGTH } from './types.ts';
import type { ImportSession } from './types.ts';
export const DRAFT_KEY = 'detours-planning-draft-v1';
type ScopedStorage = Storage & { accountId?: string | null };
function checkScope(storage: Pick<ScopedStorage,'accountId'>, scope: string) {
  if ((storage.accountId || 'local') !== scope) throw new Error('Le brouillon appartient à un autre espace personnel.');
}
export function createSession(scope: string, source = ''): ImportSession { return { version:1, id:uid('trip'),scope,source,draft:null,keepSource:false,departureDate:'',currency:'',timezone:'',committedId:null }; }
function validateSession(value: unknown, scope: string): ImportSession {
  if (!isObj(value) || value.version !== 1 || value.scope !== scope || typeof value.id !== 'string' || !/^trip-[0-9a-f-]{36}$/.test(value.id) || typeof value.source !== 'string' || value.source.length > MAX_SOURCE_LENGTH || typeof value.keepSource !== 'boolean' || typeof value.currency !== 'string' || typeof value.timezone !== 'string' || typeof value.departureDate !== 'string' || (value.departureDate && !isValidDate(value.departureDate)) || (value.committedId !== null && value.committedId !== value.id)) throw new Error('Brouillon illisible. La source est conservée.');
  if (value.draft !== null) validateDraft(value.draft, value.source, true, true);
  if (value.preparedTrip !== undefined && (!validateState(value.preparedTrip) || value.preparedTrip.journey?.id !== value.id)) throw new Error('Brouillon illisible. La source est conservée.');
  return value as ImportSession;
}
export function saveSession(storage: ScopedStorage, session: ImportSession): void {
  checkScope(storage,session.scope); validateSession(session,session.scope);
  const raw=JSON.stringify(session); storage.setItem(DRAFT_KEY,raw);
  if (storage.getItem(DRAFT_KEY) !== raw) throw new Error('Sauvegarde du brouillon impossible. Le texte reste disponible.');
}
export function loadSession(storage: Pick<ScopedStorage,'getItem'|'accountId'>, scope: string): ImportSession|null {
  checkScope(storage,scope); const raw=storage.getItem(DRAFT_KEY); if (!raw) return null;
  try { return validateSession(JSON.parse(raw),scope); } catch { throw new Error('Brouillon illisible. La source est conservée.'); }
}
export function clearSession(storage: ScopedStorage & {removeItem(key:string):void}, scope: string): void {
  checkScope(storage,scope); storage.removeItem(DRAFT_KEY);
  if (storage.getItem(DRAFT_KEY) !== null) throw new Error('Effacement du brouillon impossible.');
}
/** Persist the exact candidate first, then the trip, then its receipt. Replays only read. */
export function commitImport(storage: ScopedStorage, session: ImportSession): import('../types').StoredState {
  checkScope(storage,session.scope); validateSession(session,session.scope);
  const saved=loadSession(storage,session.scope);
  const candidate=saved?.id === session.id && saved.preparedTrip ? saved.preparedTrip : session.preparedTrip;
  if (storage.getItem(tripKey(session.id))) {
    const result=readTrip(storage,session.id);
    if (!candidate && !session.committedId && !(saved?.id === session.id && saved.committedId)) throw new Error('Cette identité de carnet existe déjà.');
    if (candidate && !session.committedId && !(saved?.id === session.id && saved.committedId) && JSON.stringify(result) !== JSON.stringify(candidate)) throw new Error('Le carnet ne correspond pas au brouillon sauvegardé.');
    saveSession(storage,{ ...session, preparedTrip:candidate, committedId:session.id });
    return result;
  }
  if (!session.draft) throw new Error('Vérifie le programme avant de créer le carnet.');
  const state=candidate || draftToTrip(session.draft,{ ...session,id:session.id });
  const journal={ ...session,preparedTrip:state };
  saveSession(storage,journal);
  if (storage instanceof AccountStorage) storage.createLocalTrip(state);
  else writeTrip(storage,state);
  const result=readTrip(storage,session.id);
  if (JSON.stringify(result)!==JSON.stringify(state)) throw new Error('Le carnet ne correspond pas au brouillon sauvegardé.');
  saveSession(storage,{ ...journal, committedId:session.id });
  return result;
}
