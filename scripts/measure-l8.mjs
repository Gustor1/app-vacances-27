import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { checkLocalBuild } from './build-identity.mjs';
import { performanceCollection } from './l8-fixture.mjs';

const root = resolve(process.argv[2] || 'dist'), output = resolve(process.argv[3] || `${tmpdir()}/detours-l8-${Date.now()}.json`);
const repeats = Number(process.env.L8_REPEATS || 5);
assert.ok(Number.isInteger(repeats) && repeats >= 3);
const build = await checkLocalBuild(root);
const cover = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#547764"/><!--' + 'x'.repeat(200_000) + '--></svg>');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/l8-cover/')) { res.setHeader('Content-Type', 'image/svg+xml'); res.end(cover); return; }
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(chromiumTestOptions());
const results = [];
const afterPaint = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now())))));
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
try {
  for (let run = 0; run < repeats; run++) for (const size of ['small', 'large']) {
    const fixture = performanceCollection(size);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === url ? route.continue() : route.abort());
    await context.addInitScript(records => {
      for (const [key, raw] of records) localStorage.setItem(key, raw);
      window.__l8 = { tasks: [], inputs: [] };
      new PerformanceObserver(list => window.__l8.tasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
      document.addEventListener('input', event => {
        const start = performance.now(), name = event.target.id || event.target.getAttribute('aria-label');
        requestAnimationFrame(() => requestAnimationFrame(() => window.__l8.inputs.push({ name, ms: performance.now() - start })));
      }, true);
    }, fixture.records);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 200_000, uploadThroughput: 200_000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0; const covers = new Set();
    cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
    cdp.on('Network.requestWillBeSent', e => { if (e.request.url.includes('/l8-cover/')) covers.add(e.request.url); });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => document.querySelectorAll('.journey-card').length > 0 && document.querySelector('.journey-cover img')?.complete && document.querySelector('.journey-cover img')?.naturalWidth > 0, null, { timeout: 120_000 });
    const homeMs = await afterPaint(page), homeBytes = bytes, homeCovers = covers.size;
    await page.waitForLoadState('networkidle', { timeout: 120_000 });
    // networkidle may precede the images created by React. Decode every requested
    // cover before measuring settled traffic, including native lazy-loaded ones.
    await page.waitForFunction(urls => Array.from(document.querySelectorAll('.journey-cover img')).filter(img => urls.includes(img.src)).every(img => img.complete && img.naturalWidth > 0), [...covers], { timeout: 120_000 });
    await afterPaint(page);
    const settledBytes = bytes, settledCovers = covers.size;
    const openStart = await page.evaluate(() => { const start = performance.now(); document.querySelector('.journey-title').click(); return start; });
    await page.waitForSelector('.timeline .step-card', { timeout: 120_000 });
    const openMs = (await afterPaint(page)) - openStart;
    const note = page.locator('#city-note'); await note.fill('');
    await note.pressSequentially('Une note de voyage', { delay: 100 });
    await afterPaint(page);
    const search = page.getByRole('textbox', { name: 'Rechercher dans le carnet', exact: true });
    await search.pressSequentially('Promenade', { delay: 100 }); await afterPaint(page);
    await search.fill('');
    const mapStart = await page.evaluate(() => { const start = performance.now(); Array.from(document.querySelectorAll('.sidebar button')).find(b => b.textContent.includes('La carte du voyage')).click(); return start; });
    await page.waitForSelector('.full-map .leaflet-marker-icon', { timeout: 120_000 });
    const mapMs = (await afterPaint(page)) - mapStart;
    const observations = await page.evaluate(() => window.__l8);
    assert.deepEqual(errors, []);
    const values = name => observations.inputs.filter(i => i.name === name).map(i => i.ms);
    const result = { run: run + 1, size, homeMs, openMs, mapMs, homeBytes, settledBytes, homeCovers, settledCovers, noteMedianMs: median(values('city-note')), noteMaxMs: Math.max(...values('city-note')), searchMedianMs: median(values('Rechercher dans le carnet')), searchMaxMs: Math.max(...values('Rechercher dans le carnet')), longTasks: observations.tasks, inputs: observations.inputs, errors };
    results.push(result); console.log(JSON.stringify({ ...result, inputs: result.inputs.length, longTasks: result.longTasks.length }));
    for (const key of ['homeMs', 'openMs', 'mapMs', 'settledBytes', 'noteMedianMs', 'searchMedianMs']) assert.ok(Number.isFinite(result[key]) && result[key] > 0, `Missing metric ${key}`);
    await context.close();
  }
  const summary = Object.fromEntries(['small', 'large'].map(size => [size, Object.fromEntries(['homeMs', 'openMs', 'mapMs', 'homeBytes', 'settledBytes', 'homeCovers', 'settledCovers', 'noteMedianMs', 'noteMaxMs', 'searchMedianMs', 'searchMaxMs'].map(key => [key, median(results.filter(r => r.size === size).map(r => r[key]))]))]));
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), buildId: build.id, browser: browser.version(), node: process.version, platform: process.platform, protocol: { repeats, viewport: '1440x900', cpuSlowdown: 4, downloadBytesPerSecond: 200_000, latencyMs: 80, reducedMotion: true, serviceWorker: 'blocked', httpCache: 'disabled', covers: 'distinct locally served 200 KB SVG fixtures', compression: 'none', externalNetwork: 'blocked', device: 'same local PC', coverCompletion: 'requested covers decoded, not networkidle alone' }, fixtures: ['small', 'large'].map(size => { const f = performanceCollection(size); delete f.records; return f; }), summary, results }, null, 2));
  console.log('Measurements saved: ' + output);
} finally { await browser.close(); await new Promise(done => server.close(done)); }
