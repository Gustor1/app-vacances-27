import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { checkServedBuild } from './build-identity.mjs';
import { raw, trip } from './l6-fixture.mjs';
import { ACCOUNT_HINT_KEY } from '../src/cloud/session-cache.ts';
import { tripKey } from '../src/journeys.ts';

const server = await productionTestServer(); server.update();
const browser = await chromium.launch(chromiumTestOptions());
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await context.route('https://**/*', route => route.abort());
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.url);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: tripKey(trip.journey.id), raw });
  await page.reload();
  const info = await checkServedBuild(page);
  // These modules must genuinely be unopened before going offline.
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => /\/(SourceDocument|markdown)-/.test(r.name))), false);
  await page.getByRole('button', { name: 'Ouvrir ' + trip.journey.title, exact: true }).click();
  await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  const nav = page.getByRole('navigation', { name: 'Navigation principale', exact: true });
  await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
  await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(page.locator('.world-view')).toBeVisible();
  await page.getByRole('tab', { name: 'Mes voyages', exact: true }).click();
  await page.getByRole('button', { name: 'Ouvrir ' + trip.journey.title, exact: true }).click();
  for (const label of ['La carte du voyage', 'Mes envies & bonus', 'Mes transports', 'Vue d’ensemble', 'Mes outils sur place', 'Maintenant', 'Mon carnet pratique']) {
    await nav.getByRole('button', { name: label }).click();
    await expect(nav.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
  }
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Note L8 hors ligne');
  await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Notes personnelles', exact: true })).toHaveValue('Note L8 hors ligne');
  // Read a document through the deferred Markdown module for the first time offline.
  await page.evaluate(key => {
    const archive = JSON.parse(localStorage.getItem(key));
    archive.state.documents = [{ id: 'l8-doc', title: 'Document L8 hors ligne', content: '# Document prêt\n\n**Contenu conservé**.' }];
    localStorage.setItem(key, JSON.stringify(archive));
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(archive) }));
  }, tripKey(trip.journey.id));
  await page.getByRole('button', { name: 'Document L8 hors ligne', exact: true }).click();
  await expect(page.locator('.source-document')).toContainText('Contenu conservé');
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await context.setOffline(false);
  // Cross-tab content and permission invalidation, using an isolated account cache.
  const account = '00000000-0000-4000-8000-000000000081';
  const key = `detours-account-v1:${account}:${tripKey(trip.journey.id)}`;
  await page.evaluate(({ account, hint, key, raw }) => {
    localStorage.setItem(hint, JSON.stringify({ version: 1, id: account }));
    localStorage.setItem(key, JSON.stringify({ version: 1, raw, base: null, revision: 1, privateRevision: 0, pending: false, operation: 'l8', role: 'owner' }));
  }, { account, hint: ACCOUNT_HINT_KEY, key, raw });
  await page.reload();
  await page.getByRole('button', { name: 'Ouvrir ' + trip.journey.title, exact: true }).click();
  await nav.getByRole('button', { name: 'Mon planning', exact: true }).click();
  await page.locator('.day-preparation summary').click();
  const second = await context.newPage(); await second.goto(server.url);
  await second.evaluate(key => {
    const record = JSON.parse(localStorage.getItem(key)), archive = JSON.parse(record.raw);
    archive.state.cities[0].days[0].preparation.activeAlternativeId = 'urban-alternative';
    archive.state.cities[0].days[0].steps[1].title = 'Musée modifié dans l’autre onglet';
    record.raw = JSON.stringify(archive); record.revision++; record.role = 'reader';
    localStorage.setItem(key, JSON.stringify(record));
  }, key);
  await expect(page.locator('.timeline .step-card')).toHaveCount(1);
  await expect(page.locator('.timeline')).toContainText('Musée modifié dans l’autre onglet');
  await expect(page.getByRole('button', { name: 'Revenir au plan initial', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Renseigner les durées et la marge', exact: true })).toBeDisabled();
  const before = await page.evaluate(key => localStorage.getItem(key), key);
  await page.getByRole('button', { name: 'Comparer Plan pluie', exact: true }).click();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), before);
  await second.evaluate(key => { const r = JSON.parse(localStorage.getItem(key)); r.revoked = true; localStorage.setItem(key, JSON.stringify(r)); }, key);
  await expect(page.locator('.timeline')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ouvrir ' + trip.journey.title, exact: true })).toHaveCount(0);
  assert.deepEqual(errors, []);
  console.log(`L8 compiled passed: served identity ${info.id}; unopened world/Markdown modules offline; all views, note/reload; native cross-tab alternative/title/reader/revocation invalidation; no runtime errors. Account permissions simulated locally, not remote proof.`);
  await context.close();
} finally { await browser.close(); await server.close(); }
