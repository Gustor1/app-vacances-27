import { useState } from 'react';
import { Download } from 'lucide-react';
import { useLocale } from '../i18n';
import { resolveRecord, contentRaw } from '../cloud/engine';
import { AccountStorage, type SyncRecord } from '../cloud/storage';
import { parseTrip } from '../journeys';
import { downloadText } from '../lib';
import './AccountPanel.css';
export default function ConflictCard({ storage, keyName:key, record:r, onResolved, onError }: {storage:AccountStorage;keyName:string;record:SyncRecord;onResolved:()=>void|Promise<void>;onError:(message:string)=>void}){
 const {t}=useLocale();const [choices,setChoices]=useState<Record<string,'local'|'remote'>>({});
   function conflictLabel(path: string, raw: string) {
    const labels: Record<string, string> = { title: 'Titre', description: 'Description', address: 'Adresse', status: 'Statut', countries: 'Pays du voyage', departureDate: 'Date de départ', endDate: 'Date de retour (facultative)', palette: 'Palette', wishes: 'Pays qui me tentent', year: 'Année (facultative)', date: 'Date', label: 'Souvenir du séjour', reference: 'Référence de réservation', booked: 'Réservé', general: 'Notes personnelles', $order: 'Ordre des étapes', $deleted: 'Suppression du carnet', $attachment: 'Deux sources à comparer' };
    const field = path.split('.').at(-1) || '';
    const ids = [...path.matchAll(/\[([^\]]+)\]/g)].map(match => match[1]);
    let names: string[] = [];
    try { const state = parseTrip(raw).state; names = state.cities.flatMap(c => [c, ...c.days.flatMap(d => [d, ...d.steps])]).filter(row => ids.includes(row.id)).map(row => 'name' in row ? row.name : row.title); } catch { /* World conflicts have no itinerary entities. */ }
    return [...names, t(Object.hasOwn(labels, field) ? labels[field] : 'Champ modifié')].join(' · ');
  }
  function describe(value: unknown) {
    if (value === undefined) return t('Supprimé');
    if (value === null) return t('Aucune valeur');
    if (typeof value === 'boolean') return t(value ? 'Oui' : 'Non');
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(row => typeof row === 'string' ? row : row?.title || row?.name || row?.label || t('Élément')).join(' → ');
    if (typeof value === 'object') return 'title' in value ? String(value.title) : 'name' in value ? String(value.name) : t('Contenu modifié');
    return '';
  }

 return <section className="account-conflict" ><h3>{t('Conflit à résoudre')} · {(() => { try { return parseTrip(r.raw).state.journey!.title; } catch { return t('Mon monde'); } })()}</h3><p>{t('Les deux versions sont conservées. Choisis les valeurs à garder avant le prochain envoi.')}</p><div className="conflict-exports"><button className="btn btn-secondary" onClick={() => downloadText(r.raw, 'detours-version-locale.json')}><Download size={14}/>{t('Exporter ma version')}</button><button className="btn btn-secondary" onClick={() => { try { downloadText(contentRaw(key, r.conflict!.remote), 'detours-version-distante.json'); } catch { downloadText(JSON.stringify(r.conflict!.remote, null, 2), 'detours-source-distante.json'); } }}><Download size={14}/>{t('Exporter la version distante')}</button></div>
          {!r.conflict!.remoteDeleted && <div className="conflict-bulk"><button className="btn btn-secondary" onClick={()=>setChoices(Object.fromEntries(r.conflict!.fields.map(f=>[key+f.path,'local'])))}>{t('Garder ma version pour toutes les différences')}</button><button className="btn btn-secondary" onClick={()=>setChoices(Object.fromEntries(r.conflict!.fields.map(f=>[key+f.path,'remote'])))}>{t('Garder la version distante pour toutes les différences')}</button></div>}
          {r.conflict!.remoteDeleted ? <p>{t('Ce carnet a été supprimé à distance. Exporte ta version pour créer une nouvelle copie ; le carnet supprimé ne sera pas recréé.')}</p> : r.conflict!.fields.map(f => <fieldset key={f.path}><legend>{conflictLabel(f.path, r.raw)}</legend><div className="conflict-choices">{(['local', 'remote'] as const).map(side => <div className="conflict-choice" key={side}><label><input type="radio" name={key + f.path} checked={choices[key + f.path] === side} onChange={() => setChoices({ ...choices, [key + f.path]: side })}/><span className="conflict-choice-body"><strong>{t(side === 'local' ? 'Sur cet appareil' : 'Version distante')}</strong><span>{describe(f[side])}</span></span></label><details><summary>{t('Comparer les données complètes')}</summary><pre>{JSON.stringify(f[side], null, 2) ?? t('Supprimé')}</pre></details></div>)}</div></fieldset>)}
          <button className="btn btn-primary" disabled={!r.conflict!.remoteDeleted && r.conflict!.fields.some(f => !choices[key + f.path])} onClick={() => { try { resolveRecord(storage, key, Object.fromEntries(r.conflict!.fields.map(f => [f.path, choices[key + f.path]]))); void onResolved(); } catch { onError(t('Résolution impossible. Exporte les deux versions et réessaie.')); } }}>{t(r.conflict!.remoteDeleted ? 'Conserver la suppression distante' : 'Appliquer mes choix')}</button></section>;
}
