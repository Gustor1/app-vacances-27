import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = 5198;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.md': 'text/plain; charset=utf-8' };

const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed'); return; }
    const parsed = new URL(request.url, `http://127.0.0.1:${port}`);
    const requestedPath = decodeURIComponent(parsed.pathname);
    const filePath = path.resolve(root, `.${requestedPath === '/' ? '/index.html' : requestedPath}`);
    const relative = path.relative(root, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end('Forbidden'); return; }
    if (!(await stat(filePath)).isFile()) { response.writeHead(404); response.end('Not found'); return; }
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const status = error?.code === 'ENOENT' ? 404 : error instanceof URIError ? 400 : 500;
    response.writeHead(status); response.end(status === 404 ? 'Not found' : 'Unable to serve this file');
  }
});
server.on('error', error => { console.error(`Prototype server: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Détours mascot lab: http://127.0.0.1:${port}`));
