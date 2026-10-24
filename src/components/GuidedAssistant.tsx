import { useContext, useEffect, useRef, useState, type FormEvent } from 'react';
import { Modal } from '../App';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { uid } from '../lib';
import type { StoredState } from '../types';
import { assistantCategory, assistantFields, assistantRevision, lightKeep, prepareAssistant, searchNotebook, tomorrowDays, type AssistantAction, type AssistantField, type AssistantProposal } from '../assistant';
import { ReadOnlyContext, SharedFieldsContext } from './EditControls';
import './GuidedAssistant.css';

type Props = { state: StoredState; saving: boolean; onCommit: (proposal: AssistantProposal, undo: boolean, signal: AbortSignal, fields?: string[]) => Promise<void>; onNavigate: (cityId: string, dayId: string) => void };
const fieldLabels: Record<AssistantField,string> = {title:'Lieu ou activité',description:'Description',address:'Adresse précise',chineseName:'Nom local (facultatif)',period:'Moment de la journée'};
export default function GuidedAssistant(props: Props) {
  const { t }=useLocale(), { scope }=useCloud();
  const [open,setOpen]=useState(false);
  return <><button className="btn btn-secondary" onClick={()=>setOpen(true)}>{t('Assistant du carnet')}</button>{open&&<Modal title={t('Assistant du carnet')} onClose={()=>setOpen(false)} wide><AssistantSession key={scope+':'+props.state.journey!.id} {...props} scope={scope} onClose={()=>setOpen(false)}/></Modal>}</>;
}
function AssistantSession({state,saving,onCommit,onNavigate,scope,onClose}: Props & {scope:string;onClose:()=>void}) {
  const { t }=useLocale(), readOnly=useContext(ReadOnlyContext), fields=useContext(SharedFieldsContext);
  const [query,setQuery]=useState(''),[kind,setKind]=useState<AssistantAction['kind']>('note');
  const [stepId,setStepId]=useState(''),[dayId,setDayId]=useState(''),[field,setField]=useState<AssistantField>('description'),[value,setValue]=useState('');
  const [keep,setKeep]=useState<string[]>([]),[label,setLabel]=useState('');
  const [tomorrow,setTomorrow]=useState<string[] | null>(null);
  const [preview,setPreview]=useState<{proposal:AssistantProposal;undo:boolean} | null>(null),[receipt,setReceipt]=useState<AssistantProposal | null>(null);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[resetKey,setResetKey]=useState(0);
  const lock=useRef(false),lifetime=useRef(new AbortController());
  useEffect(()=>{const controller=new AbortController();lifetime.current=controller;return()=>controller.abort();},[]);
  const days=state.cities.flatMap(city=>city.days.map(day=>({city,day})));
  const steps=days.flatMap(({city,day})=>day.steps.map(step=>({city,day,step})));
  const selectedDay=days.find(d=>d.day.id===dayId)?.day;
  const category=kind==='note'?'notes':kind==='lighten'?'preparation':undefined;
  const blocked=readOnly || !!(category&&fields&&!fields.includes(category));
  const results=searchNotebook(state,query);
  const stale=preview&&assistantRevision(state)!==assistantRevision(preview.undo?preview.proposal.after:preview.proposal.before);
  const dayLabel=({city,day}:typeof days[number])=>`${city.name} · ${day.title} · ${day.date||t('Sans date')} · ${city.timezone||state.journey!.timezone}`;
  function chooseDay(id:string) {setDayId(id);const day=days.find(d=>d.day.id===id)?.day;setKeep(day?lightKeep(day,state.bookings).map(s=>s.id):[]);}
  function clear() {setQuery('');setValue('');setStepId('');setDayId('');setKeep([]);setLabel('');setTomorrow(null);setPreview(null);setReceipt(null);setError('');setResetKey(n=>n+1);}
  function propose(event:FormEvent) {
    event.preventDefault();setError('');
    const action:AssistantAction=kind==='note'?{kind,stepId,text:value}:kind==='field'?{kind,stepId,field,value}:kind==='move'?{kind,stepId,destinationDayId:dayId}:{kind,dayId,keep,label,alternativeId:uid('alternative')};
    try {setPreview({proposal:prepareAssistant(state,scope,action),undo:false});} catch(e) {setError(t(e instanceof Error?e.message:'Action invalide ou non autorisée.'));}
  }
  async function confirm() {
    if (!preview || lock.current) return;
    lock.current=true;setBusy(true);setError('');
    const controller=lifetime.current;
    try {
      await onCommit(preview.proposal,preview.undo,controller.signal,fields);
      if (!controller.signal.aborted) {setReceipt(preview.undo?null:preview.proposal);setPreview(null);setValue('');}
    } catch(e) {
      if (!controller.signal.aborted) setError(t(e instanceof Error&&['Le carnet ou les droits ont changé. Ferme cet aperçu et recommence.','Attends la sauvegarde. Si elle reste impossible, exporte le carnet.','La protection contre les écritures concurrentes est indisponible. Utilise les formulaires du carnet.'].includes(e.message)?e.message:'Écriture non confirmée. Réessaie cet aperçu ; après rechargement, vérifie le carnet et sa copie précédente.'));
    } finally {lock.current=false;if(!controller.signal.aborted)setBusy(false);}
  }
  return <div className="guided-assistant" key={resetKey}>
    <p>{t('Choix guidés, sans compréhension de phrase libre. Tout reste dans ce carnet ; aucun envoi à une IA.')}</p>
    <p className="muted small">{t('La recherche et les aperçus sont effacés à la fermeture. Les changements acceptés suivent les règles de partage et de sauvegarde du carnet.')}</p>
    <p><strong>{state.journey!.title}</strong></p>
    <label className="field">{t('Rechercher dans ce carnet')}<input type="search" value={query} maxLength={200} onChange={e=>setQuery(e.target.value)}/></label>
    {query.trim()&&<><p role="status">{t('Résultats du carnet : {count} maximum 40',{count:results.length})}</p><ul className="assistant-results">{results.map((r,i)=><li key={i}><strong>{r.location}</strong><p>{r.text}</p>{r.cityId&&r.dayId&&<button className="text-btn" onClick={()=>{onNavigate(r.cityId!,r.dayId!);onClose();}}>{t('Ouvrir cette journée')}</button>}</li>)}</ul></>}
    <form className="editor-form" onSubmit={propose}>
      <label className="field">{t('Action guidée')}<select aria-label={t('Action guidée')} value={kind} disabled={busy||!!preview} onChange={e=>{setKind(e.target.value as AssistantAction['kind']);setError('');setValue('');setTomorrow(null);chooseDay('');}}>
        <option value="note">{t('Ajouter une note à une activité')}</option><option value="field">{t('Modifier un champ d’activité')}</option><option value="move">{t('Déplacer une activité')}</option><option value="lighten">{t('Alléger une journée')}</option>
      </select></label>
      {!preview&&<fieldset disabled={busy}>
        {kind!=='lighten'&&<label className="field">{t('Activité concernée')}<select aria-label={t('Activité concernée')} value={stepId} required onChange={e=>setStepId(e.target.value)}><option value="">{t('À choisir')}</option>{steps.map(({city,day,step})=><option key={step.id} value={step.id}>{city.name} · {day.title} · {step.title}</option>)}</select></label>}
        {kind==='field'&&<label className="field">{t('Champ à modifier')}<select aria-label={t('Champ à modifier')} value={field} onChange={e=>{setField(e.target.value as AssistantField);setValue('');}}>{Object.keys(assistantFields).map(k=><option value={k} key={k}>{t(fieldLabels[k as AssistantField])}</option>)}</select></label>}
        {(kind==='note'||kind==='field')&&<label className="field">{t(kind==='note'?'Texte à ajouter':'Nouvelle valeur')}<textarea aria-label={t(kind==='note'?'Texte à ajouter':'Nouvelle valeur')} value={value} required={kind==='note'||field==='title'} maxLength={kind==='note'?4000:assistantFields[field]} rows={3} onChange={e=>setValue(e.target.value)}/></label>}
        {(kind==='move'||kind==='lighten')&&<>
          <button type="button" className="text-btn" onClick={()=>{setTomorrow(tomorrowDays(state).map(d=>d.day.id));chooseDay('');}}>{t('Voir les journées de demain')}</button>
          {tomorrow&&<p role="status">{t('Demain dépend du fuseau de chaque étape. Choisis explicitement une journée datée.')} {tomorrow.length===0&&t('Aucune journée datée ne correspond.')}</p>}
          <label className="field">{t(kind==='move'?'Journée de destination':'Journée à alléger')}<select aria-label={t(kind==='move'?'Journée de destination':'Journée à alléger')} value={dayId} required onChange={e=>chooseDay(e.target.value)}><option value="">{t('À choisir')}</option>{days.filter(d=>!tomorrow||tomorrow.includes(d.day.id)).map(d=><option key={d.day.id} value={d.day.id}>{dayLabel(d)}</option>)}</select></label>
          {tomorrow&&<button className="text-btn" type="button" onClick={()=>setTomorrow(null)}>{t('Voir toutes les journées')}</button>}
        </>}
        {kind==='lighten'&&<>
          <p>{t('Choisis les activités à garder. Le plan initial reste conservé ; aucun horaire, trajet ou gain de temps n’est inventé.')}</p>
          <label className="field">{t('Nom de l’alternative')}<input value={label} required maxLength={100} onChange={e=>setLabel(e.target.value)}/></label>
          <fieldset><legend>{t('Activités à garder')}</legend>{selectedDay?.steps.map(s=>{const protectedStep=s.booking||state.bookings.includes(s.id)||selectedDay.preparation?.anchorStepId===s.id;return <label className="assistant-check" key={s.id}><input type="checkbox" checked={keep.includes(s.id)} disabled={!!protectedStep} onChange={e=>setKeep(ids=>e.target.checked?[...ids,s.id]:ids.filter(id=>id!==s.id))}/>{s.title}{protectedStep?' · '+t('À conserver'):''}</label>;})}</fieldset>
        </>}
        <p className="muted small">{t(kind==='note'?(fields?'Cette note sera visible dans le carnet partagé.':'Cette note suit les réglages privés habituels du carnet.'):'Cette modification porte sur le programme commun si le carnet est partagé.')}</p>
        <button className="btn btn-secondary" type="submit">{t('Prévisualiser cette action')}</button>
      </fieldset>}
    </form>
    {preview&&<section className="assistant-preview" aria-label={t('Aperçu de l’action')}>
      <h3>{t(preview.undo?'Annuler cette action':'Aperçu de l’action')}</h3><p><strong>{state.journey!.title}</strong></p>
      {preview.proposal.changes.map((c,i)=><div key={i}><p><strong>{c.location}</strong> · {t(fieldLabels[c.field as AssistantField]||c.field)}</p><div className="assistant-diff"><div><h4>{t('Avant')}</h4><p>{(preview.undo?c.after:c.before)||t('Vide')}</p></div><div><h4>{t('Après')}</h4><p>{(preview.undo?c.before:c.after)||t('Vide')}</p></div></div></div>)}
      {preview.proposal.action.kind==='lighten'&&<p>{t('Le plan initial, les billets et les dépenses sont conservés.')}</p>}
      {stale&&<p role="status">{t('Le carnet ou les droits ont changé. Ferme cet aperçu et recommence.')}</p>}
      <div className="form-actions"><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>{setPreview(null);setError('');}}>{t('Annuler')}</button><button className="btn btn-primary" disabled={busy||saving||blocked||readOnly||!!(assistantCategory(preview.proposal.action)&&fields&&!fields.includes(assistantCategory(preview.proposal.action)!))||!!stale} onClick={confirm}>{t('Confirmer cette action')}</button></div>
    </section>}
    {receipt&&!preview&&<div role="status"><p>{t('Action enregistrée. L’annulation reste possible tant que le carnet ne change pas.')}</p><button className="btn btn-secondary" disabled={busy} onClick={()=>{setPreview({proposal:receipt,undo:true});setError('');}}>{t('Prévisualiser l’annulation')}</button></div>}
    {readOnly&&<p role="status">{t('Lecture seule : recherche et aperçus disponibles, sans écriture.')}</p>}
    {blocked&&!readOnly&&<p role="status">{t('Les droits actuels ne permettent pas cette modification.')}</p>}
    {error&&<p role="alert">{error}</p>}
    <button className="text-btn" disabled={busy} onClick={clear}>{t('Effacer la session de l’assistant')}</button>
  </div>;
}
