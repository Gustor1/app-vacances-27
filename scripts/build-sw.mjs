import { readdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { buildId, sha256 } from './build-identity.mjs';
const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && !['sw.js', 'build-info.json'].includes(entry.name))
  .map(entry => `${entry.parentPath}/${entry.name}`.replaceAll('\\', '/').replace(/^dist/, ''));
const assets = [];
for (const file of files.sort()) {
  const bytes = await readFile(`dist${file}`);
  assets.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
}
const id = buildId(assets);
const html = await readFile('dist/index.html', 'utf8');
const entry = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
if (!entry || !assets.some(file => file.path === entry)) throw new Error('Build entry missing');
let baseRevision = null;
try { baseRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* Source archives may omit Git metadata. */ }
await writeFile('dist/build-info.json', JSON.stringify({ version: 1, id, baseRevision, entry, files: assets }, null, 2));
files.push('/build-info.json');
const cacheName = `a-l-est-${id.slice(0, 12)}`;
await writeFile('dist/sw.js', `const CACHE = ${JSON.stringify(cacheName)};\nconst FILES = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('a-l-est-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' || ['/', '/index.html'].includes(new URL(event.request.url).pathname)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/').then(response => response || Response.error())));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
});\n`);
console.log(`Offline cache prepared: ${files.length} files (${cacheName}).`);
