import { DOCUMENT_LIMITS, DocumentError, type DocumentResult, type DocumentErrorCode } from './document-contract.ts';

export async function readPlanningDocument(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>, signal?: AbortSignal): Promise<DocumentResult> {
  if (!/\.(pdf|docx)$/i.test(file.name)) throw new DocumentError('format');
  if (file.size > DOCUMENT_LIMITS.bytes) throw new DocumentError('size');
  const controller = new AbortController();
  const abort = () => controller.abort(new DocumentError('cancelled'));
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(() => controller.abort(new DocumentError('timeout')), DOCUMENT_LIMITS.timeoutMs);
  let onAbort: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => { onAbort = () => reject(controller.signal.reason); controller.signal.addEventListener('abort', onAbort, { once: true }); });
  const work = async (): Promise<DocumentResult> => {
    controller.signal.throwIfAborted();
    const buffer = await file.arrayBuffer(); controller.signal.throwIfAborted();
    if (buffer.byteLength > DOCUMENT_LIMITS.bytes) throw new DocumentError('size');
    const magic = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 5));
    let source: string, pages: number | undefined;
    const kind = /\.pdf$/i.test(file.name) ? 'pdf' : 'docx';
    if (kind === 'pdf') {
      if (new TextDecoder().decode(magic) !== '%PDF-') throw new DocumentError('format');
      let pdf;
      try { pdf = await import('./document-pdf.ts'); } catch { throw new DocumentError('unavailable'); }
      controller.signal.throwIfAborted();
      ({ source, pages } = await pdf.extractPdf(buffer, controller.signal));
    } else {
      if (magic[0] !== 80 || magic[1] !== 75 || magic[2] !== 3 || magic[3] !== 4) throw new DocumentError('format');
      source = await new Promise<string>((resolve, reject) => {
        const worker = new Worker(new URL('./docx.worker.ts', import.meta.url), { type: 'module' });
        const stop = () => { worker.terminate(); controller.signal.removeEventListener('abort', stop); };
        controller.signal.addEventListener('abort', stop, { once: true });
        worker.onmessage = (event: MessageEvent<{ source: string; error?: DocumentErrorCode }>) => { stop(); if (event.data.error) reject(new DocumentError(event.data.error)); else resolve(event.data.source); };
        worker.onerror = () => { stop(); reject(new DocumentError('unavailable')); };
        worker.postMessage(buffer, [buffer]);
      });
    }
    return { source, origin: { kind, name: file.name.slice(0, 255), originalText: source, ...(pages ? { pages } : {}) } };
  };
  try { return await Promise.race([work(), cancelled]); }
  catch (error) { if (error instanceof DocumentError) throw error; throw new DocumentError('corrupt'); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); controller.signal.removeEventListener('abort', onAbort); }
}
