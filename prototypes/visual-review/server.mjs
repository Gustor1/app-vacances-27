import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const allowed = new Map([['/', 'index.html'], ['/index.html','index.html'], ['/app.js','app.js'], ['/style.css','style.css']]);
createServer(async (req,res) => {
  const file = allowed.get(new URL(req.url,'http://localhost').pathname);
  if (!file) { res.writeHead(404); res.end('Introuvable'); return; }
  try {
    const data = await readFile(fileURLToPath(new URL(file,import.meta.url)));
    res.writeHead(200, {'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; connect-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}); res.end(data);
  } catch { res.writeHead(500); res.end('Fichier indisponible'); }
}).listen(4318,'127.0.0.1',()=>console.log('Atelier : http://127.0.0.1:4318'));
