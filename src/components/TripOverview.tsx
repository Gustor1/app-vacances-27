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
export function printWholeTrip(state: StoredState): void {
  const frame = document.createElement('iframe');
  frame.title = 'Version imprimable du voyage';
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0';
  document.body.append(frame);
  const doc = frame.contentDocument;
  const target = frame.contentWindow;
  if (!doc || !target) { frame.remove(); throw new Error('Impression indisponible dans ce navigateur.'); }
  doc.title = 'À l’Est — voyage complet';
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
  add(doc.body, 'h1', 'À l’Est — mon voyage complet');
  add(doc.body, 'p', `${state.cities.length} villes · ${state.cities.reduce((sum, city) => sum + city.days.length, 0)} journées${state.departureDate ? ` · Départ : ${state.departureDate}` : ''}`);
  if (state.notes.general) { add(doc.body, 'h2', 'Mes notes personnelles'); add(doc.body, 'p', state.notes.general); }
  for (const city of state.cities) {
    const section = add(doc.body, 'section', '', 'city');
    add(section, 'h2', `${city.name} · ${city.chineseName}`);
    add(section, 'p', city.subtitle);
    for (const note of city.notes) add(section, 'p', note);
    if (state.notes[city.id]) add(section, 'p', `Mes notes : ${state.notes[city.id]}`);
    const stay = state.stays?.find(item => item.cityId === city.id);
    if (stay) add(section, 'p', `Hébergement : ${stay.name} ${stay.chineseName}\n${stay.address}\nArrivée : ${stay.checkIn || 'à renseigner'} · Départ : ${stay.checkOut || 'à renseigner'}\n${stay.notes}`);
    for (const day of city.days) {
      const article = add(section, 'article', '');
      add(article, 'h3', `${day.title} · ${day.date && validCalendarDate(day.date) ? day.date : 'Date à renseigner'}`);
      if (state.notes[day.id]) add(article, 'p', `Mes notes : ${state.notes[day.id]}`);
      for (const step of day.steps) {
        const block = add(article, 'div', '', 'step');
        add(block, 'h4', `${state.done.includes(step.id) ? '✓ ' : ''}${step.period ? step.period + ' · ' : ''}${step.title}${step.chineseName ? ' · ' + step.chineseName : ''}`);
        add(block, 'p', [step.description,step.address].filter(Boolean).join('\n'));
        if (state.favorites.includes(step.id)) add(block, 'p', 'Favori');
        if (step.booking || state.bookings.includes(step.id)) add(block, 'p', state.bookings.includes(step.id) ? 'Réservation confirmée' : 'Réservation à prévoir');
        if (state.notes[step.id]) add(block, 'p', `Mes notes : ${state.notes[step.id]}`);
        link(block, 'Amap', amapLink(city, step));
      }
    }
    const favoriteBonus = [...bonusItems, ...(state.customBonus || [])].filter(item => item.cityId === city.id && (state.favorites.includes(item.id) || state.bookings.includes(item.id) || Boolean(state.notes[item.id])));
    if (favoriteBonus.length) {
      add(section, 'h3', 'Mes bonus — favoris, réservations et notes');
      for (const bonus of favoriteBonus) {
        const block = add(section, 'div', '', 'step');
        add(block, 'h4', `${bonus.title}${bonus.chineseName ? ' · ' + bonus.chineseName : ''}`);
        if (state.favorites.includes(bonus.id)) add(block, 'p', 'Favori');
        add(block, 'p', [bonus.description, bonus.address, bonus.budget, bonus.tip, state.notes[bonus.id]].filter(Boolean).join('\n'));
        if (state.bookings.includes(bonus.id)) add(block, 'p', 'Réservation confirmée');
        link(block, 'Amap', amapLink(city, bonus));
        add(block, 'br', '');
        link(block, 'Source', bonus.sourceUrl);
      }
    }
  }
  if (state.transfers?.length) {
    add(doc.body, 'h2', 'Mes trajets');
    for (const transfer of state.transfers) {
      const name = (id: string) => state.cities.find(city => city.id === id)?.name || id;
      add(doc.body, 'p', `${name(transfer.fromCityId)} → ${name(transfer.toCityId)} · ${transfer.label}\n${transfer.departure} ${transfer.fromStation} → ${transfer.arrival} ${transfer.toStation}\n${transfer.booked ? 'Réservé' : 'À réserver'}${transfer.reference ? ' · ' + transfer.reference : ''}\n${transfer.notes}`);
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
    notify(`${dated} journée${dated > 1 ? 's' : ''} exportée${dated > 1 ? 's' : ''} vers ton calendrier.`);
  };
  return <section className="trip-overview" aria-labelledby="overview-title">
    <header className="section-header">
      <div><p className="eyebrow">Tout le voyage en un regard</p><h2 id="overview-title">Vue d’ensemble</h2><p className="muted">Retrouve chaque journée, sa date et ton avancement.</p></div>
      <div className="overview-actions"><button type="button" disabled={!dated} onClick={exportCalendar}><Download size={18} aria-hidden="true" /> Exporter le calendrier ({dated})</button><button type="button" onClick={() => { try { printWholeTrip(state); } catch (error) { notify(error instanceof Error ? error.message : 'Impression indisponible.'); } }}><Printer size={18} aria-hidden="true" /> Imprimer tout le voyage</button></div>
    </header>
    <div className="overview-summary"><span><MapPin size={18} aria-hidden="true" /> {state.cities.length} villes</span><span><CalendarDays size={18} aria-hidden="true" /> {days.length} journées · {dated} datées</span><span>{completed} / {steps.length} activités faites</span><progress max={steps.length || 1} value={completed} aria-label="Avancement des activités du voyage" /></div>
    <p className="overview-date-hint">Attribue une date à chaque journée. Les journées de départ et d’arrivée peuvent se chevaucher entre deux villes : les dates ne sont donc pas calculées automatiquement depuis le départ. Seules les journées datées sont exportées, en événements sur la journée entière.</p>
    {state.cities.map(city => <section className="overview-city" key={city.id} aria-labelledby={`overview-city-${city.id}`}>
      <h2 id={`overview-city-${city.id}`}>{city.name} <small>{city.chineseName}</small></h2>
      {city.days.length ? city.days.map(day => {
        const done = day.steps.filter(step => state.done.includes(step.id)).length;
        return <article className="overview-day" key={day.id}>
          <div><button type="button" className="overview-day-link" onClick={() => onNavigate(city.id, day.id)} aria-label={`Ouvrir ${day.title} à ${city.name}`}>{day.title}</button><p>{day.steps.length ? `${done} / ${day.steps.length} activités faites` : 'Journée à compléter'}{day.steps.some(step => step.booking && !state.bookings.includes(step.id)) ? ' · Réservations à prévoir' : ''}</p></div>
          <label className="overview-date">Date de {day.title}<input type="date" min="0001-01-01" max="9999-12-30" value={day.date || ''} onChange={event => {
            const date = event.target.value;
            if (date && (!validCalendarDate(date) || date > '9999-12-30')) { notify('Choisis une date valide.'); return; }
            onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: date || undefined } : row) } : item) }));
          }} /></label>
          {day.date && <button className="overview-clear" type="button" aria-label={`Effacer la date de ${day.title} à ${city.name}`} onClick={() => onChange(prev => ({ ...prev, cities: prev.cities.map(item => item.id === city.id ? { ...item, days: item.days.map(row => row.id === day.id ? { ...row, date: undefined } : row) } : item) }))}>Effacer</button>}
        </article>;
      }) : <p className="muted">Ajoute une journée depuis le planning de cette ville.</p>}
    </section>)}
  </section>;
}
