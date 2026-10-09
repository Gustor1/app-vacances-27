import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Copy, Download, LockKeyhole, MapPin, Users } from 'lucide-react';
import { Modal } from '../App';
import { useLocale } from '../i18n';
import { useCloud } from '../cloud/CloudProvider';
import { supabase } from '../cloud/client';
import { splitContent, joinContent } from '../cloud/projection';
import { AccountStorage } from '../cloud/storage';
import { archive, tripKey, readTrip, parseTrip } from '../journeys';
import { downloadText } from '../lib';
import type { StoredState } from '../types';
import MapActions from './MapActions';
import './SharedTrip.css';
import './SharePanel.css';
import { useRoster, sharingCategories, categoryLabels, type Collaborator } from './TripCollaboration';

type Invitation = { id: string; expires_at: string; accepted: boolean; cancelled: boolean };
type Member = Collaborator;
type Version = { revision: number; author_id: string; created_at: string; action: string };
const INVITATION_KEY = 'detours-pending-invitation';
function pendingInvitation() {
  try {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get('invite');
    if (token && /^[a-f0-9]{64}$/.test(token)) { sessionStorage.setItem(INVITATION_KEY, token); history.replaceState(null, '', location.pathname + location.search); return token; }
    return sessionStorage.getItem(INVITATION_KEY);
  } catch { return null; }
}
export function InvitationBanner({ onAccepted }: { onAccepted: (id: string) => void }) {
  const { t } = useLocale();
  const cloud = useCloud();
  const [token, setToken] = useState(pendingInvitation);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const receive = () => { setToken(pendingInvitation()); setError(''); };
    window.addEventListener('hashchange', receive);
    return () => window.removeEventListener('hashchange', receive);
  }, []);
  if (!token) return null;
  return <section className="notice invitation-banner" aria-labelledby="invitation-title">
    <span className="invitation-icon" aria-hidden="true"><Users size={24}/></span>
    <div className="invitation-copy"><h2 id="invitation-title">{t('Une invitation privée t’attend')}</h2><p>{t('Accepter donne un accès en lecture au carnet. Cela ne confirme aucune participation au voyage.')}</p><p className="muted">{t('Ton adresse mail sera visible au créateur et aux autres membres de ce carnet privé.')}</p>{error && <p role="alert">{error}</p>}</div>
    <div className="invitation-actions">{cloud.session ? <button className="btn btn-primary" disabled={busy} onClick={async () => { setBusy(true); try { const id = await cloud.rpc<string>('detours_accept_invite', { p_token: token }); await cloud.download(id); await cloud.sync(); sessionStorage.removeItem(INVITATION_KEY); setToken(null); onAccepted(id); } catch { setError(t('Invitation expirée, annulée ou déjà utilisée. Demande un nouveau lien au propriétaire.')); } finally { setBusy(false); } }}>{t('Accepter l’invitation')}</button> : cloud.configured ? <button className="btn btn-primary" onClick={() => void cloud.signIn()}>{t('Se connecter avec Google')}</button> : <p>{t('Les comptes ne sont pas encore activés dans cette bêta.')}</p>}<button className="text-btn" onClick={() => { sessionStorage.removeItem(INVITATION_KEY); setToken(null); }}>{t('Ignorer l’invitation')}</button></div>
  </section>;
}
export function ReadOnlyTrip({ state, onHome, onCopy, accountControl }: { state: StoredState; onHome: () => void; onCopy: () => void; accountControl?: ReactNode }) {
  const { t } = useLocale();
  // Render only the existing sharing whitelist, including when showing a cached copy.
  const shared = splitContent(state).shared;
  const journey = shared.journey!;
  const days = shared.cities.reduce((count, city) => count + city.days.length, 0);
  const activities = shared.cities.reduce((count, city) => count + city.days.reduce((total, day) => total + day.steps.length, 0), 0);
  return <main className="read-only-trip">
    <div className="read-only-topbar"><button className="btn btn-secondary" onClick={onHome}><ArrowLeft size={16}/>{t('Mes voyages')}</button>{accountControl}</div>
    <header className="panel shared-trip-header">
      <div className="shared-trip-intro"><p className="eyebrow"><LockKeyhole size={13}/>{t('Carnet partagé · lecture seule')}</p><h1>{journey.title}</h1>{journey.destinations && <p className="shared-trip-destination"><MapPin size={16}/>{journey.destinations}</p>}{journey.description && <p className="shared-trip-description">{journey.description}</p>}
        <dl className="shared-trip-stats"><div><dt>{t('Étapes du voyage')}</dt><dd>{shared.cities.length}</dd></div><div><dt>{t('Journées prévues')}</dt><dd>{days}</dd></div><div><dt>{t('Activités prévues')}</dt><dd>{activities}</dd></div></dl>
      </div>
      <aside className="shared-trip-actions"><h2>{t('Garder ce carnet')}</h2><p>{t('Crée une version à toi pour ajouter tes idées, ou télécharge le planning partagé.')}</p><button className="btn btn-primary" onClick={onCopy}><Copy size={16}/>{t('Créer ma copie')}</button><button className="btn btn-secondary" onClick={() => downloadText(JSON.stringify(archive(shared), null, 2), 'detours-carnet-partage.json')}><Download size={16}/>{t('Exporter le planning partagé')}</button><details className="shared-trip-privacy"><summary>{t('À propos de cet accès')}</summary><p>{t('Les notes et références privées du propriétaire ne sont pas partagées. Une copie téléchargée reste sur l’appareil après révocation.')}</p></details></aside>
    </header>
    <section className="shared-trip-planning" aria-labelledby="shared-planning-title"><div className="shared-planning-heading"><h2 id="shared-planning-title">{t('Le planning partagé')}</h2><p>{t('Consulte les étapes préparées par le propriétaire du carnet.')}</p></div>
      {!shared.cities.length ? <div className="panel shared-trip-empty"><span aria-hidden="true"><BookOpen size={30}/></span><div><h3>{t('Le voyage prend forme')}</h3><p>{t('Aucune étape n’a encore été ajoutée. Le planning apparaîtra ici lorsque le propriétaire le complétera.')}</p><p className="muted">{t('Pour proposer tes idées directement dans ce carnet, demande au propriétaire un accès éditeur.')}</p></div></div> : <div className="shared-cities">{shared.cities.map((city, index) => <section className="panel shared-city" key={city.id}>
        <header className="shared-city-heading"><span className="shared-city-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3>{city.name}</h3>{city.subtitle && <p>{city.subtitle}</p>}</div></header>
        {!city.days.length && <p className="shared-day-empty">{t('Les journées de cette étape restent à préparer.')}</p>}
        {city.days.map(day => <section className="shared-day" key={day.id}><header><h4>{day.title}</h4>{day.date && <span>{day.date}</span>}</header>{day.steps.length ? <ol className="shared-steps">{day.steps.map((step, i) => <li key={step.id}><div className="shared-step-title"><h5>{step.title}</h5>{step.period && <span>{step.period}</span>}</div>{step.description && <p>{step.description}</p>}{step.address && <p className="shared-step-address"><MapPin size={14}/>{step.address}</p>}<MapActions city={city} place={step} next={day.steps[i + 1]}/></li>)}</ol> : <p className="shared-day-empty">{t('Les activités de cette journée restent à préparer.')}</p>}</section>)}
      </section>)}</div>}
    </section>
  </main>;
}
export default function SharePanel({ state, onClose }: { state: StoredState; onClose: () => void }) {
  const { t, dateLocale } = useLocale();
  const cloud = useCloud();
  const id = state.journey!.id;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const {people,refresh:refreshPeople}=useRoster(state.journey!.id);
  const members:Member[]=people.filter(person=>person.role!=='owner');
  const [versions, setVersions] = useState<Version[]>([]);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [includeAll,setIncludeAll]=useState(true);
  const [fieldOverrides,setFieldOverrides]=useState<Record<string,string[]>>({});
  const [restore, setRestore] = useState<number | null>(null);
  const [restoringContent, setRestoringContent] = useState<StoredState | null>(null);
  const content = splitContent(state);
  const record = cloud.storage instanceof AccountStorage ? cloud.storage.record(tripKey(id)) : null;
  const owner = record?.role === 'owner';
  const completePreview=!!record?.fullSharing||(owner&&includeAll);
  const sharedPreview=record?.fullSharing?parseTrip(record.raw).state:completePreview?state:content.shared;
  const collaborationEnabled = import.meta.env.VITE_ENABLE_COLLABORATION === 'true';
  const writable = owner || (record?.role === 'editor' && collaborationEnabled);
  const synced = !!record?.revision && !record.pending && !record.conflict;
  async function refresh() {
    if (!supabase || !record?.revision || !cloud.session) return;
    try {
      const [i, , v] = await Promise.all([
        owner ? cloud.rpc<Invitation[]>('detours_list_invites', { p_trip: id }) : Promise.resolve([]),
        refreshPeople(),
        supabase.from('detours_versions').select('revision,author_id,created_at,action').setHeader('Authorization', 'Bearer ' + cloud.session!.access_token).eq('trip_id', id).order('revision', { ascending: false }).limit(30),
      ]);
      if (v.error) throw v.error;
      setInvitations(i); setVersions(v.data as Version[]);
      window.dispatchEvent(new CustomEvent('detours-roster-updated',{detail:id}));
    } catch { setError(t('Accès au partage indisponible. Tes données locales sont conservées.')); }
  }
  useEffect(() => { void refresh(); }, [id, cloud.session?.user.id, record?.revision, owner]);
  async function run(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); await refresh(); } catch { setError(t('Partage non terminé. Compare les différences de ce carnet ou réessaie avec Internet. Tes changements sont conservés.')); } finally { setBusy(false); } }
  async function prepareSharing() {
    if(!navigator.onLine)throw new Error('offline');
    await cloud.sync();
    const pending=(cloud.storage as AccountStorage).record(tripKey(id));
    if(pending?.pending&&!pending.conflict)await cloud.sync();
    const latest=(cloud.storage as AccountStorage).record(tripKey(id));
    if(!latest?.revision||latest.pending||latest.conflict||latest.revoked)throw new Error('sync-required');
    if(includeAll&&!latest.fullSharing){await cloud.rpc('detours_enable_full_share',{p_trip:id});await cloud.download(id);}
  }
  async function changeFields(member:Member,category:string,checked:boolean) {
    const previous=member.share_fields||[...sharingCategories];
    const fields=checked?[...new Set([...previous,category])]:previous.filter(field=>field!==category);
    setFieldOverrides(current=>({...current,[member.user_id]:fields}));
    await run(async()=>{await cloud.rpc('detours_set_share_fields',{p_trip:id,p_user:member.user_id,p_fields:fields});await cloud.sync();});
    setFieldOverrides(current=>{const next={...current};delete next[member.user_id];return next;});
  }
  return <Modal title={t('Partager et historique')} onClose={onClose} wide><div className="share-panel">
    <header className="share-intro"><span className="share-intro-icon" aria-hidden="true"><Users size={24}/></span><div><h3>{t('Préparer le voyage ensemble')}</h3><p className="share-trip-name">{state.journey!.title}</p><p className="muted">{t('Invitation privée, accès en lecture seule, compte obligatoire.')}</p></div></header>
    <details className="share-help"><summary>{t('Comment partager avec mes amis ?')}</summary><ol className="share-guide"><li>{t('Envoie un lien différent à chaque ami. Il expire après 72 h et ne sert qu’une fois.')}</li><li>{t('Ton ami se connecte avec Google et accepte l’invitation.')}</li><li>{t(collaborationEnabled ? 'Après son acceptation, autorise les modifications dans Membres pour préparer le planning ensemble.' : 'Les invitations donnent un accès en lecture. L’édition entre amis sera disponible après activation de la collaboration.')}</li></ol></details>
    {!cloud.session ? <div className="notice share-sync-needed"><p>{t('Connecte-toi pour partager ce carnet. La synchronisation se lancera automatiquement.')}</p><p>{t('Ce carnet sera copié vers ton compte après la connexion. L’original reste sur cet appareil.')}</p>{cloud.configured && <button className="btn btn-secondary" onClick={() => {if(!cloud.storage.accountId)sessionStorage.setItem('detours-share-after-signin',id);void cloud.signIn();}}>{t('Se connecter avec Google')}</button>}</div> : <>
      {owner && <>
        <section className="share-card share-create"><div><h3>{t('Inviter un ami')}</h3><p>{t('Envoie un lien différent à chaque ami. Il expire après 72 h et ne sert qu’une fois.')}</p></div><button className="btn btn-primary" disabled={busy} onClick={() => void run(async () => { await prepareSharing(); const invite = await cloud.rpc<{ token: string }>('detours_invite', { p_trip: id }); setLink(location.origin + import.meta.env.BASE_URL + '#invite=' + invite.token); setCopied(false); })}>{t(busy?'Synchronisation et préparation du partage…':'Créer un lien privé valable 72 h')}</button>
          <div className="share-scope"><label><input type="checkbox" checked={record?.fullSharing||includeAll} disabled={!!record?.fullSharing||busy} onChange={event=>setIncludeAll(event.target.checked)}/><span>{t('Partager le carnet complet : notes, réservations, dépenses et documents inclus.')}</span></label><p>{t('Les adresses mail du créateur et des collaborateurs sont visibles aux membres de ce carnet privé.')}</p>{!record?.fullSharing&&<button className="btn btn-secondary" disabled={busy||!includeAll} onClick={()=>void run(prepareSharing)}>{t('Activer le carnet commun pour les membres actuels')}</button>}{!synced&&<p role="status">{t(record?.conflict?'Ce carnet a des différences à comparer avant de créer le lien.':'Le partage enverra automatiquement les changements en attente.')}</p>}</div>
          {link && <div className="share-link"><label className="field">{t('Lien à transmettre toi-même')}<input readOnly value={link} onFocus={e => e.target.select()}/></label><div className="share-row-actions"><button className="btn btn-secondary" onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => setError(t('Sélectionne le lien pour le copier.')))}><Copy size={14}/>{t('Copier le lien')}</button>{copied && <span role="status">{t('Lien copié')}</span>}</div></div>}
        </section>
        <div className="share-access-grid">
          <section className="share-card"><div className="share-card-heading"><h3>{t('Membres')}</h3><button className="text-btn" disabled={busy} onClick={() => void run(async () => {})}>{t('Actualiser les accès')}</button></div><p className="muted">{t('Un lecteur consulte le carnet. Un éditeur peut le modifier. Seul le propriétaire gère les accès et supprime le carnet.')}</p>{people.filter(person=>person.role==='owner').map(person=><div className="share-member" key={person.user_id}><div className="share-member-name"><strong>{person.email||person.display_name}</strong><span className="share-role">{t('Créateur')}</span></div></div>)}{!members.length && <p className="share-empty">{t('Aucun membre pour le moment.')}</p>}{members.map(m => <div className="share-member" key={m.user_id}><div className="share-member-name"><strong>{m.email||m.display_name}</strong><span className="share-role">{t(m.role === 'editor' ? 'Éditeur' : 'Lecteur')}</span></div><div className="share-row-actions"><label className="field">{t('Rôle de {name}',{name:m.email||m.display_name})}<select aria-label={t('Rôle de {name}',{name:m.email||m.display_name})} value={m.role} disabled={busy||!navigator.onLine} onChange={event=>{const role=event.target.value;void run(async()=>{await cloud.rpc('detours_set_member',{p_trip:id,p_user:m.user_id,p_role:role});});}}><option value="reader">{t('Lecteur')}</option><option value="editor" disabled={!collaborationEnabled}>{t('Éditeur')}</option></select></label><button disabled={busy} className="text-btn" onClick={() => void run(async () => { await cloud.rpc('detours_set_member', { p_trip: id, p_user: m.user_id, p_role: 'remove' }); })}>{t('Retirer l’accès')}</button></div><details className="share-advanced"><summary>{t('Options avancées de ce collaborateur')}</summary><p>{t('Les catégories masquées ne sont ni visibles ni modifiables par cette personne.')}</p>{sharingCategories.map(category=><label key={category}><input type="checkbox" checked={(fieldOverrides[m.user_id]||m.share_fields||sharingCategories).includes(category)} disabled={busy||!record?.fullSharing} onChange={event=>void changeFields(m,category,event.target.checked)}/><span>{t(categoryLabels[category])}</span></label>)}</details></div>)}<p className="share-footnote">{t('La révocation bloque les prochains accès au serveur. Elle ne retire pas une copie déjà téléchargée ou exportée.')}</p></section>
          <section className="share-card"><h3>{t('Invitations')}</h3>{!invitations.length && <p className="share-empty">{t('Aucune invitation.')}</p>}{invitations.map(i => <div className="share-invitation" key={i.id}><div><span className="share-role">{t(i.cancelled ? 'Annulée' : i.accepted ? 'Acceptée' : new Date(i.expires_at).getTime() < Date.now() ? 'Expirée' : 'En attente')}</span><p>{new Date(i.expires_at).toLocaleString(dateLocale)}</p></div>{!i.cancelled && !i.accepted && <button className="text-btn" disabled={busy} onClick={() => void run(async () => { await cloud.rpc('detours_manage_invite', { p_id: i.id }); setLink(''); })}>{t('Annuler')}</button>}</div>)}</section>
        </div>
      </>}
      <section className="share-card"><h3>{t('Historique du planning')}</h3><p className="muted">{t('Les 30 dernières versions du planning sont conservées. Restaurer crée une nouvelle version sans modifier les droits ni les détails actuels du carnet.')}</p>{!versions.length && <p className="share-empty">{t('Aucune version pour le moment.')}</p>}{versions.map(v => <div className="share-version" key={v.revision}><div><strong>{t('Version {revision}', { revision: v.revision })} · {t(v.action === 'restore' ? 'Restauration' : v.action === 'delete' ? 'Suppression' : 'Modification')}</strong><p>{new Date(v.created_at).toLocaleString(dateLocale)} · {v.author_id === cloud.session?.user.id ? t('Moi') : t('Membre {id}', { id: v.author_id.slice(0, 8) })}</p></div><button className="btn btn-secondary" disabled={busy} onClick={() => void run(async () => { const { data, error } = await supabase!.from('detours_versions').select('content').setHeader('Authorization', 'Bearer ' + cloud.session!.access_token).eq('trip_id', id).eq('revision', v.revision).single(); if (error) throw error; setRestoringContent(data.content as StoredState); setRestore(v.revision); })}>{t('Voir cette version')}</button></div>)}</section>
      {restore && restoringContent && <section className="share-card share-restore"><h3>{t('Version {revision}', { revision: restore })}</h3><p>{restoringContent.journey!.title} · {restoringContent.cities.length} {t('étapes')}</p><div className="share-row-actions"><button className="btn btn-secondary" onClick={() => downloadText(JSON.stringify(archive(restoringContent), null, 2), 'detours-version-' + restore + '.json')}><Download size={14}/>{t('Exporter cette version')}</button>{writable && <button className="btn btn-primary" disabled={busy || !synced} onClick={() => void run(async () => {
        const storage = cloud.storage as AccountStorage;
        const current = storage.record(tripKey(id))!;
        if (current.pending || current.conflict) throw new Error('Pending edits');
        // Persist the restoration before sending, just like an ordinary edit.
        const latest = readTrip(storage, id);
        const desired = joinContent({ shared: restoringContent, private: splitContent(latest).private });
        storage.setItem(tripKey(id), JSON.stringify(archive(desired)));
        const sent = storage.record(tripKey(id))!;
        storage.put(tripKey(id), { ...sent, action: 'restore', pending: true });
        await cloud.sync();
        setRestore(null); setRestoringContent(null);
      })}>{t('Restaurer cette version')}</button>}</div></section>}
    </>}
    <section className="share-card share-privacy"><h3><LockKeyhole size={16}/>{t('Ce que tu partages')}</h3><p className="muted">{t(record?.fullSharing?'Ce carnet est commun : planning, notes, réservations, dépenses et documents. Les options avancées limitent les catégories visibles par chaque membre.':completePreview?'La création du lien activera le carnet commun, avec les notes, réservations, dépenses et documents.':'Le planning, les adresses, les hébergements et les coups de cœur seront partagés. Les notes, références de réservation, dépenses, documents et visites personnelles restent privés.')}</p><details><summary>{t('Voir exactement le contenu partagé')}</summary><div className="share-preview"><pre>{JSON.stringify(sharedPreview, null, 2)}</pre></div></details><div className="share-row-actions"><button className="btn btn-secondary" onClick={() => downloadText(JSON.stringify(archive(sharedPreview), null, 2), 'detours-apercu-partage.json')}><Download size={16}/>{t(completePreview?'Exporter le carnet partagé':'Exporter le planning partagé')}</button></div></section>
    {error && <div className="share-error"><p className="practical-error" role="alert">{error}</p><button className="btn btn-secondary" onClick={()=>{onClose();window.dispatchEvent(new CustomEvent('detours-resolve-trip',{detail:id}));}}>{t('Voir la synchronisation')}</button></div>}
  </div></Modal>;
}
