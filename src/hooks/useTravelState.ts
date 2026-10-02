import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { City, StoredState } from '../types';
import { BACKUP_KEY, STORAGE_KEY, cleanReferences, parseBackup, validateState } from '../lib';
import { mergeCatalog, mergeChanges } from '../persistence';

type Recovery = { savedAt: string; raw: string };
function readRecovery(): Recovery | null {
  try { const value: unknown = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null'); if (value && typeof value==='object' && 'raw' in value && typeof value.raw==='string' && 'savedAt' in value && typeof value.savedAt==='string') { parseBackup(value.raw); return value as Recovery; } } catch { /* Keep invalid recovery data untouched. */ }
  return null;
}
function initialize(catalog: City[], legacy: City[]) {
  const fresh: StoredState = {version:1,cities:catalog,catalogBase:catalog,favorites:[],done:[],bookings:[],notes:{},departureDate:''};
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {state:fresh,error:'',raw:null,blocked:false,recovery:readRecovery()};
    const existing = parseBackup(raw);
    return {state:mergeCatalog({...existing,catalogBase:existing.catalogBase||legacy},catalog),error:'',raw:null,blocked:false,recovery:readRecovery()};
  } catch {
    return {state:fresh,error:raw ? 'La sauvegarde locale est illisible. Télécharge le fichier original pour le conserver, ou restaure la copie précédente.' : 'Le stockage local est indisponible. Exporte ton carnet pour conserver tes changements.',raw,blocked:true,recovery:readRecovery()};
  }
}
export function useTravelState(catalog: City[], legacy: City[]) {
  const [initial] = useState(()=>initialize(catalog,legacy));
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

  const update = useCallback((action: SetStateAction<StoredState>, replace = false) => {
    const base = current.current;
    const desired = cleanReferences(typeof action==='function' ? action(base) : action);
    if (!validateState(desired)) { setStorageError('Une modification contient des informations invalides. Rien n’a été remplacé.'); return; }
    current.current=desired; setReactState(desired);
    if (blocked.current && !replace) return;
    const actionNumber=++sequence.current;
    ++pending.current; setSaving(true);
    const write = async () => {
      try {
        const raw=localStorage.getItem(STORAGE_KEY);
        let merged=desired;
        if (!replace && raw) {
          let latest: StoredState;
          try { latest=parseBackup(raw); } catch { blocked.current=true; setCorruptRaw(raw); throw new Error('La sauvegarde a changé et est illisible. Ton carnet actuel reste exportable.'); }
          merged=cleanReferences(mergeChanges(base,desired,latest));
          if (!validateState(merged)) throw new Error('Les modifications d’un autre onglet nécessitent une restauration. Exporte ton carnet avant de continuer.');
          if (JSON.stringify(merged)!==JSON.stringify(desired)) setSyncMessage('Les changements de l’autre onglet ont été conservés.');
        }
        const nextRaw=JSON.stringify(merged);
        if (raw && raw!==nextRaw) {
          try { parseBackup(raw); const previous={savedAt:new Date().toISOString(),raw}; localStorage.setItem(BACKUP_KEY,JSON.stringify(previous)); setRecovery(previous); } catch { /* Invalid originals stay downloadable; a recovery failure must not disguise a primary write failure. */ }
        }
        localStorage.setItem(STORAGE_KEY,nextRaw);
        lastWritten.current=nextRaw; committed.current=merged;
        blocked.current=false; setStorageError(''); setCorruptRaw(null);
        if (actionNumber===sequence.current) { current.current=merged; setReactState(merged); }
      } catch (error) { setStorageError(error instanceof Error && error.message.startsWith('La sauvegarde') ? error.message : 'Sauvegarde locale impossible. Exporte ton carnet pour conserver tes changements.'); }
      finally { --pending.current; if (!pending.current) setSaving(false); }
    };
    const locked = async ():Promise<void> => { if(navigator.locks) {try {await navigator.locks.request(STORAGE_KEY,async()=>{await write();});} catch {await write();}} else await write(); };
    queue.current=queue.current.then(locked,locked).then(()=>undefined);
  }, []);

  useEffect(()=> {
    if (!initial.blocked) update(current.current);
    // Initialize the snapshot once; subsequent changes use the transactional setter.
  }, [initial.blocked,update]);
  useEffect(()=> {
    const receive=(event: StorageEvent)=> {
      if(event.key!==STORAGE_KEY || event.newValue===lastWritten.current || pending.current) return;
      if(!event.newValue) { blocked.current=true; setStorageError('Le carnet a été supprimé dans un autre onglet. Ton exemplaire reste exportable.'); return; }
      try { const next=parseBackup(event.newValue); current.current=next; setReactState(next); blocked.current=false; setStorageError(''); setSyncMessage('Carnet actualisé depuis un autre onglet.'); }
      catch { blocked.current=true;setCorruptRaw(event.newValue);setStorageError('La sauvegarde d’un autre onglet est illisible. Ton exemplaire reste exportable.'); }
    };
    window.addEventListener('storage',receive); return ()=>window.removeEventListener('storage',receive);
  },[]);
  useEffect(()=> {
    const flush=()=> {
      if (!pending.current || blocked.current) return;
      try {
        const raw=localStorage.getItem(STORAGE_KEY);
        const latest=raw ? parseBackup(raw) : committed.current;
        const merged=cleanReferences(mergeChanges(committed.current,current.current,latest));
        if(validateState(merged)) localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
      } catch { /* Pending state stays exportable while this page remains open. */ }
    };
    window.addEventListener('pagehide',flush);
    return ()=>window.removeEventListener('pagehide',flush);
  },[]);
  const setState = update as Dispatch<SetStateAction<StoredState>>;
  const replaceState=(next:StoredState)=> {blocked.current=false;update(mergeCatalog({...next,catalogBase:next.catalogBase||legacy},catalog),true);};
  return {state,setState,replaceState,storageError,corruptRaw,recovery,syncMessage,setSyncMessage,saving};
}
