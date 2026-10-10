import { activeSteps } from '../day-preparation';
import { useState } from 'react';
import { EditInput, EditButton } from './EditControls';
import { useLocale, translate } from '../i18n';
import { localeFor } from '../locale-utils';
import type { Language } from '../i18n';
import { CalendarDays, Download, MapPin, Printer } from 'lucide-react';
import { calendarItemKey, createProgramCalendar, datedDayCount, validCalendarDate } from '../calendar';
import type { CalendarExportOptions } from '../calendar';
import { projectProgram } from '../notifications';
import { amapLink, safeExternalUrl } from '../lib';
import type { StoredState } from '../types';
import './TripOverview.css';
import { useMapPreferences } from '../MapPreferences';
import { preferredMapCity, type MapProvider } from '../map-preferences';


type Props = {
  state: StoredState;
  onChange: (updater: (prev: StoredState) => StoredState) => void;
  onNavigate: (cityId: string, dayId: string) => void;
  notify: (message: string) => void;
};

const calendarCopy = {
  fr: { options: 'Options du calendrier', days: 'Journées entières', combined: 'Journées et activités horaires', timed: 'Activités et transports horaires', scope: 'Contenu à exporter', selection: 'Choisir les activités et transports', alarms: 'Inclure des alarmes (peut doubler les rappels Détours)', minutes: 'minutes avant', day: '24 heures avant', custom: 'Délai personnalisé en minutes (1 à 10 080)', copy: 'Copie du programme au moment de l’export. Les changements dans Détours ne sont pas synchronisés automatiquement.', warning: 'Non exportés en événements horaires :', noTime: 'sans horaire fiable', noZone: 'sans fuseau valide', exported: 'événements exportés', select: 'Exporter le calendrier', clients: 'Les alarmes et réimports peuvent varier entre Apple Calendar, Google Calendar et Outlook.' },
  en: { options: 'Calendar options', days: 'All-day summaries', combined: 'Summaries and timed activities', timed: 'Timed activities and transfers', scope: 'Export content', selection: 'Choose activities and transfers', alarms: 'Include alarms (may duplicate Détours reminders)', minutes: 'minutes before', day: '24 hours before', custom: 'Custom offset in minutes (1 to 10,080)', copy: 'Copy of the schedule at export time. Changes in Détours are not automatically synchronized.', warning: 'Not exported as timed events:', noTime: 'without a reliable time', noZone: 'without a valid timezone', exported: 'events exported', select: 'Export calendar', clients: 'Alarms and reimports may behave differently in Apple Calendar, Google Calendar and Outlook.' },
  'zh-CN': { options: '日历选项', days: '全天行程摘要', combined: '全天摘要及定时活动', timed: '定时活动及交通', scope: '导出内容', selection: '选择活动及交通', alarms: '包含提醒（可能与 Détours 提醒重复）', minutes: '分钟前', day: '24 小时前', custom: '自定义提前时间（1 至 10080 分钟）', copy: '导出文件是当前行程的副本。Détours 中的更改不会自动同步。', warning: '无法导出为定时事件：', noTime: '缺少可靠时间', noZone: '缺少有效时区', exported: '个事件已导出', select: '导出日历', clients: 'Apple Calendar、Google Calendar 和 Outlook 对提醒和重新导入的处理可能不同。' },
  es: { options: 'Opciones del calendario', days: 'Resúmenes de día completo', combined: 'Resúmenes y actividades con horario', timed: 'Actividades y transportes con horario', scope: 'Contenido para exportar', selection: 'Elegir actividades y transportes', alarms: 'Incluir alarmas (pueden duplicar los avisos de Détours)', minutes: 'minutos antes', day: '24 horas antes', custom: 'Antelación personalizada en minutos (1 a 10 080)', copy: 'Copia del programa al exportarlo. Los cambios en Détours no se sincronizan automáticamente.', warning: 'No exportados como eventos con horario:', noTime: 'sin horario fiable', noZone: 'sin zona horaria válida', exported: 'eventos exportados', select: 'Exportar calendario', clients: 'Las alarmas y las reimportaciones pueden variar entre Apple Calendar, Google Calendar y Outlook.' },
} satisfies Record<Language, Record<string, string>>;

/** A separate document prints every city without changing the active app view. */
export function printWholeTrip(state: StoredState, language: Language = 'fr', provider?: MapProvider): void {
  const t = (text: string, values?: Record<string, string | number>) => translate(text, language, values);
  const frame = document.createElement('iframe');
  frame.title = t("Version imprimable du voyage");
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0';
  document.body.append(frame);
  const doc = frame.contentDocument;
  const target = frame.contentWindow;
  if (!doc || !target) { frame.remove(); throw new Error(t("Impression indisponible dans ce navigateur.")); }
  doc.title = state.journey?.title || t("Détours — voyage complet");
  doc.documentElement.lang = language;
  const dateLocale = localeFor(language);
  const displayDate = (value: string) => validCalendarDate(value) ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : value;
  const style = doc.createElement('style');
  style.textContent = `@page { margin: 16mm; } body { font: 12pt system-ui,sans-serif; color:#172a27; line-height:1.5; } h1 {font-size:25pt} h2 {font-size:20pt;break-after:avoid} h3 {break-after:avoid} article {border-top:1px solid #aaa;padding-top:8px} p {white-space:pre-wrap;overflow-wrap:anywhere} a {color:#172a27;overflow-wrap:anywhere} .city {break-before:page} .city:first-of-type {break-before:auto} .step {break-inside:avoid} @media print {body {margin:0}}`;
  doc.head.append(style);
  const add = (parent: HTMLElement, tag: string, content: string, className = '') => {
    const node = doc.createElement(tag); node.textContent = content; node.className = className; parent.append(node); return node;
  };
  const link = (parent: HTMLElement, label: string, url?: string) => {
    const safe = safeExternalUrl(url);
    if (!safe) return;
    const anchor = doc.createElement('a'); anchor.href = safe; anchor.textContent = `${label} : ${safe}`; parent.append(anchor);
  };
  add(doc.body, 'h1', state.journey?.title || t("Détours — mon voyage complet"));
  add(doc.body, 'p', t("{cities} villes · {days} journées", { cities: state.cities.length, days: state.cities.reduce((sum, city) => sum + city.days.length, 0) }) + (state.departureDate ? t(" · Départ : {date}", { date: displayDate(state.departureDate) }) : ''));
  if (state.notes.general) { add(doc.body, 'h2', t("Mes notes personnelles")); add(doc.body, 'p', state.notes.general); }
  for (const sourceCity of state.cities) {
    const city = provider ? preferredMapCity(sourceCity,provider) : sourceCity;
    const section = add(doc.body, 'section', '', 'city');
    add(section, 'h2', `${city.name} · ${city.chineseName}`);
    add(section, 'p', city.subtitle);
    for (const note of city.notes) add(section, 'p', note);
    if (state.notes[city.id]) add(section, 'p', t("Mes notes : {notes}", { notes: state.notes[city.id] }));
    const stay = state.stays?.find(item => item.cityId === city.id);
    if (stay) add(section, 'p', t("Hébergement : {name}\n{address}\nArrivée : {arrival} · Départ : {departure}\n{notes}", { name: `${stay.name} ${stay.chineseName}`, address: stay.address, arrival: displayDate(stay.checkIn) || t("à renseigner"), departure: displayDate(stay.checkOut) || t("à renseigner"), notes: stay.notes }));
    for (const day of city.days) {
      const article = add(section, 'article', '');
      add(article, 'h3', `${day.title} · ${day.date && validCalendarDate(day.date) ? displayDate(day.date) : t("Date à renseigner")}`);
      if (state.notes[day.id]) add(article, 'p', t("Mes notes : {notes}", { notes: state.notes[day.id] }));
      for (const step of activeSteps(day)) {
        const block = add(article, 'div', '', 'step');
        add(block, 'h4', `${state.done.includes(step.id) ? '✓ ' : ''}${step.period ? step.period + ' · ' : ''}${step.title}${step.chineseName ? ' · ' + step.chineseName : ''}`);
        add(block, 'p', [step.description,step.address].filter(Boolean).join('\n'));
        if (state.favorites.includes(step.id)) add(block, 'p', t("Favori"));
        if (step.booking || state.bookings.includes(step.id)) add(block, 'p', state.bookings.includes(step.id) ? t("Réservation confirmée") : t("Réservation à prévoir"));
        if (state.notes[step.id]) add(block, 'p', t("Mes notes : {notes}", { notes: state.notes[step.id] }));
        link(block, city.mapProvider === 'google' ? 'Google Maps' : 'Amap', amapLink(city, step));
      }
    }
    const favoriteBonus = [...(state.bonusCatalog || []), ...(state.customBonus || [])].filter(item => item.cityId === city.id && (state.favorites.includes(item.id) || state.bookings.includes(item.id) || Boolean(state.notes[item.id])));
    if (favoriteBonus.length) {
      add(section, 'h3', t("Mes bonus — favoris, réservations et notes"));
      for (const bonus of favoriteBonus) {
        const block = add(section, 'div', '', 'step');
        add(block, 'h4', `${bonus.title}${bonus.chineseName ? ' · ' + bonus.chineseName : ''}`);
        if (state.favorites.includes(bonus.id)) add(block, 'p', t("Favori"));
        add(block, 'p', [bonus.description, bonus.address, bonus.budget, bonus.tip, state.notes[bonus.id]].filter(Boolean).join('\n'));
        if (state.bookings.includes(bonus.id)) add(block, 'p', t("Réservation confirmée"));
        link(block, city.mapProvider === 'google' ? 'Google Maps' : 'Amap', amapLink(city, bonus));
        add(block, 'br', '');
        link(block, t('Source'), bonus.sourceUrl);
      }
    }
  }
  if (state.transfers?.length) {
    add(doc.body, 'h2', t("Mes trajets"));
    for (const transfer of state.transfers) {
      const name = (id: string) => state.cities.find(city => city.id === id)?.name || id;
      add(doc.body, 'p', `${name(transfer.fromCityId)} → ${name(transfer.toCityId)} · ${transfer.label}\n${transfer.departure} ${transfer.fromStation} → ${transfer.arrival} ${transfer.toStation}\n${transfer.booked ? t("Réservé") : t("À réserver")}${transfer.reference ? ' · ' + transfer.reference : ''}\n${transfer.notes}`);
    }
  }
  const cleanup = () => frame.remove();
  target.addEventListener('afterprint', cleanup, { once: true });
  // Some mobile browsers never send afterprint. Keep the frame through their dialog.
  window.setTimeout(cleanup, 300_000);
  target.focus();
  target.print();
}

export default function TripOverview({ state, onChange, onNavigate, notify }: Props) {
  const { t, language } = useLocale();
  const copy = calendarCopy[language];
  const [scope, setScope] = useState<CalendarExportOptions['scope']>('days');
  const [includeAlarms, setIncludeAlarms] = useState(false);
  const [offsets, setOffsets] = useState([30]);
  const [customOffset, setCustomOffset] = useState('');
  const [excluded, setExcluded] = useState<string[]>([]);
  const { provider } = useMapPreferences();
  const days = state.cities.flatMap(city => city.days);
  const steps = days.flatMap(day => activeSteps(day));
  const completed = steps.filter(step => state.done.includes(step.id)).length;
  const dated = datedDayCount(state);
  const items = projectProgram(state);
  const custom = customOffset ? Number(customOffset) : undefined;
  const validAlarms = scope === 'days' || !includeAlarms || ((!customOffset || (Number.isInteger(custom) && custom! >= 1 && custom! <= 10080)) && (offsets.length > 0 || custom !== undefined));
  const exportOptions: CalendarExportOptions = { scope, selectedKeys: items.map(calendarItemKey).filter(key => !excluded.includes(key)), includeAlarms: includeAlarms && scope !== 'days' && validAlarms, offsets: [...new Set([...offsets, ...(custom !== undefined ? [custom] : [])])], appUrl: window.location.origin + window.location.pathname };
  const preview = createProgramCalendar(state, exportOptions);
  const count = preview.dayCount + preview.timedCount;
  const exportCalendar = () => {
    const blob = new Blob([createProgramCalendar(state, exportOptions).content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'a-l-est-voyage.ics';
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    notify(`${count} ${copy.exported}`);
  };
  return <section className="trip-overview" aria-labelledby="overview-title">
    <header className="section-header">
      <div><p className="eyebrow">{t("Tout le voyage en un regard")}</p><h2 id="overview-title">{t("Vue d’ensemble")}</h2><p className="muted">{t("Retrouve chaque journée, sa date et ton avancement.")}</p></div>
      <div className="overview-actions"><button type="button" disabled={!count || !validAlarms} onClick={exportCalendar}><Download size={18} aria-hidden="true" /> {copy.select} ({count})</button><button type="button" onClick={() => { try { printWholeTrip(state, language, provider); } catch (error) { notify(error instanceof Error ? error.message : t("Impression indisponible.")); } }}><Printer size={18} aria-hidden="true" />{t("Imprimer tout le voyage")}</button></div>
    </header>
    <details className="overview-calendar-options">
      <summary>{copy.options}</summary>
      <label>{copy.scope}<select aria-label={copy.scope} value={scope} onChange={event => setScope(event.target.value as CalendarExportOptions['scope'])}><option value="days">{copy.days}</option><option value="combined">{copy.combined}</option><option value="timed">{copy.timed}</option></select></label>
      {scope !== 'days' && <>
        <details><summary>{copy.selection}</summary><div className="overview-calendar-selection">{items.map(item => { const key = calendarItemKey(item); return <label key={key}><input type="checkbox" checked={!excluded.includes(key)} onChange={event => setExcluded(previous => event.target.checked ? previous.filter(id => id !== key) : [...previous, key])} /> <span>{item.date} · {item.title} · {item.time || copy.noTime} · {item.timezone || copy.noZone}</span></label>; })}</div></details>
        <label className="overview-calendar-check"><input type="checkbox" checked={includeAlarms} onChange={event => setIncludeAlarms(event.target.checked)} />{copy.alarms}</label>
        {includeAlarms && <fieldset><legend>{copy.alarms}</legend><div className="overview-calendar-offsets">{[15, 30, 60, 1440].map(offset => <label key={offset}><input type="checkbox" checked={offsets.includes(offset)} onChange={event => setOffsets(previous => event.target.checked ? [...previous, offset] : previous.filter(value => value !== offset))} />{offset === 1440 ? copy.day : `${offset} ${copy.minutes}`}</label>)}</div><label>{copy.custom}<input type="number" min="1" max="10080" step="1" value={customOffset} onChange={event => setCustomOffset(event.target.value)} aria-invalid={!validAlarms} /></label></fieldset>}
        {(preview.missingTime > 0 || preview.missingTimezone > 0) && <p role="status">{copy.warning} {preview.missingTime} {copy.noTime} · {preview.missingTimezone} {copy.noZone}.</p>}
      </>}
      <p className="muted">{copy.clients}</p>
    </details>
    <p className="overview-calendar-copy">{copy.copy}</p>
    <div className="overview-summary"><span><MapPin size={18} aria-hidden="true" /> {t("{count} villes", { count: state.cities.length })}</span><span><CalendarDays size={18} aria-hidden="true" /> {t("{count} journées · {dated} datées", { count: days.length, dated })}</span><span>{t("{done} / {total} activités faites", { done: completed, total: steps.length })}</span><progress max={steps.length || 1} value={completed} aria-label={t("Avancement des activités du voyage")} /></div>
    <p className="overview-date-hint">{t("Attribue une date à chaque journée. Les journées de départ et d’arrivée peuvent se chevaucher entre deux villes : les dates ne sont donc pas calculées automatiquement depuis le départ. Seules les journées datées sont exportées, en événements sur la journée entière.")}</p>
    {state.cities.map(city => <section className="overview-city" key={city.id} aria-labelledby={`overview-city-${city.id}`}>
      <h2 id={`overview-city-${city.id}`}>{city.name} <small>{city.chineseName}</small></h2>
      {city.days.length ? city.days.map(day => {
        const done = activeSteps(day).filter(step => state.done.includes(step.id)).length;
        return <article className="overview-day" key={day.id}>
          <div><button type="button" className="overview-day-link" onClick={() => onNavigate(city.id, day.id)} aria-label={t("Ouvrir {day} à {city}", { day: day.title, city: city.name })}>{day.title}</button><p>{activeSteps(day).length ? t("{done} / {total} activités faites", { done, total: activeSteps(day).length }) : t("Journée à compléter")}{day.steps.some(step => step.booking && !state.bookings.includes(step.id)) ? t(" · Réservations à prévoir") : ''}</p></div>
          <label className="overview-date">{t("Date de {day}", { day: day.title })}<EditInput type="date" min="0001-01-01" max="9999-12-30" value={day.date || ''} onChange={event => {
            const date = event.target.value;
            if (date && (!validCalendarDate(date) || date > '9999-12-30')) { notify(t("Choisis une date valide.")); return; }
            onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: date || undefined } : row) } : item) }));
          }} /></label>
          {day.date && <EditButton className="overview-clear" type="button" aria-label={t("Effacer la date de {day} à {city}", { day: day.title, city: city.name })} onClick={() => onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: undefined } : row) } : item) }))}>{t("Effacer")}</EditButton>}
        </article>;
      }) : <p className="muted">{t("Ajoute une journée depuis le planning de cette ville.")}</p>}
    </section>)}
  </section>;
}
