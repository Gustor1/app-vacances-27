import { chromiumTestOptions } from './browser-test-options.ts';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { archive, blankTrip } from '../src/journeys.ts';

const server = await productionTestServer(); server.update();
const browser = await chromium.launch(chromiumTestOptions()).catch(async error => { await server.close(); throw error; });
const errors = [];
async function offlineProfile() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true); await page.reload();
  return { context, page };
}
try {
  const { page } = await offlineProfile();
  const trip = blankTrip({ id: 'offline-backup', title: 'Sauvegarde hors ligne' });
  trip.documents = [{ id: 'doc', title: 'Billet.txt', content: 'Réservation 中文 😀' }];
  trip.notes.general = 'Sans réseau';
  await page.evaluate(trip => localStorage.setItem('a-l-est-trip-v2:' + trip.id, JSON.stringify(trip)), archive(trip));
  await page.reload();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger ma sauvegarde complète', exact: true }).click();
  const raw = await readFile((await (await downloaded).path()), 'utf8');
  const target = await offlineProfile();
  await target.page.getByLabel('Choisir une sauvegarde complète').setInputFiles({ name: 'offline.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await target.page.getByRole('dialog').getByRole('button', { name: 'Confirmer la restauration', exact: true }).click();
  await target.page.getByRole('button', { name: 'Ouvrir Sauvegarde hors ligne', exact: true }).waitFor();
  await target.page.reload();
  const restored = await target.page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('a-l-est-trip-v2:')).map(k => JSON.parse(localStorage.getItem(k)).state));
  assert.equal(restored.length, 1);
  assert.deepEqual({ ...restored[0], journey: { ...restored[0].journey, id: trip.journey.id } }, trip);
  assert.equal(await target.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mkdir('docs/development/screenshots', { recursive: true });
  await target.page.locator('.backup-panel').screenshot({ path: 'docs/development/screenshots/backup-offline-390.png' });
  assert.deepEqual(errors, []);
  console.log('Backup production smoke passed: export and restore offline in separate Chrome profiles, document and note content, reload, 390px, reduced motion, no runtime errors.');
} finally { await browser.close(); await server.close(); }
