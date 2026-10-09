import { useEffect, useId, useRef, useState } from 'react';
import { Cloud, Download, RefreshCw, LogIn, LogOut, UserRound, ChevronDown } from 'lucide-react';
import { Modal } from '../App';
import { useLocale } from '../i18n';
import { useCloud } from '../cloud/CloudProvider';
import { AccountStorage } from '../cloud/storage';
import ConflictCard from './ConflictCard';
import { archive, listTrips, tripKey } from '../journeys';
import { downloadText } from '../lib';
import { readWorld, writeWorld } from '../world';
import './AccountPanel.css';
import { useMapPreferences } from '../MapPreferences';

export default function AccountPanel() {
  const { t } = useLocale();
  const cloud = useCloud();
  const maps = useMapPreferences();
  const [opened, setOpened] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const control = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [logout, setLogout] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [withWorld, setWithWorld] = useState(false);
  const [message, setMessage] = useState('');
  const localTrips = (() => { try { return cloud.session ? listTrips(localStorage) : []; } catch { return []; } })();
  const records = (() => { try { return cloud.storage instanceof AccountStorage ? cloud.storage.records() : []; } catch { return []; } })();
  const conflictRecords = records.filter(([, r]) => r.conflict);
  const hasAccount = !!cloud.session || !!cloud.storage.accountId;
  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => { if (!control.current?.contains(event.target as Node)) setMenuOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menuOpen]);
  function openAccount(confirmLogout = false) { setMenuOpen(false); setLogout(confirmLogout); setOpened(true); }
  function disconnect() {
    setMenuOpen(false);
    if (cloud.pending || conflictRecords.length) { openAccount(true); return; }
    void cloud.signOut().catch(() => { setMessage(t('Déconnexion impossible. Réessaie.')); setOpened(true); });
  }
  function connect() {
    setMenuOpen(false);
    if (!navigator.onLine) setOpened(true);
    void cloud.signIn().catch(() => { setMessage(t('Connexion Google impossible. Réessaie.')); setOpened(true); });
  }
  function attach() {
    if (!(cloud.storage instanceof AccountStorage)) return;
    try {
      for (const original of localTrips.filter(trip => selected.includes(trip.journey!.id))) {
        const state = structuredClone(original);
        // Stable per-owner mapping: retries/device copies use the same ID. A
        // differing ancient source becomes an explicit attachment conflict.
        const id = cloud.session!.user.id + '~' + original.journey!.id;
        if (!cloud.storage.record(tripKey(id))) { state.journey!.id = id; state.journey!.followsCatalog = false; cloud.storage.setItem(tripKey(id), JSON.stringify(archive(state))); }
      }
      if (withWorld) {
        const source = readWorld(localStorage), current = readWorld(cloud.storage);
        const visits = new Map(current.visits.map(v => [v.id, v]));
        source.visits.forEach(v => { const mapped = { ...v, ...(v.journeyId ? { journeyId: cloud.session!.user.id + '~' + v.journeyId, ...(v.stayId === v.journeyId ? { id: 'visit:' + cloud.session!.user.id + '~' + v.journeyId + ':' + v.country } : {}), stayId: v.stayId === v.journeyId ? cloud.session!.user.id + '~' + v.stayId : v.stayId } : {}) }; if (!visits.has(mapped.id) && ![...visits.values()].some(x => x.stayId === mapped.stayId && x.country === mapped.country)) visits.set(mapped.id, mapped); });
        writeWorld(cloud.storage, { ...current, visits: [...visits.values()], wishes: [...new Set([...current.wishes, ...source.wishes])] });
      }
      setMessage(t('Copies rattachées. Les originaux restent sur cet appareil.')); setSelected([]); setWithWorld(false); void cloud.sync();
    } catch { setMessage(t('Rattachement incomplet. Les originaux sont conservés ; tu peux réessayer.')); }
  }
  return <><div className="account-control" ref={control}>
    <button ref={trigger} type="button" className="account-button" aria-label={t(hasAccount ? 'Mon compte' : 'Connexion')} title={t(hasAccount ? 'Mon compte' : 'Connexion')} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(value => !value)}>{hasAccount ? <UserRound size={17} aria-hidden="true"/> : <LogIn size={17} aria-hidden="true"/>}<span className="account-button-label">{t(hasAccount ? 'Mon compte' : 'Connexion')}</span><ChevronDown className="account-button-chevron" size={14} aria-hidden="true"/></button>
    {menuOpen && <div id={menuId} className="account-menu" role="group" aria-label={t('Actions du compte')}>
      <div className="account-menu-heading">{hasAccount && <strong>{cloud.session?.user.email || t('Mon compte')}</strong>}<span className="account-status"><Cloud size={14}/>{t(cloud.status)}</span></div>
      {!cloud.session && cloud.configured && <button type="button" onClick={connect}><LogIn size={16}/>{t('Se connecter avec Google')}</button>}
      <button type="button" onClick={() => openAccount()}><Download size={16}/>{t('Mon compte et mes sauvegardes')}</button>
      {cloud.session && <button type="button" onClick={() => { setMenuOpen(false); void cloud.sync(); }}><RefreshCw size={16}/>{t('Synchroniser maintenant')}</button>}
      {hasAccount && <button type="button" onClick={disconnect}><LogOut size={16}/>{t('Se déconnecter')}</button>}
    </div>}
    {cloud.error && <p className="account-error" role="alert">{t(cloud.error)}</p>}
    </div>
    {opened && <Modal title={t('Mon compte et mes sauvegardes')} onClose={() => { setOpened(false); setLogout(false); requestAnimationFrame(() => trigger.current?.focus()); }}>
      <div className="account-panel"><p className="sync-state" role="status">{t(cloud.status)}{cloud.pending ? ` · ${t('{count} envoi(s) en attente', { count: cloud.pending })}` : ''}</p>
        <section className="account-preferences"><h3>{t('Préférences')}</h3><label className="field">{t('Application de cartes préférée')}<select aria-label={t('Application de cartes préférée')} value={maps.provider} onChange={event => maps.setProvider(event.target.value === 'amap' ? 'amap' : 'google')}><option value="google">Google Maps</option><option value="amap">Amap</option></select></label><p className="muted small">{t('Ce choix s’applique aux lieux et aux trajets de tous tes carnets. Amap est surtout utile en Chine.')}</p><p className="muted small" role="status">{t(maps.error ? 'Ce choix reste actif pour cette session, mais sa sauvegarde est indisponible.' : 'Ce choix est mémorisé pour ton compte sur cet appareil. Sans compte, il reste local à cet appareil.')}</p></section>
        {!cloud.session ? <><p>{t('Utilise Détours sans compte, ou retrouve tes carnets sur tes appareils avec Google.')}</p>{cloud.storage.accountId && <div className="notice"><p>{t('La session a expiré. Les carnets téléchargés de ce compte restent accessibles et exportables sur cet appareil. Reconnecte-toi pour les synchroniser.')}</p><button className="text-btn" onClick={() => setLogout(true)}>{t('Se déconnecter')}</button>{logout && <><p>{t(cloud.pending ? 'Des changements attendent un envoi. Ils resteront dans le cache isolé de ce compte. Exporte-les ou synchronise avant de quitter.' : 'Les copies de ce compte restent isolées sur cet appareil. Reconnecte-toi au même compte pour les retrouver.')}</p><div className="form-actions"><button className="btn btn-secondary" onClick={() => setLogout(false)}>{t('Annuler')}</button><button className="btn btn-primary" onClick={() => void cloud.signOut()}>{t('Confirmer la déconnexion')}</button></div></>}</div>}{cloud.configured ? <button className="btn btn-primary" onClick={connect}><LogIn size={16}/>{t('Se connecter avec Google')}</button> : <div className="notice"><p>{t('Les comptes ne sont pas encore activés dans cette bêta. Tes carnets restent enregistrés sur cet appareil et exportables.')}</p></div>}</> : <><p className="muted">{cloud.session.user.email}</p><p>{t('Les carnets téléchargés restent utilisables hors ligne. La synchronisation reprend quand Détours est ouvert avec Internet.')}</p><button className="btn btn-secondary" onClick={() => void cloud.sync()}><RefreshCw size={16}/>{t('Synchroniser maintenant')}</button>
        {localTrips.length > 0 && <section className="account-attach"><h3>{t('Rattacher mes carnets locaux')}</h3><p className="muted small">{t('Choisis les carnets à copier vers ce compte. Les sources locales sont conservées et rien n’est fusionné sur le seul titre.')}</p>{localTrips.map(trip => <label key={trip.journey!.id}><input type="checkbox" checked={selected.includes(trip.journey!.id)} onChange={e => setSelected(e.target.checked ? [...selected, trip.journey!.id] : selected.filter(id => id !== trip.journey!.id))}/>{trip.journey!.title}</label>)}<label><input type="checkbox" checked={withWorld} onChange={e => setWithWorld(e.target.checked)}/>{t('Rattacher aussi mes souvenirs et envies')}</label><button className="btn btn-primary" disabled={!selected.length && !withWorld} onClick={attach}>{t('Rattacher la sélection')}</button></section>}
        {conflictRecords.map(([key,r]) => <ConflictCard key={key+':'+r.conflict!.revision+':'+r.conflict!.privateRevision} storage={cloud.storage as AccountStorage} keyName={key} record={r} onResolved={()=>cloud.sync()} onError={setMessage}/>)}
        {records.filter(([, r]) => r.revoked).map(([key, r]) => <section key={key} className="notice"><p>{t('Un accès a été retiré. Le travail conservé sur cet appareil peut être exporté comme copie personnelle.')}</p><button className="text-btn" onClick={() => downloadText(r.raw, 'detours-copie-acces-retire.json')}>{t('Exporter ma version')}</button></section>)}
        <section className="account-logout">{!logout ? <button className="text-btn" onClick={() => setLogout(true)}>{t('Se déconnecter')}</button> : <div className="notice"><p>{t(cloud.pending ? 'Des changements attendent un envoi. Ils resteront dans le cache isolé de ce compte. Exporte-les ou synchronise avant de quitter.' : 'Les copies de ce compte restent isolées sur cet appareil. Reconnecte-toi au même compte pour les retrouver.')}</p><div className="form-actions"><button className="btn btn-secondary" onClick={() => setLogout(false)}>{t('Annuler')}</button><button className="btn btn-primary" onClick={() => void cloud.signOut()}>{t('Confirmer la déconnexion')}</button></div></div>}</section></>}
        {cloud.error && <p className="practical-error" role="alert">{t(cloud.error)}</p>}{message && <p role="status">{message}</p>}
      </div></Modal>}
    </>;
}
