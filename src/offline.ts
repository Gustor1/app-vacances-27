export type CacheReader = {
  names: () => Promise<string[]>;
  match: (name: string, path: string) => Promise<Response | undefined>;
};
export type OfflineAssets = { ready: boolean; mapReady: boolean; buildId: string | null; missing: string[] };
export type OfflineReceipt = { version: 1; checkedAt: string; tripDigest: string; buildId: string | null; ready: boolean };

export async function contentDigest(value: string | ArrayBuffer): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Check the manifest of the open entry, never infer completeness from existing keys. */
export async function checkOfflineAssets(reader: CacheReader, entry: string, loadedAssets: string[] = []): Promise<OfflineAssets> {
  const absent: OfflineAssets = { ready: false, mapReady: false, buildId: null, missing: ['manifest'] };
  for (const name of await reader.names()) {
    if (!/^a-l-est-[a-f0-9]{12}$/.test(name)) continue;
    try {
      const manifest = await reader.match(name, '/build-info.json');
      if (!manifest?.ok) continue;
      const info = await manifest.json();
      if (info.version !== 1 || !/^[a-f0-9]{64}$/.test(info.id) || name !== `a-l-est-${info.id.slice(0, 12)}` || info.entry !== entry || !Array.isArray(info.files) || !info.files.length || info.files.length > 1000) continue;
      if (await contentDigest(JSON.stringify(info.files)) !== info.id) continue;
      const paths = new Set<string>();
      if (!info.files.every((file: { path: string; bytes: number; sha256: string }) => {
        const valid = typeof file.path === 'string' && /^\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/.test(file.path) && !file.path.split('/').includes('..') && !paths.has(file.path) && Number.isSafeInteger(file.bytes) && file.bytes >= 0 && /^[a-f0-9]{64}$/.test(file.sha256);
        paths.add(file.path); return valid;
      }) || !paths.has(entry) || !paths.has('/index.html') || !paths.has('/world-geography.json') || loadedAssets.some(path => !paths.has(path))) continue;
      const missing: string[] = [];
      let mapReady = false;
      for (const file of info.files) {
        const response = await reader.match(name, file.path);
        let available = false;
        if (response?.ok) {
          const bytes = await response.arrayBuffer();
          available = bytes.byteLength === file.bytes && await contentDigest(bytes) === file.sha256;
        }
        if (!available) missing.push(file.path);
        if (file.path === '/world-geography.json') mapReady = available;
      }
      const root = await reader.match(name, '/');
      const index = info.files.find((file: { path: string }) => file.path === '/index.html');
      if (!root?.ok || await contentDigest(await root.arrayBuffer()) !== index.sha256) missing.push('/');
      return { ready: !missing.length, mapReady, buildId: info.id, missing };
    } catch { /* An old, corrupt or unavailable cache cannot prove readiness. */ }
  }
  return absent;
}

export function readOfflineReceipt(raw: string | null): OfflineReceipt | null {
  if (!raw || raw.length > 1024) return null;
  try {
    const value = JSON.parse(raw || 'null');
    if (value?.version === 1 && Object.keys(value).every(key => ['version','checkedAt','tripDigest','buildId','ready'].includes(key)) && typeof value.checkedAt === 'string' && Number.isFinite(Date.parse(value.checkedAt)) && new Date(value.checkedAt).toISOString() === value.checkedAt && /^[a-f0-9]{64}$/.test(value.tripDigest) && (value.buildId === null || /^[a-f0-9]{64}$/.test(value.buildId)) && typeof value.ready === 'boolean') return value;
  } catch { /* Keep a malformed receipt untouched, without claiming a check. */ }
  return null;
}

export function offlineReceiptKey(scope: string, id: string) { return `detours-offline-check-v1:${encodeURIComponent(scope)}:${encodeURIComponent(id)}`; }
