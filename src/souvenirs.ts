/** Personal media never enters StoredState, localStorage, cloud projections or old backups. */
export const SOUVENIR_DB = 'detours-personal-souvenirs-v1';
export const SOUVENIR_EXCLUSION = 'Les photos et légendes quotidiennes sont exclues de cette sauvegarde. Dans chaque carnet, utilise Souvenir personnel → Télécharger le paquet souvenirs, puis restaure ce paquet après le carnet.';
export const MEDIA_LIMITS = { input: 12 * 1024 ** 2, pixels: 32_000_000, side: 16384, output: 512 * 1024, edge: 1600, total: 32 * 1024 ** 2, count: 1000, caption: 500, package: 48 * 1024 ** 2 } as const;
export type Souvenir = { key: string; scope: string; trip: string; day: string; revision: string; caption: string; photo?: Blob };
export type SouvenirWrite = { day: string; before: string | null; value: { caption: string; photo?: Blob } | null };
const fail = (code: string): never => { throw new Error(code); };
const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 200;
export const souvenirKey = (scope: string, trip: string, day: string) => JSON.stringify([scope, trip, day]);

/** Read encoded dimensions before allocating decoded pixels. Unsupported formats stay explicit. */
export function imageHeader(bytes: Uint8Array): { type: string; width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let type = '', width = 0, height = 0;
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) && view.getUint32(12) === 0x49484452) {
    type = 'image/png'; width = view.getUint32(16); height = view.getUint32(20);
  } else if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216) {
    type = 'image/jpeg';
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0,0xc1,0xc2].includes(marker) && length >= 8) { height = view.getUint16(offset+3); width = view.getUint16(offset+5); break; }
      offset += length;
    }
  } else if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') {
    type = 'image/webp';
    const chunk = String.fromCharCode(...bytes.slice(12,16));
    if (chunk === 'VP8X') { width = 1 + bytes[24] + (bytes[25]<<8) + (bytes[26]<<16); height = 1 + bytes[27] + (bytes[28]<<8) + (bytes[29]<<16); }
    if (chunk === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) { width = view.getUint16(26,true)&0x3fff; height = view.getUint16(28,true)&0x3fff; }
    if (chunk === 'VP8L' && bytes[20] === 0x2f) { const bits = view.getUint32(21,true); width = (bits&0x3fff)+1; height = ((bits>>>14)&0x3fff)+1; }
  }
  if (!type || !width || !height) return fail('media-format');
  if (width > MEDIA_LIMITS.side || height > MEDIA_LIMITS.side || width * height > MEDIA_LIMITS.pixels) return fail('media-size');
  return { type, width, height };
}

export async function preparePhoto(file: Blob): Promise<Blob> {
  if (!file.size || file.size > MEDIA_LIMITS.input) return fail('media-size');
  const header = imageHeader(new Uint8Array(await file.arrayBuffer()));
  if (file.type && file.type !== header.type) return fail('media-format');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { return fail('media-format'); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MEDIA_LIMITS.pixels) return fail('media-size');
    const ratio = Math.min(1, MEDIA_LIMITS.edge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) return fail('media-format');
    context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for (const quality of [0.82,0.65,0.45]) {
      const output = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve,'image/jpeg',quality));
      if (output?.type === 'image/jpeg' && output.size <= MEDIA_LIMITS.output) return output;
    }
    return fail('media-size');
  } finally { bitmap.close(); }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(SOUVENIR_DB,1);
    request.onupgradeneeded = () => request.result.createObjectStore('memories',{ keyPath:'key' });
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('media-storage'));
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
  });
}
export async function readSouvenirs(scope: string, trip: string): Promise<Souvenir[]> {
  const db = await openDB();
  try {
    return await new Promise((resolve,reject) => {
      const tx = db.transaction('memories','readonly');
      const request = tx.objectStore('memories').getAll();
      tx.oncomplete = () => resolve((request.result as Souvenir[]).filter(row => row.scope === scope && row.trip === trip));
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('media-storage'));
    });
  } finally { db.close(); }
}
function validValue(value: { caption: string; photo?: Blob }) {
  return typeof value.caption === 'string' && value.caption.length <= MEDIA_LIMITS.caption && (value.photo === undefined || value.photo instanceof Blob && value.photo.type === 'image/jpeg' && value.photo.size > 0 && value.photo.size <= MEDIA_LIMITS.output);
}
async function validateStoredPhoto(photo?: Blob) {
  if (!photo) return;
  const header = imageHeader(new Uint8Array(await photo.arrayBuffer()));
  if (header.type !== 'image/jpeg' || Math.max(header.width,header.height) > MEDIA_LIMITS.edge) return fail('media-invalid');
}
/** Blob and metadata commit in the same record/transaction. Aborts leave the old value intact.
 * All writes use the same store, so quota checks and revisions serialize across tabs. */
export async function writeSouvenirs(scope: string, trip: string, writes: SouvenirWrite[]): Promise<void> {
  if (!validId(scope) || !validId(trip) || writes.length > MEDIA_LIMITS.count || new Set(writes.map(w=>w.day)).size !== writes.length || writes.some(w => !validId(w.day) || w.value && !validValue(w.value))) return fail('media-invalid');
  for (const write of writes) await validateStoredPhoto(write.value?.photo);
  const db = await openDB();
  try {
    await new Promise<void>((resolve,reject) => {
      const tx = db.transaction('memories','readwrite',{durability:'strict'});
      const store = tx.objectStore('memories');
      let error: unknown;
      const request = store.getAll();
      request.onsuccess = () => {
        try {
          const rows = new Map((request.result as Souvenir[]).map(row=>[row.key,row]));
          for (const write of writes) {
            const key = souvenirKey(scope,trip,write.day);
            if ((rows.get(key)?.revision || null) !== write.before) return fail('media-conflict');
            if (!write.value) rows.delete(key);
            else rows.set(key,{ key,scope,trip,day:write.day,revision:crypto.randomUUID(),caption:write.value.caption,...(write.value.photo ? {photo:write.value.photo} : {}) });
          }
          const size = [...rows.values()].reduce((sum,row)=>sum+(row.photo?.size || 0)+new TextEncoder().encode(row.caption).length+1024,0);
          if (size > MEDIA_LIMITS.total || rows.size > MEDIA_LIMITS.count) return fail('media-quota');
          for (const write of writes) {
            const key = souvenirKey(scope,trip,write.day), row = rows.get(key);
            if (row) {
              store.put(row);
              const check = store.get(key);
              check.onsuccess = () => { if (check.result?.revision !== row.revision || check.result?.photo?.size !== row.photo?.size) { error = new Error('media-storage'); tx.abort(); } };
            } else {
              store.delete(key);
              const check = store.get(key);
              check.onsuccess = () => { if (check.result !== undefined) { error = new Error('media-storage'); tx.abort(); } };
            }
          }
        } catch (failure) { error = failure; try { tx.abort(); } catch { /* Already aborted by the browser or an interruption. */ } }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(error || tx.error || new Error('media-storage'));
    });
  } finally { db.close(); }
}

type PackageRow = { day: string; caption: string; photo?: string; sha256?: string };
export type MediaPackage = { version: 1; scope: 'detours-personal-media'; entries: PackageRow[] };
const hash = async (bytes: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
export async function exportSouvenirs(rows: Souvenir[]): Promise<string> {
  if (rows.length > MEDIA_LIMITS.count) return fail('media-size');
  const entries: PackageRow[] = [];
  for (const row of rows) {
    if (!validId(row.day) || !validValue(row)) return fail('media-invalid');
    await validateStoredPhoto(row.photo);
    if (row.photo) {
      const bytes = await row.photo.arrayBuffer();
      let binary = '';
      for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
      entries.push({ day:row.day,caption:row.caption,photo:btoa(binary),sha256:await hash(bytes) });
    } else entries.push({day:row.day,caption:row.caption});
  }
  const raw = JSON.stringify({version:1,scope:'detours-personal-media',entries} satisfies MediaPackage);
  if (new TextEncoder().encode(raw).length > MEDIA_LIMITS.package) return fail('media-size');
  return raw;
}
export async function prepareSouvenirRestore(raw: string, days: string[], current: Souvenir[]): Promise<{ writes: SouvenirWrite[]; skipped: number }> {
  if (new TextEncoder().encode(raw).length > MEDIA_LIMITS.package) return fail('media-size');
  let data: MediaPackage;
  try { data = JSON.parse(raw); } catch { return fail('media-invalid'); }
  if (!data || data.version !== 1 || data.scope !== 'detours-personal-media' || !Array.isArray(data.entries) || data.entries.length > MEDIA_LIMITS.count) return fail('media-invalid');
  const seen = new Set<string>(), writes: SouvenirWrite[] = [];
  let skipped = 0, bytesTotal = 0;
  for (const row of data.entries) {
    if (!row || !validId(row.day) || seen.has(row.day) || typeof row.caption !== 'string' || row.caption.length > MEDIA_LIMITS.caption) return fail('media-invalid');
    seen.add(row.day);
    let photo: Blob | undefined;
    if (row.photo !== undefined) {
      if (typeof row.photo !== 'string' || row.photo.length > Math.ceil(MEDIA_LIMITS.output/3)*4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(row.photo)) return fail('media-invalid');
      let binary: string;
      try { binary = atob(row.photo); } catch { return fail('media-invalid'); }
      const bytes = Uint8Array.from(binary,c=>c.charCodeAt(0));
      bytesTotal += bytes.length;
      if (bytesTotal > MEDIA_LIMITS.total || row.sha256 !== await hash(bytes.buffer)) return fail('media-invalid');
      // Untrusted imported images pass through the same decoder and metadata removal.
      photo = await preparePhoto(new Blob([bytes],{type:'image/jpeg'}));
    }
    if (!days.includes(row.day) || current.some(item=>item.day===row.day)) { skipped++; continue; }
    writes.push({day:row.day,before:null,value:{caption:row.caption,...(photo?{photo}:{})}});
  }
  return {writes,skipped};
}
