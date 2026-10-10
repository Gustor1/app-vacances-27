import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { buildRecap, checklistFor, defaultNotificationPreferences, normalizeOffsets, notificationKey, parseNotificationPreferences, projectProgram, recapDates, reminderItem } from '../notifications';
import type { NotificationPreferences, ProgramItem, ReminderOverride, Weather } from '../notifications';
import { markRecapRead, mergeRemoteRecaps, readRecapCache, updateRecapCache, writeNotificationPreferences, writeRecapCache } from '../notification-storage';
import type { RecapRecord } from '../notification-storage';
import { cachedWeather, loadRecapWeather, WEATHER_TTL } from '../notification-weather';
import { checklistCopy, notificationCopy } from '../notification-copy';
import { validTimezone } from '../time';
import { categoryLabels } from '../lib';
import type { Category, StoredState } from '../types';
import { pushSupport, registerPush, disablePush } from '../notification-push';
import './Recaps.css';

type Props = { state: StoredState; onDay: (item: ProgramItem) => void; requestedDate?: string; requestedObject?: {kind:ProgramItem['kind'];id:string} };
type Capabilities = { enabled: boolean; push: boolean; email: boolean; vapidPublicKey: string | null };
const noCapabilities: Capabilities = { enabled: false, push: false, email: false, vapidPublicKey: null };
const categories: Category[] = ['visit', 'transport', 'food', 'hotel', 'walk', 'shopping'];

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
  const cloud = useCloud(), { language, dateLocale, t } = useLocale();
  const c = (key: Parameters<typeof notificationCopy>[1]) => notificationCopy(language, key);
  const tripId = state.journey!.id;
  const dialog = useRef<HTMLDialogElement>(null), alive = useRef(true), weatherAbort = useRef<AbortController | null>(null);
  const [initial] = useState(() => {
    try { return { preferences: parseNotificationPreferences(cloud.storage.getItem(notificationKey(tripId)), state.journey?.timezone), records: readRecapCache(cloud.storage, tripId), error: false }; }
    catch { return { preferences: defaultNotificationPreferences(state.journey?.timezone), records: [] as RecapRecord[], error: true }; }
  });
  const [preferences, setPreferences] = useState(initial.preferences);
  const [offsetText, setOffsetText] = useState(initial.preferences.offsets.join(', '));
  const [customAmount,setCustomAmount]=useState('30'),[customUnit,setCustomUnit]=useState(1);
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
    if (cloud.session) {
      void cloud.rpc<Capabilities>('detours_notification_capabilities').then(value => { if (active) setCapabilities(value); }).catch(() => {});
      void cloud.rpc<RecapRecord[]>('detours_notification_recap_snapshots', { p_trip: tripId }).then(snapshots => {
        const validated=mergeRemoteRecaps([],snapshots,tripId);
        if (active) setRecords(previous => mergeRemoteRecaps(previous, validated, tripId));
      }).catch(() => {});
      void cloud.rpc<NotificationPreferences | null>('detours_notification_preferences', { p_trip: tripId }).then(value => {
        if (active && value && !edited.current) {
          remotePreferences.current = true;
          const parsed = parseNotificationPreferences(JSON.stringify(value));
          writeNotificationPreferences(cloud.storage, tripId, parsed);
          setPreferences(parsed); setOffsetText(parsed.offsets.join(', '));
        }
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [cloud.rpc, cloud.storage, cloud.session, tripId]);
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

  function edit(value: Partial<NotificationPreferences>) { edited.current = true; setPreferences(p => ({ ...p, ...value })); }
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
      const parsed = parseNotificationPreferences(JSON.stringify({ ...preferences, offsets: normalizeOffsets(offsetText.split(',').map(v => Number(v.trim()))) }));
      const wantsPush = parsed.activityPush || parsed.recapPush;
      if ((wantsPush && !(capabilities.enabled && capabilities.push && capabilities.vapidPublicKey && pushSupport())) || (parsed.email && !(capabilities.enabled && capabilities.email && cloud.session?.user.email_confirmed_at))) throw new Error('Remote channels unavailable');
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
      setPreferences(parsed); setOffsetText(parsed.offsets.join(', ')); setMessage('saved');
    } catch { if (alive.current) setMessage('error'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function disableDevices(all: boolean) {
    setBusy(true);setMessage('');
    try {
      const device=cloud.storage.getItem('detours-push-device-v1');
      if(!all && !device) { setMessage('saved');return; }
      await disablePush({rpc:async(name,args)=>{try{await cloud.rpc(name,args);return {error:null};}catch(error){return {error};}}},all?undefined:device!,()=>alive.current);
      if(!alive.current)return;
      cloud.storage.removeItem('detours-push-device-v1');setMessage('saved');
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
    <header><div><h2 id="recaps-title">{c(requestedObject?'reminder':'title')}</h2><p>{state.journey!.title} · {preferences.timezone || '—'}</p></div><button type="button" className="icon-btn" aria-label={c('close')} onClick={onClose}><X size={20}/></button></header>
    {requestedObject && (requestedItem?<section className="recap-card"><h3>{requestedItem.title}</h3><p>{requestedItem.date || c('dateMissing')} · {requestedItem.time || '—'} · {requestedItem.timezone || '—'}</p>{requestedItem.instant===undefined && <p className="muted">{c('noTime')}</p>}<ReminderControl item={requestedItem} value={preferences.overrides[`${requestedItem.kind}:${requestedItem.id}`] || {mode:'default'}} onChange={value=>override(requestedItem,value)}/><button type="button" className="btn secondary" onClick={()=>{onDay(requestedItem);onClose();}}>{c('day')}</button></section>:<p role="status">{c('missingTarget')}</p>)}
    {!dates && <p role="status">{c('timezoneMissing')}</p>}
    {requestedDate && !displayed.some(r => r.recap.date === requestedDate) && <p role="status">{c('missingTarget')}</p>}
    {dates && <>{card(displayed.find(r => r.recap.date === dates.today), dates.today, c('today'))}{card(displayed.find(r => r.recap.date === dates.tomorrow), dates.tomorrow, c('tomorrow'))}<details><summary>{c('history')}</summary>{displayed.filter(r => r.recap.date < dates.today).map(record => card(record, record.recap.date, ''))}</details></>}
    <p className="muted">{c('weatherInfo')}</p><button type="button" className="btn secondary" disabled={weatherState.busy || !dates} onClick={() => { void weather(); }}>{weatherState.busy ? c('loading') : c('weatherLoad')}</button>
    {weatherState.unavailable && <p role="status">{c('weatherMissing')}</p>}{weatherState.stale && <p role="status">{c('stale')}</p>}
    <details className="recap-preferences" open={!dates}><summary>{c('settings')}</summary><p className="muted">{c('local')}</p>
      <label>{c('timezone')}<input value={preferences.timezone} placeholder="Asia/Shanghai" onChange={e => edit({ timezone: e.target.value })}/></label>
      <label>{c('time')}<input type="time" value={preferences.recapTime} onChange={e => edit({ recapTime: e.target.value })}/></label>
      <label>{c('offsets')}<input value={offsetText} onChange={e => { edited.current = true; setOffsetText(e.target.value); }} inputMode="numeric"/></label>
      <div className="recap-delay-presets">{[1440,60,30,15].map(offset=><button type="button" key={offset} onClick={()=>{try{const current=normalizeOffsets(offsetText.split(',').map(Number));setOffsetText(normalizeOffsets([...current.filter(n=>n!==offset),offset]).join(', '));edited.current=true;}catch{setMessage('error');}}}>{offset===1440?'24 h':offset===60?'1 h':`${offset} min`}</button>)}</div>
      <div className="recap-custom-delay"><label>{c('quantity')}<input type="number" min="1" max={Math.floor(10080/customUnit)} step="1" value={customAmount} onChange={e=>setCustomAmount(e.target.value)}/></label><label>{c('unit')}<select aria-label={c('unit')} value={customUnit} onChange={e=>setCustomUnit(Number(e.target.value))}>{([1,60,1440] as const).map((unit,index)=><option key={unit} value={unit}>{c((['minutes','hours','days'] as const)[index])}</option>)}</select></label><button type="button" disabled={!Number.isInteger(Number(customAmount)) || Number(customAmount)<1 || Number(customAmount)*customUnit>10080} onClick={()=>{try{setOffsetText(normalizeOffsets([...offsetText.split(',').map(Number),Number(customAmount)*customUnit]).join(', '));edited.current=true;}catch{setMessage('error');}}}>{c('addDelay')}</button></div>
      <fieldset><legend>{c('categories')}</legend>{categories.map(category => <label key={category}><input type="checkbox" checked={preferences.categories.includes(category)} onChange={e => edit({ categories: e.target.checked ? [...preferences.categories, category] : preferences.categories.filter(v => v !== category) })}/>{t(categoryLabels[category])}</label>)}</fieldset>
      <label><input type="checkbox" checked={preferences.followed} onChange={e => edit({ followed: e.target.checked })}/>{c('follow')}</label>
      <label><input type="checkbox" disabled={!preferences.activityPush && !(capabilities.enabled && capabilities.push && pushSupport())} checked={preferences.activityPush} onChange={e => edit({ activityPush: e.target.checked })}/>{c('push')}</label>
      <label><input type="checkbox" disabled={!preferences.recapPush && !(capabilities.enabled && capabilities.push && pushSupport())} checked={preferences.recapPush} onChange={e => edit({ recapPush: e.target.checked })}/>{c('recapPush')}</label>
      <label><input type="checkbox" disabled={!preferences.email && !(capabilities.enabled && capabilities.email && cloud.session?.user.email_confirmed_at)} checked={preferences.email} onChange={e => edit({ email: e.target.checked })}/>{c('email')}</label>
      {!capabilities.enabled && <p className="muted">{c('unavailable')}</p>}<p className="muted">{c('deferred')}</p>
      {cloud.session && <div className="inline-actions"><button type="button" disabled={busy} onClick={()=>{void disableDevices(false);}}>{c('disableDevice')}</button><button type="button" disabled={busy} onClick={()=>{void disableDevices(true);}}>{c('disableAll')}</button></div>}
    </details>
    <footer><button type="button" className="btn primary" disabled={busy || initial.error} onClick={() => { void save(); }}>{busy ? c('loading') : c('save')}</button>{message && <p role="status">{c(message)}</p>}</footer>
  </dialog>;
}

function ReminderControl({ item, value, onChange }: { item: ProgramItem; value: ReminderOverride; onChange: (value: ReminderOverride) => void }) {
  const { language } = useLocale();
  const c = (key: Parameters<typeof notificationCopy>[1]) => notificationCopy(language, key);
  const [text, setText] = useState(value.offsets?.join(', ') || '30'), [invalid, setInvalid] = useState(false);
  return <div className="recap-reminder"><label>{c('reminder')}<select aria-label={`${c('reminder')} · ${item.title}`} value={value.mode} onChange={e => onChange(e.target.value === 'custom' ? { mode: 'custom', offsets: [30] } : { mode: e.target.value as 'default' | 'off' })}>{(['default', 'off', 'custom'] as const).map(mode => <option key={mode} value={mode}>{c(mode)}</option>)}</select></label>{value.mode === 'custom' && <label>{c('offsets')}<input aria-label={`${c('offsets')} · ${item.title}`} aria-invalid={invalid} value={text} onChange={e => { setText(e.target.value); try { const offsets = normalizeOffsets(e.target.value.split(',').map(v => Number(v.trim()))); onChange({ mode: 'custom', offsets }); setInvalid(false); } catch { setInvalid(true); } }}/></label>}<span className="sr-only">{item.title}</span></div>;
}
