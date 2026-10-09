import { useLocale } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, WifiOff } from 'lucide-react';
import { useCloud } from '../cloud/CloudProvider';
import { archive, parseTrip, tripKey } from '../journeys';
import { checkOfflineAssets, contentDigest, offlineReceiptKey, readOfflineReceipt, type OfflineAssets, type OfflineReceipt } from '../offline';
import { localeFor } from '../locale-utils';
import type { StoredState } from '../types';
import './OfflineStatus.css';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function OfflineStatus({ state, saving, storageError }: { state: StoredState; saving: boolean; storageError: string }) {
  const { t, language } = useLocale();
  const cloud = useCloud();
  const [status, setStatus] = useState<'checking'|'ready'|'missing'|'dev'>('checking');
  const [install, setInstall] = useState<InstallEvent|null>(null);
  const [receipt, setReceipt] = useState<OfflineReceipt|null>(null);
  const [result, setResult] = useState<{ assets: OfflineAssets; saved: boolean; signature: string } | null>(null);
  const latest = useRef({ state, saving, storageError }); latest.current = { state, saving, storageError };
  const generation = useRef(0);
  const signature = JSON.stringify(archive(state));
  const receiptKey = offlineReceiptKey(cloud.scope, state.journey!.id);
  const current = !!result && result.signature === signature && !saving && !storageError;
  const ready = status === 'ready' && current;

  async function check() {
    const ticket = ++generation.current;
    setStatus('checking');
    const snapshot = latest.current;
    const checkedSignature = JSON.stringify(archive(snapshot.state));
    let saved = false;
    let assets: OfflineAssets = { ready: false, mapReady: false, buildId: null, missing: ['manifest'] };
    try {
      const raw = cloud.storage.getItem(tripKey(snapshot.state.journey!.id));
      saved = !!raw && !snapshot.saving && !snapshot.storageError && JSON.stringify(archive(parseTrip(raw).state)) === checkedSignature;
      if (import.meta.env.PROD && 'serviceWorker' in navigator && 'caches' in window) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('worker unavailable')), 6000); })]);
        } finally { clearTimeout(timeout); }
        const entry = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src;
        const loaded = Array.from(document.querySelectorAll<HTMLScriptElement|HTMLLinkElement>('script[src],link[rel=stylesheet],link[rel=modulepreload]')).map(element => element instanceof HTMLScriptElement ? element.src : element.href).filter(url => new URL(url).origin === location.origin).map(url => new URL(url).pathname);
        if (entry) assets = await checkOfflineAssets({ names: () => caches.keys(), match: async (name, path) => (await caches.open(name)).match(path, { ignoreVary: true }) }, new URL(entry).pathname, loaded);
      }
    } catch { /* A failed read cannot certify the current notebook or cache. */ }
    if (ticket !== generation.current) return;
    saved = saved && !latest.current.saving && !latest.current.storageError && checkedSignature === JSON.stringify(archive(latest.current.state));
    let tripDigest = '';
    try { tripDigest = await contentDigest(checkedSignature); } catch { /* In an insecure context, do not persist an unverified receipt. */ }
    const next: OfflineReceipt = { version: 1, checkedAt: new Date().toISOString(), tripDigest, buildId: assets.buildId, ready: saved && assets.ready };
    if (ticket !== generation.current) return;
    setResult({ assets, saved, signature: checkedSignature }); setReceipt(next);
    setStatus(!import.meta.env.PROD ? 'dev' : next.ready ? 'ready' : 'missing');
    if (tripDigest) { try { localStorage.setItem(receiptKey, JSON.stringify(next)); } catch { /* Visible check remains available without a persisted timestamp. */ } }
  }
  useEffect(() => {
    try { setReceipt(readOfflineReceipt(localStorage.getItem(receiptKey))); } catch { setReceipt(null); }
    setResult(null); void check();
    const before = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', before);
    return () => { generation.current++; window.removeEventListener('beforeinstallprompt', before); };
  }, [receiptKey]);
  const checkedDate = receipt ? new Intl.DateTimeFormat(localeFor(language), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(receipt.checkedAt)) : '';
  const available = (yes: boolean) => t(yes ? 'Disponible ici' : 'À vérifier');
  return <section className={`offline-status panel offline-${status === 'ready' && !ready ? 'missing' : status}`} aria-labelledby="offline-heading">
    <div className="offline-status-icon">{ready ? <CheckCircle2/> : <WifiOff/>}</div>
    <div className="offline-status-body">
      <h2 id="offline-heading">{t(ready ? 'Ton carnet est prêt pour le hors-ligne' : status === 'checking' ? 'Vérification du carnet hors ligne…' : status === 'dev' ? 'Préparer le carnet pour le départ' : 'Le carnet hors ligne n’est pas encore prêt')}</h2>
      <p className="muted">{t(cloud.online ? 'Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.' : 'Internet indisponible. Les changements peuvent rester enregistrés ici en attendant l’envoi.')}</p>
      <ul className="offline-checklist">
        <li><span>{t('Planning, adresses, réservations et notes')}</span><strong>{available(current && !!result?.saved)}</strong></li>
        <li><span>{t('Documents joints : {count}', { count: state.documents?.length || 0 })}</span><strong>{available(current && !!result?.saved)}</strong></li>
        <li><span>{t('Application, polices et vues différées')}</span><strong>{available(!!result?.assets.ready)}</strong></li>
        <li><span>{t('Contours locaux du monde')}</span><strong>{available(!!result?.assets.mapReady)}</strong></li>
        <li><span>{t('Cartes de rues, liens et couvertures externes')}</span><strong>{t('Internet requis')}</strong></li>
      </ul>
      <p className="muted small">{receipt ? <>{t('Dernier contrôle :')} <time dateTime={receipt.checkedAt}>{checkedDate}</time></> : t('Aucun contrôle enregistré pour ce carnet.')}{result && !current && <> · {t('Carnet modifié : vérifie de nouveau avant le départ.')}</>}</p>
      <p className="muted small">{t(status === 'dev' ? 'Le cache hors ligne se prépare dans la version publiée ou la version de production. Garde aussi une sauvegarde JSON.' : 'Ce contrôle relit cette copie et les ressources de la version ouverte. Il ne constitue pas une sauvegarde sur un autre appareil.')}</p>
      <details className="offline-recovery"><summary>{t('Retrouver mes données')}</summary><ol>
        <li>{t('Reviens sur le même site, dans le même navigateur et le même compte.')}</li>
        <li>{t('Sans Internet, seuls les carnets déjà téléchargés sont disponibles ici.')}</li>
        <li>{t('Avant de vider l’application, télécharge une sauvegarde complète et conserve-la sur un autre support.')}</li>
        <li>{t('Une erreur d’enregistrement ? Exporte le carnet affiché avant de fermer.')}</li>
        <li>{t('En cas de conflit, conserve les deux sources et compare les valeurs avant de choisir.')}</li>
        <li>{t('Un accès retiré bloque les échanges futurs ; des copies déjà téléchargées peuvent subsister.')}</li>
      </ol></details>
    </div>
    <div className="offline-status-actions"><button className="btn btn-secondary" disabled={status === 'checking'} onClick={() => void check()}><RefreshCw size={16}/>{t('Vérifier')}</button>{install && <button className="btn btn-primary" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}><Download size={16}/>{t('Installer le carnet')}</button>}</div>
  </section>;
}
