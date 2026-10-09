import type { SyncRecord } from './storage.ts';

export function tripSaveStatus({ account, record, saving = false, storageError = '', working = false, online = true, connected = false }: {
  account: boolean; record?: SyncRecord | null; saving?: boolean; storageError?: string; working?: boolean; online?: boolean; connected?: boolean;
}): string {
  if (storageError) return 'Enregistrement local impossible';
  if (saving) return 'Enregistrement sur cet appareil…';
  if (!account) return 'Enregistré sur cet appareil';
  if (!record) return 'Carnet non téléchargé';
  if (record.revoked) return 'Accès retiré';
  if (record.conflict) return 'Conflit à résoudre';
  if (record.pending) return working && online && connected ? 'Synchronisation en cours…' : 'En attente d’envoi';
  if (!connected) return 'Enregistré sur cet appareil';
  if (record.lastSynced || record.revision > 0) return 'Synchronisé';
  return 'En attente d’envoi';
}
