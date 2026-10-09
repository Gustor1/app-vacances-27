import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { translate } from '../src/locale-utils.ts';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';

const server = await productionTestServer(); server.update();
const browser = await chromium.launch(chromiumTestOptions()).catch(async error => { await server.close(); throw error; });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url);
  await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  const preparation = page.locator('.offline-status');
  await expect(preparation).toHaveClass(/offline-ready/);
  await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find(name => name.startsWith('a-l-est-')));
    const request = (await cache.keys()).find(request => /\/assets\/WorldView-/.test(request.url));
    if (!request) throw new Error('Missing lazy world fixture asset');
    const kept = await cache.match(request);
    window.l4Repair = async () => cache.put(request, kept.clone());
    await cache.delete(request);
  });
  await preparation.getByRole('button', { name: 'Vérifier', exact: true }).click();
  await expect(preparation.getByRole('button', { name: 'Vérifier', exact: true })).toBeEnabled();
  await mkdir('docs/development/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/development/screenshots/l4-missing-lazy-390.png', fullPage: true });
  assert.match(await preparation.getAttribute('class'), /offline-missing/, 'A missing lazy module must make offline preparation incomplete');
  await page.evaluate(() => window.l4Repair());
  await preparation.getByRole('button', { name: 'Vérifier', exact: true }).click();
  await expect(preparation).toHaveClass(/offline-ready/);
  await context.setOffline(true);
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Note L4 enregistrée hors ligne');
  await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
  await expect(preparation).toHaveClass(/offline-missing/);
  await preparation.getByRole('button', { name: 'Vérifier', exact: true }).click();
  await expect(preparation).toHaveClass(/offline-ready/);
  for (const language of ['fr','en','zh-CN','es']) {
    await page.evaluate(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'dark' })), language);
    await page.reload();
    await expect(page.getByRole('textbox', { name: translate('Notes personnelles', language), exact: true })).toHaveValue('Note L4 enregistrée hors ligne');
    await expect(preparation).toHaveClass(/offline-ready/);
    await expect(preparation.locator('time')).toBeVisible();
    await preparation.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(preparation.locator('details')).toHaveAttribute('open','');
    for (const width of [320,390,1440]) {
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language}: no overflow at ${width}`);
    }
  }
  const receipts = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('detours-offline-check-v1:')).map(key => localStorage.getItem(key)));
  assert.ok(receipts.length && receipts.every(raw => raw.length < 1024 && !raw.includes('Note L4')));
  await page.screenshot({path:'docs/development/screenshots/l4-ready-offline-es.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('L4 offline smoke passed: missing/corrected lazy cache, offline edit and reload, dated checks, bounded receipts, recovery keyboard, four languages, 320/390/1440.');
} finally { await browser.close(); await server.close(); }
