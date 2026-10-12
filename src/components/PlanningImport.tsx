import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Download, Plus, Sparkles, Square, Trash2 } from 'lucide-react';
import { Modal } from '../App';
import { useLocale } from '../i18n';
import { categoryLabels, downloadText } from '../lib';
import type { TripStorage } from '../cloud/storage';
import type { StoredState } from '../types';
import { applyDepartureDate, correctField, draftSummary, unstructuredNotes, validateDraft } from '../planning-import/draft';
import { clearSession, commitImport, createSession, DRAFT_KEY, loadSession, saveSession } from '../planning-import/persistence';
import { extractPlanning, getExtractionAvailability } from '../planning-import/extraction';
import { SYNTHETIC_EXAMPLES } from '../planning-import/fixtures';
import { MAX_SOURCE_LENGTH, type DraftDay, type DraftItem, type ImportSession, type PlanningDraft, type Provenance } from '../planning-import/types';
import './PlanningImport.css';

const userEvidence = (): Provenance => ({ title: { origin: 'user', quote: '' } });
const emptyDay = (): DraftDay => ({ title: '', date: '', items: [], evidence: userEvidence() });
const emptyItem = (): DraftItem => ({ title: '', category: 'visit', description: '', address: '', period: '', time: '', optional: false, booked: false, kind: 'activity', coordinates: null, checkIn: '', checkOut: '', departure: '', arrival: '', toCity: '', mode: 'other', reference: '', excluded: false, evidence: userEvidence() });
const evidenceLabels: Record<string, string> = { title: 'Titre', name: 'Ville, région ou lieu de séjour', date: 'Date (facultative)', category: 'Catégorie', description: 'Détails et informations', address: 'Adresse précise', period: 'Période', time: 'Heure explicite (facultative)', optional: 'Facultatif', booked: 'Réservation confirmée', kind: 'Type', coordinates: 'Coordonnées', checkIn: 'Arrivée à l’hébergement', checkOut: 'Départ de l’hébergement', departure: 'Départ du transport', arrival: 'Arrivée du transport', toCity: 'Ville d’arrivée', mode: 'Mode de transport', reference: 'Référence de réservation', excluded: 'Exclure', source: 'Extrait source', missing: 'Information absente', conflict: 'Conflit', suggestion: 'Suggestion', user: 'Correction personnelle' };
const extractionErrors: Record<string, string> = { unavailable: 'Analyse IA indisponible : service non activé ou compte non connecté. La saisie manuelle reste disponible.', authentication: 'Connecte-toi pour analyser ce programme.', input: 'Le texte dépasse 50 000 caractères. Réduis-le avant analyse ; rien n’a été tronqué.', quota: 'Limite d’analyse atteinte. Réessaie plus tard ; ton texte est conservé.', timeout: 'L’analyse a dépassé le délai. Ton texte est conservé.', cancelled: 'Analyse annulée. Ton texte est conservé.', provider: 'Analyse impossible. Le texte est conservé.', invalid: 'Réponse IA invalide. Le texte est conservé.' };

export default function PlanningImport({ storage, scope, token, onCreated, onClose }: { storage: TripStorage; scope: string; token?: string; onCreated: (state: StoredState) => void; onClose: () => void }) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [initial] = useState(() => {
    try { return { session: loadSession(storage, scope) || createSession(scope), failed: false }; }
    catch { return { session: createSession(scope), failed: true }; }
  });
  const [session, setSession] = useState(initial.session);
  const [blocked, setBlocked] = useState(initial.failed);
  const current = useRef(session);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const request = useRef<{ controller: AbortController; sequence: number } | null>(null);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; request.current?.controller.abort(); }, []);
  const available = getExtractionAvailability() && !!token;
  function update(next: ImportSession) {
    current.current = next; setSession(next);
    try { saveSession(storage, next); setError(''); }
    catch { setError(t('Sauvegarde du brouillon impossible. Télécharge le texte avant de fermer.')); }
  }
  function changeDraft(change: (draft: PlanningDraft) => PlanningDraft) {
    if (current.current.draft) update({ ...current.current, draft: change(structuredClone(current.current.draft)) });
  }
  function stop() { sequence.current++; request.current?.controller.abort(); request.current = null; setBusy(false); }
  async function analyze() {
    if (!available || current.current.draft || !current.current.source.trim() || current.current.source.length > MAX_SOURCE_LENGTH || blocked) return;
    stop(); const controller = new AbortController(); const id = ++sequence.current;
    request.current = { controller, sequence: id }; const source = current.current.source;
    setBusy(true); setError('');
    try {
      const result = await extractPlanning(source, { signal: controller.signal, token });
      if (sequence.current === id && current.current.source === source) update({ ...current.current, draft: validateDraft(result, source) });
    } catch (failure) {
      if (sequence.current === id) setError(t(extractionErrors[(failure as { code?: string })?.code || ''] || 'Analyse impossible. Le texte est conservé.'));
    } finally { if (sequence.current === id) { request.current = null; setBusy(false); } }
  }
  function manual() {
    stop(); update({ ...current.current, draft: { version: 1, title: '', cities: [{ name: '', days: [emptyDay()], evidence: { name: { origin: 'user', quote: '' } } }], notes: current.current.source ? [current.current.source] : [], evidence: userEvidence() } });
  }
  function reset() {
    stop(); try { clearSession(storage, scope); update(createSession(scope)); setResetRequested(false); setBlocked(false); }
    catch { setError(t('Effacement impossible. Le brouillon est conservé.')); }
  }
  function move(ci: number, di: number, ii: number, target: string) {
    const [toCity, toDay] = target.split(':').map(Number);
    changeDraft(draft => { const item = draft.cities[ci].days[di].items.splice(ii, 1)[0]; draft.cities[toCity].days[toDay].items.push(item); return draft; });
  }
  function reorder(ci: number, di: number, ii: number, direction: number) {
    changeDraft(draft => { const items = draft.cities[ci].days[di].items; const next = ii + direction; [items[ii], items[next]] = [items[next], items[ii]]; return draft; });
  }
  function editItem<K extends keyof DraftItem>(ci: number, di: number, ii: number, key: K, value: DraftItem[K]) {
    changeDraft(draft => {
      let item = correctField(draft.cities[ci].days[di].items[ii], key, value);
      if ((key === 'title' || key === 'address') && item.coordinates) item = correctField(item, 'coordinates', null);
      draft.cities[ci].days[di].items[ii] = item; return draft;
    });
  }
  function provenance(evidence: Provenance) {
    return <details><summary>{t('Provenance et points à vérifier')}</summary><dl className="planning-evidence">{Object.entries(evidence).map(([field, entry]) => <div key={field}><dt>{t(evidenceLabels[field] || 'Information')} · {t(evidenceLabels[entry.origin])}</dt><dd>{entry.quote || t('Aucun extrait source')}</dd></div>)}</dl></details>;
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return; setSaving(true); setError('');
    try { const state = await commitImport(storage, current.current); onCreated(state); }
    catch (failure) {
      try { const saved = loadSession(storage, scope); if (saved?.id === current.current.id && saved.preparedTrip) { current.current = saved; setSession(saved); } } catch { /* Keep the current text available for download. */ }
      setError(t(failure instanceof Error ? failure.message : 'Création impossible. Le brouillon et le texte sont conservés.'));
    }
    finally { setSaving(false); }
  }
  const draft = session.draft;
  const summary = draft ? draftSummary(draft, session.source) : null;
  const preservedNotes = draft ? unstructuredNotes(draft, session.source) : [];
  return <Modal title={t('Créer depuis un planning')} wide onClose={() => { stop(); onClose(); }}><div className="planning-import">
    {blocked && <div role="alert" className="notice warning-notice"><p>{t('Brouillon illisible. Sa source est conservée ; efface-le explicitement pour recommencer.')}</p><button type="button" className="text-btn" onClick={() => { try { downloadText(storage.getItem(DRAFT_KEY) || '', 'detours-brouillon-a-recuperer.json'); } catch { setError(t('Sauvegarde du brouillon impossible. Télécharge le texte avant de fermer.')); } }}><Download size={16}/>{t('Télécharger le brouillon brut')}</button></div>}
    {error && <p role="alert" className="notice warning-notice">{error}</p>}
    {!draft ? <>
      <label className="field">{t('Ton programme')}<textarea rows={10} autoFocus value={session.source} disabled={blocked} onChange={event => { stop(); update({ ...current.current, source: event.target.value }); }} aria-describedby="planning-source-limit"/></label>
      <p id="planning-source-limit" className="muted small">{session.source.length.toLocaleString()} / {MAX_SOURCE_LENGTH.toLocaleString()} {t('caractères')}</p>
      {session.source.length > MAX_SOURCE_LENGTH && <p role="alert">{t('Le texte dépasse 50 000 caractères. Réduis-le avant analyse ; rien n’a été tronqué.')}</p>}
      <p className="muted small">{t(available ? 'En lançant l’analyse, tu envoies ce texte au fournisseur OpenAI. Aucun envoi pendant la saisie.' : 'Analyse IA indisponible : service non activé ou compte non connecté. La saisie manuelle reste disponible.')}</p>
      <div className="planning-actions">
        <button className="btn btn-primary" disabled={!available || busy || blocked || !session.source.trim() || session.source.length > MAX_SOURCE_LENGTH} onClick={() => void analyze()}><Sparkles size={16}/>{t('Analyser mon programme')}</button>
        {busy && <button className="btn btn-secondary" onClick={stop}><Square size={16}/>{t('Annuler l’analyse')}</button>}
        <button className="btn btn-secondary" disabled={busy || blocked || session.source.length > MAX_SOURCE_LENGTH} onClick={manual}><Plus size={16}/>{t('Saisir mon aperçu manuellement')}</button>
      </div>
      {busy && <p role="status">{t('Analyse en cours… Ton texte reste disponible sur cet appareil.')}</p>}
      <div className="planning-examples"><span className="muted small">{t('Exemples fictifs de démonstration, sans analyse IA')}</span>{SYNTHETIC_EXAMPLES.map((example, index) => <button className="text-btn" key={index} disabled={busy || blocked} onClick={() => update({ ...current.current, source: example.source, draft: structuredClone(example.draft) })}>{t('Charger l’exemple {count}', { count: index + 1 })}</button>)}</div>
    </> : <form onSubmit={event => void create(event)}>
      {session.preparedTrip && <p className="notice">{t('Création préparée. Réessayer termine le même carnet sauvegardé ; les corrections sont verrouillées.')}</p>}
      <fieldset className="planning-review-fields" disabled={!!session.preparedTrip}>
      <label className="field">{t('Titre du voyage')}<input required maxLength={140} value={draft.title} onChange={e => changeDraft(d => correctField(d, 'title', e.target.value))}/></label>
      {provenance(draft.evidence)}
      <div className="form-row"><label className="field">{t('Devise de référence')}<input required maxLength={3} placeholder="EUR" value={session.currency} onChange={e => update({ ...current.current, currency: e.target.value.toUpperCase() })}/></label><label className="field">{t('Fuseau du voyage')}<input required placeholder="Europe/Paris" value={session.timezone} onChange={e => update({ ...current.current, timezone: e.target.value })}/></label></div>
      <div className="planning-actions"><label className="field">{t('Date de départ (facultative)')}<input type="date" value={session.departureDate} onChange={e => update({ ...current.current, departureDate: e.target.value })}/></label><button type="button" className="btn btn-secondary" disabled={!session.departureDate} onClick={() => { try { changeDraft(d => applyDepartureDate(d, session.departureDate)); } catch { setError(t('Date de départ invalide.')); } }}>{t('Dater les journées sans date')}</button></div>
      {draft.cities.map((city, ci) => <section className="planning-city" key={ci}>
        <label className="field">{t('Ville, région ou lieu de séjour')}<input required maxLength={100} value={city.name} onChange={e => changeDraft(d => { d.cities[ci] = correctField(d.cities[ci], 'name', e.target.value); return d; })}/></label>
        {provenance(city.evidence)}
        {city.days.map((day, di) => <section className="planning-day" key={di}>
          <div className="form-row"><label className="field">{t('Titre de la journée')}<input required maxLength={180} value={day.title} onChange={e => changeDraft(d => { d.cities[ci].days[di] = correctField(d.cities[ci].days[di], 'title', e.target.value); return d; })}/></label><label className="field">{t('Date (facultative)')}<input type="date" value={day.date} onChange={e => changeDraft(d => { d.cities[ci].days[di] = correctField(d.cities[ci].days[di], 'date', e.target.value); return d; })}/></label></div>
          {provenance(day.evidence)}
          {day.items.map((item, ii) => <article className={`planning-item${item.excluded ? ' planning-excluded' : ''}`} key={ii}>
            <div className="planning-item-toolbar"><strong>{t(item.kind === 'stay' ? 'Hébergement' : item.kind === 'transfer' ? 'Transport' : item.kind === 'suggestion' ? 'Suggestion' : item.kind === 'alternative' ? 'Alternative' : 'Activité')}</strong><button title={t('Monter')} aria-label={t('Monter')} type="button" className="icon-btn" disabled={ii === 0} onClick={() => reorder(ci, di, ii, -1)}><ArrowUp size={16}/></button><button title={t('Descendre')} aria-label={t('Descendre')} type="button" className="icon-btn" disabled={ii === day.items.length - 1} onClick={() => reorder(ci, di, ii, 1)}><ArrowDown size={16}/></button><label className="checkbox-label"><input type="checkbox" checked={item.excluded} onChange={e => editItem(ci, di, ii, 'excluded', e.target.checked)}/>{t('Exclure')}</label></div>
            <fieldset disabled={item.excluded}>
              <label className="field">{t('Lieu ou activité')}<input required={!item.excluded} maxLength={180} value={item.title} onChange={e => editItem(ci, di, ii, 'title', e.target.value)}/></label>
              <div className="form-row"><label className="field">{t('Type')}<select value={item.kind} onChange={e => editItem(ci, di, ii, 'kind', e.target.value as DraftItem['kind'])}>{(['activity', 'stay', 'transfer', 'suggestion', 'alternative'] as const).map((kind, index) => <option key={kind} value={kind}>{t(['Activité', 'Hébergement', 'Transport', 'Suggestion', 'Alternative'][index])}</option>)}</select></label><label className="field">{t('Catégorie')}<select value={item.category} onChange={e => editItem(ci, di, ii, 'category', e.target.value as DraftItem['category'])}>{Object.entries(categoryLabels).filter(([key]) => key !== 'photo').map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label></div>
              <label className="field">{t('Adresse précise')}<input value={item.address} onChange={e => editItem(ci, di, ii, 'address', e.target.value)}/></label>
              {!item.address && !item.coordinates && <p className="muted small">{t('Lieu à préciser : aucun repère géographique ajouté.')}</p>}
              <div className="form-row"><label className="field">{t('Période')}<input value={item.period} onChange={e => editItem(ci, di, ii, 'period', e.target.value)}/></label><label className="field">{t('Heure explicite (facultative)')}<input type="time" value={item.time} onChange={e => editItem(ci, di, ii, 'time', e.target.value)}/></label></div>
              {item.kind === 'stay' && <div className="form-row">{(['checkIn', 'checkOut'] as const).map((key, index) => <label className="field" key={key}>{t(['Arrivée à l’hébergement', 'Départ de l’hébergement'][index])}<input type="date" value={item[key]} onChange={e => editItem(ci, di, ii, key, e.target.value)}/></label>)}</div>}
              {item.kind === 'transfer' && <><div className="form-row">{(['departure', 'arrival'] as const).map((key, index) => <label className="field" key={key}>{t(['Départ du transport', 'Arrivée du transport'][index])}<input type="datetime-local" value={item[key]} onChange={e => editItem(ci, di, ii, key, e.target.value)}/></label>)}</div><div className="form-row"><label className="field">{t('Ville d’arrivée')}<input value={item.toCity} onChange={e => editItem(ci, di, ii, 'toCity', e.target.value)}/></label><label className="field">{t('Mode de transport')}<select value={item.mode} onChange={e => editItem(ci, di, ii, 'mode', e.target.value as DraftItem['mode'])}>{(['train', 'plane', 'bus', 'car', 'other'] as const).map((mode, index) => <option key={mode} value={mode}>{t(['Train', 'Avion', 'Bus', 'Voiture', 'Autre'][index])}</option>)}</select></label></div></>}
              <label className="field">{t('Détails et informations')}<textarea rows={2} value={item.description} onChange={e => editItem(ci, di, ii, 'description', e.target.value)}/></label>
              <label className="field">{t('Référence de réservation')}<input value={item.reference} onChange={e => editItem(ci, di, ii, 'reference', e.target.value)}/></label>
              <div className="planning-actions"><label className="checkbox-label"><input type="checkbox" checked={item.optional} onChange={e => editItem(ci, di, ii, 'optional', e.target.checked)}/>{t('Facultatif')}</label><label className="checkbox-label"><input type="checkbox" checked={item.booked} onChange={e => editItem(ci, di, ii, 'booked', e.target.checked)}/>{t('Réservation confirmée')}</label></div>
              <label className="field">{t('Affectation ville / journée')}<select value={`${ci}:${di}`} onChange={e => move(ci, di, ii, e.target.value)}>{draft.cities.flatMap((c, cIndex) => c.days.map((d, dIndex) => <option key={`${cIndex}:${dIndex}`} value={`${cIndex}:${dIndex}`}>{c.name} · {d.title || t('Jour {count}', { count: dIndex + 1 })}</option>))}</select></label>
            </fieldset>
            {provenance(item.evidence)}
          </article>)}
          <button type="button" className="text-btn" onClick={() => changeDraft(d => { d.cities[ci].days[di].items.push(emptyItem()); return d; })}><Plus size={16}/>{t('Ajouter une activité')}</button>
        </section>)}
        <button type="button" className="text-btn" onClick={() => changeDraft(d => { d.cities[ci].days.push(emptyDay()); return d; })}><Plus size={16}/>{t('Ajouter une journée')}</button>
      </section>)}
      <button type="button" className="text-btn" onClick={() => changeDraft(d => { d.cities.push({ name: '', days: [emptyDay()], evidence: { name: { origin: 'user', quote: '' } } }); return d; })}><Plus size={16}/>{t('Ajouter une ville')}</button>
      <label className="field">{t('Notes non structurées')}<textarea rows={4} value={draft.notes.join('\n')} onChange={e => changeDraft(d => ({ ...d, notes: e.target.value.split('\n').filter(Boolean) }))}/></label>
      <details><summary>{t('Texte source')}</summary><pre className="planning-source">{session.source}</pre></details>
      {preservedNotes.length > 0 && <details><summary>{t('Extraits conservés en notes')}</summary><pre className="planning-source">{preservedNotes.join('\n\n')}</pre></details>}
      <div className="planning-summary" role="status">{summary && t('{days} journées · {activities} activités · {suggestions} suggestions · {unstructured} notes · {missing} absences · {conflicts} conflits · {unknownPlaces} lieux à préciser', summary)}</div>
      <label className="checkbox-label"><input type="checkbox" checked={session.keepSource} onChange={e => update({ ...current.current, keepSource: e.target.checked })}/>{t('Conserver le texte original dans le carnet après création')}</label>
      </fieldset>
      <div className="planning-actions"><button className="btn btn-primary" disabled={saving || busy || blocked}><Check size={16}/>{t(session.committedId ? 'Ouvrir le carnet créé' : 'Créer et ouvrir le carnet')}</button><button type="button" className="btn btn-secondary" onClick={() => setResetRequested(true)}><Trash2 size={16}/>{t('Effacer et recommencer')}</button></div>
    </form>}
    <div className="planning-actions"><button type="button" className="text-btn" onClick={() => downloadText(session.source, 'detours-programme.txt')}><Download size={16}/>{t('Télécharger le texte source')}</button>{!draft && <button type="button" className="text-btn" onClick={() => setResetRequested(true)}><Trash2 size={16}/>{t('Effacer le brouillon')}</button>}</div>
    <p className="muted small">{t('Le texte reste dans le brouillon récupérable sur cet appareil jusqu’à son effacement explicite.')}</p>
    {resetRequested && <div className="notice warning-notice"><p>{t('Effacer le texte et les corrections ? Cette action permet de lancer un nouvel import.')}</p><div className="planning-actions"><button className="btn btn-secondary" onClick={() => setResetRequested(false)}>{t('Annuler')}</button><button className="btn btn-primary" onClick={reset}>{t('Effacer le brouillon')}</button></div></div>}
  </div></Modal>;
}
