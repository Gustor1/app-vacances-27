import type { StoredState } from './types.ts';
import type { TripStorage } from './cloud/storage.ts';
import { AccountStorage } from './cloud/storage.ts';
import { archive, parseTrip, readTrip, recoveryKey, tripKey, writeTrip } from './journeys.ts';
import { assistantCategory, assistantRevision, prepareAssistant, type AssistantProposal } from './assistant.ts';

/** Shared verified recovery/write contract for forms and controlled actions. */
export function writeWithRecovery(storage: TripStorage, next: StoredState) {
  const id = next.journey!.id, raw = storage.getItem(tripKey(id));
  let recovery = null;
  if (raw && raw !== JSON.stringify(archive(next))) {
    let readable = true; try { parseTrip(raw); } catch { readable = false; }
    recovery = {savedAt:new Date().toISOString(),raw,readable};
    const backup = JSON.stringify(recovery);
    storage.setItem(recoveryKey(id),backup);
    if (storage.getItem(recoveryKey(id)) !== backup) throw new Error('Recovery readback failed');
  }
  writeTrip(storage,next);
  return recovery;
}
export type AssistantContext = { scope: string; tripId: string; readOnly: boolean; allowedFields?: string[]; active: boolean };
/** Caller holds the same Web Lock as forms. All reads/checks/writes here are synchronous. */
export function commitAssistant(storage: TripStorage, context: AssistantContext, proposal: AssistantProposal, undo = false) {
  const conflict = () : never => { throw new Error('Le carnet ou les droits ont changé. Ferme cet aperçu et recommence.'); };
  if (!context.active || context.readOnly || context.scope !== proposal.scope || (storage.accountId || 'local') !== proposal.scope || proposal.before.journey?.id !== context.tripId) return conflict();
  const rebuilt = prepareAssistant(proposal.before,proposal.scope,proposal.action);
  if (assistantRevision(rebuilt.after) !== assistantRevision(proposal.after)) return conflict();
  let allowedFields = context.allowedFields;
  if (storage instanceof AccountStorage) {
    const record = storage.record(tripKey(context.tripId));
    if (!record || record.role === 'reader' || record.deleted || record.revoked || record.conflict || record.accessChanged) return conflict();
    allowedFields = record.fullSharing ? record.allowedFields : undefined;
  }
  const category = assistantCategory(proposal.action);
  if (category && allowedFields && !allowedFields.includes(category)) return conflict();
  const latest = readTrip(storage,context.tripId), expected = undo ? proposal.after : proposal.before, next = undo ? proposal.before : proposal.after;
  // A write may have completed before its acknowledgement/readback was interrupted.
  if (assistantRevision(latest) === assistantRevision(next)) return {state:latest,recovery:null,already:true};
  if (assistantRevision(latest) !== assistantRevision(expected)) return conflict();
  const recovery = writeWithRecovery(storage,next);
  return {state:next,recovery,already:false};
}
