import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name !== 'sw.js')
  .map(entry => `${entry.parentPath}/${entry.name}`.replace(/^dist/, ''));
const hash = createHash('sha256');
for (const file of files.sort()) hash.update(await readFile(`dist${file}`));
const cacheName = `a-l-est-${hash.digest('hex').slice(0, 12)}`;
await writeFile('dist/sw.js', `const CACHE = ${JSON.stringify(cacheName)};\nconst FILES = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('a-l-est-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/').then(response => response || Response.error())));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
});\n`);
console.log(`Offline cache prepared: ${files.length} files (${cacheName}).`);
