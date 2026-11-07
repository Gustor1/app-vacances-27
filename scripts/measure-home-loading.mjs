import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { archive, chinaTrip, tripKey } from '../src/journeys.ts';
import { checkLocalBuild } from './build-identity.mjs';

// Isolated loading experiment. No SW, HTTP cache, remote images or API calls.
const root = resolve('dist'), build = await checkLocalBuild(root);
const output = process.argv[2];
if (!output) throw new Error('Pass the destination JSON path.');
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json', '.woff2':'font/woff2' };
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(chromiumTestOptions());
const trip = chinaTrip(undefined,'loading-fixture');
trip.journey.cover = '/travel-landscape.svg';
const results = [];
try {
  for(let run=1;run<=3;run++) {
    const context = await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
    await context.route('**/*',r=>r.request().url().startsWith(url) ? r.continue() : r.abort());
    await context.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:tripKey(trip.journey.id),value:JSON.stringify(archive(trip))});
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await page.goto(url); await page.locator('.journey-card').waitFor(); await page.waitForLoadState('networkidle');
    const home = await page.evaluate(()=>({ms:performance.now(),resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,bytes:r.transferSize}))}));
    const start = Date.now(); await page.locator('.journey-title').click(); await page.locator('.day-panel').waitFor();
    results.push({run,home,openMs:Date.now()-start,errors});
    await context.close();
  }
  await writeFile(output,JSON.stringify({buildId:build.id,browser:browser.version(),protocol:'3 fresh contexts; one China fixture, local cover; CPU x4; no bandwidth throttle, cache, SW or external network; same PC',results},null,2));
  console.log(JSON.stringify(results.map(r=>({run:r.run,homeMs:r.home.ms,homeBytes:r.home.resources.reduce((n,r)=>n+r.bytes,0),homeJS:r.home.resources.filter(r=>r.name.endsWith('.js')).reduce((n,r)=>n+r.bytes,0),openMs:r.openMs,errors:r.errors}))));
} finally { await browser.close(); await new Promise(done=>server.close(done)); }
