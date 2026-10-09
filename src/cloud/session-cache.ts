import type { Storage } from '../journeys.ts';
import { isObj } from '../lib.ts';
export const ACCOUNT_HINT_KEY = 'detours-last-account-v1';
export type AccountHint = { version: 1; id: string; email?: string };
/** Identity hint only. It never authenticates a server request. Explicit sign
 * out removes the hint, while an offline/expired session keeps its isolated cache.
 */
export function readAccountHint(storage: Storage): AccountHint | null {
  try { const value: unknown = JSON.parse(storage.getItem(ACCOUNT_HINT_KEY) || 'null'); return isObj(value) && value.version === 1 && typeof value.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id) && (value.email === undefined || typeof value.email === 'string') ? value as AccountHint : null; } catch { return null; }
}
