import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Modal } from '../App';
import { useLocale } from '../i18n';
import { useCloud } from '../cloud/CloudProvider';
import { applyRestore, exportBackup, MAX_BACKUP_BYTES, pendingRestores, prepareRestore, SOURCE_PREFIX, type RestorePlan, type PendingRestore } from '../backup';
import { downloadText } from '../lib';
import { WORLD_KEY } from '../world';

const errors: Record<string, string> = {
  'backup-size': 'La sauvegarde dépasse la limite de 64 Mo. Aucun fichier incomplet n’est téléchargé.',
  'backup-integrity': 'Le contrôle d’intégrité a échoué. Le fichier et tes données restent conservés.',
  'backup-invalid': 'La sauvegarde est invalide. Aucune restauration n’a commencé.',
  'backup-world-invalid': 'Les souvenirs existants sont illisibles. Télécharge leur source avant de restaurer.',
  'backup-conflict': 'Des données ont changé depuis le bilan. La restauration est arrêtée pour les préserver.',
  'backup-pending': 'Termine la restauration en attente avant d’en commencer une autre.',
  'backup-complete': 'Cette sauvegarde a déjà été restaurée ici. Aucun doublon n’a été ajouté.',
  'backup-journal': 'Le journal de restauration est illisible ou indisponible. Sa source est conservée.',
  'backup-write': 'Une écriture n’a pas pu être relue. Réessaie la restauration avec le même fichier.',
  'backup-unreadable-cache': 'Une source illisible ne peut pas être isolée du cache du compte. Télécharge son original depuis l’accueil avant de sauvegarder.',
};
const baseExclusions = 'Seuls les carnets téléchargés de l’espace ouvert sont sauvegardés. Comptes, droits, ressources externes et caches réseau sont exclus.';

export default function BackupPanel({ onChanged, remoteMissing = 0 }: { onChanged: () => void; remoteMissing?: number }) {
  const { t } = useLocale();
  const { storage } = useCloud();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [pending, setPending] = useState<PendingRestore[]>([]);
  const [sources, setSources] = useState<{ key: string; raw: string }[]>([]);
  function refresh() {
    try {
      setPending(pendingRestores(window.localStorage));
      const result = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(SOURCE_PREFIX)) result.push({ key, raw: window.localStorage.getItem(key) || '' });
      }
      setSources(result);
    } catch (failure) { setError(t(errors[failure instanceof Error ? failure.message : ''] || errors['backup-journal'])); }
  }
  useEffect(() => { refresh(); }, [storage]);
  const fail = (failure: unknown) => setError(t(errors[failure instanceof Error ? failure.message : ''] || 'Le stockage est indisponible ou plein. Des éléments peuvent déjà être restaurés ; conserve le fichier et reprends la même restauration.'));
  async function download() {
    setBusy(true); setError(''); setMessage('');
    try {
      const raw = await exportBackup(storage, window.localStorage, key => {
        const physical = window.localStorage.getItem(storage.physicalKey(key));
        // Never include account envelopes, roles, queue operations or session metadata.
        if (!storage.accountId) return physical;
        try { const value = JSON.parse(physical || 'null'); return typeof value?.raw === 'string' ? value.raw : null; } catch { return null; }
      }, [t(baseExclusions), t('{count} carnet(s) distant(s) non téléchargé(s).', { count: remoteMissing })]);
      downloadText(raw, 'detours-sauvegarde-complete-v3.json');
      setMessage(t('Sauvegarde complète téléchargée. Conserve ce fichier hors de cet appareil.'));
    } catch (failure) { fail(failure); } finally { setBusy(false); }
  }
  async function preview(file: File) {
    setBusy(true); setError(''); setMessage('');
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('backup-size');
      setPlan(await prepareRestore(await file.text(), window.localStorage));
    } catch (failure) { fail(failure); } finally { setBusy(false); }
  }
  async function restore() {
    if (!plan) return;
    setBusy(true); setError('');
    try {
      const selected = plan;
      const commit = () => applyRestore(window.localStorage, selected);
      if (navigator.locks) await navigator.locks.request('detours-restore', () => navigator.locks.request(WORLD_KEY, commit)); else commit();
      setPlan(null);
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
      // LocaleProvider listens specifically to this preference key.
      const preference = selected.writes.find(w => w.key === 'a-l-est-preferences-v1');
      if (preference) window.dispatchEvent(new StorageEvent('storage', { key: preference.key, newValue: preference.after }));
      window.dispatchEvent(new Event('detours-money-preferences'));
      setMessage(t(storage.accountId ? 'Restauration terminée dans l’espace local privé. Déconnecte-toi pour retrouver ces carnets.' : 'Restauration terminée. Tes carnets et souvenirs sont disponibles ici.'));
    } catch (failure) { fail(failure); } finally { refresh(); onChanged(); setBusy(false); }
  }
  return <section className="journeys-import panel backup-panel" aria-labelledby="full-backup-title">
    <div><h2 id="full-backup-title">{t('Sauvegarder et restaurer mes données')}</h2><p className="muted">{t('Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier vérifié (64 Mo maximum).')}</p><p className="muted small">{t(baseExclusions)}</p>{remoteMissing > 0 && <p role="status">{t('{count} carnet(s) distant(s) non téléchargé(s).', { count: remoteMissing })}</p>}</div>
    <div className="journeys-import-actions"><button className="btn btn-secondary" disabled={busy} onClick={() => void download()}><Download size={16}/>{t('Télécharger ma sauvegarde complète')}</button><button className="btn btn-secondary" disabled={busy} onClick={() => input.current?.click()}><Upload size={16}/>{t('Restaurer mes données')}</button></div>
    <input ref={input} type="file" accept=".json,application/json" hidden aria-label={t('Choisir une sauvegarde complète')} onChange={event => { const file = event.target.files?.[0]; if (file) void preview(file); event.target.value = ''; }}/>
    {busy && <p role="status">{t('Vérification de la sauvegarde…')}</p>}
    {message && <p role="status">{message}</p>}
    {error && <p className="practical-error" role="alert">{error}</p>}
    {pending.map(item => <div key={item.id} className="notice warning-notice"><p>{t('Restauration incomplète : certains éléments peuvent déjà être visibles. Le fichier original et les données existantes sont conservés.')}</p><p>{t('Pour reprendre, sélectionne le même fichier de sauvegarde.')}</p><button className="btn btn-secondary" disabled={busy} onClick={() => { setError(''); input.current?.click(); }}>{t('Reprendre la restauration')}</button></div>)}
    {sources.length > 0 && <details><summary>{t('{count} source(s) brute(s) conservée(s) séparément.', { count: sources.length })}</summary>{sources.map((source, index) => <button key={source.key} className="text-btn" onClick={() => downloadText(source.raw, `detours-source-${index + 1}.json`)}>{t('Télécharger la source {count}', { count: index + 1 })}</button>)}</details>}
    {plan && <Modal title={t('Bilan de restauration')} onClose={() => { if (!busy) setPlan(null); }}>
      <p>{t('La restauration crée des carnets privés sur cet appareil. Les carnets existants et les droits serveur restent conservés.')}</p>
      <ul><li>{t('{count} carnet(s) à retrouver.', { count: plan.trips })}</li><li>{t('{count} souvenir(s) à retrouver.', { count: plan.visits })}</li><li>{t('{count} collision(s) traitée(s) sans remplacer les carnets.', { count: plan.collisions })}</li><li>{t('{count} préférence(s) existante(s) conservée(s).', { count: plan.keptPreferences })}</li><li>{t('{count} source(s) brute(s) conservée(s) séparément.', { count: plan.sources })}</li></ul>
      <p>{t('Espace supplémentaire estimé : {count} Mo, journal compris. Le quota réel du navigateur sera vérifié lors des écritures.', { count: (plan.bytes / 1_000_000).toFixed(2) })}</p>
      {plan.exclusions.map((text, index) => <p className="muted small" key={index}>{text === 'backup-legacy-exclusions' ? t('Ce fichier historique contient uniquement des carnets. Souvenirs et préférences ne sont pas inclus.') : text}</p>)}
      <p className="muted small">{t('Une interruption peut laisser une restauration partielle. Reprendre le même fichier conserve les identités et évite les doublons.')}</p>
      {error && <p role="alert" className="practical-error">{error}</p>}
      <div className="form-actions"><button className="btn btn-secondary" disabled={busy} onClick={() => setPlan(null)}>{t('Annuler')}</button><button className="btn btn-primary" disabled={busy} onClick={() => void restore()}>{t('Confirmer la restauration')}</button></div>
    </Modal>}
  </section>;
}
