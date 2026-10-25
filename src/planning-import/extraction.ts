import { validateDraft } from './draft.ts';
import { MAX_SOURCE_LENGTH, type PlanningDraft } from './types.ts';

export type ExtractionErrorCode = 'unavailable' | 'authentication' | 'input' | 'quota' | 'timeout' | 'cancelled' | 'provider' | 'invalid';
export class PlanningExtractionError extends Error {
  code: ExtractionErrorCode;
  constructor(code: ExtractionErrorCode) { super(code); this.name = 'PlanningExtractionError'; this.code = code; }
}

export function getExtractionAvailability(): boolean {
  return import.meta.env?.VITE_PLANNING_EXTRACTION_ENABLED === 'true';
}

export async function extractPlanning(source: string, options: { signal?: AbortSignal; token?: string } = {}): Promise<PlanningDraft> {
  if (!getExtractionAvailability()) throw new PlanningExtractionError('unavailable');
  if (!source.trim() || source.length > MAX_SOURCE_LENGTH) throw new PlanningExtractionError('input');
  if (!options.token) throw new PlanningExtractionError('authentication');
  const timeout = AbortSignal.timeout(45_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  try {
    const response = await fetch('/api/planning-extraction', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.token}` },
      body: JSON.stringify({ source }),
    });
    if (!response.ok) {
      const code = response.status === 401 || response.status === 403 ? 'authentication'
        : response.status === 429 ? 'quota' : response.status === 503 ? 'unavailable'
          : response.status === 504 ? 'timeout' : response.status === 400 || response.status === 413 ? 'input' : 'provider';
      throw new PlanningExtractionError(code);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new PlanningExtractionError('invalid');
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 1_000_000) { await reader.cancel(); throw new PlanningExtractionError('invalid'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return validateDraft(JSON.parse(new TextDecoder().decode(bytes)), source); }
    catch { throw new PlanningExtractionError('invalid'); }
  } catch (error) {
    if (options.signal?.aborted) throw new PlanningExtractionError('cancelled');
    if (timeout.aborted) throw new PlanningExtractionError('timeout');
    if (error instanceof PlanningExtractionError) throw error;
    throw new PlanningExtractionError('provider');
  }
}
