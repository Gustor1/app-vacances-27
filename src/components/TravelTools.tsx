import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, CalendarDays, CheckCheck, ExternalLink, Info, MapPin, Plane, Route, TrainFront } from 'lucide-react';
import { amapSearch, toggleValue, uid } from '../lib';
import type { StoredState, Transfer } from '../types';
import './TravelTools.css';

const sourceTransfers = [
  { cityIds: ['shenzhen', 'guangzhou'], from: 'Shenzhen', to: 'Guangzhou', mode: 'Train', detail: 'Départ de Shenzhen North. Gare d’arrivée, horaire et billet à renseigner.', stations: [{ name: 'Shenzhen North · 深圳北站', keyword: '深圳北站', city: '深圳' }], flight: false },
  { cityIds: ['guangzhou', 'yangshuo'], from: 'Guangzhou', to: 'Yangshuo', mode: 'À confirmer', detail: 'Transfert prévu dans le planning. Moyen de transport et gares à confirmer avant de réserver.', stations: [], flight: false },
  { cityIds: ['yangshuo', 'chongqing'], from: 'Yangshuo', to: 'Chongqing', mode: 'Train', detail: 'Départ idéalement dans l’après-midi. Gares, horaire et billet à renseigner.', stations: [], flight: false },
  { cityIds: ['chongqing'], from: 'Chongqing Est', to: 'Wulong Sud', mode: 'Train · aller-retour', detail: 'Excursion à Wulong. Prévoir le retour et vérifier la liaison entre la gare et les sites visités.', stations: [{ name: 'Chongqing Est · 重庆东站', keyword: '重庆东站', city: '重庆' }, { name: 'Wulong Sud · 武隆南站', keyword: '武隆南站', city: '重庆 武隆' }], flight: false },
  { cityIds: ['chongqing', 'chengdu'], from: 'Chongqing', to: 'Chengdu', mode: 'À organiser', detail: 'Étape suivante du voyage. Moyen de transport, points de départ et d’arrivée à choisir.', stations: [], flight: false },
  { cityIds: ['chengdu', 'shanghai'], from: 'Chengdu', to: 'Shanghai', mode: 'Avion', detail: 'Vol prévu dans le planning. Aéroports, horaire et réservation à renseigner.', stations: [], flight: true },
  { cityIds: ['shanghai', 'suzhou'], from: 'Shanghai', to: 'Suzhou', mode: 'Excursion · aller-retour', detail: 'Trajet à confirmer. Prévoir les deux sens et les déplacements sur place.', stations: [], flight: false },
];

const modeLabels: Record<Transfer['mode'], string> = { train: 'Train', plane: 'Avion', bus: 'Bus', car: 'Voiture / taxi', other: 'Autre' };

// Validate the wall-clock time without converting it to the browser's timezone.
function validChinaTime(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 16) === value;
}
function displayChinaTime(value: string) {
  if (!value || !validChinaTime(value)) return 'À préciser';
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year} à ${time}`;
}

type TransportProps = { state: StoredState; onChange: (updater: (previous: StoredState) => StoredState) => void; notify: (message: string) => void };

export function TransportView({ state, onChange, notify }: TransportProps) {
  const cities = state.cities;
  const [draft, setDraft] = useState<Transfer | null>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const transfers = state.transfers || [];
  const plannedTransport = cities.flatMap(city => city.days.flatMap(day => day.steps.filter(step => step.category === 'transport').map(step => ({ city, day, step }))));
  const sources = sourceTransfers.filter(transfer => transfer.cityIds.every(id => cities.some(city => city.id === id)));
  const changeDraft = <K extends keyof Transfer,>(key: K, value: Transfer[K]) => {
    setDraft(previous => previous ? { ...previous, [key]: value } : previous);
    setError('');
  };
  function editTransfer(transfer?: Transfer) {
    setError('');
    setDraft(transfer ? { ...transfer } : { id: uid('transfer'), fromCityId: cities[0]?.id || '', toCityId: cities[1]?.id || cities[0]?.id || '', label: '', mode: 'train', departure: '', arrival: '', fromStation: '', toStation: '', reference: '', notes: '', booked: false });
    requestAnimationFrame(() => formHeading.current?.focus());
  }
  function saveTransfer(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (!cities.some(city => city.id === draft.fromCityId) || !cities.some(city => city.id === draft.toCityId)) { setError('Choisis les villes de départ et d’arrivée présentes dans ton carnet.'); return; }
    if (!validChinaTime(draft.departure) || !validChinaTime(draft.arrival)) { setError('Saisis des dates et heures valides.'); return; }
    if (draft.departure && draft.arrival && draft.arrival < draft.departure) { setError('L’arrivée doit avoir lieu après le départ, ou à la même heure.'); return; }
    const cleaned = { ...draft, label: draft.label.trim() || `${cities.find(c=>c.id===draft.fromCityId)?.name} → ${cities.find(c=>c.id===draft.toCityId)?.name}`, fromStation: draft.fromStation.trim(), toStation: draft.toStation.trim(), reference: draft.reference.trim(), notes: draft.notes.trim() };
    onChange(previous => ({ ...previous, transfers: (previous.transfers || []).some(item => item.id === cleaned.id) ? (previous.transfers || []).map(item => item.id === cleaned.id ? cleaned : item) : [...(previous.transfers || []), cleaned] }));
    setDraft(null);
    notify('Trajet enregistré dans ton carnet.');
  }
  return <section className="transport-view" aria-labelledby="transport-title">
    <header className="section-header">
      <div><p className="eyebrow">D’une escale à l’autre</p><h2 id="transport-title">Les trajets du voyage</h2><p className="muted">Garde les gares exactes, les horaires et les références de tes billets à portée de main.</p></div>
      <button className="btn btn-primary" type="button" disabled={cities.length === 0} onClick={() => editTransfer()}>Ajouter un trajet</button>
    </header>
    <div className="notice"><Info size={18} aria-hidden="true" /><p>Tous les horaires ci-dessous sont en heure chinoise, Asia/Shanghai (UTC+8). Vérifie la gare ou l’aéroport exact sur ton billet, ainsi que les conditions d’embarquement.</p></div>
    {draft && <section className="panel transfer-editor" aria-labelledby="transfer-editor-title">
      <h3 id="transfer-editor-title" tabIndex={-1} ref={formHeading}>{transfers.some(item => item.id === draft.id) ? 'Modifier le trajet' : 'Ajouter un trajet'}</h3>
      <form onSubmit={saveTransfer}>
        <label className="field"><span>Nom du trajet (facultatif)</span><input value={draft.label} maxLength={160} onChange={event => changeDraft('label', event.target.value)} placeholder="Excursion, train du matin…" /></label>
        <div className="transfer-form-grid">
          <label className="field"><span>Ville de départ</span><select required value={draft.fromCityId} onChange={event => changeDraft('fromCityId', event.target.value)}><option value="" disabled>Choisir une ville</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
          <label className="field"><span>Ville d’arrivée</span><select required value={draft.toCityId} onChange={event => changeDraft('toCityId', event.target.value)}><option value="" disabled>Choisir une ville</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
        </div>
        <p className="muted">Pour une excursion avec retour dans la même ville, choisis cette ville aux deux extrémités et précise la destination dans le nom ou l’adresse.</p>
        <label className="field"><span>Moyen de transport</span><select value={draft.mode} onChange={event => changeDraft('mode', event.target.value as Transfer['mode'])}>{Object.entries(modeLabels).map(([mode, label]) => <option value={mode} key={mode}>{label}</option>)}</select></label>
        <div className="transfer-form-grid">
          <label className="field"><span>Départ · heure chinoise (facultatif)</span><input type="datetime-local" value={draft.departure} onChange={event => changeDraft('departure', event.target.value)} /></label>
          <label className="field"><span>Arrivée · heure chinoise (facultatif)</span><input type="datetime-local" min={draft.departure || undefined} value={draft.arrival} onChange={event => changeDraft('arrival', event.target.value)} /></label>
          <label className="field"><span>Gare, aéroport ou adresse de départ exacte</span><input value={draft.fromStation} maxLength={500} onChange={event => changeDraft('fromStation', event.target.value)} placeholder="Nom chinois conseillé : 深圳北站" /></label>
          <label className="field"><span>Gare, aéroport ou adresse d’arrivée exacte</span><input value={draft.toStation} maxLength={500} onChange={event => changeDraft('toStation', event.target.value)} placeholder="Nom chinois conseillé" /></label>
        </div>
        <label className="field"><span>Référence du billet (facultative)</span><input value={draft.reference} maxLength={200} onChange={event => changeDraft('reference', event.target.value)} /></label>
        <label className="field"><span>Notes</span><textarea rows={3} value={draft.notes} maxLength={5000} onChange={event => changeDraft('notes', event.target.value)} placeholder="Numéro de train, voiture, places, temps avant l’embarquement…" /></label>
        <label className="transfer-booked"><input type="checkbox" checked={draft.booked} onChange={event => changeDraft('booked', event.target.checked)} />Billet réservé</label>
        {error && <p className="transfer-error" role="alert">{error}</p>}
        <div className="transfer-actions"><button className="btn btn-primary" type="submit">Enregistrer le trajet</button><button className="btn btn-secondary" type="button" onClick={() => { setDraft(null); setError(''); }}>Annuler</button></div>
      </form>
    </section>}
    <section aria-labelledby="my-transfers-title">
      <h3 id="my-transfers-title" className="transfer-section-title">Mes fiches trajets</h3>
      {transfers.length === 0 ? <p className="empty-state">Aucun trajet enregistré. Ajoute une fiche pour préparer ton prochain déplacement.</p> : <div className="tools-grid">{transfers.map(transfer => {
        const from = cities.find(city => city.id === transfer.fromCityId);
        const to = cities.find(city => city.id === transfer.toCityId);
        return <article className="panel transfer-card" key={transfer.id}>
          <div className="transfer-actions"><span className="tag">{modeLabels[transfer.mode]}</span><span className="tag">{transfer.booked ? 'Réservé' : 'À réserver'}</span></div>
          <h4>{transfer.label || `${from?.name || 'Ville retirée'} → ${to?.name || 'Ville retirée'}`}</h4>
          {transfer.label && <p>{from?.name || 'Ville retirée'} → {to?.name || 'Ville retirée'}</p>}
          <dl className="transfer-facts"><div><dt>Départ</dt><dd>{displayChinaTime(transfer.departure)}</dd></div><div><dt>Arrivée</dt><dd>{displayChinaTime(transfer.arrival)}</dd></div><div><dt>Gare / adresse de départ</dt><dd>{transfer.fromStation || 'À préciser'}</dd></div><div><dt>Gare / adresse d’arrivée</dt><dd>{transfer.toStation || 'À préciser'}</dd></div>{transfer.reference && <div><dt>Référence billet</dt><dd>{transfer.reference}</dd></div>}</dl>
          {transfer.notes && <p className="transfer-notes">{transfer.notes}</p>}
          <div className="transfer-actions">{from && transfer.fromStation && <a className="btn btn-secondary" href={amapSearch(from.chineseName || from.name, transfer.fromStation)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" />Départ sur Amap<span className="sr-only"> — nouvel onglet</span></a>}{to && transfer.toStation && <a className="btn btn-secondary" href={amapSearch(to.chineseName || to.name, transfer.toStation)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" />Arrivée sur Amap<span className="sr-only"> — nouvel onglet</span></a>}</div>
          <div className="transfer-actions"><button type="button" className="btn btn-secondary" onClick={() => editTransfer(transfer)}>Modifier<span className="sr-only"> {transfer.label || 'ce trajet'}</span></button><button type="button" className="btn btn-secondary" onClick={() => setDeletingId(transfer.id)}>Supprimer<span className="sr-only"> {transfer.label || 'ce trajet'}</span></button></div>
          {deletingId === transfer.id && <div className="transfer-confirm" role="group" aria-label="Confirmer la suppression du trajet"><p>Supprimer cette fiche trajet ?</p><div className="transfer-actions"><button className="btn btn-secondary" type="button" onClick={() => setDeletingId(null)}>Conserver</button><button className="btn btn-primary" type="button" onClick={() => { onChange(previous => ({ ...previous, transfers: (previous.transfers || []).filter(item => item.id !== transfer.id) })); setDeletingId(null); if (draft?.id === transfer.id) setDraft(null); notify('Trajet supprimé.'); }}>Confirmer la suppression</button></div></div>}
        </article>;
      })}</div>}
    </section>
    {sources.length > 0 && <section aria-labelledby="source-transfers-title">
      <h3 id="source-transfers-title" className="transfer-section-title">Liaisons des documents d’origine</h3>
      <p className="muted">Repères du planning initial. Ajoute une fiche trajet ci-dessus pour conserver tes horaires et tes billets.</p>
      <div className="tools-grid">{sources.map(transfer => <article className="panel transfer-card" key={`${transfer.from}-${transfer.to}`}>
        <div className="transfer-icon">{transfer.flight ? <Plane size={23} aria-hidden="true" /> : transfer.mode.startsWith('Train') ? <TrainFront size={23} aria-hidden="true" /> : <Route size={23} aria-hidden="true" />}</div>
        <span className="tag">Document d’origine · {transfer.mode}</span>
        <h4 className="transfer-stations"><span>{transfer.from}</span><ArrowRight size={19} aria-label="vers" /><span>{transfer.to}</span></h4>
        <p className="muted">{transfer.detail}</p>
        {transfer.stations.map(station => <a className="btn btn-secondary" key={station.keyword} href={amapSearch(station.city, station.keyword)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" />{station.name}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> — Amap, nouvel onglet</span></a>)}
      </article>)}</div>
    </section>}
    {plannedTransport.length > 0 && <section className="panel" aria-labelledby="transport-details-title">
      <div className="panel-heading"><Route size={20} aria-hidden="true" /><h3 id="transport-details-title">Les détails de ton planning</h3></div>
      <p className="muted">Ces indications suivent les modifications de tes journées.</p>
      {plannedTransport.map(({ city, day, step }) => <div className="checklist-row" key={`${city.id}-${day.id}-${step.id}`}><div><span className="eyebrow">{city.name} · {day.title}</span><h4>{step.title}</h4><p className="muted">{step.description}</p></div></div>)}
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
    <header className="section-header"><div><p className="eyebrow">L’esprit tranquille</p><h2 id="notebook-title">Le carnet de voyage</h2><p className="muted">Tes réservations, tes notes et les petits repères utiles, au même endroit.</p></div></header>
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
