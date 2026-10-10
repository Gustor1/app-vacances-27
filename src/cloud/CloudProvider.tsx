import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, cloudConfigError } from './client';
import { AccountStorage, localTripStorage, type Role, type TripStorage } from './storage';
import { acceptRemote, syncRecord, type RemoteRecord, type SaveResult } from './engine';
import { WORLD_KEY } from '../world';
import { tripKey, parseTrip, recoveryKey } from '../journeys';
import type { Journey } from '../types';
import { ACCOUNT_HINT_KEY, readAccountHint, type AccountHint } from './session-cache';
import { disablePush } from '../notification-push';

export type TripSummary = { id: string; journey: Journey; departureDate: string; revision: number; privateRevision: number; deleted: boolean; role: Role; cityCount: number; fullSharing?: boolean };
type CloudContext = { session: Session | null; ready: boolean; configured: boolean; storage: TripStorage; summaries: TripSummary[]; error: string; sync: () => Promise<void>; download: (id: string) => Promise<void>; leave: (id: string) => Promise<void>; scope: string; signIn: () => Promise<void>; signOut: () => Promise<void>; pending: number; status: string; online: boolean; working: boolean; revision: number; rpc: <T>(name: string, args?: Record<string, unknown>) => Promise<T> };
const Context = createContext<CloudContext | null>(null);
async function cloudRpc<T>(name: string, args: Record<string, unknown>, token: string): Promise<T> {
  if (!supabase) throw new Error('La synchronisation n’est pas configurée.');
  const { data, error } = await supabase.rpc(name, args).setHeader('Authorization', `Bearer ${token}`);
  if (error) throw error;
  return data as T;
}
export function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hint, setHint] = useState<AccountHint | null>(() => supabase ? readAccountHint(localStorage) : null);
  const [ready, setReady] = useState(!supabase || (!!hint && !new URLSearchParams(location.search).has('code')));
  const [error, setError] = useState(cloudConfigError);
  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [revision, setRevision] = useState(0);
  const [working, setWorking] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncedOnce, setSyncedOnce] = useState(false);
  const accountId = session?.user.id || hint?.id || null;
  const scope = accountId || 'local';
  const changed = useCallback(() => { setRevision(n => n + 1); window.dispatchEvent(new Event('detours-storage')); }, []);
  const storage = useMemo(() => accountId ? new AccountStorage(localStorage, accountId, changed) : localTripStorage(localStorage), [accountId, changed]);
  // Pin each request to the session whose cache it reads/writes. The SDK's
  // global session may change in another tab while a request is in flight.
  const rpc = useCallback(<T,>(name: string, args: Record<string, unknown> = {}): Promise<T> => {
    if (!session) return Promise.reject(new Error('Connexion nécessaire.'));
    return cloudRpc<T>(name, args, session.access_token);
  }, [session]);
  const activeStorage = useRef(storage); activeStorage.current = storage;
  const activeSession = useRef(session); activeSession.current = session;
  const inFlight = useRef<{ storage: TripStorage; promise: Promise<void> } | null>(null);
  const failureCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessEpoch = useRef(new Map<string, number>());
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const remember = (next: Session | null) => {
      const previous = activeSession.current;
      if (previous && previous.user.id !== next?.user.id) {
        const deviceId = new AccountStorage(localStorage,previous.user.id,changed).getItem('detours-push-device-v1');
        if (deviceId) {
          // Do not block Auth's internal callback on SDK network work. Pin the
          // old bearer: a changed global SDK session must never disable B's device.
          void cloudRpc('detours_disable_push',{p_device:deviceId},previous.access_token).catch(() => {
            // Expired bearer: remove the browser endpoint so it can no longer
            // display A's notifications. A fresh explicit enrollment is needed.
            if ('serviceWorker' in navigator) void navigator.serviceWorker.getRegistration().then(async sw => { if(sw && activeSession.current?.user.id===next?.user.id) await (await sw.pushManager.getSubscription())?.unsubscribe(); });
          });
        }
      }
      activeSession.current=next;
      setSession(next); if (next) { const value: AccountHint = { version: 1, id: next.user.id, email: next.user.email }; setHint(value); try { localStorage.setItem(ACCOUNT_HINT_KEY, JSON.stringify(value)); } catch { /* Session still works; export remains available. */ } } else setHint(readAccountHint(localStorage));
    };
    supabase.auth.getSession().then(({ data, error }) => { if (!mounted) return; if (error) setError('Connexion nécessaire. Tes changements locaux sont conservés.'); remember(data.session); setReady(true); }).catch(() => { if (!mounted) return; setError('Connexion nécessaire. Tes changements locaux sont conservés.'); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { if (!mounted) return; remember(next); setReady(true); });
    const receive = (event: StorageEvent) => { if (event.key === ACCOUNT_HINT_KEY) setHint(readAccountHint(localStorage)); };
    window.addEventListener('storage', receive);
    return () => { mounted = false; data.subscription.unsubscribe(); window.removeEventListener('storage', receive); };
  }, [changed]);
  const download = useCallback(async (id: string) => {
    if (!(storage instanceof AccountStorage)) return;
    const epochKey = storage.physicalKey(tripKey(id));
    const epoch = accessEpoch.current.get(epochKey);
    const wasRevoked = !!storage.record(tripKey(id))?.revoked;
    const remote = await rpc<RemoteRecord>('detours_get_trip', { p_trip: id });
    if (activeStorage.current !== storage || accessEpoch.current.get(epochKey) !== epoch) return;
    // Another tab can leave while this request is in flight. A fresh download
    // started from a revoked capsule is still allowed after a new invitation.
    if (!wasRevoked && storage.record(tripKey(id))?.revoked) return;
    acceptRemote(storage, tripKey(id), remote);
  }, [storage, rpc]);
  const leave = useCallback(async (id: string) => {
    if (!(storage instanceof AccountStorage) || !session || !navigator.onLine) throw new Error('Connexion nécessaire pour quitter ce voyage.');
    // Finish an upload before leaving; the server independently serializes all writes.
    if (inFlight.current?.storage === storage) await inFlight.current.promise;
    await rpc('detours_leave_trip', { p_trip: id });
    const key = tripKey(id), epochKey = storage.physicalKey(key);
    accessEpoch.current.set(epochKey, (accessEpoch.current.get(epochKey) || 0) + 1);
    const current = storage.record(key);
    if (current) storage.put(key, { ...current, revoked: true, pending: false, conflict: undefined });
    const list = JSON.parse(storage.getItem('detours-summaries') || '[]') as TripSummary[];
    storage.setItem('detours-summaries', JSON.stringify(list.filter(trip => trip.id !== id)));
    if (activeStorage.current === storage) setSummaries(previous => previous.filter(trip => trip.id !== id));
  }, [storage, session, rpc]);
  const sync = useCallback(async (): Promise<void> => {
    if (!(storage instanceof AccountStorage) || !navigator.onLine || !session || activeStorage.current !== storage) return;
    if (inFlight.current) {
      const running = inFlight.current;
      await running.promise;
      if (running.storage !== storage) await sync();
      return;
    }
    const operation = (async () => {
    setWorking(true);
    try {
      const list = await rpc<TripSummary[]>('detours_list_trips');
      if (activeStorage.current !== storage) return;
      storage.setItem('detours-summaries', JSON.stringify(list)); setSummaries(list);
      const authorized = new Map(list.map(s => [s.id, s]));
      // Download only cached trips whose server revision changed; uncached trips
      // stay as summaries until explicitly opened.
      for (const [key] of storage.records()) {
        const record = storage.record(key);
        if (!record) continue;
        if (key === WORLD_KEY) continue;
        const id = key.slice('a-l-est-trip-v2:'.length);
        const summary = authorized.get(id);
        if (!summary && record.revision > 0) { storage.put(key, { ...record, revoked: true, pending: false }); continue; }
        if (summary?.role !== record.role && summary) storage.put(key, { ...record, role: summary.role });
        const knownRevision = record.conflict?.revision ?? record.revision;
        const knownPrivateRevision = record.conflict?.privateRevision ?? record.privateRevision;
        const knownDeleted = !!(record.conflict?.remoteDeleted || record.deleted);
        if (summary && (summary.revision !== knownRevision || summary.privateRevision !== knownPrivateRevision || summary.deleted !== knownDeleted)) await download(id);
      }
      const { data: world, error: worldError } = await supabase!.from('detours_world').select('content,revision').eq('user_id', session.user.id).setHeader('Authorization', 'Bearer ' + session.access_token).maybeSingle();
      if (worldError) throw worldError;
      if (activeStorage.current !== storage) return;
      if (world) acceptRemote(storage, WORLD_KEY, { content: world.content, revision: world.revision, private_revision: 0, deleted: false, role: 'owner' });
      for (const [key] of storage.records()) {
        const record = storage.record(key);
        if (!record) continue;
        if (activeStorage.current !== storage) return;
        if (!record.pending || record.conflict || record.revoked) continue;
        if (record.role === 'reader') {
          const id = key.slice('a-l-est-trip-v2:'.length);
          storage.setItem(recoveryKey(id), JSON.stringify({ savedAt: new Date().toISOString(), raw: record.raw }));
          const remote = await rpc<RemoteRecord>('detours_get_trip', { p_trip: id });
          if (activeStorage.current !== storage) return;
          if (storage.record(key)?.revoked) continue;
          storage.put(key, { ...record, revoked: true, pending: false });
          acceptRemote(storage, key, remote); continue;
        }
        await syncRecord(storage, key, { save: async (key, record, content) => {
          if (activeStorage.current !== storage) throw new Error('Compte changé.');
          if (key === WORLD_KEY) return rpc<SaveResult>('detours_save_world', { p_expected: record.revision, p_content: content, p_operation: record.operation });
          return rpc<SaveResult>('detours_save_trip', { p_trip: parseTrip(record.raw).id, p_expected: record.revision, p_private_expected: record.privateRevision, p_content: content, p_operation: record.operation, p_deleted: !!record.deleted, p_action: record.action || 'edit' });
        } });
      }
      if (activeStorage.current !== storage) return;
      const updated = await rpc<TripSummary[]>('detours_list_trips');
      if (activeStorage.current !== storage) return;
      storage.setItem('detours-summaries', JSON.stringify(updated)); setSummaries(updated); setError(''); setSyncedOnce(true); failureCount.current = 0;
    } catch (failure) { if (activeStorage.current === storage) { failureCount.current++; const auth = typeof failure === 'object' && failure !== null && 'status' in failure && failure.status === 401; setError(auth ? 'Connexion nécessaire. Tes changements locaux sont conservés.' : 'Synchronisation indisponible. Tes changements restent sur cet appareil ; réessaie après reconnexion.'); } }
    finally { setWorking(false); }
    })();
    inFlight.current = { storage, promise: operation };
    try { await operation; } finally { if (inFlight.current?.promise === operation) inFlight.current = null; }
  }, [storage, session, download, rpc]);
  useEffect(() => {
    setSyncedOnce(false);
    if (!(storage instanceof AccountStorage)) { setSummaries([]); return; }
    try { setSummaries(JSON.parse(storage.getItem('detours-summaries') || '[]')); } catch { setSummaries([]); }
    void sync();
  }, [storage, sync]);
  useEffect(() => {
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void sync(), Math.min(60000, 1200 * 2 ** failureCount.current));
    };
    const connected = () => { setOnline(navigator.onLine); if (navigator.onLine) schedule(); };
    const visible = () => { if (document.visibilityState === 'visible') schedule(); };
    window.addEventListener('online', connected); window.addEventListener('offline', connected); window.addEventListener('focus', schedule); window.addEventListener('detours-storage', schedule); window.addEventListener('storage', schedule); document.addEventListener('visibilitychange', visible);
    const interval = setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) void sync(); }, 60000);
    return () => { if (timer.current) clearTimeout(timer.current); clearInterval(interval); window.removeEventListener('online', connected); window.removeEventListener('offline', connected); window.removeEventListener('focus', schedule); window.removeEventListener('detours-storage', schedule); window.removeEventListener('storage', schedule); document.removeEventListener('visibilitychange', visible); };
  }, [sync]);
  const records = (() => { try { return storage instanceof AccountStorage ? storage.records() : []; } catch { return []; } })();
  const pending = records.filter(([, r]) => r.pending && !r.revoked).length;
  const conflict = records.some(([, r]) => r.conflict);
  const status = !accountId ? 'Enregistré sur cet appareil' : conflict ? 'Conflit à résoudre' : pending ? working && online && session ? 'Synchronisation en cours…' : 'En attente d’envoi' : !session || error.startsWith('Connexion nécessaire') ? 'Connexion nécessaire' : working ? 'Synchronisation en cours…' : error || !syncedOnce ? 'Synchronisation à vérifier' : 'Synchronisé';
  return <Context.Provider value={{ session, ready, configured: !!supabase, storage, summaries, error, sync, download, leave, scope, pending, status, online, working, revision, rpc,
    signIn: async () => {
      if (!supabase) return;
      if (!navigator.onLine) { setError('Connexion nécessaire. Tes changements locaux sont conservés.'); return; }
      const previous = readAccountHint(localStorage);
      // An OAuth return can represent another person: do not briefly expose the
      // old cache while the new session is being exchanged.
      try { localStorage.removeItem(ACCOUNT_HINT_KEY); } catch { setError('Connexion Google impossible. Réessaie.'); return; }
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + import.meta.env.BASE_URL } });
      if (error) { if (previous) localStorage.setItem(ACCOUNT_HINT_KEY, JSON.stringify(previous)); setError('Connexion Google impossible. Réessaie.'); }
    },
    signOut: async () => {
      const signingOut = session;
      const deviceId = storage.getItem('detours-push-device-v1');
      if (signingOut && deviceId) {
        try {
          await disablePush({ rpc: async (name,args) => { try { await cloudRpc(name,args,signingOut.access_token); return {error:null}; } catch(error) { return {error}; } } },deviceId);
        } catch { setError('Désactive les rappels de cet appareil avant la déconnexion ; connexion nécessaire.'); return; }
        if (activeSession.current?.user.id !== signingOut.user.id) return;
        storage.removeItem('detours-push-device-v1');
      }
      // Clear the hint before Auth emits SIGNED_OUT, including in other tabs.
      const previous = readAccountHint(localStorage);
      try { localStorage.removeItem(ACCOUNT_HINT_KEY); } catch { setError('Déconnexion impossible. Réessaie.'); return; }
      const { error } = await supabase!.auth.signOut({ scope: 'local' });
      if (error) { if (previous) { localStorage.setItem(ACCOUNT_HINT_KEY, JSON.stringify(previous)); setHint(previous); } setError('Déconnexion impossible. Réessaie.'); return; }
      setHint(null); setSession(null); setSummaries([]); setError('');
    },
  }}>{children}</Context.Provider>;
}
export function useCloud() { const context = useContext(Context); if (!context) throw new Error('CloudProvider required'); return context; }
