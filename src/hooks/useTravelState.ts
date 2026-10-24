import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { StoredState } from '../types';
import { cleanReferences, parseBackup, validateState } from '../lib';
import { mergeCatalog, mergeChanges } from '../persistence';

import { archive, chinaTrip, parseTrip, readTrip, recoveryKey, tripKey, writeTrip } from '../journeys';
import { initialCities } from '../data/trip';
import { useCloud } from '../cloud/CloudProvider';
import type { TripStorage } from '../cloud/storage';
import { commitAssistant, writeWithRecovery } from '../travel-write';
import { assistantRevision, type AssistantProposal } from '../assistant';

export function recoveryState(raw: string): StoredState { try { return parseTrip(raw).state; } catch { const old = parseBackup(raw); return old.journey ? old : chinaTrip(old); } }

type Recovery = { savedAt: string; raw: string; readable: boolean };
function readRecovery(id: string, localStorage: TripStorage): Recovery | null {
  try { const value: unknown = JSON.parse(localStorage.getItem(recoveryKey(id)) || 'null'); if (value && typeof value==='object' && 'raw' in value && typeof value.raw==='string' && 'savedAt' in value && typeof value.savedAt==='string') { let readable=true;try {recoveryState(value.raw);}catch {readable=false;} return {...value,readable} as Recovery; } } catch { /* Keep invalid recovery data untouched. */ }
  return null;
}
function initialize(seed: StoredState, localStorage: TripStorage) {
  const id = seed.journey!.id;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(tripKey(id));
    const existing = readTrip(localStorage, id);
    const state = existing.journey?.followsCatalog ? mergeCatalog(existing, initialCities) : existing;
    return {state,error:'',raw:null,blocked:false,recovery:readRecovery(id, localStorage)};
  } catch {
    return {state:seed,error:'La sauvegarde locale est illisible. Télécharge le fichier original pour le conserver.',raw,blocked:true,recovery:readRecovery(id, localStorage)};
  }
}
export function useTravelState(seed: StoredState, readOnly = false) {
  const { storage: localStorage, scope } = useCloud();
  // The parent remounts this hook when switching trips. Pending writes retain this key.
  const id = seed.journey!.id;
  const key = tripKey(id);
  const backupKey = recoveryKey(id);
  const [initial] = useState(()=>initialize(seed, localStorage));
  const [state, setReactState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [corruptRaw, setCorruptRaw] = useState(initial.raw);
  const [recovery, setRecovery] = useState(initial.recovery);
  const [syncMessage, setSyncMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const blocked = useRef(initial.blocked);
  const current = useRef(state);
  const sequence = useRef(0);
  const pending = useRef(0);
  const queue = useRef(Promise.resolve());
  const lastWritten = useRef<string | null>(null);
  const committed = useRef(initial.state);
  const unsavedBase = useRef<StoredState | null>(null);
  const readOnlyRef = useRef(readOnly); readOnlyRef.current = readOnly;
  const live = useRef({active:true,scope,storage:localStorage});
  live.current.scope=scope; live.current.storage=localStorage;
  const strictBusy = useRef(false);
  useEffect(()=>{live.current.active=true;return()=>{live.current.active=false;};},[]);

  const update = useCallback((action: SetStateAction<StoredState>, replace = false) => {
    if (readOnlyRef.current) return;
    const base = current.current;
    const desired = cleanReferences(typeof action==='function' ? action(base) : action);
    if (!validateState(desired) || desired.journey?.id !== id) { setStorageError('Une modification contient des informations invalides. Rien n’a été remplacé.'); return; }
    current.current=desired; setReactState(desired);
    if (blocked.current && !replace) return;
    const actionNumber=++sequence.current;
    ++pending.current; setSaving(true);
    const write = async () => {
      try {
        if (readOnlyRef.current) return;
        const raw=localStorage.getItem(key);
        if (!raw && !replace) throw new Error('La sauvegarde a été supprimée dans un autre onglet. Ton carnet actuel reste exportable.');
        let merged=desired;
        if (!replace && raw) {
          let latest: StoredState;
          try { latest=readTrip(localStorage,id); } catch { blocked.current=true; setCorruptRaw(raw); throw new Error('La sauvegarde a changé et est illisible. Ton carnet actuel reste exportable.'); }
          merged=cleanReferences(mergeChanges(unsavedBase.current || base,desired,latest));
          if (!validateState(merged) || merged.journey?.id !== id) throw new Error('Les modifications d’un autre onglet nécessitent une restauration. Exporte ton carnet avant de continuer.');
          if (JSON.stringify(archive(merged))!==JSON.stringify(archive(desired))) setSyncMessage('Les changements de l’autre onglet ont été conservés.');
        }
        const nextRaw=JSON.stringify(archive(merged));
        const previous=writeWithRecovery(localStorage,merged);
        if(previous) setRecovery(previous);
        unsavedBase.current=null;
        lastWritten.current=nextRaw; committed.current=merged;
        blocked.current=false; setStorageError(''); setCorruptRaw(null);
        if (actionNumber===sequence.current) { current.current=merged; setReactState(merged); }
      } catch (error) { unsavedBase.current ||= base; setStorageError(error instanceof Error && error.message.startsWith('La sauvegarde') ? error.message : 'Sauvegarde locale impossible. Exporte ton carnet pour conserver tes changements.'); }
      finally { --pending.current; if (!pending.current) setSaving(false); }
    };
    const locked = async ():Promise<void> => { if(navigator.locks) {try {await navigator.locks.request(key,async()=>{await write();});} catch {await write();}} else await write(); };
    queue.current=queue.current.then(locked,locked).then(()=>undefined);
  }, [id,key,backupKey,localStorage]);

  // Controlled actions do not optimistically alter the visible/exportable state.
  // They fail closed on any revision change instead of merging a stale proposal.
  const applyAssistant = async (proposal: AssistantProposal, undo = false, signal?: AbortSignal, allowedFields?: string[]) => {
    if (!navigator.locks) throw new Error('La protection contre les écritures concurrentes est indisponible. Utilise les formulaires du carnet.');
    if (strictBusy.current || pending.current || blocked.current || unsavedBase.current) throw new Error('Attends la sauvegarde. Si elle reste impossible, exporte le carnet.');
    const expected=undo?proposal.after:proposal.before, next=undo?proposal.before:proposal.after;
    if (assistantRevision(current.current)!==assistantRevision(expected) && assistantRevision(current.current)!==assistantRevision(next)) throw new Error('Le carnet ou les droits ont changé. Ferme cet aperçu et recommence.');
    strictBusy.current=true; ++pending.current; setSaving(true);
    const actionNumber=++sequence.current;
    try {
      // No fallback without a lock: rerunning a checked write could overwrite another tab.
      await navigator.locks.request(key,()=>{
        const active=live.current.active && live.current.scope===scope && live.current.storage===localStorage && !signal?.aborted && actionNumber===sequence.current;
        const result=commitAssistant(localStorage,{scope,tripId:id,readOnly:readOnlyRef.current,allowedFields,active},proposal,undo);
        current.current=result.state; committed.current=result.state; lastWritten.current=JSON.stringify(archive(result.state));
        setReactState(result.state); if(result.recovery)setRecovery(result.recovery);
        setStorageError(''); setCorruptRaw(null);
      });
    } catch(error) {
      // Storage events are ignored while a write is pending. On a conflict,
      // refresh the missed revision so closing/rebuilding the preview can recover.
      // An unacknowledged write stays on the explicit idempotent retry path.
      if (error instanceof Error && error.message === 'Le carnet ou les droits ont changé. Ferme cet aperçu et recommence.' && live.current.active && live.current.storage===localStorage && actionNumber===sequence.current) {
        try {const latest=readTrip(localStorage,id);current.current=latest;committed.current=latest;setReactState(latest);} catch { /* Keep the current copy exportable if it was removed or corrupted. */ }
      }
      throw error;
    } finally {strictBusy.current=false;--pending.current;if(live.current.active&&!pending.current)setSaving(false);}
  };

  useEffect(()=> {
    if (!initial.blocked) update(current.current);
    // Initialize the snapshot once; subsequent changes use the transactional setter.
  }, [initial.blocked,update]);
  useEffect(()=> {
    const receive=(event: StorageEvent)=> {
      if(event.key!==localStorage.physicalKey(key) || pending.current) return;
      const nextRaw = localStorage.getItem(key);
      if(nextRaw===lastWritten.current) return;
      if(!event.newValue) { blocked.current=true; setStorageError('Le carnet a été supprimé dans un autre onglet. Ton exemplaire reste exportable.'); return; }
      try { const next=readTrip(localStorage,id); current.current=next; committed.current=next; setReactState(next); blocked.current=false; setStorageError(''); setSyncMessage('Carnet actualisé depuis un autre onglet.'); }
      catch { blocked.current=true;setCorruptRaw(event.newValue);setStorageError('La sauvegarde d’un autre onglet est illisible. Ton exemplaire reste exportable.'); }
    };
    const cloudReceive = () => receive({ key: localStorage.physicalKey(key), newValue: localStorage.getItem(key) } as StorageEvent);
    window.addEventListener('storage',receive); window.addEventListener('detours-storage',cloudReceive);
    return ()=>{window.removeEventListener('storage',receive);window.removeEventListener('detours-storage',cloudReceive);};
  },[id,key,localStorage]);
  useEffect(()=> {
    const flush=()=> {
      if (readOnlyRef.current) return;
      if (!pending.current || blocked.current) return;
      try {
        const raw=localStorage.getItem(key);
        if (!raw) return; // Never resurrect a removed/tombstoned trip on pagehide.
        const latest=readTrip(localStorage,id);
        const merged=cleanReferences(mergeChanges(committed.current,current.current,latest));
        if(validateState(merged) && merged.journey?.id===id) writeTrip(localStorage,merged);
      } catch { /* Pending state stays exportable while this page remains open. */ }
    };
    window.addEventListener('pagehide',flush);
    return ()=>window.removeEventListener('pagehide',flush);
  },[id,key,localStorage]);
  const setState = update as Dispatch<SetStateAction<StoredState>>;
  const replaceState=(next:StoredState)=> {update({...next,journey:state.journey},true);};
  return {state,setState,replaceState,storageError,corruptRaw,recovery,syncMessage,setSyncMessage,saving,applyAssistant};
}
