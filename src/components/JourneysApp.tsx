import { lazy, Suspense, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { BookOpen, CalendarDays, Compass, Copy, Download, Globe2, MapPin, Mountain, Pencil, Plus, ArrowRight, Upload } from 'lucide-react';
import App, { Modal } from '../App';
import { useLocale } from '../i18n';
import PreferencesButton from './Preferences';
import GlassSelection from './GlassSelection';
import { blankTrip, chinaTrip, collectionArchive, duplicateTrip, legacyDiverged, migrateLegacy, parseImport, parseTrip, readTrip, TRIP_PREFIX, writeTrip, LEGACY_COPY_KEY, LEGACY_RECOVERY_COPY_KEY, tripKey, recoveryKey, returnTrip, archive, RECOVERY_PREFIX } from '../journeys';
import { downloadText, safeExternalUrl, STORAGE_KEY, validCurrency } from '../lib';
import { mergeChanges } from '../persistence';
import { dateInTimezone, validTimezone } from '../time';
import type { StoredState } from '../types';
import './JourneysApp.css';
// Shared home tabs, filters and country fields must be styled before opening the lazy world view.
import './WorldView.css';
import { countries, countryName, statuses } from '../countries';
import CountryPicker from './CountryPicker';
import { freezeLegacyConversions, suggestedCurrency } from '../money';
import AccountPanel from './AccountPanel';
import { useCloud } from '../cloud/CloudProvider';
import { AccountStorage, type TripStorage } from '../cloud/storage';
import { readWorld, writeWorld, emptyWorld, confirmVisits, WORLD_KEY } from '../world';
import type { PersonalWorld, JourneyStatus } from '../types';
import SharePanel, { InvitationBanner } from './SharePanel';
import TripCollaboration, {TripSyncPanel,HomeSyncStatus} from './TripCollaboration';
import BackupPanel from './BackupPanel';
import { formatCivilDate } from '../locale-utils';

const OPEN_KEY = 'a-l-est-open-trip-v2';
const WorldView = lazy(() => import('./WorldView'));
type Problem = { key: string; message: string; raw: string | null };
function safeRaw(key: string, storage: TripStorage): string | null { try { return window.localStorage.getItem(storage.physicalKey(key)); } catch { return null; } }
function loadCollection(localStorage: TripStorage) {
  const trips: StoredState[] = [], problems: Problem[] = [], recoveries: { id: string; raw: string }[] = [];
  let migrated: string | null = null;
  try { if (!localStorage.accountId) migrated = localStorage.getItem(`${TRIP_PREFIX}china-legacy`) ? 'china-legacy' : migrateLegacy(localStorage); }
  catch (error) { problems.push({ key: STORAGE_KEY, message: error instanceof Error ? error.message : 'Migration impossible.', raw: safeRaw(STORAGE_KEY, localStorage) }); }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(TRIP_PREFIX)) continue;
      try {
        if (localStorage instanceof AccountStorage) { const record = localStorage.record(key); if (record?.deleted || record?.revoked) continue; }
        trips.push(readTrip(localStorage, key.slice(TRIP_PREFIX.length)));
      }
      catch (error) { problems.push({ key, message: error instanceof Error ? error.message : 'Carnet illisible.', raw: safeRaw(key, localStorage) }); }
    }
  } catch { problems.push({ key: '', message: 'Le stockage local est indisponible.', raw: null }); }
  try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (!key?.startsWith(RECOVERY_PREFIX)) continue; const id = key.slice(RECOVERY_PREFIX.length); if (localStorage.getItem(tripKey(id))) continue; const raw = localStorage.getItem(key); if (raw) { const value = JSON.parse(raw); if (typeof value.raw === 'string') recoveries.push({ id, raw: value.raw }); } } } catch { /* Existing sources remain downloadable. */ }
  let divergence = false;
  try { divergence = !localStorage.accountId && legacyDiverged(localStorage); } catch { /* Already reported. */ }
  return { trips, problems, recoveries, migrated, divergence, legacyCopy: safeRaw(LEGACY_COPY_KEY, localStorage), legacyRecovery: safeRaw(LEGACY_RECOVERY_COPY_KEY, localStorage) };
}

export default function JourneysApp() {
  const { t, language } = useLocale();
  const cloud = useCloud();
  const localStorage = cloud.storage;
  const openKey = localStorage.accountId ? OPEN_KEY + ':' + cloud.scope : OPEN_KEY;
  const [collection, setCollection] = useState(() => loadCollection(localStorage));
  const [tab, setTab] = useState<'trips' | 'world'>('trips');
  const tabsId = useId();
  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length : event.key === 'ArrowLeft' ? (index + buttons.length - 1) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setTab((['trips', 'world'] as const)[next]);
    buttons[next].focus();
  }
  const [syncTripId,setSyncTripId]=useState<string|null>(null);
  useEffect(()=>{const receive=(event:Event)=>setSyncTripId((event as CustomEvent<string>).detail);window.addEventListener('detours-resolve-trip',receive);return()=>window.removeEventListener('detours-resolve-trip',receive);},[]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sharingFilter, setSharingFilter] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [worldError, setWorldError] = useState('');
  const [world, setWorld] = useState<PersonalWorld>(() => { try { return readWorld(localStorage); } catch { return emptyWorld(); } });
  const [closing, setClosing] = useState<StoredState | null>(null);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<StoredState | null>(null);
  const [sharing, setSharing] = useState<StoredState | null>(null);
  const [activeId, setActiveId] = useState(() => {
    const linked = new URLSearchParams(location.search).get('trip');
    if (linked) return collection.trips.some(trip => trip.journey?.id === linked) ? linked : null;
    try { return sessionStorage.getItem(openKey) ?? collection.migrated; } catch { return collection.migrated; }
  });
  const [chosenCurrency, setChosenCurrency] = useState('');
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [editor, setEditor] = useState<StoredState | 'new' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const active = collection.trips.find(trip => trip.journey?.id === activeId);
  const refresh = () => { setCollection(loadCollection(localStorage)); try { setWorld(readWorld(localStorage)); setWorldError(''); } catch { setWorldError(t('Les souvenirs sont illisibles. La source est conservée.')); } };
  const displayTrips = [...collection.trips, ...cloud.summaries.filter(s => !s.deleted && !(localStorage instanceof AccountStorage && localStorage.record(tripKey(s.id))?.revoked) && !collection.trips.some(t => t.journey!.id === s.id)).map(s => ({ version: 1 as const, journey: s.journey, departureDate: s.departureDate, cities: [], notes: {}, favorites: [], done: [], bookings: [] }))];
  const role = (id: string) => cloud.summaries.find(s => s.id === id)?.role || (localStorage instanceof AccountStorage ? localStorage.record(tripKey(id))?.role : null) || 'owner';
  const writable = (id: string) => role(id) === 'owner' || (role(id) === 'editor' && import.meta.env.VITE_ENABLE_COLLABORATION === 'true');
  const visibleTrips = displayTrips.filter(trip => (statusFilter === 'all' || (trip.journey!.status || 'idea') === statusFilter) && (countryFilter === 'all' || trip.journey!.countries?.includes(countryFilter)) && (sharingFilter === 'all' || (sharingFilter === 'mine') === (role(trip.journey!.id) === 'owner')));
  function edit(value: StoredState | 'new', country?: string) { setChosenCurrency(value === 'new' ? suggestedCurrency(country ? [country] : []) || '' : value.journey!.currency); setCurrencyTouched(value !== 'new'); setSelectedCountries(value === 'new' ? country ? [country] : [] : value.journey!.countries || []); setEditor(value); setError(''); }
  async function changeWorld(next: PersonalWorld) { try { const commit = () => writeWorld(localStorage, mergeChanges(world, next, readWorld(localStorage))); if (navigator.locks) await navigator.locks.request(localStorage.physicalKey(WORLD_KEY), commit); else commit(); setWorld(readWorld(localStorage)); setWorldError(''); } catch { setWorldError(t('Sauvegarde des souvenirs impossible. La source est conservée.')); throw new Error('Save failed'); } }
  function open(id: string | null) {
    if (!id) { const url = new URL(location.href); for (const key of ['trip','kind','object']) url.searchParams.delete(key); history.replaceState(null,'',url); }
    // Read storage now: a freshly created or accepted trip may not yet be in the rendered collection.
    if (id && !localStorage.getItem(tripKey(id))) { void cloud.download(id).then(() => { refresh(); setActiveId(id); setError(''); try { sessionStorage.setItem(openKey, id); } catch { /* A session hint failure must not discard the downloaded trip. */ } }).catch(() => setError(t('Carnet non téléchargé. Connecte-toi pour l’ouvrir sur cet appareil.'))); return; }
    setActiveId(id); setMessage('');
    try { sessionStorage.setItem(openKey, id || ''); } catch { /* Navigation remains usable. */ }
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('trip');
    if (!id || !cloud.ready) return;
    let cancelled = false;
    // Resolve exact identities only inside the active personal storage scope.
    if (localStorage.getItem(tripKey(id))) { setActiveId(id); return; }
    setActiveId(null);
    if (!cloud.session) { setError(t('Carnet non téléchargé. Connecte-toi pour l’ouvrir sur cet appareil.')); return; }
    void cloud.download(id).then(() => {
      if (cancelled) return;
      if (!localStorage.getItem(tripKey(id))) throw new Error('Unavailable');
      refresh(); setActiveId(id); setError('');
    }).catch(() => { if (!cancelled) setError(t('Carnet non téléchargé. Connecte-toi pour l’ouvrir sur cet appareil.')); });
    return () => { cancelled = true; };
  }, [cloud.ready, cloud.scope, cloud.session?.user.id, localStorage]);
  useEffect(()=>{
    if(!cloud.ready||!cloud.session||!(localStorage instanceof AccountStorage))return;
    const originalId=sessionStorage.getItem('detours-share-after-signin');
    if(!originalId)return;
    try {
      const state=structuredClone(readTrip(window.localStorage,originalId));
      const id=cloud.session.user.id+'~'+originalId;
      if(!localStorage.record(tripKey(id))){state.journey!.id=id;state.journey!.followsCatalog=false;writeTrip(localStorage,state);}
      sessionStorage.removeItem('detours-share-after-signin');
      refresh();open(id);setSharing(readTrip(localStorage,id));void cloud.sync();
    } catch {setError(t('Rattachement incomplet. Les originaux sont conservés ; tu peux réessayer.'));}
  },[cloud.ready,cloud.session?.user.id,localStorage]);
  useEffect(() => {
    const receive = (event: StorageEvent) => { if (!event.key || event.key.startsWith(localStorage.physicalKey(TRIP_PREFIX)) || event.key === localStorage.physicalKey(STORAGE_KEY) || event.key === localStorage.physicalKey(WORLD_KEY)) refresh(); };
    window.addEventListener('storage', receive); window.addEventListener('detours-storage', refresh); refresh(); return () => { window.removeEventListener('storage', receive); window.removeEventListener('detours-storage', refresh); };
  }, [localStorage]);
  useEffect(() => { if (!active) document.title = `Détours — ${t('Mes voyages')}`; }, [active, t]);
  function persist(state: StoredState, shouldOpen = false) {
    try { writeTrip(localStorage, state); refresh(); setError(''); if (shouldOpen) open(state.journey!.id); return true; }
    catch (error) { setError(error instanceof Error ? error.message : t('Sauvegarde locale impossible.')); return false; }
  }
  async function importFile(file: File) {
    let imported = 0;
    try {
      if (file.size > 5_000_000) throw new Error(t('Le fichier est trop volumineux (5 Mo maximum).'));
      const states = parseImport(await file.text());
      // All records are validated before the first write. Each new ID is independent.
      for (const state of states) { writeTrip(localStorage, state); imported++; }
      refresh(); setError(''); setMessage(t('{count} carnet(s) ajouté(s).', { count: imported }));
      if (states.length === 1) open(states[0].journey!.id);
    } catch (error) { refresh(); setError(`${imported ? t('{count} carnet(s) ajouté(s).', { count: imported }) + ' ' : ''}${error instanceof Error ? error.message : t('Import impossible.')}`); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) || '').trim();
    const title = get('title'), currency = get('currency').toUpperCase(), timezone = get('timezone');
    if (!title || !validCurrency(currency) || !validTimezone(timezone)) { setError(t('Vérifie le titre, la devise et le fuseau horaire.')); return; }
    if (get('endDate') && get('departureDate') && get('endDate') < get('departureDate')) { setError(t('La date de retour doit suivre le départ.')); return; }
    const cover = get('cover');
    if (cover && !cover.startsWith('/') && !safeExternalUrl(cover)) { setError(t('Utilise une adresse HTTPS pour la couverture.')); return; }
    let previous: StoredState;
    try { previous = editor && editor !== 'new' ? readTrip(localStorage, editor.journey!.id) : blankTrip({ title }); } catch {setError(t('La sauvegarde locale est illisible. La source originale est conservée.'));return;}
    const changedCurrency = previous.journey!.currency !== currency;
    const next: StoredState = { ...(changedCurrency ? freezeLegacyConversions(previous) : previous), journey: { ...previous.journey!, title, destinations: get('destinations'), description: get('description'), cover: cover || previous.journey!.cover, currency, timezone, countries: selectedCountries, status: get('status') as JourneyStatus, endDate: get('endDate'), highlights: get('highlights') }, departureDate: get('departureDate'), ...(changedCurrency ? { exchangeRates: {}, rateQuotes: {}, budgetCurrency: previous.budgetCurrency || previous.journey!.currency } : {}) };
    if (editor === 'new') {if(persist(next,true)){setEditor(null);setMessage(t('Carnet enregistré.'));}return;}
    try {
      const commit=()=>{const latest=readTrip(localStorage,previous.journey!.id);writeTrip(localStorage,mergeChanges(previous,next,latest));};
      if(navigator.locks)await navigator.locks.request(tripKey(previous.journey!.id),commit);else commit();
      refresh();setError('');setEditor(null);setMessage(t('Carnet enregistré.'));
    } catch(error) {setError(error instanceof Error ? error.message : t('Sauvegarde locale impossible.'));}
  }
  const exportCollection = () => {
    try {
      const latest = loadCollection(localStorage);
      downloadText(JSON.stringify(collectionArchive(latest.trips), null, 2), 'a-l-est-mes-voyages.json');
      setMessage(t(latest.problems.length ? 'Les carnets lisibles ont été exportés. Télécharge aussi les sources à récupérer ci-dessus.' : 'Collection exportée.'));
    } catch (error) { setError(error instanceof Error ? error.message : t('Export impossible.')); }
  };
  const importInput = <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label={t('Choisir une sauvegarde JSON')} onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ''; }} />;
  const synchronization=syncTripId?<TripSyncPanel id={syncTripId} onClose={()=>setSyncTripId(null)}/>:null;
  const invitation = <InvitationBanner onAccepted={id => { refresh(); open(id); }}/>;
  if (active) { const id=active.journey!.id; const record=localStorage instanceof AccountStorage?localStorage.record(tripKey(id)):null; return <>{invitation}{synchronization}<App key={id} seed={active} readOnly={!writable(id)} allowedFields={record?.fullSharing?record.allowedFields:undefined} collaborationControl={({saving,storageError,...presentation})=><TripCollaboration {...presentation} saving={saving} storageError={storageError} id={id} onShare={()=>setSharing(readTrip(localStorage,id))} onCopy={()=>persist(duplicateTrip(readTrip(localStorage,id),active.journey!.title+' — '+t('Ma copie')),true)}/>} accountControl={<AccountPanel/>} externalError={error} onHome={() => { refresh(); open(null); }} onImport={importFile}/>{sharing&&<SharePanel state={sharing} onClose={()=>setSharing(null)}/>} {collection.divergence && <div className="legacy-warning" role="alert">{t('Une ancienne version a modifié le carnet Chine. Reviens dans Mes voyages pour récupérer ces changements.')}</div>}</>; }
  return <>{invitation}{synchronization}<div className="journeys-shell">
    <a className="skip-link" href="#journeys-main">{t('Aller au contenu')}</a>
    <header className="journeys-topbar"><a className="brand" href="#journeys-main"><span className="brand-mark"><Mountain size={26} strokeWidth={1.6}/></span><span>détours<span className="brand-dot">.</span><small>{t('LES BEAUX DÉTOURS')}</small></span></a><div className="journeys-topbar-actions"><PreferencesButton/><AccountPanel/></div></header>
    <main id="journeys-main" className="journeys-main">
      <section className="journeys-intro"><div><p className="eyebrow">{t('UN CARNET POUR CHAQUE ÉCHAPPÉE')}</p><h1>{t('Mes voyages')}</h1><p className="muted">{t('Un week-end, une ville, un grand détour. Retrouve chaque voyage à son rythme.')}</p></div><button className="btn btn-primary" onClick={() => { edit('new'); }}><Plus size={18}/>{t('Créer un voyage')}</button></section>
      <div className="collection-toolbar"><div className="journeys-tabs glass-selection-group" role="tablist" aria-label={t('Accueil')} onKeyDown={navigateTabs}><GlassSelection selection={tab}/><button id={`${tabsId}-trips-tab`} role="tab" aria-controls={`${tabsId}-trips-panel`} tabIndex={tab === 'trips' ? 0 : -1} aria-selected={tab === 'trips'} onClick={() => setTab('trips')}><BookOpen size={17}/>{t('Mes voyages')}</button><button id={`${tabsId}-world-tab`} role="tab" aria-controls={`${tabsId}-world-panel`} tabIndex={tab === 'world' ? 0 : -1} aria-selected={tab === 'world'} onClick={() => setTab('world')}><Globe2 size={17}/>{t('Mon monde')}</button></div>{displayTrips.length > 0 && <div className="collection-summary"><span><BookOpen size={15}/><strong>{displayTrips.length}</strong> {t('Mes voyages')}</span><span><MapPin size={15}/>{t('{count} étapes', { count: displayTrips.reduce((sum, trip) => sum + trip.cities.length, 0) })}</span><span><CalendarDays size={15}/>{t('{count} journées', { count: displayTrips.reduce((sum, trip) => sum + trip.cities.reduce((total, city) => total + city.days.length, 0), 0) })}</span></div>}</div><HomeSyncStatus onResolve={setSyncTripId}/>{worldError && <div className="notice warning-notice" role="alert">{worldError}<button className="text-btn" onClick={() => downloadText(safeRaw(WORLD_KEY, localStorage) || '', 'detours-souvenirs-a-recuperer.json')}>{t('Télécharger le fichier original')}</button></div>}
      {error && <div className="notice warning-notice" role="alert">{error}</div>}
      {message && <div className="notice" role="status">{message}</div>}
      {collection.problems.map(problem => <div key={problem.key} className="notice warning-notice" role="alert"><p>{problem.message} {t('La source est conservée. Aucun carnet existant n’a été remplacé.')}</p>{problem.raw && <button className="btn btn-secondary" onClick={() => downloadText(problem.raw!, 'a-l-est-source-a-recuperer.json')}><Download size={16}/>{t('Télécharger le fichier original')}</button>}</div>)}
      {collection.divergence && <section className="panel"><h2>{t('Changements d’une ancienne version')}</h2><p>{t('Un ancien onglet a modifié le carnet Chine. Tes carnets actuels sont conservés ; importe la source comme un carnet supplémentaire pour comparer les versions.')}</p><button className="btn btn-secondary" onClick={() => downloadText(localStorage.getItem(STORAGE_KEY) || '', 'a-l-est-ancien-carnet.json')}>{t('Télécharger le fichier original')}</button></section>}
      <section id={`${tabsId}-world-panel`} role="tabpanel" aria-labelledby={`${tabsId}-world-tab`} tabIndex={0} hidden={tab !== 'world'}>{tab === 'world' && <Suspense fallback={<p role="status">{t('Chargement…')}</p>}><WorldView world={world} trips={displayTrips.filter(tr => role(tr.journey!.id) === 'owner' || world.participation?.includes(tr.journey!.id) || world.visits.some(v => v.journeyId === tr.journey!.id))} onChange={next => void changeWorld(next).catch(() => {})} onPrepare={code => edit('new', code)} onOpen={open}/></Suspense>}</section><section id={`${tabsId}-trips-panel`} role="tabpanel" aria-labelledby={`${tabsId}-trips-tab`} tabIndex={0} hidden={tab !== 'trips'}>{tab === 'trips' && <>
      <div className="journeys-filters"><label className="field">{t('Statut')}<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">{t('Tous les statuts')}</option>{Object.entries(statuses).map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}</select></label><label className="field">{t('Pays')}<select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}><option value="all">{t('Tous les pays')}</option>{countries.map(c => ({ ...c, name: countryName(c.code, language) })).sort((a, b) => a.name.localeCompare(b.name, language)).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>{cloud.session && <label className="field">{t('Accès')}<select value={sharingFilter} onChange={e => setSharingFilter(e.target.value)}><option value="all">{t('Tous les carnets')}</option><option value="mine">{t('Mes voyages')}</option><option value="shared">{t('Partagés avec moi')}</option></select></label>}</div>
      {visibleTrips.length ? <div className="journeys-grid">{visibleTrips.map(trip => {
        const journey = trip.journey!, days = trip.cities.reduce((sum, city) => sum + city.days.length, 0);
        return <article className="journey-card panel" key={journey.id}><button className="journey-cover" aria-label={t('Ouvrir {title}', { title: journey.title })} onClick={() => open(journey.id)}><img src={journey.cover} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/travel-landscape.svg'; }}/><span className="journey-cover-tag"><Compass size={14}/>{journey.destinations || t('À imaginer')}</span></button><div className="journey-card-body"><span className="journey-status">{t(statuses[journey.status || 'idea'])}{role(journey.id) !== 'owner' ? ' · ' + t('Partagés avec moi') : ''}</span><button className="journey-title" onClick={() => open(journey.id)}><h2>{journey.title}</h2><ArrowRight size={20}/></button><p className="muted">{journey.description || t('Les beaux détours commencent ici.')}</p><div className="journey-details"><span><MapPin size={14}/>{t('{count} étapes', { count: trip.cities.length })}</span><span><CalendarDays size={14}/>{t('{count} journées', { count: days })}</span>{trip.departureDate && <time dateTime={trip.departureDate}>{formatCivilDate(trip.departureDate, language)}</time>}</div><p className="journey-countries">{(journey.countries || []).map(code => countryName(code, language)).join(' · ')}</p><div className="journey-card-actions">{writable(journey.id) && collection.trips.some(tr => tr.journey!.id === journey.id) && <><button className="text-btn" onClick={() => { edit(readTrip(localStorage, trip.journey!.id)); }}><Pencil size={14}/>{t('Modifier le voyage')}</button><button className="text-btn" onClick={() => { if (persist(duplicateTrip(readTrip(localStorage, journey.id)))) setMessage(t('Copie indépendante créée, avec les dates, réservations et dépenses.')); }}><Copy size={14}/>{t('Dupliquer')}</button></>}</div>{role(journey.id) !== 'owner' && <><button className="text-btn" aria-pressed={world.participation?.includes(journey.id) || false} onClick={() => void changeWorld({ ...world, participation: world.participation?.includes(journey.id) ? world.participation.filter(id => id !== journey.id) : [...world.participation || [], journey.id] }).catch(() => {})}>{t(world.participation?.includes(journey.id) ? 'Ma participation est confirmée' : 'Je participe à ce voyage')}</button><p className="muted small">{t('Participer ne confirme aucune visite. Les séjours réellement effectués se confirment séparément.')}</p></>}<div className="journey-card-actions">{collection.trips.some(tr => tr.journey!.id === journey.id) && <><button className="text-btn" onClick={() => persist(returnTrip(readTrip(localStorage, journey.id), journey.title + ' — ' + t('Nouveau départ')))}>{t('Repartir ici')}</button><button className="text-btn" onClick={() => setSharing(readTrip(localStorage, journey.id))}>{t('Partager et historique')}</button>{role(journey.id) === 'owner' && <><button className="text-btn" onClick={() => setDeleting(trip)}>{t('Supprimer')}</button></>}</>}{journey.endDate && journey.endDate < dateInTimezone(journey.timezone) && ['planning', 'ongoing'].includes(journey.status || '') && role(journey.id) === 'owner' && collection.trips.some(tr => tr.journey!.id === journey.id) && <button className="text-btn" onClick={() => edit({ ...trip, journey: { ...journey, status: 'completed' } })}>{t('Ce voyage est-il terminé ?')}</button>}{journey.status === 'completed' && collection.trips.some(tr => tr.journey!.id === journey.id) && <button className="text-btn" onClick={() => { setClosing(trip); setConfirmed(world.visits.filter(v => v.stayId === journey.id).map(v => v.country)); }}>{t('Confirmer mes visites')}</button>}</div></div></article>;
      })}</div> : <section className="journeys-empty panel"><BookOpen size={44} strokeWidth={1.2}/><h2>{t(displayTrips.length ? 'Aucun voyage pour ces filtres.' : 'Ton prochain voyage commence ici.')}</h2><p>{t('Crée ton carnet, puis ajoute tes étapes, journées et bonnes adresses. Tu peux aussi importer une sauvegarde existante.')}</p><button className="btn btn-primary" onClick={() => edit('new')}><Plus size={16}/>{t('Créer mon premier carnet')}</button></section>}
      <section className="journeys-import panel"><div><p className="eyebrow">{t('À GARDER, À RETROUVER')}</p><h2>{t('Tes carnets voyagent avec toi.')}</h2><p className="muted">{t('Importe un ancien carnet ou une collection JSON. Chaque import ajoute une copie indépendante.')}</p><p className="muted small">{t('La lecture automatique des PDF n’est pas encore disponible.')}</p></div><div className="journeys-import-actions"><button className="btn btn-secondary" onClick={() => fileInput.current?.click()}><Upload size={16}/>{t('Importer un fichier')}</button>{collection.trips.length > 0 && <button className="btn btn-secondary" onClick={exportCollection}><Download size={16}/>{t('Exporter mes voyages')}</button>}<button className="text-btn" onClick={() => persist(chinaTrip(), true)}>{t('Ajouter l’exemple Chine')}<ArrowRight size={14}/></button>{collection.legacyCopy && <button className="text-btn" onClick={() => downloadText(collection.legacyCopy!, 'a-l-est-avant-migration-v1.json')}>{t('Sauvegarde avant migration')}</button>}{collection.legacyRecovery && <button className="text-btn" onClick={()=>{let raw=collection.legacyRecovery!;try {const value=JSON.parse(raw);if(typeof value.raw==='string')raw=value.raw;}catch { /* Preserve an unparsed legacy source for download. */ }downloadText(raw,'a-l-est-ancienne-copie.json');}}>{t('Ancienne copie de secours')}</button>}</div></section>
      {collection.recoveries.length > 0 && <section className="panel journeys-recovery"><h2>{t('Carnets supprimés : copies de récupération')}</h2><p className="muted">{t('Télécharge une copie, puis importe-la pour créer une nouvelle préparation. Tes souvenirs ne changent pas.')}</p><div className="journeys-recovery-list">{collection.recoveries.map(copy => { let title = copy.id; try { title = parseTrip(copy.raw).state.journey!.title; } catch { /* An unreadable recovery remains downloadable. */ } return <article className="journeys-recovery-item" key={copy.id}><h3>{title}</h3><button className="text-btn" onClick={() => downloadText(copy.raw, 'detours-carnet-supprime-' + copy.id + '.json')}><Download size={14}/>{t('Télécharger la copie de récupération')}</button></article>; })}</div></section>}
      </>}</section><BackupPanel onChanged={refresh} remoteMissing={displayTrips.filter(trip => !collection.trips.some(local => local.journey!.id === trip.journey!.id)).length}/><footer className="page-footer"><span><Mountain size={15}/>{t('Le monde, au gré des envies.')}</span><span>{t(cloud.session ? 'Carnets privés par défaut' : 'Carnets sauvegardés sur cet appareil')}</span></footer>
    </main>{importInput}
    {sharing && <SharePanel state={sharing} onClose={() => setSharing(null)}/>}
    {closing && <Modal title={t('Confirmer mes visites')} onClose={() => setClosing(null)}><p>{t('Sélectionne uniquement les pays réellement visités, sans compter les escales. Retirer un pays déjà confirmé supprime explicitement cette visite.')}</p>{(closing.journey!.countries || []).map(code => <label className="field" key={code}><span><input type="checkbox" checked={confirmed.includes(code)} onChange={e => setConfirmed(e.target.checked ? [...confirmed, code] : confirmed.filter(c => c !== code))}/>{countryName(code, language)}</span></label>)}{!closing.journey!.countries?.length && <p>{t('Ajoute d’abord les pays du voyage dans Modifier le voyage.')}</p>}<button className="btn btn-primary" disabled={!closing.journey!.countries?.length} onClick={async () => { try { await changeWorld(confirmVisits(world, closing, confirmed)); setClosing(null); } catch { setError(t('Confirmation impossible. Tes souvenirs sont conservés.')); } }}>{t('Confirmer les pays visités')}</button></Modal>}
    {deleting && <Modal title={t('Supprimer ce carnet ?')} onClose={() => setDeleting(null)}><p>{t('Les visites confirmées sont conservées. Une copie de récupération reste sur cet appareil.')}</p><div className="form-actions"><button className="btn btn-secondary" onClick={() => downloadText(JSON.stringify(archive(deleting), null, 2), 'detours-avant-suppression.json')}>{t('Exporter ma version')}</button><button className="btn btn-primary" onClick={() => { try { localStorage.setItem(recoveryKey(deleting.journey!.id), JSON.stringify({ savedAt: new Date().toISOString(), raw: JSON.stringify(archive(deleting)) })); localStorage.removeItem(tripKey(deleting.journey!.id)); setDeleting(null); refresh(); } catch { setError(t('Suppression impossible. Rien n’a été effacé.')); } }}>{t('Supprimer')}</button><button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)}>{t('Annuler')}</button></div></Modal>}
    {editor && <Modal title={t(editor === 'new' ? 'Un nouveau carnet' : 'Modifier le voyage')} onClose={() => { setEditor(null); setError(''); }}><form className="editor-form" onSubmit={save}>
      <label className="field">{t('Titre du voyage')}<input name="title" required autoFocus maxLength={140} defaultValue={editor === 'new' ? '' : editor.journey!.title} placeholder={t('Ex. Un printemps au Japon')}/></label>
      <label className="field">{t('Destinations')}<input name="destinations" maxLength={300} defaultValue={editor === 'new' ? '' : editor.journey!.destinations} placeholder={t('Pays, régions ou villes')}/></label>
      <label className="field">{t('En quelques mots')}<textarea name="description" rows={2} defaultValue={editor === 'new' ? '' : editor.journey!.description}/></label>
      <CountryPicker selected={selectedCountries} onChange={next=>{setSelectedCountries(next);if(!currencyTouched)setChosenCurrency(suggestedCurrency(next)||'');}}/><label className="field">{t('Statut')}<select name="status" defaultValue={editor === 'new' ? 'planning' : editor.journey!.status || 'idea'}>{Object.entries(statuses).map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}</select></label><p className="muted small">{t('Les dates ne changent jamais le statut automatiquement.')}</p><div className="form-row"><label className="field">{t('Devise de référence')}<input aria-label={t('Devise de référence')} name="currency" required list="currencies" maxLength={3} value={chosenCurrency} onChange={event=>{setChosenCurrency(event.target.value.toUpperCase());setCurrencyTouched(true);}} placeholder={t('Choisir une devise')}/><datalist id="currencies">{Intl.supportedValuesOf('currency').map(code => <option key={code} value={code}/>)}</datalist><span className="muted small">{t(editor === 'new' && !suggestedCurrency(selectedCountries) ? 'Choisis explicitement la devise du voyage, notamment pour plusieurs pays.' : 'Devise proposée selon le pays, toujours modifiable.')}</span></label><label className="field">{t('Fuseau du voyage')}<input name="timezone" required list="timezones" defaultValue={editor === 'new' ? 'UTC' : editor.journey!.timezone}/><datalist id="timezones">{['UTC','Europe/Paris','Asia/Tokyo','Asia/Shanghai','America/New_York','Europe/London'].map(zone => <option key={zone} value={zone}/>)}</datalist></label></div>
      <label className="field">{t('Date de départ')}<input name="departureDate" type="date" defaultValue={editor === 'new' ? '' : editor.departureDate}/></label>
      <label className="field">{t('Date de retour (facultative)')}<input type="date" name="endDate" defaultValue={editor === 'new' ? '' : editor.journey!.endDate}/></label><label className="field">{t('Mes coups de cœur')}<textarea name="highlights" rows={2} defaultValue={editor === 'new' ? '' : editor.journey!.highlights}/></label><details><summary>{t('Personnaliser la couverture')}</summary><label className="field">{t('Adresse de l’image')}<input name="cover" defaultValue={editor === 'new' ? '' : editor.journey!.cover} placeholder="https://…"/></label><p className="muted small">{t('Une image distante nécessite Internet. Le visuel par défaut reste disponible hors ligne.')}</p></details>
      {editor !== 'new' && <p className="muted small">{t('Changer la devise conserve les montants originaux et le budget dans sa devise. Les taux doivent être renseignés à nouveau.')}</p>}
      {error && <p className="practical-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => { setEditor(null); setError(''); }}>{t('Annuler')}</button><button className="btn btn-primary">{t(editor === 'new' ? 'Créer le carnet' : 'Enregistrer')}</button></div>
    </form></Modal>}
  </div></>;
}
