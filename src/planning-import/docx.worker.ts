import { extractDocx } from './document-docx.ts';
import { DocumentError } from './document-contract.ts';
self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try { self.postMessage({ source: extractDocx(new Uint8Array(event.data)) }); }
  catch (error) { self.postMessage({ error: error instanceof DocumentError ? error.code : 'corrupt' }); }
};
