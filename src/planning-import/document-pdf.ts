import { getDocument, PDFWorker } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DOCUMENT_LIMITS as limits, DocumentError, checkExtractedText } from './document-contract.ts';

// Only bundled, allowlisted resources may be requested. Some CJK PDFs depend on
// predefined CMaps; standard fonts improve spacing without using system fonts.
const resources = import.meta.glob<string>('/node_modules/pdfjs-dist/{cmaps/*.bcmap,standard_fonts/*.{pfb,ttf}}', { eager: true, query: '?url', import: 'default' });
class LocalBinaryDataFactory {
  async fetch({ kind, filename }: { kind: string; filename: string }): Promise<Uint8Array> {
    const folder = kind === 'cMapUrl' ? 'cmaps' : kind === 'standardFontDataUrl' ? 'standard_fonts' : '';
    const url = folder && resources[`/node_modules/pdfjs-dist/${folder}/${filename}`];
    if (!url) throw new Error('Unsupported bundled PDF resource');
    const response = await fetch(url); if (!response.ok) throw new Error('PDF resource unavailable');
    return new Uint8Array(await response.arrayBuffer());
  }
}

export async function extractPdf(buffer: ArrayBuffer, signal: AbortSignal): Promise<{ source: string; pages: number }> {
  const port = new Worker(workerUrl, { type: 'module' });
  const worker = PDFWorker.create({ port });
  const task = getDocument({ data: new Uint8Array(buffer), worker, useSystemFonts: false, BinaryDataFactory: LocalBinaryDataFactory,
    useWorkerFetch: false, useWasm: false, disableFontFace: true, stopAtErrors: true, isOffscreenCanvasSupported: false });
  const abort = () => { void task.destroy().catch(() => {}); worker.destroy(); port.terminate(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    const pdf = await task.promise;
    if (pdf.numPages > limits.pages) throw new DocumentError('pages');
    let source = '', characters = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(number);
      const reader = page.streamTextContent().getReader();
      // Use the existing parser's page-reference syntax, so metadata cannot
      // become a trip title or an activity.
      const marker = `Page ${number} / ${pdf.numPages}\n`;
      let pageText = '', lastY: number | undefined;
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        for (const item of chunk.value.items) {
          if (!('str' in item)) continue;
          // Keep the PDF content stream order; vertical movement provides line breaks.
          // Columns remain explicitly subject to review, never reordered by guesswork.
          const y = item.transform[5];
          const separator = lastY !== undefined && Math.abs(y - lastY) > 2 ? '\n' : pageText && !pageText.endsWith('\n') ? ' ' : '';
          pageText += separator + item.str + (item.hasEOL ? '\n' : ''); lastY = y;
          if (source.length + marker.length + pageText.trimEnd().length > limits.text) throw new DocumentError('length');
          characters += item.str.trim().length;
        }
      }
      source += `${marker}${pageText.trim()}\n\n`; page.cleanup();
    }
    if (!characters) throw new DocumentError('empty');
    return { source: checkExtractedText(source.trim()), pages: pdf.numPages };
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (error instanceof DocumentError) throw error;
    throw new DocumentError((error as Error)?.name === 'PasswordException' ? 'protected' : 'corrupt');
  } finally { signal.removeEventListener('abort', abort); if (!signal.aborted) await task.destroy(); worker.destroy(); port.terminate(); }
}
