import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Cloud, LogOut, RefreshCw, Users } from 'lucide-react';
import { useLocale } from '../i18n';
import { useCloud } from '../cloud/CloudProvider';
import { AccountStorage } from '../cloud/storage';
import { tripSaveStatus } from '../cloud/status';
import { tripKey, parseTrip } from '../journeys';
import { Modal } from '../App';
import ConflictCard from './ConflictCard';
import './TripCollaboration.css';

export const sharingCategories = ['notes','reservations','budget','documents','preparation'] as const;
export const categoryLabels = { notes:'Notes et précisions', reservations:'Réservations et références', budget:'Budget et dépenses', documents:'Documents du voyage', preparation:'Préparation, favoris et activités vécues' };
export type Collaborator = { user_id:string; email:string|null; display_name:string; role:'owner'|'reader'|'editor'; share_fields?:string[] };
export function useRoster(id:string) {
  const cloud=useCloud(); const [people,setPeople]=useState<Collaborator[]>([]);
  const [error,setError]=useState('');
  const generation=useRef(0);
  const record=cloud.storage instanceof AccountStorage?cloud.storage.record(tripKey(id)):null;
  async function refresh() {if(!cloud.session||!record?.revision)return;const request=++generation.current;try {const result=await cloud.rpc<Collaborator[]>('detours_roster',{p_trip:id});if(request!==generation.current)return;setPeople(result);setError('');}catch{if(request===generation.current)setError('La liste des collaborateurs est indisponible.');}}
  useEffect(()=>{
    setPeople([]);void refresh();
    const updated=(event:Event)=>{if((event as CustomEvent<string>).detail===id)void refresh();};
    const timer=setInterval(()=>{if(record?.fullSharing&&document.visibilityState==='visible'&&navigator.onLine)void refresh();},15000);
    window.addEventListener('detours-roster-updated',updated);
    return()=>{generation.current++;clearInterval(timer);window.removeEventListener('detours-roster-updated',updated);};
  },[id,cloud.session?.user.id,record?.revision,record?.role,record?.fullSharing]);
  return {people,error,refresh};
}
export default function TripCollaboration({id,onShare,onCopy,saving=false,storageError=""}:{id:string;onShare:()=>void;onCopy:()=>void;saving?:boolean;storageError?:string}) {
  const {t,dateLocale}=useLocale();const cloud=useCloud();const {people,error}=useRoster(id);
  const [opened,setOpened]=useState(false);
  const [leaving,setLeaving]=useState(false),[busy,setBusy]=useState(false),[leaveError,setLeaveError]=useState('');
  const storage=cloud.storage instanceof AccountStorage?cloud.storage:null;
  const record=storage?.record(tripKey(id));const owner=people.find(p=>p.role==='owner');const members=people.filter(p=>p.role!=='owner');
  const shared=!!record&&record.role!=='owner'||members.length>0;
  useEffect(()=>{
    if(!record?.revision||!cloud.session||(record.role==='owner'&&!members.length))return;
    const refresh=()=>{if(document.visibilityState==='visible'&&navigator.onLine)void cloud.sync();};
    const timer=setInterval(refresh,5000);
    window.addEventListener('focus',refresh);
    return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[!!record?.revision,record?.role,members.length,cloud.session?.user.id,cloud.sync]);
  const status=tripSaveStatus({account:!!storage,record,saving,storageError,working:cloud.working,online:cloud.online,connected:!!cloud.session});

  return <>
    <section className="trip-collaboration" aria-label={t('Partage et synchronisation')}>
      <div className="trip-collaboration-heading"><div><span className="trip-access-badge"><Users size={15}/>{t(shared?'Voyage partagé':'Mon voyage')} · {t(record?.role==='reader'?'Lecteur':record?.role==='editor'?'Éditeur':'Propriétaire')}</span>{owner&&shared&&<p>{t('Partagé par :')} <strong>{owner.email||owner.display_name}</strong></p>}{members.length>0&&<p>{t('Partagé avec :')} {members.map(p=>p.email||p.display_name).join(' · ')}</p>}{error&&shared&&<p className="muted">{t(error)}</p>}</div><div className="trip-collaboration-actions"><button className="btn btn-primary" onClick={onShare}><Users size={16}/>{t('Partager')}</button>{record?.role==='reader'&&<button className="btn btn-secondary" onClick={onCopy}>{t('Créer ma copie')}</button>}</div></div>
      <div className="trip-sync-row"><span role="status">{record?.conflict?<Cloud size={15}/>:<CheckCircle2 size={15}/>} {t(status)}</span><button className="text-btn" onClick={()=>setOpened(true)}>{t(record?.conflict?'Résoudre les différences':'Voir la synchronisation')}</button></div>
      <p className="trip-sync-hint">{t(cloud.online?'Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.':'Internet indisponible. Les changements peuvent rester enregistrés ici en attendant l’envoi.')}</p>{record?.lastSynced&&Number.isFinite(Date.parse(record.lastSynced))&&<p className="trip-sync-hint">{t('Dernier échange avec le compte :')} <time dateTime={record.lastSynced}>{new Intl.DateTimeFormat(dateLocale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(record.lastSynced))}</time></p>}{record?.role==='reader'&&<p className="trip-sync-hint">{t('Tu consultes le même carnet que le propriétaire. Demande un accès éditeur pour le modifier.')}</p>}
      {record?.fullSharing&&<p className="trip-sync-hint">{t('Carnet commun : les modifications autorisées sont partagées avec les autres membres.')}</p>}
      {record?.accessChanged&&<p className="trip-sync-hint">{t('Les droits ont changé. Le carnet affiche les informations autorisées ; ton travail en attente reste dans les copies de récupération.')}</p>}
    </section>
    {record && record.role !== 'owner' && <button className="text-btn leave-trip" onClick={()=>{setLeaveError('');setLeaving(true);}}><LogOut size={16}/>{t('Quitter ce voyage')}</button>}
    {leaving&&<Modal title={t('Quitter ce voyage ?')} onClose={()=>{if(!busy)setLeaving(false);}}><div className="account-panel"><p>{t('Ce voyage disparaîtra de ton carnet et tu perdras ton accès, y compris depuis un ancien lien.')}</p><p>{t('Le voyage et tes contributions restent disponibles pour le créateur et les autres participants. Une nouvelle invitation te permettra de revenir.')}</p>{record?.pending&&<p>{t('Des modifications sont encore en attente sur cet appareil. Seules les contributions déjà synchronisées sont partagées.')}</p>}{leaveError&&<p role="alert">{leaveError}</p>}<div className="trip-collaboration-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>setLeaving(false)}>{t('Annuler')}</button><button className="btn btn-primary" disabled={busy||!cloud.session||!navigator.onLine} onClick={async()=>{setBusy(true);try{await cloud.leave(id);setLeaving(false);}catch{setLeaveError(t('Impossible de quitter le voyage. Vérifie ta connexion et réessaie.'));}finally{setBusy(false);}}}>{t('Confirmer et quitter')}</button></div>{(!cloud.session||!navigator.onLine)&&<p>{t('Connecte-toi avec Internet pour quitter ce voyage.')}</p>}</div></Modal>}
    {opened&&<TripSyncPanel id={id} saving={saving} storageError={storageError} onClose={()=>setOpened(false)}/>}
  </>;
}

export function TripSyncPanel({id,onClose,saving=false,storageError=""}:{id:string;onClose:()=>void;saving?:boolean;storageError?:string}) {
 const {t}=useLocale(),cloud=useCloud();const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const storage=cloud.storage instanceof AccountStorage?cloud.storage:null,record=storage?.record(tripKey(id));
 const status=tripSaveStatus({account:!!storage,record,saving,storageError,working:cloud.working,online:cloud.online,connected:!!cloud.session});
 async function synchronize(){setBusy(true);setMessage('');try{await cloud.sync();const latest=storage?.record(tripKey(id));setMessage(t(latest?.conflict?'Choisis les valeurs à garder ci-dessous. Les deux versions seront conservées.':latest?.pending?'L’envoi reste en attente. Tes changements sont conservés sur cet appareil.':latest?.lastSynced?'Synchronisé':'Enregistré sur cet appareil'));}finally{setBusy(false);}}
 return <Modal title={t('Synchronisation du voyage')} onClose={onClose} wide><div className="account-panel trip-sync-panel"><p className="sync-state" role="status">{t(status)}</p><p>{t('Tes changements sont enregistrés sur cet appareil, puis envoyés automatiquement lorsque Détours est ouvert avec Internet. Les changements sur des champs différents se réunissent automatiquement.')}</p>{!cloud.session&&cloud.configured?<button className="btn btn-primary" onClick={()=>void cloud.signIn()}>{t('Se connecter avec Google')}</button>:<button className="btn btn-secondary" disabled={busy||!cloud.online||!cloud.session} onClick={()=>void synchronize()}><RefreshCw size={16}/>{t('Synchroniser maintenant')}</button>}{record?.conflict&&storage&&<ConflictCard key={record.conflict.revision+':'+record.conflict.privateRevision} storage={storage} keyName={tripKey(id)} record={record} onResolved={synchronize} onError={setMessage}/>}<p className="muted">{t('Résoudre une différence conserve les deux versions dans les copies de récupération. Aucun choix n’est fait automatiquement à ta place.')}</p>{(message||cloud.error)&&<p role="status">{message||t(cloud.error)}</p>}</div></Modal>;
}
export function HomeSyncStatus({onResolve}:{onResolve:(id:string)=>void}) {
 const cloud=useCloud(),{t}=useLocale();const [busy,setBusy]=useState(false);
 const conflicts=cloud.storage instanceof AccountStorage?cloud.storage.records().filter(([key,record])=>key.startsWith('a-l-est-trip-v2:')&&record.conflict&&!record.revoked):[];
 return <section className="home-sync-status" aria-label={t('Synchronisation')}><div><strong>{t(busy?'Envoi des modifications…':cloud.status)}</strong><p>{t(cloud.storage.accountId?'Les changements sont envoyés automatiquement. Tu peux suivre chaque carnet et comparer les différences ici.':'Tes carnets sont enregistrés sur cet appareil. Connecte-toi pour les retrouver sur tes autres appareils.')}</p>{cloud.error&&<p role="status">{t(cloud.error)}</p>}</div>{cloud.session&&<button className="btn btn-secondary" disabled={busy||!navigator.onLine} onClick={()=>{setBusy(true);void cloud.sync().finally(()=>setBusy(false));}}><RefreshCw size={16}/>{t('Synchroniser maintenant')}</button>}{conflicts.map(([key,record])=><button key={key} className="btn btn-primary" onClick={()=>onResolve(key.slice('a-l-est-trip-v2:'.length))}>{t('Résoudre les différences')} · {parseTrip(record.raw).state.journey!.title}</button>)}</section>;
}
