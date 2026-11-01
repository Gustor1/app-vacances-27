import { useState, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import type { City, Day, Step, StoredState } from '../types';
import { addIdea, departureIssues, dismissIssue, emptyCompanion, localIdeas, undoIdea, type DepartureIssue, type LocalIdea, type RequiredField } from '../companion';
import { uid } from '../lib';
import { useLocale } from '../i18n';
import { Modal } from '../App';
import { EditButton, EditSelect } from './EditControls';
import './Companion.css';

const fieldLabels = {address:'Adresse précise',chineseName:'Nom local (facultatif)',duration:'Durée (min)'};
type Props = { state:StoredState; city?:City; day?:Day; onChange:Dispatch<SetStateAction<StoredState>>; onCorrect:(issue:DepartureIssue)=>void };
export default function Companion({state,city,day,onChange,onCorrect}:Props) {
  const {t}=useLocale();
  const [all,setAll]=useState(false),[budget,setBudget]=useState(45),[favorites,setFavorites]=useState(false),[category,setCategory]=useState('all');
  const [preview,setPreview]=useState<LocalIdea|null>(null),[inserted,setInserted]=useState<Step|null>(null),[message,setMessage]=useState('');
  const issues=departureIssues(state),p=state.companion||emptyCompanion();
  const ideas=city&&day?localIdeas(state,city,day).filter(i=>(!favorites||i.favorite)&&(category==='all'||i.step.category===category)&&(i.duration===undefined||i.duration<=budget)):[];
  function requireField(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const data=new FormData(event.currentTarget),stepId=String(data.get('step')),field=String(data.get('field')) as RequiredField;
    if (!day?.steps.some(s=>s.id===stepId)) return;
    const id=uid('requirement');
    onChange(s=>{const current=s.companion||emptyCompanion();return current.requirements.some(r=>r.stepId===stepId&&r.field===field)||current.requirements.length>=500?s:{...s,companion:{...current,requirements:[...current.requirements,{id,stepId,field}]}};});
  }
  function adopt() {
    if(!preview||!city||!day)return;
    const stepId=`companion-step:${city.id}:${preview.id}`;let added:Step|undefined;
    onChange(s=>{const next=addIdea(s,city.id,day.id,preview,stepId);added=next.cities.flatMap(c=>c.days).flatMap(d=>d.steps).find(x=>x.id===stepId);return next;});
    if(added){setInserted(added);setMessage(t('Idée ajoutée. Tu peux annuler cet ajout.'));setPreview(null);}else setMessage(t('Les données ont changé. Ferme cet aperçu et choisis à nouveau.'));
  }
  return <div className="companion">
    <section className="panel companion-check" aria-labelledby="companion-check-title"><h3 id="companion-check-title">{t('Contrôle avant départ')}</h3>
      <p className="muted small">{t('Uniquement les réservations à faire, tes informations exigées et les chevauchements prouvés par les horaires saisis.')}</p>
      <p className="muted small">{t('Ces exigences, exclusions et remarques écartées restent sur cet appareil. Elles voyagent avec tes sauvegardes, sans synchronisation.')}</p>
      {!issues.length&&<p>{t('Aucun point signalé dans les données actuelles. Ce contrôle ne certifie pas que le voyage est prêt.')}</p>}
      <ul className="companion-issues">{(all?issues:issues.slice(0,6)).map(issue=><li key={issue.id}>
        <strong>{issue.step.title}{issue.other&&` / ${issue.other.title}`}</strong><p className="small">{issue.city.name} · {issue.day.title}{issue.day.date&&` · ${issue.day.date}`} · {issue.city.timezone||state.journey?.timezone}</p>
        <p>{t(issue.kind==='booking'?'Origine : activité marquée « À réserver », sans confirmation.':issue.kind==='overlap'?'Origine : deux débuts et deux durées saisis se chevauchent.':'Origine : information que tu as explicitement exigée, encore absente.')}{issue.field&&` ${t(fieldLabels[issue.field])}`}</p>
        <div className="companion-actions"><EditButton className="btn btn-secondary" onClick={()=>onCorrect(issue)}>{t('Ouvrir la correction')}</EditButton><EditButton className="text-btn" onClick={()=>onChange(s=>dismissIssue(s,issue))}>{t('Écarter pour ces données')}</EditButton></div>
      </li>)}</ul>
      {issues.length>6&&<button className="text-btn" onClick={()=>setAll(!all)}>{t(all?'Réduire la liste':'Voir tous les points')}</button>}
      {p.dismissed.length>0&&<EditButton className="text-btn" onClick={()=>onChange(s=>({...s,companion:{...(s.companion||emptyCompanion()),dismissed:[]}}))}>{t('Réexaminer les remarques écartées')}</EditButton>}
      {day&&<details className="companion-require"><summary>{t('Exiger une information pour cette journée')}</summary><form onSubmit={requireField}>
        <label className="field">{t('Activité principale')}<EditSelect name="step" required>{day.steps.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</EditSelect></label>
        <label className="field">{t('Information importante')}<EditSelect name="field"><option value="address">{t('Adresse précise')}</option><option value="chineseName">{t('Nom local (facultatif)')}</option><option value="duration">{t('Durée (min)')}</option></EditSelect></label>
        <EditButton className="btn btn-secondary" disabled={!day.steps.length||p.requirements.length>=500}>{t('Exiger cette information')}</EditButton>
      </form>{p.requirements.filter(r=>day.steps.some(s=>s.id===r.stepId)).map(r=><p key={r.id}>{day.steps.find(s=>s.id===r.stepId)?.title} · {t(fieldLabels[r.field])} <EditButton className="text-btn" onClick={()=>onChange(s=>({...s,companion:{...(s.companion||emptyCompanion()),requirements:(s.companion?.requirements||[]).filter(x=>x.id!==r.id)}}))}>{t('Ne plus exiger')}</EditButton></p>)}</details>}
    </section>
    {city&&day&&<section className="panel companion-ideas" aria-labelledby="companion-ideas-title"><h3 id="companion-ideas-title">{t('J’ai un peu de temps')}</h3><p>{city.name} · {day.title}</p><p className="muted small">{t('Idées enregistrées dans cette ville. Les visites faites ou déjà au programme sont écartées ; aucune recherche externe.')}</p>
      <div className="companion-filters"><label className="field">{t('Temps disponible (min)')}<input type="number" min="5" max="1440" step="5" value={budget} onChange={e=>setBudget(Math.max(5,Math.min(1440,Number(e.target.value)||45)))}/></label><label className="field">{t('Catégorie')}<select value={category} onChange={e=>setCategory(e.target.value)}>{[['all','Toutes'],['visit','Visite'],['food','À table'],['walk','Balade'],['shopping','Shopping']].map(([v,l])=><option key={v} value={v}>{t(l)}</option>)}</select></label><label><input type="checkbox" checked={favorites} onChange={e=>setFavorites(e.target.checked)}/> {t('Favoris uniquement')}</label></div>
      <p className="muted small">{t('Le budget filtre les durées connues. Durée inconnue ou déplacement non renseigné : le temps total reste à vérifier.')}</p>
      {!ideas.length&&<p>{t('Aucune idée ne correspond. Modifie les filtres ou ajoute un bonus au carnet.')}</p>}
      <ul className="companion-issues">{ideas.slice(0,12).map(idea=><li key={idea.id}><strong>{idea.step.title}</strong><p>{idea.duration!==undefined?t('Durée saisie : {minutes} min ; déplacement à vérifier.',{minutes:idea.duration}):t('Durée et déplacement à vérifier.')}</p><div className="companion-actions"><EditButton className="btn btn-secondary" onClick={()=>{setPreview(idea);setMessage('');}} disabled={!!day.preparation?.activeAlternativeId}>{t('Prévisualiser l’ajout')}</EditButton><EditButton className="text-btn" onClick={()=>onChange(s=>{const c=s.companion||emptyCompanion();return {...s,companion:{...c,excluded:[...new Set([...c.excluded,idea.id])].slice(-2000)}};})}>{t('Exclure cette idée')}</EditButton></div></li>)}</ul>
      {day.preparation?.activeAlternativeId&&<p>{t('Reviens au plan initial avant d’ajouter une idée. Les alternatives restent conservées.')}</p>}
      {!!p.excluded.length&&<EditButton className="text-btn" onClick={()=>onChange(s=>({...s,companion:{...(s.companion||emptyCompanion()),excluded:[]}}))}>{t('Réintégrer les idées exclues')}</EditButton>}
      {inserted&&<EditButton className="btn btn-secondary" onClick={()=>{let undone=false;onChange(s=>{const next=undoIdea(s,inserted);undone=next!==s;return next;});setMessage(t(undone?'Ajout annulé.':'Cette activité a changé. Ouvre le planning pour la modifier.'));if(undone)setInserted(null);}}>{t('Annuler cet ajout')}</EditButton>}
      <p role="status">{message}</p>
    </section>}
    {preview&&city&&day&&<Modal title={t('Prévisualiser l’ajout')} onClose={()=>setPreview(null)}><div className="companion-preview"><h3>{preview.step.title}</h3><p>{preview.step.address}</p><p>{city.name} · {day.title}{day.date&&` · ${day.date}`}</p><p>{t('L’activité sera ajoutée en fin de journée au programme commun. Les notes privées, billets et favoris ne sont pas copiés.')}</p><p>{t('Durée et déplacement à vérifier.')}</p><EditButton className="btn btn-primary" onClick={adopt}>{t('Confirmer l’ajout au programme')}</EditButton><button className="btn btn-secondary" onClick={()=>setPreview(null)}>{t('Annuler')}</button><p role="status">{message}</p></div></Modal>}
  </div>;
}
