import { CalendarDays, ChevronDown, Clock3, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '../i18n';
import { categoryLabels } from '../lib';
import { notificationCopy } from '../notification-copy';
import type { NotificationIntent } from '../notification-form';
import { normalizeOffsets } from '../notifications';
import type { NotificationPreferences } from '../notifications';
import { validTimezone } from '../time';
import type { Category } from '../types';

type Props = {
  preferences: NotificationPreferences; intent: NotificationIntent; offsets: string;
  edit: (value: Partial<NotificationPreferences>) => void; setIntent: (value: NotificationIntent) => void; setOffsets: (value: string) => void;
  phoneAvailable: boolean; emailAvailable: boolean; emailRequiresVerification: boolean; permission: NotificationPermission | 'unsupported'; online: boolean; busy: boolean; loading: boolean; readOnly: boolean;
  disableDevice?: (all: boolean) => void;
};
const categories: Category[] = ['visit', 'transport', 'food', 'hotel', 'walk', 'shopping'];
function Switch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
  return <div className="notification-switch-row"><span>{label}</span><button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} className="notification-switch" onClick={onChange}><span/></button></div>;
}
export default function NotificationPreferencesForm({ preferences: p, intent, offsets, edit, setIntent, setOffsets, phoneAvailable, emailAvailable, emailRequiresVerification, permission, online, busy, loading, readOnly, disableDevice }: Props) {
  const { language, t } = useLocale();
  const c = (key: Parameters<typeof notificationCopy>[1]) => notificationCopy(language, key);
  const [amount, setAmount] = useState('30'), [unit, setUnit] = useState(1);
  let values: number[] = [], invalid = false;
  try { values = normalizeOffsets(offsets.split(',').map(value => Number(value.trim()))); } catch { invalid = true; }
  const custom = values.length !== 1 || ![15, 30, 60].includes(values[0]);
  const changeIntent = (value: Partial<NotificationIntent>) => setIntent({ ...intent, ...value });
  const delay = (minutes: number) => minutes % 1440 === 0 ? `${minutes / 1440} ${c('days')}` : minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
  const city = validTimezone(p.timezone) ? p.timezone.split('/').at(-1)!.replaceAll('_', ' ') : '—';
  return <div className="notification-preferences" aria-busy={busy || loading}>
    <p className="notification-subtitle">{c('notificationsSubtitle')}</p>
    <Switch label={c('enableNotifications')} checked={p.followed} disabled={busy || loading || readOnly} onChange={() => edit({ followed: !p.followed })}/>
    {!p.followed && <p className="notification-hint" role="status">{c('notificationsPaused')}</p>}
    <fieldset className="notification-sections" disabled={!p.followed || busy || loading || readOnly}>
      <legend className="sr-only">{c('settings')}</legend>
      <section className="notification-section" aria-labelledby="notification-program">
        <h3 id="notification-program"><CalendarDays size={20}/>{c('programTitle')}</h3>
        <Switch label={c('programToggle')} checked={intent.program} onChange={() => changeIntent({ program: !intent.program })}/>
        {intent.program && <label className="notification-time">{c('time')}<select aria-label={c('time')} value={p.recapTime} onChange={event => edit({ recapTime: event.target.value })}>
          {!['18:00', '19:00', '20:00', '21:00'].includes(p.recapTime) && <option value={p.recapTime}>{p.recapTime} · {c('custom')}</option>}
          {['18:00', '19:00', '20:00', '21:00'].map(time => <option key={time} value={time}>{time.replace(':', ' h ')}</option>)}
        </select></label>}
        <p className="notification-hint">{c('localTripTime')} : {city}</p>
      </section>
      <section className="notification-section" aria-labelledby="notification-activities">
        <h3 id="notification-activities"><Clock3 size={20}/>{c('activityTitle')}</h3>
        <Switch label={c('activityToggle')} checked={intent.activities} onChange={() => changeIntent({ activities: !intent.activities })}/>
        {intent.activities && <div className="notification-delay"><p>{c('howEarly')}</p><div className="notification-quick-delays" role="group" aria-label={c('howEarly')}>
          {[15, 30, 60].map(value => <button type="button" key={value} aria-pressed={!custom && values[0] === value} onClick={() => setOffsets(String(value))}>{value === 60 ? '1 h' : `${value} min`}</button>)}
        </div>{custom && <p className="notification-hint">{c('custom')} : {values.map(delay).join(' · ') || c('invalidDelays')}</p>}</div>}
        <p className="notification-hint">{c('activitiesSummary')} : {p.categories.map(category => t(categoryLabels[category])).join(', ') || c('noCategories')}</p>
      </section>
      <section className="notification-section" aria-labelledby="notification-channels">
        <h3 id="notification-channels"><Smartphone size={20}/>{c('channelsTitle')}</h3>
        <Switch label={c('phoneChannel')} checked={intent.phone && permission !== 'denied' && permission !== 'unsupported'} disabled={!intent.phone && (!phoneAvailable || permission === 'denied')} onChange={() => changeIntent({ phone: !intent.phone })}/>
        <p className="notification-hint">{permission === 'denied' ? c('phoneBlocked') : permission === 'unsupported' ? c('phoneUnsupported') : !phoneAvailable ? c('phoneInactive') : intent.phone && permission === 'default' ? c('phonePermission') : c('serverPushInfo')}</p>
        <Switch label={c('emailChannel')} checked={intent.email} disabled={!intent.email && !emailAvailable} onChange={() => changeIntent({ email: !intent.email })}/>
        {!emailAvailable && <p className="notification-hint">{c(emailRequiresVerification ? 'emailVerify' : 'emailStandby')}</p>}
      </section>
      <details className="notification-advanced">
        <summary>{c('advanced')}<ChevronDown size={18}/></summary>
        <div className="notification-advanced-content">
          <fieldset className="notification-categories"><legend>{c('categories')}</legend>{categories.map(category => <label key={category}><input type="checkbox" checked={p.categories.includes(category)} onChange={event => edit({ categories: event.target.checked ? [...p.categories, category] : p.categories.filter(value => value !== category) })}/>{t(categoryLabels[category])}</label>)}</fieldset>
          <div className="notification-additional"><h4>{c('additionalDelays')}</h4><p className="notification-hint">{c('delaysHelp')}</p><div className="notification-delay-chips">{values.map(value => <button type="button" key={value} disabled={values.length === 1} aria-label={`${c('removeDelay')} : ${delay(value)}`} onClick={() => setOffsets(values.filter(offset => offset !== value).join(', '))}>{delay(value)}<X size={14}/></button>)}</div>
            <label className="notification-offset-input">{c('offsets')}<input value={offsets} aria-invalid={invalid} onChange={event => setOffsets(event.target.value)} inputMode="numeric"/></label>
            {invalid && <p role="alert">{c('invalidDelays')}</p>}
            <div className="recap-custom-delay"><label>{c('quantity')}<input type="number" min="1" max={Math.floor(10080 / unit)} step="1" value={amount} onChange={event => setAmount(event.target.value)}/></label><label>{c('unit')}<select aria-label={c('unit')} value={unit} onChange={event => setUnit(Number(event.target.value))}>{([1, 60, 1440] as const).map((value, index) => <option key={value} value={value}>{c((['minutes', 'hours', 'days'] as const)[index])}</option>)}</select></label><button type="button" disabled={invalid || values.length >= 5 || !Number.isInteger(Number(amount)) || Number(amount) < 1 || Number(amount) * unit > 10080} onClick={() => setOffsets(normalizeOffsets([...values, Number(amount) * unit]).join(', '))}>{c('addDelay')}</button></div>
          </div>
          <label className="notification-zone">{c('timezone')}<input value={p.timezone} aria-invalid={!validTimezone(p.timezone)} placeholder="Europe/Paris" onChange={event => edit({ timezone: event.target.value })}/></label>
          <label className="notification-custom-time">{c('customRecapTime')}<input type="time" value={p.recapTime} onChange={event => edit({ recapTime: event.target.value })}/></label>
          {disableDevice && <div className="notification-device-actions"><button type="button" onClick={() => disableDevice(false)}>{c('disableDevice')}</button><button type="button" onClick={() => disableDevice(true)}>{c('disableAll')}</button></div>}
          {!online && <p className="notification-hint">{c('deferred')}</p>}
        </div>
      </details>
    </fieldset>
    <p className="notification-hint">{c('localRecapsInfo')}</p>
  </div>;
}
