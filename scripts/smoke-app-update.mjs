import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, webkit, devices, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';

await mkdir('docs/development/lot-02-pwa/screenshots', { recursive: true });
for (const engine of [chromium, webkit]) {
  const server = await productionTestServer({ previousPage: true });
  const browser = await engine.launch(engine === chromium && process.platform === 'win32' ? { channel: 'chrome' } : {});
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'dark' });
    await context.route('https://**/*', route => route.abort());
    let page = await context.newPage();
    const errors = [];
    const checks = [];
    page.on('request', request => { if (request.url().includes('app-update=')) checks.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.url);
    await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
    await page.locator('.app-shell').waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    assert.equal(await page.locator('.app-update').count(), 0, 'no update prompt for the current release');
    const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
    const oldEntry = await page.locator('script[type=module][src]').getAttribute('src');
    assert.ok(oldEntry.endsWith('?previous=1'));
    // Leave a real unsaved city form visible through failed installation/resume.
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Mon planning', exact: true }).click();
    await page.getByRole('button', { name: 'Modifier Shenzhen', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Ville, région ou lieu de séjour', { exact: true }).fill('Brouillon ville préservé');
    const build = JSON.parse(await readFile('dist/build-info.json', 'utf8'));
    const lazy = build.files.find(file => /\/WorldView-.*\.js$/.test(file.path));
    assert.ok(lazy);
    server.failResource(lazy.path);
    server.update();
    // A partial precache install fails, without activating or deleting the old cache.
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Failed install did not settle')), 15000);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'redundant') { clearTimeout(timeout); resolve(); }
          });
        }, { once: true });
        registration.update().catch(reject);
      });
    });
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('a-l-est-previous-test')));
    assert.equal(await page.getByRole('dialog').getByLabel('Ville, région ou lieu de séjour', { exact: true }).inputValue(), 'Brouillon ville préservé');
    server.failResource(null);
    // Resume as Safari would when returning to a tab from its page cache.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    try { await page.getByText('Une nouvelle version est prête.', { exact: true }).waitFor({ timeout: 8000 }); }
    catch (error) { console.log({ checks, errors, entry: await page.locator('script[type=module][src]').getAttribute('src'), html: await page.evaluate(async () => (await (await fetch('/index.html?diagnostic=1')).text()).match(/src="\/assets\/index-[^"]+/)?.[0]) }); throw error; }
    assert.equal(await page.locator('script[type=module][src]').getAttribute('src'), oldEntry);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]))), before);
    await page.evaluate(() => document.querySelector('.app-update button').click());
    await page.getByText('Enregistre tes modifications et ferme les formulaires avant de mettre à jour.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('dialog').getByLabel('Ville, région ou lieu de séjour', { exact: true }).inputValue(), 'Brouillon ville préservé');
    assert.equal(await page.locator('script[type=module][src]').getAttribute('src'), oldEntry);
    await page.waitForFunction(() => document.querySelector('.modal')?.style.opacity === '1');
    await page.screenshot({ path: `docs/development/lot-02-pwa/screenshots/update-draft-${engine.name()}.png` });
    await page.getByRole('dialog').getByRole('button', { name: 'Annuler', exact: true }).click();
    await page.getByRole('button', { name: 'Mettre à jour', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('script[type=module][src]')?.getAttribute('src')?.includes('previous=1'));
    await page.locator('.app-shell').waitFor();
    assert.equal(await page.locator('.app-update').count(), 0);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]))), before);
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting);
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('a-l-est-previous-test')), 'Old cache retained while a window uses it');
    await page.close();
    if (engine === chromium) await expect.poll(async () => (await Promise.all(context.serviceWorkers().map(worker => worker.evaluate(async () => !(await caches.keys()).includes('a-l-est-previous-test')).catch(() => false)))).some(Boolean), { timeout: 15000 }).toBe(true);
    page = await context.newPage(); await page.goto(server.url);
    page.on('pageerror', error => errors.push(error.message));
    await page.getByRole('button', { name: 'Ouvrir Chine 2027', exact: true }).click();
    await page.locator('.app-shell').waitFor();
    await page.waitForFunction(async () => !(await caches.keys()).includes('a-l-est-previous-test'));
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active === navigator.serviceWorker.controller && registration?.active?.state === 'activated';
    });
    console.log(`${engine.name()}: update detected and applied; cache upgraded and new worker controls the page.`);
    assert.deepEqual(errors, []);
    if (engine === webkit) {
      // Playwright rejects even literal SW responses under WebKit offline emulation:
      // https://github.com/microsoft/playwright/issues/42775
      // Keep this engine's real update/cache checks; Chromium covers offline reload.
      // The active worker and old-cache removal do not establish that a newly
      // reopened WebKit page can already read the new cache. Wait for the
      // actual offline entry, with the same required outcome and a deadline.
      await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/'))), { timeout: 15000 }).toBe(true);
      await page.screenshot({ path: 'docs/development/lot-02-pwa/screenshots/iphone-header-webkit.png' });
      console.log('webkit: resume, manual update, journals and cache verified. Offline emulation excluded (Playwright #42775).');
      continue;
    }
    await context.setOffline(true);
    try { await page.reload(); }
    catch (error) {
      console.log(`${engine.name()} offline navigation diagnostic`, await page.evaluate(async () => ({ worker: navigator.serviceWorker.controller?.state, caches: await caches.keys(), htmlCached: Boolean(await caches.match('/')), fetch: await fetch('/index.html').then(r => r.status).catch(e => e.message) })).catch(e => e.message));
      throw error;
    }
    await page.locator('.app-shell').waitFor();
    assert.equal(await page.locator('.app-update').count(), 0, 'offline fallback must not claim an update');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `docs/development/lot-02-pwa/screenshots/iphone-header-${engine.name()}.png` });
    console.log(`${engine.name()}: resume detects release through the old HTML cache; manual update preserves journals; new release works offline.`);
  } finally { await browser.close(); await server.close(); }
}
