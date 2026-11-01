import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';

/** Isolated compiled-app server. Start with an older worker, then update to dist/sw.js. */
export async function productionTestServer({ previousPage = false, previousManifest = null } = {}) {
  const root=resolve('dist');let previous=true;let failedPath=null;
  const oldWorker=`self.addEventListener('install',e=>e.waitUntil(caches.open('a-l-est-previous-test').then(async c=>{await c.put('/previous-marker',new Response('old'));${previousPage ? "await c.addAll(['/', '/index.html']);" : ''}${previousManifest ? `await c.put('/manifest.webmanifest',new Response(${JSON.stringify(JSON.stringify(previousManifest))},{headers:{'Content-Type':'application/manifest+json'}}));` : ''}}).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));${previousPage || previousManifest ? "self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(e.request.mode==='navigate'?fetch(e.request):caches.match(e.request).then(c=>c||fetch(e.request)));});" : ''}`;
  const server=createServer(async(request,response)=>{
    const pathname=new URL(request.url,'http://localhost').pathname;
    response.setHeader('Cache-Control','no-store');
    if(pathname===failedPath){response.writeHead(503);response.end('Synthetic cache failure');return;}
    if(pathname==='/sw.js' && previous){response.setHeader('Content-Type','text/javascript');response.end(oldWorker);return;}
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)){response.writeHead(403);response.end();return;}
    try {
      let body=await readFile(file);
      // Same executable code under an older entry URL, to test release detection.
      if(previousPage && previous && file===resolve(root,'index.html')) body=Buffer.from(body.toString().replace(/(src="\/assets\/index-[^"]+\.js)(")/, '$1?previous=1$2'));
      const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.md':'text/plain'};
      response.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');response.end(body);
    } catch {response.writeHead(404);response.end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  return {url:`http://127.0.0.1:${server.address().port}`,update:()=>{previous=false;},failResource:path=>{failedPath=path;},close:()=>new Promise(done=>server.close(done))};
}
