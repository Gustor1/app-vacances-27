import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';
import { formatCivilDate } from '../locale-utils';
import { dateInTimezone } from '../time';
import { nowDays, nowDetails, stageTimezone } from '../now';
import { Modal } from '../App';
import MapActions from './MapActions';
import type { StoredState, View } from '../types';
import './NowView.css';

export default function NowView({state,onNavigate,notify}:{state:StoredState;onNavigate:(city:string,day:string,view:View)=>void;notify:(text:string)=>void}) {
  const {t,language}=useLocale();
  const [date,setDate]=useState<string|null>(null);
  const [selected,setSelected]=useState('');
  const [show,setShow]=useState(false);
  const [instant,setInstant]=useState(()=>new Date());
  useEffect(()=>{const update=()=>setInstant(new Date());const timer=setInterval(update,60000);window.addEventListener('focus',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);};},[]);
  const all=state.cities.flatMap(city=>city.days.map(day=>({city,day})));
  const candidates=nowDays(state,date,instant);
  const current=(selected?all.find(item=>item.day.id===selected):undefined)||candidates[0];
  const details=current?nowDetails(state,current.city,current.day):null;
  const timezone=current?stageTimezone(state,current.city):'UTC';
  const displayDate=current?.day.date||date||dateInTimezone(timezone,instant);
  const localName=details?.stay?.chineseName.trim();
  const address=details?.stay?.address.trim();
  const text=[localName||details?.stay?.name,address].filter(Boolean).join('\n');
  const copy=async()=>{try{await navigator.clipboard.writeText(text);notify(t('Texte copié.'));}catch{notify(t('Copie indisponible : sélectionne le nom affiché pour le copier.'));}};
  const jump=(view:View)=>{if(current)onNavigate(current.city.id,current.day.id,view);};
  return <section className="now-view" aria-labelledby="now-title">
    <header className="section-header"><div><p className="eyebrow">{t('Les informations du carnet, au bon endroit')}</p><h2 id="now-title">{t('Maintenant')}</h2><p className="muted">{t('Sans suivi de position. Choisis la journée que tu veux consulter.')}</p></div></header>
    <div className="now-controls panel">
      <label className="field">{t('Date choisie')}<input aria-label={t('Date choisie')} type="date" value={date||''} onChange={e=>{setDate(e.target.value||null);setSelected('');setShow(false);}}/></label>
      <button className="btn btn-secondary" onClick={()=>{setDate(null);setSelected('');setInstant(new Date());setShow(false);}}>{t('Aujourd’hui dans le fuseau de chaque étape')}</button>
      <label className="field">{t('Journée à consulter')}<select aria-label={t('Journée à consulter')} value={current?.day.id||''} onChange={e=>{setSelected(e.target.value);setShow(false);}}><option value="" disabled>{t('Choisir une journée')}</option>{all.filter(item=>!date||item.day.date===date).map(({city,day})=><option key={day.id} value={day.id}>{city.name} · {day.title}{day.date?` · ${formatCivilDate(day.date,language)}`:` · ${t('Date à renseigner')}`}</option>)}</select></label>
      {current&&<p className="muted">{formatCivilDate(displayDate,language)} · {timezone}{!current.day.date&&` · ${t('Journée sans date : sélection manuelle')}`}</p>}
    </div>
    {!current?<p className="panel">{t('Aucune journée datée ne correspond. Choisis une journée ou attribue ses dates dans la vue d’ensemble.')}</p>:details&&<div className="now-grid">
      <article className="panel now-card"><h3>{t('Mon hébergement')}</h3>{details.stay?<><h4>{details.stay.name}</h4><p className="now-local">{localName||t('Nom local non renseigné')}</p><p className="now-address">{address||t('Adresse non renseignée')}</p><p className="muted small">{t('Adresse recopiée du carnet : langue à vérifier, aucune traduction automatique.')}</p>{!details.stayDateMatches&&<p role="status">{t('Les dates de cet hébergement ne couvrent pas cette journée.')}</p>}<button className="btn btn-primary" onClick={()=>{setSelected(current.day.id);setShow(true);}}>{t('À montrer')}</button></>:<p>{t('Aucun hébergement renseigné pour cette ville.')}</p>}<button className="text-btn" onClick={()=>jump('practical')}>{t('Ouvrir les hébergements')}</button></article>
      <article className="panel now-card"><h3>{t('Prochaine étape du planning')}</h3><p className="muted small">{t('Première activité encore à faire dans l’ordre saisi, sans estimation horaire.')}</p>{details.next?<><h4>{details.next.title}</h4>{details.next.chineseName&&<p className="now-local">{details.next.chineseName}</p>}<p>{details.next.period}</p><p className="now-address">{details.next.address||t('Adresse non renseignée')}</p><MapActions city={current.city} place={details.next} next={details.following}/></>:<p>{t('Aucune activité restante pour cette journée.')}</p>}<button className="text-btn" onClick={()=>jump('planning')}>{t('Ouvrir cette journée')}</button></article>
      <article className="panel now-card"><h3>{t('Réservation du jour')}</h3>{details.reservation?<><h4>{details.reservation.title}</h4><p>{t('Réservation confirmée')}</p>{state.notes[details.reservation.id]&&<p className="now-note">{state.notes[details.reservation.id]}</p>}</>:!details.transfer&&<p>{t('Aucune réservation confirmée renseignée pour cette journée.')}</p>}{details.transfer&&<><h4>{details.transfer.label}</h4><p>{details.transfer.departure.replace('T',' ')} · {details.transfer.departureTimezone||stageTimezone(state,current.city)}</p><p>{details.transfer.fromStation} → {details.transfer.toStation}</p><p className="now-note">{details.transfer.reference}</p><button className="text-btn" onClick={()=>jump('transport')}>{t('Ouvrir mes transports')}</button></>}</article>
      <article className="panel now-card"><h3>{t('Note du jour')}</h3><p className="now-note">{details.note||t('Aucune note saisie pour cette journée.')}</p><button className="text-btn" onClick={()=>jump('planning')}>{t('Ouvrir cette journée')}</button></article>
    </div>}
    {show&&details?.stay&&current&&<Modal title={t('À montrer')} onClose={()=>setShow(false)} wide><div className="now-show"><p className="now-local">{localName||t('Nom local non renseigné')}</p>{!localName&&<p>{details.stay.name}</p>}<p className="now-address">{address||t('Adresse non renseignée')}</p><p className="muted">{t('Adresse recopiée du carnet : langue à vérifier, aucune traduction automatique.')}</p><button className="btn btn-primary" disabled={!text} onClick={()=>void copy()}>{t('Copier le texte')}</button><button className="btn btn-secondary" onClick={()=>setShow(false)}>{t('Revenir au carnet')}</button></div></Modal>}
  </section>;
}
