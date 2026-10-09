import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit, devices } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';

await mkdir('docs/design/screenshots', { recursive: true });
for (const engine of [chromium, webkit]) {
  const server = await productionTestServer({ previousPage: true });
  const browser = await engine.launch(engine === chromium && process.platform === 'win32' ? { channel: 'chrome' } : {});
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'dark' });
    const page = await context.newPage();
    const errors = [];
    const checks = [];
    page.on('request', request => { if (request.url().includes('app-update=')) checks.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.url);
    await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
    await page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    assert.equal(await page.locator('.app-update').count(), 0, 'no update prompt for the current release');
    const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
    const oldEntry = await page.locator('script[type=module][src]').getAttribute('src');
    assert.ok(oldEntry.endsWith('?previous=1'));
    // Leave an unsaved search visible: discovering an update must not reload it.
    await page.getByRole('textbox', { name: 'Rechercher dans le carnet' }).fill('Brouillon conservé');
    server.update();
    // Resume as Safari would when returning to a tab from its page cache.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    try { await page.getByText('Une nouvelle version est prête.', { exact: true }).waitFor({ timeout: 8000 }); }
    catch (error) { console.log({ checks, errors, entry: await page.locator('script[type=module][src]').getAttribute('src'), html: await page.evaluate(async () => (await (await fetch('/index.html?diagnostic=1')).text()).match(/src="\/assets\/index-[^"]+/)?.[0]) }); throw error; }
    assert.equal(await page.getByRole('textbox', { name: 'Rechercher dans le carnet' }).inputValue(), 'Brouillon conservé');
    assert.equal(await page.locator('script[type=module][src]').getAttribute('src'), oldEntry);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]))), before);
    await page.screenshot({ path: `docs/design/screenshots/iphone-update-${engine.name()}.png` });
    await page.getByRole('button', { name: 'Mettre à jour', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('script[type=module][src]')?.getAttribute('src')?.includes('previous=1'));
    await page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' }).waitFor();
    assert.equal(await page.locator('.app-update').count(), 0);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]))), before);
    await page.waitForFunction(async () => !(await caches.keys()).includes('a-l-est-previous-test'));
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active === navigator.serviceWorker.controller && registration?.active?.state === 'activated';
    });
    console.log(`${engine.name()}: update detected and applied; cache upgraded and new worker controls the page.`);
    if (engine === webkit) {
      // Playwright rejects even literal SW responses under WebKit offline emulation:
      // https://github.com/microsoft/playwright/issues/42775
      // Keep this engine's real update/cache checks; Chromium covers offline reload.
      assert.equal(await page.evaluate(async () => Boolean(await caches.match('/'))), true);
      await page.screenshot({ path: 'docs/design/screenshots/iphone-header-webkit.png' });
      console.log('webkit: resume, manual update, journals and cache verified. Offline emulation excluded (Playwright #42775).');
      continue;
    }
    await context.setOffline(true);
    try { await page.reload(); }
    catch (error) {
      console.log(`${engine.name()} offline navigation diagnostic`, await page.evaluate(async () => ({ worker: navigator.serviceWorker.controller?.state, caches: await caches.keys(), htmlCached: Boolean(await caches.match('/')), fetch: await fetch('/index.html').then(r => r.status).catch(e => e.message) })).catch(e => e.message));
      throw error;
    }
    await page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' }).waitFor();
    assert.equal(await page.locator('.app-update').count(), 0, 'offline fallback must not claim an update');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `docs/design/screenshots/iphone-header-${engine.name()}.png` });
    console.log(`${engine.name()}: resume detects release through the old HTML cache; manual update preserves journals; new release works offline.`);
  } finally { await browser.close(); await server.close(); }
}
