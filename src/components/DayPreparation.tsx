import { useState, type FormEvent } from 'react';
import type { Day, DayPreparation, StepTiming } from '../types';
import { activeSteps, analyzeDay, validPreparation } from '../day-preparation';
import { safeExternalUrl, uid } from '../lib';
import { useLocale } from '../i18n';
import { EditButton, EditInput, EditSelect } from './EditControls';
import './DayPreparation.css';

type Props = { day: Day; bookings: string[]; onSave: (base: Day, preparation: DayPreparation) => void };
export default function DayPreparationPanel({ day, bookings, onSave }: Props) {
  const { t }=useLocale();
  const [editing,setEditing]=useState(false),[adding,setAdding]=useState(false),[compare,setCompare]=useState(''),[error,setError]=useState('');
  const [editBase,setEditBase]=useState(day);
  const formP=editBase.preparation||{},formSteps=activeSteps(editBase);
  const p=day.preparation||{},analysis=analyzeDay(day),selected=p.alternatives?.find(a=>a.id===compare);
  const label=p.alternatives?.find(a=>a.id===p.activeAlternativeId)?.label;
  function saveTiming(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const data=new FormData(event.currentTarget);
    const number=(name:string)=>data.get(name)===''?undefined:Number(data.get(name));
    const string=(name:string)=>String(data.get(name)||'').trim()||undefined;
    const next:DayPreparation={...formP,anchorStepId:string('anchor'),startTime:string('start'),endTime:string('end'),marginMinutes:number('margin'),timings:{...formP.timings,...Object.fromEntries(formSteps.map((step,index)=>[step.id,{fromStepId:formSteps[index-1]?.id,durationMinutes:number('duration-'+index),transferMinutes:number('transfer-'+index),startTime:string('time-'+index),source:string('source-'+index),checkedAt:string('checked-'+index)} satisfies StepTiming]))}};
    if(!validPreparation(next,editBase.steps)){setError(t('Vérifie les horaires et les durées : la fin doit suivre le début, sur la même journée.'));return;}
    onSave(editBase,next);setEditing(false);setError('');
  }
  function saveAlternative(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const data=new FormData(event.currentTarget);
    const alternative={id:uid('alternative'),label:String(data.get('label')||'').trim(),reason:data.get('reason')==='rain'?'rain' as const:'fatigue' as const,stepIds:editBase.steps.filter((_,index)=>data.get('step-'+index)==='on').map(step=>step.id)};
    const next={...formP,alternatives:[...(formP.alternatives||[]),alternative]};
    if(!validPreparation(next,editBase.steps)){setError(t('Choisis au moins une activité et un nom ; huit alternatives maximum.'));return;}
    onSave(editBase,next);setAdding(false);setCompare(alternative.id);setError('');
  }
  const summary=(id?:string)=>{
    const a=analyzeDay(day,id||'original');
    return <><p>{t(a.complete?'Durées et trajets renseignés — faisabilité non garantie.':'À compléter : durées, trajets, plage de la journée ou marge manquants.')}</p>
      <p>{t('Temps renseigné avec marge : {minutes} min',{minutes:a.total})}</p>
      {a.conflicts.length>0&&<p role="status">{t('Conflit dans les horaires saisis : {names}',{names:a.conflicts.map(key=>day.steps.find(s=>s.id===key)?.title||t('Plage de la journée')).join(', ')})}</p>}
      {a.anchorMissing&&<p>{t('L’activité principale est absente de cette alternative.')}</p>}</>;
  };
  return <details className="day-preparation panel"><summary>{t('Préparer cette journée')}<span>{label||t('Plan initial')}</span></summary>
    <div className="day-preparation-body"><p>{t('Choisis ce qui compte, garde une marge et prépare une alternative. Aucun trajet n’est estimé automatiquement.')}</p>
      <div className="day-analysis" role="status">{summary(p.activeAlternativeId)}{analysis.missing.length>0&&<p>{t('Informations à compléter : {names}',{names:analysis.missing.map(id=>day.steps.find(s=>s.id===id)?.title).join(', ')})}</p>}</div>
      {p.activeAlternativeId&&day.steps.some(step=>bookings.includes(step.id)&&!analysis.steps.some(s=>s.id===step.id))&&<p role="status">{t('Cette alternative laisse de côté une activité réservée. Le billet reste confirmé : vérifie toi-même son changement ou son annulation.')}</p>}
      {p.activeAlternativeId&&<p className="muted small">{t('Reviens au plan initial pour modifier l’ordre des activités.')}</p>}
      {p.anchorStepId&&<p><strong>{t('Activité principale')}</strong> : {day.steps.find(s=>s.id===p.anchorStepId)?.title}</p>}
      <p className="muted small">{t('Les durées et trajets sont tes saisies. Les horaires libres du planning ne sont pas interprétés comme des heures vérifiées.')}</p>
      {!editing&&<EditButton className="btn btn-secondary" onClick={()=>{setEditBase(day);setEditing(true);}}>{t('Renseigner les durées et la marge')}</EditButton>}
      {editing&&<form className="day-timing-form" onSubmit={saveTiming}>
        <label className="field">{t('Activité principale')}<EditSelect name="anchor" aria-label={t('Activité principale')} defaultValue={formP.anchorStepId||''}><option value="">{t('À choisir')}</option>{day.steps.map(step=><option value={step.id} key={step.id}>{step.title}</option>)}</EditSelect></label>
        <div className="day-preparation-fields"><label className="field">{t('Début de la journée')}<EditInput type="time" name="start" defaultValue={formP.startTime}/></label><label className="field">{t('Fin de la journée')}<EditInput type="time" name="end" defaultValue={formP.endTime}/></label><label className="field">{t('Marge libre (min)')}<EditInput type="number" min="0" max="1440" step="1" name="margin" defaultValue={formP.marginMinutes}/></label></div>
        {formSteps.map((step,index)=>{const timing=formP.timings?.[step.id]||{};return <fieldset key={step.id}><legend>{step.title}{step.optional?' · '+t('Facultatif'):''}</legend><div className="day-preparation-fields">
          <label className="field">{t('Durée (min)')}<EditInput type="number" min="0" max="1440" step="1" name={'duration-'+index} defaultValue={timing.durationMinutes}/></label>
          <label className="field">{t('Trajet depuis l’activité précédente (min)')}<EditInput type="number" min="0" max="1440" step="1" name={'transfer-'+index} defaultValue={timing.fromStepId===formSteps[index-1]?.id?timing.transferMinutes:undefined}/></label>
          <label className="field">{t('Heure prévue (facultative)')}<EditInput type="time" name={'time-'+index} defaultValue={timing.startTime}/></label>
          <label className="field">{t('Source de ces informations')}<EditInput name={'source-'+index} maxLength={1000} defaultValue={timing.source}/></label>
          <label className="field">{t('Date de vérification')}<EditInput type="date" min="0001-01-01" max="9999-12-31" name={'checked-'+index} defaultValue={timing.checkedAt}/></label>
        </div></fieldset>;})}
        <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={()=>{setEditing(false);setError('');}}>{t('Annuler')}</button><EditButton className="btn btn-primary" type="submit">{t('Enregistrer la préparation')}</EditButton></div>
      </form>}
      <div className="day-timing-sources">{day.steps.filter(step=>p.timings?.[step.id]?.source||p.timings?.[step.id]?.checkedAt).map(step=>{const timing=p.timings![step.id];return <p key={step.id}><strong>{step.title}</strong> : {safeExternalUrl(timing.source)?<a href={safeExternalUrl(timing.source)} target="_blank" rel="noopener noreferrer">{timing.source}</a>:timing.source||t('Source non renseignée')} · {timing.checkedAt||t('Date de vérification non renseignée')}</p>;})}</div>
      <h3>{t('Plan pluie ou fatigue')}</h3><p className="muted small">{t('Une alternative utilise les activités déjà saisies. Ajoute une option au planning si nécessaire. Le plan initial, les billets et les dépenses sont conservés.')}</p>
      {(p.alternatives||[]).map(a=><div className="day-alternative-row" key={a.id}><span>{a.label} · {t(a.reason==='rain'?'Pluie':'Fatigue')}{p.activeAlternativeId===a.id?' · '+t('Plan actif'):''}</span><button className="btn btn-secondary" onClick={()=>setCompare(a.id)}>{t('Comparer {name}',{name:a.label})}</button></div>)}
      {!adding&&<EditButton className="btn btn-secondary" disabled={!day.steps.length||(p.alternatives?.length||0)>=8} onClick={()=>{setEditBase(day);setAdding(true);}}>{t('Créer une alternative')}</EditButton>}
      {adding&&<form className="day-alternative-form" onSubmit={saveAlternative}>
        <label className="field">{t('Nom de l’alternative')}<EditInput name="label" required maxLength={100}/></label><label className="field">{t('Pour quelle situation ?')}<EditSelect aria-label={t('Pour quelle situation ?')} name="reason"><option value="rain">{t('Pluie')}</option><option value="fatigue">{t('Fatigue')}</option></EditSelect></label>
        <fieldset><legend>{t('Activités à garder')}</legend>{editBase.steps.map((step,index)=><label className="day-alternative-check" key={step.id}><EditInput type="checkbox" name={'step-'+index} defaultChecked={!step.optional}/><span>{step.title}{bookings.includes(step.id)?' · '+t('Réservation confirmée'):''}</span></label>)}</fieldset>
        <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={()=>{setAdding(false);setError('');}}>{t('Annuler')}</button><EditButton className="btn btn-primary" type="submit">{t('Enregistrer l’alternative')}</EditButton></div>
      </form>}
      {selected&&<div className="day-alternative-comparison"><div><h4>{t('Plan initial')}</h4><ol>{day.steps.map(step=><li key={step.id}>{step.title}</li>)}</ol>{summary()}</div>
        <div><h4>{selected.label}</h4><ol>{selected.stepIds.map(id=><li key={id}>{day.steps.find(s=>s.id===id)?.title}</li>)}</ol>{summary(selected.id)}
          {day.steps.some(step=>bookings.includes(step.id)&&!selected.stepIds.includes(step.id))&&<p role="status">{t('Cette alternative laisse de côté une activité réservée. Le billet reste confirmé : vérifie toi-même son changement ou son annulation.')}</p>}
          <EditButton className="btn btn-primary" onClick={()=>{onSave(day,{...p,activeAlternativeId:selected.id});setCompare('');}}>{t('Adopter cette alternative')}</EditButton><button className="btn btn-secondary" onClick={()=>setCompare('')}>{t('Fermer la comparaison')}</button>
        </div></div>}
      {p.activeAlternativeId&&<EditButton className="btn btn-secondary" onClick={()=>onSave(day,{...p,activeAlternativeId:undefined})}>{t('Revenir au plan initial')}</EditButton>}
      {error&&<p role="alert">{error}</p>}
    </div></details>;
}
