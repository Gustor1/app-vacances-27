import { useLocale, translate } from '../i18n';
import { CalendarDays, Download, MapPin, Printer } from 'lucide-react';
import { createTripCalendar, datedDayCount, validCalendarDate } from '../calendar';
import { bonusItems } from '../data/bonus';
import { amapLink, safeExternalUrl } from '../lib';
import type { StoredState } from '../types';
import './TripOverview.css';

type Props = {
  state: StoredState;
  onChange: (updater: (prev: StoredState) => StoredState) => void;
  onNavigate: (cityId: string, dayId: string) => void;
  notify: (message: string) => void;
};

/** A separate document prints every city without changing the active app view. */
export function printWholeTrip(state: StoredState, language: 'fr' | 'en' = 'fr'): void {
  const t = (text: string, values?: Record<string, string | number>) => translate(text, language, values);
  const frame = document.createElement('iframe');
  frame.title = t("Version imprimable du voyage");
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0';
  document.body.append(frame);
  const doc = frame.contentDocument;
  const target = frame.contentWindow;
  if (!doc || !target) { frame.remove(); throw new Error(t("Impression indisponible dans ce navigateur.")); }
  doc.title = t("À l’Est — voyage complet");
  doc.documentElement.lang = language;
  const dateLocale = language === 'en' ? 'en-GB' : 'fr-FR';
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
  add(doc.body, 'h1', t("À l’Est — mon voyage complet"));
  add(doc.body, 'p', t("{cities} villes · {days} journées", { cities: state.cities.length, days: state.cities.reduce((sum, city) => sum + city.days.length, 0) }) + (state.departureDate ? t(" · Départ : {date}", { date: displayDate(state.departureDate) }) : ''));
  if (state.notes.general) { add(doc.body, 'h2', t("Mes notes personnelles")); add(doc.body, 'p', state.notes.general); }
  for (const city of state.cities) {
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
      for (const step of day.steps) {
        const block = add(article, 'div', '', 'step');
        add(block, 'h4', `${state.done.includes(step.id) ? '✓ ' : ''}${step.period ? step.period + ' · ' : ''}${step.title}${step.chineseName ? ' · ' + step.chineseName : ''}`);
        add(block, 'p', [step.description,step.address].filter(Boolean).join('\n'));
        if (state.favorites.includes(step.id)) add(block, 'p', t("Favori"));
        if (step.booking || state.bookings.includes(step.id)) add(block, 'p', state.bookings.includes(step.id) ? t("Réservation confirmée") : t("Réservation à prévoir"));
        if (state.notes[step.id]) add(block, 'p', t("Mes notes : {notes}", { notes: state.notes[step.id] }));
        link(block, 'Amap', amapLink(city, step));
      }
    }
    const favoriteBonus = [...bonusItems, ...(state.customBonus || [])].filter(item => item.cityId === city.id && (state.favorites.includes(item.id) || state.bookings.includes(item.id) || Boolean(state.notes[item.id])));
    if (favoriteBonus.length) {
      add(section, 'h3', t("Mes bonus — favoris, réservations et notes"));
      for (const bonus of favoriteBonus) {
        const block = add(section, 'div', '', 'step');
        add(block, 'h4', `${bonus.title}${bonus.chineseName ? ' · ' + bonus.chineseName : ''}`);
        if (state.favorites.includes(bonus.id)) add(block, 'p', t("Favori"));
        add(block, 'p', [bonus.description, bonus.address, bonus.budget, bonus.tip, state.notes[bonus.id]].filter(Boolean).join('\n'));
        if (state.bookings.includes(bonus.id)) add(block, 'p', t("Réservation confirmée"));
        link(block, 'Amap', amapLink(city, bonus));
        add(block, 'br', '');
        link(block, 'Source', bonus.sourceUrl);
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
  const days = state.cities.flatMap(city => city.days);
  const steps = days.flatMap(day => day.steps);
  const completed = steps.filter(step => state.done.includes(step.id)).length;
  const dated = datedDayCount(state);
  const exportCalendar = () => {
    const blob = new Blob([createTripCalendar(state)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'a-l-est-voyage.ics';
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    notify(t(dated > 1 ? "{count} journées exportées vers ton calendrier." : "{count} journée exportée vers ton calendrier.", { count: dated }));
  };
  return <section className="trip-overview" aria-labelledby="overview-title">
    <header className="section-header">
      <div><p className="eyebrow">{t("Tout le voyage en un regard")}</p><h2 id="overview-title">{t("Vue d’ensemble")}</h2><p className="muted">{t("Retrouve chaque journée, sa date et ton avancement.")}</p></div>
      <div className="overview-actions"><button type="button" disabled={!dated} onClick={exportCalendar}><Download size={18} aria-hidden="true" /> {t("Exporter le calendrier ({count})", { count: dated })}</button><button type="button" onClick={() => { try { printWholeTrip(state, language); } catch (error) { notify(error instanceof Error ? error.message : t("Impression indisponible.")); } }}><Printer size={18} aria-hidden="true" />{t("Imprimer tout le voyage")}</button></div>
    </header>
    <div className="overview-summary"><span><MapPin size={18} aria-hidden="true" /> {t("{count} villes", { count: state.cities.length })}</span><span><CalendarDays size={18} aria-hidden="true" /> {t("{count} journées · {dated} datées", { count: days.length, dated })}</span><span>{t("{done} / {total} activités faites", { done: completed, total: steps.length })}</span><progress max={steps.length || 1} value={completed} aria-label={t("Avancement des activités du voyage")} /></div>
    <p className="overview-date-hint">{t("Attribue une date à chaque journée. Les journées de départ et d’arrivée peuvent se chevaucher entre deux villes : les dates ne sont donc pas calculées automatiquement depuis le départ. Seules les journées datées sont exportées, en événements sur la journée entière.")}</p>
    {state.cities.map(city => <section className="overview-city" key={city.id} aria-labelledby={`overview-city-${city.id}`}>
      <h2 id={`overview-city-${city.id}`}>{city.name} <small>{city.chineseName}</small></h2>
      {city.days.length ? city.days.map(day => {
        const done = day.steps.filter(step => state.done.includes(step.id)).length;
        return <article className="overview-day" key={day.id}>
          <div><button type="button" className="overview-day-link" onClick={() => onNavigate(city.id, day.id)} aria-label={t("Ouvrir {day} à {city}", { day: day.title, city: city.name })}>{day.title}</button><p>{day.steps.length ? t("{done} / {total} activités faites", { done, total: day.steps.length }) : t("Journée à compléter")}{day.steps.some(step => step.booking && !state.bookings.includes(step.id)) ? t(" · Réservations à prévoir") : ''}</p></div>
          <label className="overview-date">{t("Date de {day}", { day: day.title })}<input type="date" min="0001-01-01" max="9999-12-30" value={day.date || ''} onChange={event => {
            const date = event.target.value;
            if (date && (!validCalendarDate(date) || date > '9999-12-30')) { notify(t("Choisis une date valide.")); return; }
            onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: date || undefined } : row) } : item) }));
          }} /></label>
          {day.date && <button className="overview-clear" type="button" aria-label={t("Effacer la date de {day} à {city}", { day: day.title, city: city.name })} onClick={() => onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: undefined } : row) } : item) }))}>{t("Effacer")}</button>}
        </article>;
      }) : <p className="muted">{t("Ajoute une journée depuis le planning de cette ville.")}</p>}
    </section>)}
  </section>;
}
