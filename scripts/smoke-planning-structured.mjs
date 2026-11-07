import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { productionTestServer } from './production-server.mjs';

const output = path.resolve('docs/development/lot-03-bis-kit-import/compiled');
await mkdir(output, { recursive: true });
const server = await productionTestServer(); server.update();
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'chrome' : undefined, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage(), errors = [], uploads = [], conversionExternal = [], mapAttempts = [], downloads = [];
let phase = 'conversion';
page.on('pageerror', error => errors.push(error.message));
context.on('request', request => {
  if (request.method() !== 'GET') uploads.push(request.url());
  if (!request.url().startsWith(server.url) && !request.url().startsWith('data:')) {
    if (phase === 'conversion') conversionExternal.push(request.url());
    else mapAttempts.push(request.url());
  }
});
const key = 'detours-planning-draft-v1';
try {
  await page.goto(server.url);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // First use of the kit and JSON importer happens offline, after normal PWA preparation.
  await context.setOffline(true); await page.reload();
  for (const [language, trigger, label] of [
    ['fr', 'Créer depuis un planning', 'Télécharger les consignes pour mon IA'],
    ['en', 'Create from an itinerary', 'Download instructions for my AI'],
    ['zh-CN', '从行程创建', '下载给我的 AI 的说明'],
    ['es', 'Crear desde un itinerario', 'Descargar instrucciones para mi IA'],
  ]) {
    await page.evaluate(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' })), language);
    await page.reload(); await page.getByRole('button', { name: trigger, exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.locator('.planning-kit summary').click();
    const pending = page.waitForEvent('download'); await dialog.getByRole('link', { name: label, exact: true }).click();
    const download = await pending, text = await readFile((await download.path()), 'utf8');
    const relative = language === 'fr' ? '' : `${language}/`;
    assert.equal(text, await readFile(fileURLToPath(new URL(`../public/import-kit/${relative}PREPARER-MON-VOYAGE-DETOURS.md`, import.meta.url)), 'utf8'));
    downloads.push({ language, filename: download.suggestedFilename(), characters: text.length });
    if (language === 'fr') {
      const pendingExample = page.waitForEvent('download');
      await dialog.getByRole('link', { name: 'Télécharger un exemple fictif', exact: true }).click();
      const example = await pendingExample, source = await readFile(await example.path(), 'utf8');
      // New file title proves this is a fresh external result, never pre-opened online.
      const result = JSON.parse(source); result.title = 'Premier import JSON hors ligne';
      const raw = JSON.stringify(result);
      await dialog.locator('input[type=file]').setInputFiles({ name: 'nouveau.detours.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
      await dialog.getByRole('button', { name: 'Remplacer le texte', exact: true }).click();
      await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue(result.title);
      await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Corrigé hors ligne');
      await dialog.getByLabel('Conserver le fichier IA externe dans le carnet après création', { exact: true }).check();
      await page.reload(); await page.getByRole('button', { name: trigger, exact: true }).click();
      const resumed = page.getByRole('dialog');
      await expect(resumed.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Corrigé hors ligne');
      assert.equal((await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).source, raw);
      phase = 'notebook';
      await resumed.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
      await expect(resumed).not.toBeVisible();
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:' + sessionStorage.getItem('a-l-est-open-trip-v2'))).state);
      assert.equal(state.journey.title, 'Corrigé hors ligne');
      assert.ok(state.documents.some(d => d.content === raw && d.title.includes('IA externe')));
      assert.equal(state.expenses, undefined); assert.equal(state.transfers.length, 1);
      await page.screenshot({ path: path.join(output, 'notebook-offline-390.png') });
      // Only disposable browser state is reset to retrieve the other localized kits.
      await page.evaluate(key => { localStorage.removeItem(key); sessionStorage.clear(); }, key);
      await page.goto(server.url); phase = 'conversion';
    } else {
      await page.keyboard.press('Escape');
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(uploads, []); assert.deepEqual(conversionExternal, []);
  assert.ok(mapAttempts.every(url => /^https:\/\/[abc]\.tile\.openstreetmap\.org\//.test(url)));
  await writeFile(path.join(output, 'validation.json'), JSON.stringify({ passed: true, downloads, offlineFirstUse: true, structuredCreationAndReload: true, errors, uploads, conversionExternal, offlineMapAttempts: mapAttempts, physicalDevice: false }, null, 2));
  console.log(JSON.stringify({ passed: true, downloads: downloads.length, output }));
} finally { await browser.close(); await server.close(); }
