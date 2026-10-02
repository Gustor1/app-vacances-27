import { useRef } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, CalendarDays, CheckCheck, ExternalLink, Info, MapPin, Plane, Route, TrainFront } from 'lucide-react';
import { amapSearch, toggleValue } from '../lib';
import type { City, StoredState } from '../types';

const transfers = [
  { from: 'Shenzhen', to: 'Guangzhou', mode: 'Train', detail: 'Départ de Shenzhen North. Gare d’arrivée, horaire et billet à renseigner.', stations: [{ name: 'Shenzhen North · 深圳北站', keyword: '深圳北站' }], flight: false },
  { from: 'Guangzhou', to: 'Yangshuo', mode: 'À confirmer', detail: 'Transfert prévu dans le planning. Moyen de transport et gares à confirmer avant de réserver.', stations: [], flight: false },
  { from: 'Yangshuo', to: 'Chongqing', mode: 'Train', detail: 'Départ idéalement dans l’après-midi. Gares, horaire et billet à renseigner.', stations: [], flight: false },
  { from: 'Chongqing Est', to: 'Wulong Sud', mode: 'Train · aller-retour', detail: 'Excursion à Wulong. Prévoir le retour et vérifier la liaison entre la gare et les sites visités.', stations: [{ name: 'Chongqing Est · 重庆东站', keyword: '重庆东站' }, { name: 'Wulong Sud · 武隆南站', keyword: '武隆南站' }], flight: false },
  { from: 'Chongqing', to: 'Chengdu', mode: 'À organiser', detail: 'Étape suivante du voyage. Moyen de transport, points de départ et d’arrivée à choisir.', stations: [], flight: false },
  { from: 'Chengdu', to: 'Shanghai', mode: 'Avion', detail: 'Vol prévu dans le planning. Aéroports, horaire et réservation à renseigner.', stations: [], flight: true },
  { from: 'Shanghai', to: 'Suzhou', mode: 'Excursion · aller-retour', detail: 'Trajet à confirmer. Prévoir les deux sens et les déplacements sur place.', stations: [], flight: false },
];

export function TransportView({ cities }: { cities: City[] }) {
  const plannedTransport = cities.flatMap(city => city.days.flatMap(day => day.steps.filter(step => step.category === 'transport').map(step => ({ city, day, step }))));
  return <section aria-labelledby="transport-title">
    <header className="section-header">
      <div><p className="eyebrow">D’une escale à l’autre</p><h1 id="transport-title">Les trajets du voyage</h1><p className="muted">Les liaisons repérées dans tes documents, avec les détails qu’il reste à organiser.</p></div>
    </header>
    <div className="notice"><Info size={18} aria-hidden="true" /><p>Les horaires, durées et tarifs restent à vérifier lors de la réservation. Les liens Amap ci-dessous recherchent les gares connues.</p></div>
    <div className="tools-grid">
      {transfers.map(transfer => <article className="panel transfer-card" key={`${transfer.from}-${transfer.to}`}>
        <div className="transfer-icon">{transfer.flight ? <Plane size={23} aria-hidden="true" /> : transfer.mode.startsWith('Train') ? <TrainFront size={23} aria-hidden="true" /> : <Route size={23} aria-hidden="true" />}</div>
        <span className="tag">{transfer.mode}</span>
        <h2 className="transfer-stations"><span>{transfer.from}</span><ArrowRight size={19} aria-label="vers" /><span>{transfer.to}</span></h2>
        <p className="muted">{transfer.detail}</p>
        {transfer.stations.map(station => <a className="btn btn-secondary" key={station.keyword} href={amapSearch('', station.keyword)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" />{station.name}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> — Amap, nouvel onglet</span></a>)}
      </article>)}
    </div>
    {plannedTransport.length > 0 && <section className="panel" aria-labelledby="transport-details-title">
      <div className="panel-heading"><Route size={20} aria-hidden="true" /><h2 id="transport-details-title">Les détails de ton planning</h2></div>
      <p className="muted">Ces indications suivent les modifications de tes journées.</p>
      {plannedTransport.map(({ city, day, step }) => <div className="checklist-row" key={step.id}><div><span className="eyebrow">{city.name} · {day.title}</span><h3>{step.title}</h3><p className="muted">{step.description}</p></div></div>)}
    </section>}
  </section>;
}

type NotebookProps = {
  state: StoredState;
  onChange: (updater: (previous: StoredState) => StoredState) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenSource: (kind: 'planning' | 'bonus') => void;
};

export function NotebookView({ state, onChange, onExport, onImport, onOpenSource }: NotebookProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const bookings = state.cities.flatMap(city => city.days.flatMap(day => day.steps.filter(step => step.booking).map(step => ({ city, day, step }))));
  const bookedCount = bookings.filter(({ step }) => state.bookings.includes(step.id)).length;
  return <section aria-labelledby="notebook-title">
    <header className="section-header"><div><p className="eyebrow">L’esprit tranquille</p><h1 id="notebook-title">Le carnet de voyage</h1><p className="muted">Tes réservations, tes notes et les petits repères utiles, au même endroit.</p></div></header>
    <div className="tools-grid">
      <section className="panel" aria-labelledby="bookings-title">
        <div className="panel-heading"><CheckCheck size={21} aria-hidden="true" /><h2 id="bookings-title">À réserver</h2><span className="tag">{bookedCount} / {bookings.length}</span></div>
        <p className="muted">Coche une activité quand tu as effectué sa réservation.</p>
        {bookings.length === 0 ? <p className="empty-state">Aucune réservation signalée. Tu peux en ajouter en modifiant une activité du planning.</p> : bookings.map(({ city, day, step }) => <label className="checklist-row" key={step.id}>
          <input type="checkbox" checked={state.bookings.includes(step.id)} onChange={() => onChange(previous => ({ ...previous, bookings: toggleValue(previous.bookings, step.id) }))} />
          <span><strong>{step.title}</strong><span className="muted" style={{ display: 'block' }}>{city.name} · {day.title}</span></span>
        </label>)}
      </section>
      <section className="panel" aria-labelledby="notes-title">
        <div className="panel-heading"><BookOpen size={21} aria-hidden="true" /><h2 id="notes-title">Mes repères</h2></div>
        <label className="field" htmlFor="departure-date"><span><CalendarDays size={16} aria-hidden="true" /> Date de départ <span className="muted">(facultative)</span></span><input id="departure-date" type="date" value={state.departureDate} onChange={event => { const departureDate = event.target.value; onChange(previous => ({ ...previous, departureDate })); }} /></label>
        <label className="field" htmlFor="general-notes"><span>Notes personnelles</span><textarea id="general-notes" rows={8} placeholder="Adresses à garder, choses à emporter, idées pour la suite…" value={state.notes.general || ''} onChange={event => { const value = event.target.value; onChange(previous => ({ ...previous, notes: { ...previous.notes, general: value } })); }} /></label>
      </section>
      <section className="panel" aria-labelledby="backup-title">
        <div className="panel-heading"><ArrowDownToLine size={21} aria-hidden="true" /><h2 id="backup-title">Garder une copie</h2></div>
        <p className="muted">Tes modifications sont enregistrées dans ce navigateur, sur cet appareil. Elles ne sont pas synchronisées. Exporte une sauvegarde pour les retrouver ailleurs ou avant d’effacer les données du navigateur.</p>
        <div className="panel-heading"><button className="btn btn-primary" type="button" onClick={onExport}><ArrowDownToLine size={16} aria-hidden="true" />Exporter ma sauvegarde</button><button className="btn btn-secondary" type="button" onClick={() => fileInput.current?.click()}><ArrowUpFromLine size={16} aria-hidden="true" />Importer un fichier</button></div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label="Choisir une sauvegarde JSON" onChange={event => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
        <p className="muted">Format JSON. L’import remplacera les données actuelles après confirmation.</p>
      </section>
      <section className="panel" aria-labelledby="practical-title">
        <div className="panel-heading"><MapPin size={21} aria-hidden="true" /><h2 id="practical-title">Sur place en Chine</h2></div>
        <p><strong>Retrouver une adresse.</strong> Utilise les boutons Amap des activités. Les noms chinois facilitent la recherche ; copie-les pour les montrer à un chauffeur ou les coller dans l’application.</p>
        <p><strong>Avant chaque trajet.</strong> Vérifie la gare ou l’aéroport exact, l’horaire et les conditions de ton billet. Les noms d’une même ville peuvent désigner plusieurs gares.</p>
        <p><strong>La carte en déplacement.</strong> Les fonds de carte nécessitent Internet. Prépare aussi tes lieux directement dans Amap, l’application que tu utiliseras sur place.</p>
      </section>
    </div>
    <details className="panel">
      <summary><strong>Les détails à anticiper</strong></summary>
      <p className="muted">Repères issus de ta liste bonus, à confirmer auprès des services concernés avant le voyage.</p>
      <ul>
        <li><strong>Trains sur 12306.</strong> Ouverture généralement à J−14 ; l’heure dépend de la gare et reste à revérifier avant le départ en 2027. Une demande auprès d’un intermédiaire ne signifie pas qu’un billet a été émis.</li>
        <li><strong>Radeau à Yangshuo.</strong> Confirme le parcours, le retour, les exigences de passeport et si le tarif est par place ou par radeau. En cas de pluie ou de crue, vérifie l’autorisation de départ auprès de l’opérateur.</li>
        <li><strong>Lever de soleil à Xianggong.</strong> Prévois le chauffeur aller-retour avant l’aube, son attente sur place et une solution de repli selon la météo.</li>
        <li><strong>Paiements.</strong> Prépare Alipay ou WeChat et garde de petites coupures à disposition.</li>
        <li><strong>À Chongqing.</strong> Réserve le billet 云中漫步 pour le Skywalk de Raffles et le spectacle 1949.</li>
      </ul>
    </details>
    <section className="panel" aria-labelledby="sources-title"><div className="panel-heading"><BookOpen size={21} aria-hidden="true" /><h2 id="sources-title">Tes documents d’origine</h2></div><p className="muted">Retrouve les informations de départ, y compris les détails qui restent à compléter.</p><div className="panel-heading"><button className="btn btn-secondary" type="button" onClick={() => onOpenSource('planning')}>Consulter le planning d’origine</button><button className="btn btn-secondary" type="button" onClick={() => onOpenSource('bonus')}>Consulter la liste bonus</button></div></section>
  </section>;
}
