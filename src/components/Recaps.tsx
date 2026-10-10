import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useCloud } from '../cloud/CloudProvider';
import { AccountStorage } from '../cloud/storage';
import { tripKey } from '../journeys';
import { useLocale } from '../i18n';
import { buildRecap, checklistFor, defaultNotificationPreferences, normalizeOffsets, notificationKey, parseNotificationPreferences, projectProgram, recapDates, reminderItem } from '../notifications';
import type { NotificationPreferences, ProgramItem, ReminderOverride, Weather } from '../notifications';
import { markRecapRead, mergeRemoteRecaps, readRecapCache, updateRecapCache, writeNotificationPreferences, writeRecapCache } from '../notification-storage';
import type { RecapRecord } from '../notification-storage';
import { cachedWeather, loadRecapWeather, WEATHER_TTL } from '../notification-weather';
import { checklistCopy, notificationCopy } from '../notification-copy';
import { validTimezone } from '../time';
import type { StoredState } from '../types';
import { pushSupport, registerPush, disablePush } from '../notification-push';
import { deliveryPreferences, notificationIntent, writeNotificationIntent } from '../notification-form';
import type { NotificationIntent } from '../notification-form';
import NotificationPreferencesForm from './NotificationPreferencesForm';
import './Recaps.css';

type Props = { state: StoredState; onDay: (item: ProgramItem) => void; requestedDate?: string; requestedObject?: {kind:ProgramItem['kind'];id:string} };
type Capabilities = { enabled: boolean; push: boolean; email: boolean; vapidPublicKey: string | null };
const noCapabilities: Capabilities = { enabled: false, push: false, email: false, vapidPublicKey: null };
const permissionState = () => pushSupport() ? Notification.permission : 'unsupported' as const;

export default function RecapsButton(props: Props) {
  const { scope, storage } = useCloud(), { language } = useLocale();
  const [open, setOpen] = useState(!!props.requestedDate), [refresh, setRefresh] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open && wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);
  let unread = false;
  try {
    const id = props.state.journey!.id;
    const p = parseNotificationPreferences(storage.getItem(notificationKey(id)), props.state.journey?.timezone);
    const dates = validTimezone(p.timezone) ? recapDates(p) : null;
    const records = readRecapCache(storage, id);
    unread = !!dates && [dates.today, dates.tomorrow].some(date => buildRecap(props.state, date, p.timezone) && !records.find(r => r.recap.date === date)?.readAt);
  } catch { /* Errors are explained on opening the panel. */ }
  return <>
    <button ref={trigger} className="icon-btn recap-trigger" type="button" aria-label={notificationCopy(language, 'title')} aria-haspopup="dialog" onClick={() => setOpen(true)}><Bell size={20}/>{unread && <span className="recap-unread" aria-label={notificationCopy(language, 'unread')}/>}</button>
    {open && <RecapsPanel key={`${scope}:${props.state.journey!.id}:${refresh}`} {...props} onClose={() => { setOpen(false); setRefresh(v => v + 1); }}/>}</>;
}

export function ReminderDialog(props: Props & { onClose: () => void }) { return <RecapsPanel {...props}/>; }
function RecapsPanel({ state, onDay, requestedDate, requestedObject, onClose }: Props & { onClose: () => void }) {
  const cloud = useCloud(), { language, dateLocale } = useLocale();
  const c = (key: Parameters<typeof notificationCopy>[1]) => notificationCopy(language, key);
  const tripId = state.journey!.id;
  const serverTrip = !!cloud.session && (cloud.summaries.some(summary => summary.id === tripId && !summary.deleted) || (cloud.storage instanceof AccountStorage && (cloud.storage.record(tripKey(tripId))?.revision || 0) > 0));
  const dialog = useRef<HTMLDialogElement>(null), alive = useRef(true), weatherAbort = useRef<AbortController | null>(null);
  const [initial] = useState(() => {
    try { const raw = cloud.storage.getItem(notificationKey(tripId)); return { preferences: parseNotificationPreferences(raw, state.journey?.timezone || state.cities.find(city => validTimezone(city.timezone || ''))?.timezone), records: readRecapCache(cloud.storage, tripId), error: false, fresh: !raw }; }
    catch { return { preferences: defaultNotificationPreferences(state.journey?.timezone), records: [] as RecapRecord[], error: true, fresh: false }; }
  });
  const [preferences, setPreferences] = useState(initial.preferences);
  const [offsetText, setOffsetText] = useState(initial.preferences.offsets.join(', '));
  const [intent, setIntent] = useState(() => notificationIntent(cloud.storage, tripId, initial.preferences));
  const savedIntent = useRef(intent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permission, setPermission] = useState(permissionState);
  const [loadAttempt, setLoadAttempt] = useState(0), [preferencesLoadError, setPreferencesLoadError] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(!!cloud.session);
  const [records, setRecords] = useState(initial.records);
  const [message, setMessage] = useState(initial.error ? 'storageError' as const : '' as '' | 'storageError' | 'saved' | 'error');
  const [capabilities, setCapabilities] = useState(noCapabilities), [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(requestedDate || '');
  const [forecasts, setForecasts] = useState<Weather[]>(() => cachedWeather(cloud.storage, tripId).map(e => e.weather));
  const [weatherState, setWeatherState] = useState({ busy: false, unavailable: false, stale: false });
  const edited = useRef(false);
  const remotePreferences = useRef(false);
  const dates = validTimezone(preferences.timezone) ? recapDates(preferences) : null;
  const program=useMemo(()=>projectProgram(state),[state]);
  const requestedItem=requestedObject?reminderItem(state,requestedObject.kind,requestedObject.id):undefined;
  const currentRecaps = dates ? [dates.today, dates.tomorrow].flatMap(date => {
    const recap = buildRecap(state, date, preferences.timezone, forecasts,program); return recap ? [recap] : [];
  }) : [];
  const displayed = dates ? updateRecapCache(records, currentRecaps, preferences, dates.today, new Date()) : records;

  useEffect(() => {
    alive.current = true;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    element?.showModal();
    return () => { alive.current = false; weatherAbort.current?.abort(); element?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    if (serverTrip) {
      setPreferencesLoading(true); setPreferencesLoadError(false);
      const capabilitiesRequest = cloud.rpc<Capabilities>('detours_notification_capabilities').then(value => { if (active) setCapabilities(value); return value; }).catch(() => noCapabilities);
      void cloud.rpc<RecapRecord[]>('detours_notification_recap_snapshots', { p_trip: tripId }).then(snapshots => {
        const validated=mergeRemoteRecaps([],snapshots,tripId);
        if (active) setRecords(previous => mergeRemoteRecaps(previous, validated, tripId));
      }).catch(() => {});
      void Promise.all([cloud.rpc<NotificationPreferences | null>('detours_notification_preferences', { p_trip: tripId }), capabilitiesRequest]).then(([value, caps]) => {
        if (!active || edited.current) return;
        if (value) {
          remotePreferences.current = true;
          const parsed = parseNotificationPreferences(JSON.stringify(value));
          writeNotificationPreferences(cloud.storage, tripId, parsed);
          setPreferences(parsed); setOffsetText(parsed.offsets.join(', '));
          const incomingIntent = notificationIntent(cloud.storage, tripId, parsed);
          savedIntent.current = incomingIntent; setIntent(incomingIntent);
        } else if (initial.fresh && caps.enabled && caps.push && permissionState() === 'granted') {
          setIntent(previous => ({ ...previous, phone: true }));
        }
      }).catch(() => { if (active) setPreferencesLoadError(true); }).finally(() => { if (active) setPreferencesLoading(false); });
    }
    else { setPreferencesLoading(false); setPreferencesLoadError(false); setCapabilities(noCapabilities); }
    return () => { active = false; };
  }, [cloud.rpc, cloud.storage, cloud.session, tripId, serverTrip, loadAttempt]);
  // Persist snapshots only while this personal panel is open. No network or shared journal mutation.
  const serialized = JSON.stringify(displayed);
  useEffect(() => {
    if (initial.error || !dates) return;
    try { writeRecapCache(cloud.storage, tripId, JSON.parse(serialized) as RecapRecord[]); if (JSON.stringify(records) !== serialized) setRecords(JSON.parse(serialized) as RecapRecord[]); }
    catch { setMessage('storageError'); }
  }, [serialized, cloud.storage, tripId, initial.error, dates?.today]);
  useEffect(() => {
    if (!requestedDate || initial.error || !displayed.some(r=>r.recap.date===requestedDate && !r.readAt)) return;
    const next = markRecapRead(displayed, requestedDate);
    setRecords(next);
    try { writeRecapCache(cloud.storage, tripId, next); } catch { setMessage('storageError'); }
  }, [requestedDate,serialized]);

  useEffect(() => {
    const refreshPermission = () => setPermission(permissionState());
    window.addEventListener('focus', refreshPermission);
    document.addEventListener('visibilitychange', refreshPermission);
    return () => { window.removeEventListener('focus', refreshPermission); document.removeEventListener('visibilitychange', refreshPermission); };
  }, []);
  function editIntent(value: NotificationIntent) { edited.current = true; setMessage(''); setIntent(value); }
  function editOffsets(value: string) { edited.current = true; setMessage(''); setOffsetText(value); }
  function edit(value: Partial<NotificationPreferences>) { edited.current = true; setMessage(''); setPreferences(p => ({ ...p, ...value })); }
  function openRecap(date: string) {
    const next = markRecapRead(displayed, date);
    setSelected(date); setRecords(next);
    try { if (!initial.error) writeRecapCache(cloud.storage, tripId, next); }
    catch { setMessage('storageError'); }
  }
  function override(item: ProgramItem, value: ReminderOverride) {
    edit({ overrides: { ...preferences.overrides, [`${item.kind}:${item.id}`]: value } });
  }
  async function save() {
    setBusy(true); setMessage('');
    try {
      if (initial.error) throw new Error('Preserve unreadable source');
      const parsed = parseNotificationPreferences(JSON.stringify(deliveryPreferences({ ...preferences, offsets: normalizeOffsets(offsetText.split(',').map(v => Number(v.trim()))) }, intent, savedIntent.current)));
      const wantsPush = parsed.followed && intent.phone && (parsed.activityPush || parsed.recapPush);
      if ((wantsPush && !(capabilities.enabled && capabilities.push && capabilities.vapidPublicKey && pushSupport())) || (parsed.followed && parsed.email && !(capabilities.enabled && capabilities.email && cloud.session?.user.email_confirmed_at))) throw new Error('Remote channels unavailable');
      if (wantsPush) {
        let device = cloud.storage.getItem('detours-push-device-v1');
        if (!device) { device = crypto.randomUUID(); cloud.storage.setItem('detours-push-device-v1', device); }
        await registerPush({ rpc: async (name, args) => { try { if(!alive.current)throw Error('Enrollment cancelled');await cloud.rpc(name, args); return { error: null }; } catch (error) { return { error }; } } }, capabilities.vapidPublicKey!, device,()=>alive.current);
      }
      if (cloud.session && (capabilities.enabled || remotePreferences.current || initial.preferences.activityPush || initial.preferences.recapPush || initial.preferences.email)) {
        await cloud.rpc('detours_notification_preferences', { p_trip: tripId, p_preferences: parsed, p_language: language === 'zh-CN' ? 'zh' : language });
      }
      if (!alive.current) return;
      writeNotificationPreferences(cloud.storage, tripId, parsed);
      writeNotificationIntent(cloud.storage, tripId, parsed, intent);
      savedIntent.current = intent;
      setPreferences(parsed); setOffsetText(parsed.offsets.join(', ')); setMessage('saved');
    } catch { if (alive.current) setMessage('error'); }
    finally { if (alive.current) { setBusy(false); setPermission(permissionState()); } }
  }
  async function disableDevices(all: boolean) {
    setBusy(true);setMessage('');
    try {
      const device=cloud.storage.getItem('detours-push-device-v1');
      if(all || device) await disablePush({rpc:async(name,args)=>{try{await cloud.rpc(name,args);return {error:null};}catch(error){return {error};}}},all?undefined:device!,()=>alive.current);
      if(!alive.current)return;
      cloud.storage.removeItem('detours-push-device-v1');
      const nextIntent = {...intent,phone:false};
      writeNotificationIntent(cloud.storage, tripId, preferences, nextIntent);
      savedIntent.current=nextIntent;setIntent(nextIntent);edited.current=true;setMessage('saved');
    }catch{if(alive.current)setMessage('error');}
    finally{if(alive.current)setBusy(false);}
  }
  async function weather() {
    if (weatherState.busy) return;
    const controller = new AbortController(); weatherAbort.current = controller;
    setWeatherState(previous => ({ ...previous, busy: true }));
    const result = await loadRecapWeather(cloud.storage, tripId, currentRecaps.flatMap(r => r.items), { online: cloud.online, signal: controller.signal });
    if (alive.current && !controller.signal.aborted) { setForecasts(result.weather); setWeatherState({ busy: false, unavailable: result.unavailable, stale: result.stale }); }
  }
  function card(record: RecapRecord | undefined, date: string, label: string) {
    const expanded = selected === date, recap = record?.recap;
    return <section className="recap-card" key={date}>
      <h3><button type="button" aria-expanded={expanded} onClick={() => openRecap(date)}>{label} · <time dateTime={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString(dateLocale, { timeZone: 'UTC' })}</time>{recap && !record?.readAt && <span className="recap-unread" aria-label={c('unread')}/>}</button></h3>
      <p className="muted">{state.journey!.title}</p>
      {!recap && <p>{c('empty')}</p>}
      {expanded && recap && <>
        {record.referenceRevision && record.referenceRevision !== recap.revision && <p role="status">{c('changed')}</p>}
        <ul className="recap-program">{recap.items.map(item => <li key={`${item.kind}:${item.id}`}>
          <strong>{item.time || '—'} {item.title}</strong><p className="muted">{item.location} · {item.timezone || '—'} {item.booked && `· ${c('booked')}`} {item.done && `· ${c('done')}`}</p>
          {item.instant === undefined && <p className="muted">{c('noTime')}</p>}
          {recap.date >= (dates?.today || '') && <ReminderControl item={item} value={preferences.overrides[`${item.kind}:${item.id}`] || { mode: 'default' }} onChange={value => override(item, value)}/>}
          {item.instant === undefined && <button type="button" className="btn secondary" onClick={() => { onDay(item); onClose(); }}>{c('day')}</button>}
        </li>)}</ul>
        <h4>{c('weather')}</h4>
        {recap.weather.length === 0 && <p className="muted">{c('weatherMissing')}</p>}
        {recap.weather.map((w, i) => <p key={`${w.place}:${i}`}>{w.place}: {w.min ?? '—'}–{w.max ?? '—'} °C · {c('rain')} {w.rainProbability ?? '—'} % · UV {w.uv ?? '—'}<br/><small>{c('updated')} {new Date(w.fetchedAt).toLocaleString(dateLocale)}{Date.now() - Date.parse(w.fetchedAt) >= WEATHER_TTL && ` · ${c('stale')}`}</small></p>)}
        {recap.weather.length > 0 && <p><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></p>}
        <h4>{c('checklist')}</h4><ul>{checklistFor(recap.items, recap.weather).map(text => <li key={text}>{checklistCopy(language, text)}</li>)}</ul><p className="muted">{c('checklistInfo')}</p>
        <button type="button" className="btn secondary" onClick={() => { onDay(recap.items[0]); onClose(); }}>{c('day')}</button>
      </>}
    </section>;
  }
  return <dialog ref={dialog} className="recaps-dialog" aria-labelledby="recaps-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><h2 id="recaps-title">{c(settingsOpen ? 'notificationsTitle' : requestedObject ? 'reminder' : 'title')}</h2><p>{state.journey!.title}</p></div><button type="button" className="icon-btn" aria-label={c('close')} onClick={onClose}><X size={20}/></button></header>
    <button type="button" className="notification-view-link" onClick={() => { setSettingsOpen(value => !value); dialog.current?.scrollTo({top:0}); }}>{c(settingsOpen ? 'backRecaps' : 'settings')}</button>
    {!settingsOpen && <>
    {requestedObject && (requestedItem?<section className="recap-card"><h3>{requestedItem.title}</h3><p>{requestedItem.date || c('dateMissing')} · {requestedItem.time || '—'} · {requestedItem.timezone || '—'}</p>{requestedItem.instant===undefined && <p className="muted">{c('noTime')}</p>}<ReminderControl item={requestedItem} value={preferences.overrides[`${requestedItem.kind}:${requestedItem.id}`] || {mode:'default'}} onChange={value=>override(requestedItem,value)}/><button type="button" className="btn secondary" onClick={()=>{onDay(requestedItem);onClose();}}>{c('day')}</button></section>:<p role="status">{c('missingTarget')}</p>)}
    {!dates && <p role="status">{c('timezoneMissing')}</p>}
    {requestedDate && !displayed.some(r => r.recap.date === requestedDate) && <p role="status">{c('missingTarget')}</p>}
    {dates && <>{card(displayed.find(r => r.recap.date === dates.today), dates.today, c('today'))}{card(displayed.find(r => r.recap.date === dates.tomorrow), dates.tomorrow, c('tomorrow'))}<details><summary>{c('history')}</summary>{displayed.filter(r => r.recap.date < dates.today).map(record => card(record, record.recap.date, ''))}</details></>}
    <p className="muted">{c('weatherInfo')}</p><button type="button" className="btn secondary" disabled={weatherState.busy || !dates} onClick={() => { void weather(); }}>{weatherState.busy ? c('loading') : c('weatherLoad')}</button>
    {weatherState.unavailable && <p role="status">{c('weatherMissing')}</p>}{weatherState.stale && <p role="status">{c('stale')}</p>}
    </>}
    {settingsOpen && <NotificationPreferencesForm preferences={preferences} intent={intent} offsets={offsetText} edit={edit} setIntent={editIntent} setOffsets={editOffsets} phoneAvailable={serverTrip && capabilities.enabled && capabilities.push && !!capabilities.vapidPublicKey && pushSupport()} emailAvailable={!!(serverTrip && capabilities.enabled && capabilities.email && cloud.session?.user.email_confirmed_at)} emailRequiresVerification={capabilities.email && !cloud.session?.user.email_confirmed_at} permission={permission} online={cloud.online} busy={busy} loading={preferencesLoading} readOnly={initial.error || preferencesLoadError} disableDevice={cloud.session ? all => { void disableDevices(all); } : undefined}/>}
    <footer hidden={!settingsOpen && !requestedObject && !edited.current && !message}><button type="button" className="btn btn-primary" disabled={busy || preferencesLoading || preferencesLoadError || initial.error} onClick={() => { void save(); }}>{busy || preferencesLoading ? c('loading') : c('save')}</button>{message && <p role="status">{c(message)}</p>}{preferencesLoadError && <><p role="status">{c('loadError')}</p><button type="button" className="notification-view-link" onClick={() => setLoadAttempt(value => value + 1)}>{c('retry')}</button></>}</footer>
  </dialog>;
}

function ReminderControl({ item, value, onChange }: { item: ProgramItem; value: ReminderOverride; onChange: (value: ReminderOverride) => void }) {
  const { language } = useLocale();
  const c = (key: Parameters<typeof notificationCopy>[1]) => notificationCopy(language, key);
  const [text, setText] = useState(value.offsets?.join(', ') || '30'), [invalid, setInvalid] = useState(false);
  return <div className="recap-reminder"><label>{c('reminder')}<select aria-label={`${c('reminder')} · ${item.title}`} value={value.mode} onChange={e => onChange(e.target.value === 'custom' ? { mode: 'custom', offsets: [30] } : { mode: e.target.value as 'default' | 'off' })}>{(['default', 'off', 'custom'] as const).map(mode => <option key={mode} value={mode}>{c(mode)}</option>)}</select></label>{value.mode === 'custom' && <label>{c('offsets')}<input aria-label={`${c('offsets')} · ${item.title}`} aria-invalid={invalid} value={text} onChange={e => { setText(e.target.value); try { const offsets = normalizeOffsets(e.target.value.split(',').map(v => Number(v.trim()))); onChange({ mode: 'custom', offsets }); setInvalid(false); } catch { setInvalid(true); } }}/></label>}<span className="sr-only">{item.title}</span></div>;
}
