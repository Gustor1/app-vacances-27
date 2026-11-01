import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../App';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { downloadText } from '../lib';
import { MEDIA_LIMITS, exportSouvenirs, preparePhoto, prepareSouvenirRestore, readSouvenirs, writeSouvenirs, type Souvenir } from '../souvenirs';
import type { Day, StoredState } from '../types';
import './Souvenirs.css';

function Photo({ blob, alt }: { blob?: Blob; alt: string }) {
  const [url,setUrl] = useState('');
  const [failed,setFailed] = useState(false);
  useEffect(()=>{
    setFailed(false);
    if (!blob) { setUrl(''); return; }
    const next = URL.createObjectURL(blob); setUrl(next);
    return ()=>URL.revokeObjectURL(next);
  },[blob]);
  const { t } = useLocale();
  return failed ? <p role="status">{t('Photo illisible. Retire les photos de l’impression ou remplace la copie locale.')}</p> : url ? <img className="souvenir-photo" src={url} alt={alt} onError={()=>setFailed(true)}/> : null;
}

export default function Souvenirs({ state, day }: { state: StoredState; day?: Day }) {
  const { storage } = useCloud();
  const scope = storage.accountId ? `account:${storage.accountId}` : 'local';
  return <PersonalSouvenirs key={JSON.stringify([scope,state.journey!.id,day?.id])} scope={scope} state={state} day={day || {id:"",title:"",steps:[]}}/>;
}
function PersonalSouvenirs({ scope, state, day }: { scope: string; state: StoredState; day: Day }) {
  const { t } = useLocale();
  const trip = state.journey!.id;
  const [rows,setRows] = useState<Souvenir[]>([]);
  const [caption,setCaption] = useState('');
  const [photo,setPhoto] = useState<Blob>();
  const [busy,setBusy] = useState(true);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [confirmDelete,setConfirmDelete] = useState(false);
  const [plan,setPlan] = useState<Awaited<ReturnType<typeof prepareSouvenirRestore>> | null>(null);
  const [printing,setPrinting] = useState(false);
  const [exporting,setExporting] = useState(false);
  const [selected,setSelected] = useState<string[]>([]);
  const [photos,setPhotos] = useState(false);
  const [captions,setCaptions] = useState(false);
  const alive = useRef(true);
  const current = rows.find(row=>row.day===day.id);
  const days = state.cities.flatMap(city=>city.days);
  const detached = rows.filter(row=>!days.some(d=>d.id===row.day));
  const [cleanDetached,setCleanDetached] = useState(false);
  async function refresh() {
    const next = await readSouvenirs(scope,trip);
    if (!alive.current) return;
    setRows(next);
    const row = next.find(r=>r.day===day.id); setCaption(row?.caption || ''); setPhoto(row?.photo);
  }
  useEffect(()=>{
    alive.current = true;
    void refresh().catch(()=>{ if(alive.current)setError(t('Stockage des souvenirs indisponible. Le carnet reste utilisable.')); }).finally(()=>{if(alive.current)setBusy(false);});
    return ()=>{alive.current=false;};
  },[scope,trip,day.id]);
  useEffect(()=>{
    if (!printing) return;
    // Browser PDF metadata/headers must use the title shown in the preview,
    // rather than leaking the notebook title from the surrounding application.
    const previous = document.title;
    document.title = t('Mes souvenirs de voyage');
    return ()=>{document.title=previous;};
  },[printing,t]);
  async function run(action: ()=>Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (failure) {
      if (alive.current) setError(t(failure instanceof Error && failure.message==='media-conflict'
        ? 'Un souvenir a changé ailleurs. Annule les modifications pour le relire avant de réessayer.'
        : failure instanceof Error && ['media-invalid','media-package'].includes(failure.message)
          ? 'Paquet souvenirs invalide ou trop grand (48 Mio maximum). Conserve le fichier original ; aucune restauration n’a commencé.'
        : failure instanceof Error && ['media-format','media-size'].includes(failure.message)
          ? 'Fichier refusé. JPEG, PNG ou WebP seulement : 12 Mio et 32 millions de pixels maximum. HEIC non pris en charge ; exporte une copie JPEG.'
          : 'Écriture non terminée : stockage plein ou indisponible. Les souvenirs précédents sont conservés ; garde ton fichier et réessaie.'));
    } finally { if(alive.current)setBusy(false); }
  }
  const printDays = days.filter(d=>selected.includes(d.id));
  const pages = <div className="souvenir-pages"><h1>{t('Mes souvenirs de voyage')}</h1>{printDays.map(d=>{
    const row = rows.find(r=>r.day===d.id);
    return <article key={d.id}><h2>{d.title}</h2>{d.date&&<p>{d.date}</p>}{photos&&<Photo blob={row?.photo} alt={t('Photo personnelle')}/>} {captions&&row?.caption&&<p className="souvenir-caption">{row.caption}</p>}</article>;
  })}</div>;
  return <details className="souvenirs"><summary>{t('Souvenir personnel')}</summary>
    <p>{t('Photo et légende privées sur cet appareil et dans cet espace uniquement. Aucun partage ni synchronisation. Original inchangé.')}</p>
    <p className="muted small">{t('JPEG, PNG, WebP : 12 Mio / 32 Mpx maximum. Copie JPEG sans métadonnées GPS, 1600 px / 512 Kio maximum. Budget local total : 32 Mio.')}</p>
    <div hidden={!day.id}><Photo blob={photo} alt={t('Photo personnelle')}/>
    <label className="field">{t('Choisir une photo personnelle')}<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{
      const file=event.target.files?.[0]; event.target.value='';
      if(file)void run(async()=>{ const next=await preparePhoto(file); if(alive.current)setPhoto(next); });
    }}/></label>
    <label className="field">{t('Légende du souvenir')}<textarea disabled={busy} value={caption} maxLength={MEDIA_LIMITS.caption} rows={3} onChange={event=>setCaption(event.target.value)}/></label>
    <div className="souvenir-actions">
      <button className="btn btn-primary" disabled={busy} onClick={()=>void run(async()=>{await writeSouvenirs(scope,trip,[{day:day.id,before:current?.revision || null,value:{caption,...(photo?{photo}:{})}}]); await refresh(); if(alive.current)setMessage(t('Souvenir enregistré sur cet appareil.'));})}>{t('Enregistrer le souvenir')}</button>
      <button className="btn btn-secondary" disabled={busy} onClick={()=>void run(refresh)}>{t('Annuler les modifications')}</button>
      {photo&&<button className="text-btn" disabled={busy} onClick={()=>setPhoto(undefined)}>{t('Retirer la photo avant enregistrement')}</button>}
      {current&&<button className="text-btn" disabled={busy} onClick={()=>setConfirmDelete(true)}>{t('Supprimer ce souvenir')}</button>}
    </div>
    {confirmDelete&&<div className="notice"><p>{t('Supprimer la copie locale et sa légende ? Le fichier original reste inchangé.')}</p><button disabled={busy} className="btn btn-secondary" onClick={()=>void run(async()=>{await writeSouvenirs(scope,trip,[{day:day.id,before:current?.revision || null,value:null}]);await refresh();setConfirmDelete(false);})}>{t('Confirmer la suppression')}</button><button className="text-btn" disabled={busy} onClick={()=>setConfirmDelete(false)}>{t('Annuler')}</button></div>}
    </div><hr/>
    <p>{t('Les sauvegardes habituelles excluent ces photos et légendes. Garde aussi un paquet souvenirs par carnet. Pour restaurer : restaure le carnet, ouvre-le, puis importe son paquet ici.')}</p>
    <p>{t('{count} souvenir(s), {bytes} Kio de photos dans ce carnet.',{count:rows.length,bytes:Math.ceil(rows.reduce((sum,row)=>sum+(row.photo?.size||0),0)/1024)})}</p>
    <div className="souvenir-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>void run(async()=>{await refresh();if(alive.current)setExporting(true);})}>{t('Télécharger le paquet souvenirs')}</button>
      <label className="field">{t('Importer un paquet souvenirs')}<input disabled={busy} type="file" accept=".json,application/json" onChange={event=>{
        const file=event.target.files?.[0]; event.target.value='';
        if(file)void run(async()=>{if(file.size>MEDIA_LIMITS.package)throw new Error('media-package');const latest=await readSouvenirs(scope,trip);const prepared=await prepareSouvenirRestore(await file.text(),days.map(d=>d.id),latest);if(alive.current){setRows(latest);setPlan(prepared);} });
      }}/></label>
      <button className="btn btn-secondary" disabled={busy} onClick={()=>void run(async()=>{await refresh();if(alive.current){setSelected([]);setPhotos(false);setCaptions(false);setPrinting(true);} })}>{t('Préparer un souvenir imprimable')}</button></div>
    {detached.length>0&&<div className="notice"><p>{t('{count} souvenir(s) de journées supprimées restent dans le paquet.',{count:detached.length})}</p><label><input type="checkbox" checked={cleanDetached} onChange={e=>setCleanDetached(e.target.checked)}/>{t('Je confirme la suppression des souvenirs de journées supprimées.')}</label><button className="btn btn-secondary" disabled={busy||!cleanDetached} onClick={()=>void run(async()=>{await writeSouvenirs(scope,trip,detached.map(row=>({day:row.day,before:row.revision,value:null})));await refresh();setCleanDetached(false);})}>{t('Nettoyer les souvenirs détachés')}</button></div>}
    {busy&&<p role="status">{t('Chargement…')}</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
    {plan&&<Modal title={t('Importer un paquet souvenirs')} onClose={()=>{if(!busy)setPlan(null);}}><p>{t('Destination : {name}',{name:state.journey!.title})}</p><p>{t('Seules les journées reconnues sans souvenir existant sont ajoutées. Les autres restent inchangées : {count}.',{count:plan.skipped})}</p><ul>{plan.writes.map(w=><li key={w.day}>{days.find(d=>d.id===w.day)?.title}<Photo blob={w.value?.photo} alt={t('Photo personnelle')}/><p>{w.value?.caption}</p></li>)}</ul><button className="btn btn-primary" disabled={busy||!plan.writes.length} onClick={()=>void run(async()=>{await writeSouvenirs(scope,trip,plan.writes);await refresh();setPlan(null);setMessage(t('Souvenir enregistré sur cet appareil.'));})}>{t('Confirmer la restauration')}</button>{error&&<p role="alert">{error}</p>}</Modal>}
    {exporting&&<Modal title={t('Télécharger le paquet souvenirs')} onClose={()=>setExporting(false)}><p>{t('Ce paquet contient toutes les photos et légendes de ce carnet, y compris les journées supprimées. Il ne contient pas le carnet : conserve aussi sa sauvegarde habituelle.')}</p><ul>{rows.map(row=><li key={row.day}>{days.find(d=>d.id===row.day)?.title || row.day}<Photo blob={row.photo} alt={t('Photo personnelle')}/><p>{row.caption}</p></li>)}</ul><button className="btn btn-primary" disabled={busy} onClick={()=>void run(async()=>{const raw=await exportSouvenirs(rows);if(alive.current){downloadText(raw,'detours-souvenirs-v1.json');setExporting(false);}})}>{t('Confirmer le téléchargement personnel')}</button>{error&&<p role="alert">{error}</p>}</Modal>}
    {printing&&<Modal title={t('Préparer un souvenir imprimable')} onClose={()=>setPrinting(false)} wide>
      <p>{t('Choisis les journées. Seuls leurs titres et dates sont inclus par défaut. Réservations, dépenses, documents, notes privées et adresses sont exclus. Vérifie les titres et l’aperçu avant impression.')}</p>
      <fieldset><legend>{t('Choisir les journées à imprimer')}</legend>{days.map(d=><label className="souvenir-choice" key={d.id}><input type="checkbox" checked={selected.includes(d.id)} onChange={e=>setSelected(list=>e.target.checked?[...list,d.id]:list.filter(id=>id!==d.id))}/>{d.title}</label>)}</fieldset>
      <label className="souvenir-choice"><input type="checkbox" checked={photos} onChange={e=>setPhotos(e.target.checked)}/>{t('J’inclus mes photos personnelles dans l’impression.')}</label>
      <label className="souvenir-choice"><input type="checkbox" checked={captions} onChange={e=>setCaptions(e.target.checked)}/>{t('J’inclus mes légendes personnelles dans l’impression.')}</label>
      <p>{t('Impression navigateur : choisis Enregistrer en PDF si disponible. Aucun PDF automatique ni envoi externe.')}</p>
      <div className="souvenir-preview">{pages}</div><button className="btn btn-primary" disabled={!selected.length} onClick={()=>{
        const pending=Array.from(document.querySelectorAll<HTMLImageElement>('#souvenir-print-root img')).map(img=>img.decode());
        void Promise.all(pending).then(()=>{if(alive.current)window.print();}).catch(()=>setError(t('Photo illisible. Retire les photos de l’impression ou remplace la copie locale.')));
      }}>{t('Imprimer les journées choisies')}</button>{error&&<p role="alert">{error}</p>}
      {createPortal(<div id="souvenir-print-root">{pages}</div>,document.body)}
    </Modal>}
  </details>;
}
