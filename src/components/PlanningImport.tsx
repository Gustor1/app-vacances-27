import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Download, ListChecks, Plus, Sparkles, Square, Trash2 } from 'lucide-react';
import { Modal } from '../App';
import { useLocale } from '../i18n';
import { categoryLabels, downloadText } from '../lib';
import type { TripStorage } from '../cloud/storage';
import type { StoredState } from '../types';
import { applyDepartureDate, correctField, draftSummary, unstructuredNotes, validateDraft } from '../planning-import/draft';
import { clearSession, commitImport, createSession, DRAFT_KEY, loadSession, saveSession } from '../planning-import/persistence';
import { extractPlanning, getExtractionAvailability } from '../planning-import/extraction';
import { activityFromPassage, reviewPassages } from '../planning-import/review';
import { parsePlanning } from '../planning-import/parser';
import { PlanningFileError, PLANNING_FILE_ACCEPT, readPlanningSource } from '../planning-import/files';
import { DocumentError, type DocumentResult } from '../planning-import/document-contract';
import { externalPlanningPrompt } from '../planning-import/external-prompt';
import { kitPath } from '../planning-import/import-kit';
import { prepareStructured, type StructuredSource } from '../planning-import/structured';
import { readStructuredFile, StructuredPlanningError } from '../planning-import/public-contract';
import { SYNTHETIC_EXAMPLES } from '../planning-import/fixtures';
import { MAX_SOURCE_LENGTH, type DraftDay, type DraftItem, type ImportSession, type PlanningDraft, type Provenance } from '../planning-import/types';
import './PlanningImport.css';
import Mascot from './Mascot';

const userEvidence = (): Provenance => ({ title: { origin: 'user', quote: '' } });
const emptyDay = (): DraftDay => ({ title: '', date: '', items: [], evidence: userEvidence() });
const emptyItem = (): DraftItem => ({ title: '', category: 'visit', description: '', address: '', period: '', time: '', optional: false, booked: false, kind: 'activity', coordinates: null, checkIn: '', checkOut: '', departure: '', arrival: '', toCity: '', mode: 'other', reference: '', excluded: false, evidence: userEvidence() });
const evidenceLabels: Record<string, string> = { title: 'Titre', name: 'Ville, région ou lieu de séjour', date: 'Date (facultative)', category: 'Catégorie', description: 'Détails et informations', address: 'Adresse précise', period: 'Période', time: 'Heure explicite (facultative)', optional: 'Facultatif', booked: 'Réservation confirmée', kind: 'Type', coordinates: 'Coordonnées', checkIn: 'Arrivée à l’hébergement', checkOut: 'Départ de l’hébergement', departure: 'Départ du transport', arrival: 'Arrivée du transport', toCity: 'Ville d’arrivée', mode: 'Mode de transport', reference: 'Référence de réservation', excluded: 'Exclure', source: 'Extrait source', missing: 'Information absente', conflict: 'Conflit', suggestion: 'Suggestion', user: 'Correction personnelle', external: 'Fichier IA externe — original personnel non vérifié' };
const extractionErrors: Record<string, string> = { unavailable: 'Analyse IA indisponible : service non activé ou compte non connecté. La saisie manuelle reste disponible.', authentication: 'Connecte-toi pour analyser ce programme.', input: 'Le texte dépasse 50 000 caractères. Réduis-le avant analyse ; rien n’a été tronqué.', quota: 'Limite d’analyse atteinte. Réessaie plus tard ; ton texte est conservé.', timeout: 'L’analyse a dépassé le délai. Ton texte est conservé.', cancelled: 'Analyse annulée. Ton texte est conservé.', provider: 'Analyse impossible. Le texte est conservé.', invalid: 'Réponse IA invalide. Le texte est conservé.' };

export default function PlanningImport({ storage, scope, token, onCreated, onClose }: { storage: TripStorage; scope: string; token?: string; onCreated: (state: StoredState) => void; onClose: () => void }) {
  const { t, language } = useLocale();
  const [error, setError] = useState('');
  const [initial] = useState(() => {
    try { return { session: loadSession(storage, scope) || createSession(scope), failed: false }; }
    catch { return { session: createSession(scope), failed: true }; }
  });
  const [session, setSession] = useState(initial.session);
  const [blocked, setBlocked] = useState(initial.failed);
  const current = useRef(session);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [pendingSource, setPendingSource] = useState<{ source: string; draft: PlanningDraft | null; sourceOrigin?: ImportSession['sourceOrigin']; structuredSource?: StructuredSource; currency?: string; timezone?: string } | null>(null);
  const [structuredError, setStructuredError] = useState<StructuredPlanningError | null>(null);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [jsonPaste, setJsonPaste] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [noteTarget, setNoteTarget] = useState('0:0');
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
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(externalPlanningPrompt(language)); setCopied(true); }
    catch { setError(t('Copie impossible. Télécharge les consignes pour les ouvrir et les copier.')); }
  }
  function stop() { sequence.current++; request.current?.controller.abort(); request.current = null; setBusy(false); setReading(false); setPendingSource(null); }
  function proposeSource(source: string, draft: PlanningDraft | null = null, sourceOrigin?: DocumentResult['origin']) {
    if (sourceOrigin || (current.current.source.trim() && current.current.source !== source)) setPendingSource({ source, draft, sourceOrigin, structuredSource: undefined });
    else update({ ...current.current, source, draft, sourceOrigin, structuredSource: undefined, reviewedQuotes: [] });
  }
  function proposeStructured(source: string, name?: string) {
    const next = prepareStructured(source, name);
    setPendingSource({ ...next, currency: next.currency ?? current.current.currency, timezone: next.timezone ?? current.current.timezone });
  }
  function structuredFailure(failure: unknown) {
    if (failure instanceof StructuredPlanningError) { setStructuredError(failure); setError(''); }
    else setError(t('Lecture du résultat impossible. Le brouillon précédent est conservé.'));
  }
  function pasteStructured() {
    stop(); setStructuredError(null); setError('');
    try { proposeStructured(jsonPaste); } catch (failure) { structuredFailure(failure); }
  }
  async function openFile(file: File) {
    if (blocked || current.current.draft) return;
    stop(); const id = ++sequence.current; const controller = new AbortController(); request.current = { controller, sequence: id }; setReading(true); setError(''); setStructuredError(null);
    try {
      if (/\.json$/i.test(file.name)) {
        const result = await readStructuredFile(file);
        if (sequence.current === id) proposeStructured(result.source, result.name);
        return;
      }
      const result = await readPlanningSource(file, controller.signal);
      if (sequence.current === id) proposeSource(result.source, null, result.origin);
    } catch (failure) {
      if (failure instanceof StructuredPlanningError) { if (sequence.current === id) structuredFailure(failure); return; }
      if (sequence.current === id) setError(t(failure instanceof PlanningFileError || failure instanceof DocumentError ? failure.message : 'Lecture du fichier impossible. Ton texte actuel est conservé.'));
    } finally { if (sequence.current === id) { setReading(false); request.current = null; } }
  }
  function recognize() {
    if (blocked || current.current.draft || !current.current.source.trim() || current.current.source.length > MAX_SOURCE_LENGTH) return;
    stop(); setError('');
    try { update({ ...current.current, draft: parsePlanning(current.current.source) }); }
    catch { setError(t('Reconnaissance impossible. Ton texte est conservé ; tu peux préparer l’aperçu manuellement.')); }
  }
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
    stop(); setStructuredError(null); setJsonPaste(''); setShowJsonPaste(false); try { clearSession(storage, scope); update(createSession(scope)); setResetRequested(false); setBlocked(false); }
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
    return <details><summary>{t('Provenance et points à vérifier')}</summary><dl className="planning-evidence">{Object.entries(evidence).map(([field, entry]) => <div key={field}><dt>{t(evidenceLabels[field] || 'Information')} · {t(evidenceLabels[entry.origin])}</dt><dd>{entry.path && <code>{entry.path} · </code>}{entry.quote || t('Aucun extrait source')}</dd></div>)}</dl></details>;
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
  const reviewSource = session.structuredSource ? '' : session.source;
  const summary = draft ? draftSummary(draft, reviewSource) : null;
  const passages = draft ? reviewPassages(draft, reviewSource, session.reviewedQuotes) : [];
  function keepNote(quote: string) { update({ ...current.current, reviewedQuotes: [...new Set([...(current.current.reviewedQuotes || []), quote])] }); }
  function promote(quote: string) {
    const [ci,di] = noteTarget.split(':').map(Number);
    changeDraft(d => {
      if (!d.cities[ci]?.days[di]) return d;
      const item=activityFromPassage(quote);
      d.cities[ci].days[di].items.push(item); return d;
    });
    keepNote(quote);
  }
  const preservedNotes = draft ? unstructuredNotes(draft, reviewSource) : [];
  return <Modal title={t('Créer depuis un planning')} wide onClose={() => { stop(); onClose(); }}><div className="planning-import">
    {blocked && <div role="alert" className="notice warning-notice"><p>{t('Brouillon illisible. Sa source est conservée ; efface-le explicitement pour recommencer.')}</p><button type="button" className="text-btn" onClick={() => { try { downloadText(storage.getItem(DRAFT_KEY) || '', 'detours-brouillon-a-recuperer.json'); } catch { setError(t('Sauvegarde du brouillon impossible. Télécharge le texte avant de fermer.')); } }}><Download size={16}/>{t('Télécharger le brouillon brut')}</button></div>}
    {error && <p role="alert" className="notice warning-notice">{error}</p>}
    {structuredError && <div role="alert" className="notice warning-notice"><p>{structuredError.path} · {t(structuredError.message)}</p>
      <button type="button" className="text-btn" onClick={() => downloadText(JSON.stringify({ code: structuredError.code, path: structuredError.path, message: t(structuredError.message) }, null, 2), 'detours-erreurs-import.json')}>{t('Télécharger les erreurs sans le planning')}</button></div>}
    {session.structuredSource && <p className="notice">{t('Préparé avec une IA externe. Structure vérifiée, fidélité à ton planning personnel non vérifiée. Relis les dates, villes et réservations avant de créer le carnet.')} · {session.structuredSource.name}</p>}
    {session.structuredSource && session.draft?.notes.some(note => note.includes('[unmapped')) && <p className="notice warning-notice">{t('Des informations non représentables restent en notes. Relis-les avant de créer le carnet ; aucune dépense n’a été créée.')}</p>}
    {session.sourceOrigin && <details className="planning-origin"><summary>{t('Texte extrait original')} · {session.sourceOrigin.name} · {session.sourceOrigin.kind.toUpperCase()}{session.sourceOrigin.pages ? ` · ${session.sourceOrigin.pages} p.` : ''}</summary>
      <p className="muted small">{t('Les corrections ne remplacent pas cette copie extraite. Le fichier binaire n’est pas conservé.')}</p>
      <pre className="planning-source">{session.sourceOrigin.originalText}</pre>
      <button type="button" className="text-btn" onClick={() => downloadText(session.sourceOrigin!.originalText, 'detours-extraction-originale.txt')}>{t('Télécharger le texte extrait original')}</button>
    </details>}
    {!draft ? <>
      <label className="field">{t('Ton programme')}<textarea rows={10} autoFocus value={session.source} disabled={blocked} onChange={event => { stop(); update({ ...current.current, source: event.target.value }); }} aria-describedby="planning-source-limit"/></label>
      <p id="planning-source-limit" className="muted small">{session.source.length.toLocaleString()} / {MAX_SOURCE_LENGTH.toLocaleString()} {t('caractères')}</p>
      <label className="field">{t('Ouvrir un fichier texte ou Markdown')} · PDF / DOCX<input ref={fileInput} type="file" aria-label={t('Ouvrir un fichier texte ou Markdown')} accept={PLANNING_FILE_ACCEPT + ',.json,application/json'} disabled={blocked || busy} aria-describedby="planning-file-help" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void openFile(file); }}/></label>
      <p id="planning-file-help" className="muted small">{t('TXT/Markdown UTF-8 : 200 Ko. PDF texte/DOCX : 10 Mo, 50 pages PDF, 50 000 caractères. Aucun OCR. Extraction locale, sans envoi du document.')}</p>
      <p className="muted small">{t('Hors ligne : ouvre Détours en ligne et attends sa préparation complète avant de partir. Les modules de lecture sont ensuite disponibles sans réseau.')}</p>
      {reading && <div role="status">{t('Lecture du fichier…')} <button className="btn btn-secondary" onClick={stop}>{t('Annuler')}</button></div>}
      {pendingSource && <div className="notice warning-notice"><p>{t(pendingSource.structuredSource ? 'Préparé avec une IA externe. Structure vérifiée, fidélité à ton planning personnel non vérifiée. Relis les dates, villes et réservations avant de créer le carnet.' : pendingSource.sourceOrigin ? 'Vérifie le texte extrait avant de l’utiliser. Colonnes, tableaux et césures peuvent modifier l’ordre de lecture. Ton brouillon précédent reste conservé jusqu’au remplacement.' : 'Un texte est déjà présent. Vérifie le nouveau texte avant de choisir de le remplacer.')}</p>{pendingSource.sourceOrigin?.kind === 'docx' && <p className="muted small">{t('Word : texte du corps uniquement. Images, en-têtes, pieds de page, commentaires et notes de bas de page ne sont pas repris. Vérifie le document original.')}</p>}<pre className="planning-source">{pendingSource.source}</pre><div className="planning-actions"><button type="button" className="btn btn-secondary" onClick={() => setPendingSource(null)}>{t('Annuler')}</button><button type="button" className="btn btn-primary" onClick={() => { update({ ...current.current, ...pendingSource, reviewedQuotes: [] }); setPendingSource(null); }}>{t('Remplacer le texte')}</button></div></div>}
      {session.source.length > MAX_SOURCE_LENGTH && <p role="alert">{t('Le texte dépasse 50 000 caractères. Réduis-le avant analyse ; rien n’a été tronqué.')}</p>}
      <p className="muted small">{t('La reconnaissance des journées et activités fonctionne sur cet appareil, sans compte ni envoi du texte. Vérifie ensuite l’aperçu avant de créer le carnet.')}</p>
      <div className="planning-actions">
        <button className="btn btn-primary" disabled={busy || reading || blocked || !session.source.trim() || session.source.length > MAX_SOURCE_LENGTH} onClick={recognize}><ListChecks size={16}/>{t('Reconnaître mon programme')}</button>
        <button className="btn btn-secondary" disabled={busy || reading || blocked || session.source.length > MAX_SOURCE_LENGTH} onClick={manual}><Plus size={16}/>{t('Saisir mon aperçu manuellement')}</button>
      </div>
      <details className="planning-remote planning-kit"><summary>{t('Préparer mon planning avec mon IA')}</summary>
        <p>{t('1. Télécharge les consignes. 2. Donne-les à ton IA avec ton planning. 3. Importe son fichier JSON. 4. Vérifie et crée ton carnet.')}</p>
        <p className="muted small">{t('L’outil IA choisi traite les documents que tu lui confies et peut avoir ses propres tarifs. Retire les références sensibles si nécessaire. Aucun carnet personnel n’est inclus dans les consignes.')}</p>
        <div className="planning-actions"><a className="btn btn-primary" href={kitPath(language)} download="PREPARER-MON-VOYAGE-DETOURS.md">{t('Télécharger les consignes pour mon IA')}</a>
        <button type="button" className="btn btn-secondary" onClick={() => void copyPrompt()}>{t('Copier les consignes')}</button>
        <button type="button" className="btn btn-secondary" disabled={blocked || busy} onClick={() => fileInput.current?.click()}>{t('Importer le résultat (.detours.json)')}</button>
        <a className="text-btn" href="/import-kit/exemple-complet.detours.json" download>{t('Télécharger un exemple fictif')}</a>
        <button type="button" className="text-btn" onClick={() => setShowJsonPaste(v => !v)}>{t('Coller un résultat JSON')}</button></div>
        <p className="muted small">{t('JSON seul en UTF-8 : 200 000 octets, 50 000 caractères, sans bloc de code. Ce planning structuré crée un nouveau carnet ; les sauvegardes se restaurent depuis Mes voyages.')}</p>
        {showJsonPaste && <div><label className="field">{t('Résultat JSON')}<textarea rows={6} value={jsonPaste} disabled={blocked || busy || reading} onChange={e => setJsonPaste(e.target.value)}/></label><button type="button" className="btn btn-secondary" disabled={blocked || busy || reading || !jsonPaste.trim()} onClick={pasteStructured}>{t('Vérifier le JSON collé')}</button></div>}
        {copied && <p role="status">{t('Modèle copié.')}</p>}
      </details>
      <section className="planning-remote" aria-label={t('Analyse IA distante (facultative)')}><strong>{t('Analyse IA distante (facultative)')}</strong>
        <p className="muted small">{t(available ? 'En lançant l’analyse, tu envoies ce texte au fournisseur OpenAI. Aucun envoi pendant la saisie.' : 'Analyse IA distante indisponible : service non activé ou compte non connecté. La reconnaissance locale reste disponible.')}</p>
        <div className="planning-actions"><button className="btn btn-secondary" disabled={!available || busy || reading || blocked || !session.source.trim() || session.source.length > MAX_SOURCE_LENGTH} onClick={() => void analyze()}><Sparkles size={16}/>{t('Analyser mon programme')}</button>
        {busy && <button className="btn btn-secondary" onClick={stop}><Square size={16}/>{t('Annuler l’analyse')}</button>}</div>
        {busy && <p role="status">{t('Analyse en cours… Ton texte reste disponible sur cet appareil.')}</p>}
      </section>
      <div className="planning-examples"><span className="muted small">{t('Exemples fictifs de démonstration, sans analyse IA')}</span>{SYNTHETIC_EXAMPLES.map((example, index) => <button className="text-btn" key={index} disabled={busy || reading || blocked} onClick={() => { stop(); proposeSource(example.source, structuredClone(example.draft)); }}>{t('Charger l’exemple {count}', { count: index + 1 })}</button>)}</div>
    </> : <form onSubmit={event => void create(event)}>
      {session.preparedTrip && <p className="notice">{t('Création préparée. Réessayer termine le même carnet sauvegardé ; les corrections sont verrouillées.')}</p>}
      <fieldset className="planning-review-fields" disabled={!!session.preparedTrip}>
      <div className="planning-summary" role="status">{t('{days} journées · {items} propositions · {review} passages à vérifier', { days: summary!.days, items: summary!.activities + summary!.suggestions, review: passages.length })}</div>
      {summary!.activities + summary!.suggestions === 0 && <p className="notice warning-notice">{t('Aucune activité proposée. Le texte est conservé ; ajoute les éléments manquants avant la création.')}</p>}
      {passages.length > 0 && <section className="planning-passages" aria-label={t('Passages à vérifier')}>
        <Mascot state="attention"/>
        <p className="muted small">{t('Blocs non traités, conflits, rattachements incomplets ou champs ambigus. Les notes explicites restent accessibles plus bas.')}</p>
        {passages.map((passage,index) => <details key={`${passage.kind}:${passage.target}:${index}`}>
          <summary>{t('Passage à vérifier {count}', {count:index+1})} · {t(passage.kind === 'conflict' ? 'Conflit' : passage.kind === 'assignment' ? 'Affectation ville / journée' : passage.kind === 'ambiguous' ? 'Champ ambigu' : 'Bloc non traité')}</summary>
          <pre className="planning-source">{passage.quote}</pre>
          {passage.target ? <a href={`#${passage.target}`} onClick={event => { event.preventDefault(); const element=document.getElementById(passage.target!); element?.scrollIntoView({block:'center'}); element?.focus(); }}>{t('Corriger la proposition')}</a> : <div className="planning-actions">
            <label className="field">{t('Journée de destination')}<select aria-label={t('Journée de destination')} value={noteTarget} onChange={e=>setNoteTarget(e.target.value)}>{draft.cities.flatMap((c,ci)=>c.days.map((d,di)=><option key={`${ci}:${di}`} value={`${ci}:${di}`}>{c.name} · {d.title || t('Jour {count}',{count:di+1})}</option>))}</select></label>
            <button type="button" className="text-btn" disabled={!draft.cities.some(c=>c.days.length)} onClick={()=>promote(passage.quote)}>{t('Transformer en activité')}</button>
            <button type="button" className="text-btn" onClick={()=>keepNote(passage.quote)}>{t('Conserver comme note')}</button>
          </div>}
        </details>)}
      </section>}
      {(!draft.title.trim() || draft.cities.some(city => !city.name.trim())) && <p className="notice">{t('Le titre du voyage ou une ville n’a pas pu être identifié avec certitude. Complète les champs vides avant de créer le carnet ; aucune destination n’a été inventée.')}</p>}
      <label className="field">{t('Titre du voyage')}<input id="planning-title" required maxLength={140} value={draft.title} onChange={e => changeDraft(d => correctField(d, 'title', e.target.value))}/></label>
      {provenance(draft.evidence)}
      <div className="form-row"><label className="field">{t('Devise de référence')}<input required maxLength={3} placeholder="EUR" value={session.currency} onChange={e => update({ ...current.current, currency: e.target.value.toUpperCase() })}/></label><label className="field">{t('Fuseau du voyage')}<input required placeholder="Europe/Paris" value={session.timezone} onChange={e => update({ ...current.current, timezone: e.target.value })}/></label></div>
      <div className="planning-actions"><label className="field">{t('Date de départ (facultative)')}<input type="date" value={session.departureDate} onChange={e => update({ ...current.current, departureDate: e.target.value })}/></label><button type="button" className="btn btn-secondary" disabled={!session.departureDate} onClick={() => { try { changeDraft(d => applyDepartureDate(d, session.departureDate)); } catch { setError(t('Date de départ invalide.')); } }}>{t('Dater les journées sans date')}</button></div>
      {draft.cities.map((city, ci) => <section className="planning-city" key={ci}>
        <label className="field">{t('Ville, région ou lieu de séjour')}<input id={`planning-city-${ci}`} required maxLength={100} value={city.name} onChange={e => changeDraft(d => { d.cities[ci] = correctField(d.cities[ci], 'name', e.target.value); return d; })}/></label>
        {provenance(city.evidence)}
        {city.days.map((day, di) => <section className="planning-day" key={di}>
          <div className="form-row"><label className="field">{t('Titre de la journée')}<input id={`planning-day-${ci}-${di}`} required maxLength={180} value={day.title} onChange={e => changeDraft(d => { d.cities[ci].days[di] = correctField(d.cities[ci].days[di], 'title', e.target.value); return d; })}/></label><label className="field">{t('Date (facultative)')}<input id={`planning-day-${ci}-${di}-date`} type="date" value={day.date} onChange={e => changeDraft(d => { d.cities[ci].days[di] = correctField(d.cities[ci].days[di], 'date', e.target.value); return d; })}/></label></div>
          {provenance(day.evidence)}
          {day.items.map((item, ii) => <article className={`planning-item${item.excluded ? ' planning-excluded' : ''}`} key={ii}>
            <div className="planning-item-toolbar"><strong>{t(item.kind === 'stay' ? 'Hébergement' : item.kind === 'transfer' ? 'Transport' : item.kind === 'suggestion' ? 'Suggestion' : item.kind === 'alternative' ? 'Alternative' : 'Activité')}</strong><button title={t('Monter')} aria-label={t('Monter')} type="button" className="icon-btn" disabled={ii === 0} onClick={() => reorder(ci, di, ii, -1)}><ArrowUp size={16}/></button><button title={t('Descendre')} aria-label={t('Descendre')} type="button" className="icon-btn" disabled={ii === day.items.length - 1} onClick={() => reorder(ci, di, ii, 1)}><ArrowDown size={16}/></button><label className="checkbox-label"><input type="checkbox" checked={item.excluded} onChange={e => editItem(ci, di, ii, 'excluded', e.target.checked)}/>{t('Exclure')}</label></div>
            <fieldset disabled={item.excluded}>
              {!item.title && (item.evidence.description?.quote.length || 0) > 300 && <p className="notice">{t('Nomme cette activité. Le passage long reste intégralement accessible dans sa provenance et les notes.')}</p>}
              <label className="field">{t('Lieu ou activité')}<input id={`planning-item-${ci}-${di}-${ii}`} required={!item.excluded} maxLength={180} value={item.title} onChange={e => editItem(ci, di, ii, 'title', e.target.value)}/></label>
              <div className="form-row"><label className="field">{t('Type')}<select value={item.kind} onChange={e => editItem(ci, di, ii, 'kind', e.target.value as DraftItem['kind'])}>{(['activity', 'stay', 'transfer', 'suggestion', 'alternative'] as const).map((kind, index) => <option key={kind} value={kind}>{t(['Activité', 'Hébergement', 'Transport', 'Suggestion', 'Alternative'][index])}</option>)}</select></label><label className="field">{t('Catégorie')}<select value={item.category} onChange={e => editItem(ci, di, ii, 'category', e.target.value as DraftItem['category'])}>{Object.entries(categoryLabels).filter(([key]) => key !== 'photo').map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label></div>
              <label className="field">{t('Adresse précise')}<input value={item.address} onChange={e => editItem(ci, di, ii, 'address', e.target.value)}/></label>
              {!item.address && !item.coordinates && <p className="muted small">{t('Lieu à préciser : aucun repère géographique ajouté.')}</p>}
              <div className="form-row"><label className="field">{t('Période')}<input value={item.period} onChange={e => editItem(ci, di, ii, 'period', e.target.value)}/></label><label className="field">{t('Heure explicite (facultative)')}<input type="time" value={item.time} onChange={e => editItem(ci, di, ii, 'time', e.target.value)}/></label></div>
              {item.kind === 'stay' && <div className="form-row">{(['checkIn', 'checkOut'] as const).map((key, index) => <label className="field" key={key}>{t(['Arrivée à l’hébergement', 'Départ de l’hébergement'][index])}<input type="date" value={item[key]} onChange={e => editItem(ci, di, ii, key, e.target.value)}/></label>)}</div>}
              {item.kind === 'transfer' && <><div className="form-row">{(['departure', 'arrival'] as const).map((key, index) => <label className="field" key={key}>{t(['Départ du transport', 'Arrivée du transport'][index])}<input type="datetime-local" value={item[key]} onChange={e => editItem(ci, di, ii, key, e.target.value)}/></label>)}</div><div className="form-row"><label className="field">{t('Ville d’arrivée')}<input value={item.toCity} onChange={e => editItem(ci, di, ii, 'toCity', e.target.value)}/></label><label className="field">{t('Mode de transport')}<select value={item.mode} onChange={e => editItem(ci, di, ii, 'mode', e.target.value as DraftItem['mode'])}>{(['train', 'plane', 'bus', 'car', 'other'] as const).map((mode, index) => <option key={mode} value={mode}>{t(['Train', 'Avion', 'Bus', 'Voiture', 'Autre'][index])}</option>)}</select></label></div></>}
              <label className="field">{t('Détails et informations')}<textarea rows={2} value={item.description} onChange={e => editItem(ci, di, ii, 'description', e.target.value)}/></label>
              <label className="field">{t('Référence de réservation')}<input value={item.reference} onChange={e => editItem(ci, di, ii, 'reference', e.target.value)}/></label>
              <div className="planning-actions"><label className="checkbox-label"><input type="checkbox" checked={item.optional} onChange={e => editItem(ci, di, ii, 'optional', e.target.checked)}/>{t('Facultatif')}</label><label className="checkbox-label"><input type="checkbox" checked={item.booked} onChange={e => editItem(ci, di, ii, 'booked', e.target.checked)}/>{t('Réservation confirmée')}</label></div>
              <label className="field">{t('Affectation ville / journée')}<select aria-label={t('Affectation ville / journée')} value={`${ci}:${di}`} onChange={e => move(ci, di, ii, e.target.value)}>{draft.cities.flatMap((c, cIndex) => c.days.map((d, dIndex) => <option key={`${cIndex}:${dIndex}`} value={`${cIndex}:${dIndex}`}>{c.name} · {d.title || t('Jour {count}', { count: dIndex + 1 })}</option>))}</select></label>
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
      <label className="checkbox-label"><input type="checkbox" checked={session.keepSource} onChange={e => update({ ...current.current, keepSource: e.target.checked })}/>{t(session.structuredSource ? 'Conserver le fichier IA externe dans le carnet après création' : 'Conserver le texte original dans le carnet après création')}</label>
      </fieldset>
      <div className="planning-actions"><button className="btn btn-primary" disabled={saving || busy || blocked}><Check size={16}/>{t(session.committedId ? 'Ouvrir le carnet créé' : 'Créer et ouvrir le carnet')}</button><button type="button" className="btn btn-secondary" onClick={() => setResetRequested(true)}><Trash2 size={16}/>{t('Effacer et recommencer')}</button></div>
    </form>}
    <div className="planning-actions"><button type="button" className="text-btn" onClick={() => downloadText(session.source, session.structuredSource ? 'mon-voyage.detours.json' : 'detours-programme.txt')}><Download size={16}/>{t('Télécharger le texte source')}</button>{!draft && <button type="button" className="text-btn" onClick={() => setResetRequested(true)}><Trash2 size={16}/>{t('Effacer le brouillon')}</button>}</div>
    <p className="muted small">{t('Le texte reste dans le brouillon récupérable sur cet appareil jusqu’à son effacement explicite.')}</p>
    {resetRequested && <div className="notice warning-notice"><p>{t('Effacer le texte et les corrections ? Cette action permet de lancer un nouvel import.')}</p><div className="planning-actions"><button className="btn btn-secondary" onClick={() => setResetRequested(false)}>{t('Annuler')}</button><button className="btn btn-primary" onClick={reset}>{t('Effacer le brouillon')}</button></div></div>}
  </div></Modal>;
}
