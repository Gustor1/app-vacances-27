import { useState } from 'react';
import { useLocale } from '../i18n';

/** A departure preparation action, never a permission request on startup. */
export default function StoragePersistence() {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'busy' | 'granted' | 'denied'>('idle');
  if (typeof navigator.storage?.persist !== 'function') return null;
  async function request() {
    setStatus('busy');
    try { setStatus(await navigator.storage.persisted() || await navigator.storage.persist() ? 'granted' : 'denied'); }
    catch { setStatus('denied'); }
  }
  return <div className="offline-persistence">
    <button type="button" className="btn btn-secondary" disabled={status === 'busy' || status === 'granted'} onClick={() => void request()}>{t('Protéger le stockage sur cet appareil')}</button>
    <p className="muted small" role="status">{t(status === 'granted' ? 'Stockage persistant accordé. Garde aussi une sauvegarde sur un autre support.' : status === 'denied' ? 'Le navigateur n’a pas accordé la persistance. Tu peux continuer ; garde une sauvegarde.' : 'Avant le départ, demande au navigateur de conserver les données. Une sauvegarde reste nécessaire.')}</p>
  </div>;
}
