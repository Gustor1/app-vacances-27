import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { paletteTokens, PALETTES_KEY } from '../src/palettes.ts';
import { translate } from '../src/locale-utils.ts';

const output = 'docs/development/lot-02-pwa';
await mkdir(output + '/screenshots', { recursive: true });
const server = await productionTestServer(); server.update();
const profile = await mkdtemp(join(tmpdir(), 'detours-pwa-install-'));
const context = await chromium.launchPersistentContext(profile, { ...chromiumTestOptions(), reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
const errors = [], matrix = [];
try {
  await context.route('https://**/*', route => route.abort());
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url);
  await page.getByRole('button', { name: 'Préférences', exact: true }).waitFor();
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
  assert.equal(manifest.id, '/'); assert.equal(manifest.start_url, '/'); assert.equal(manifest.scope, '/'); assert.equal(manifest.display, 'standalone');
  const resources = [...manifest.icons.filter(icon => icon.type === 'image/png').map(icon => [icon.src, Number(icon.sizes.split('x')[0])]), ['/icons/apple-touch-icon.png', 180]];
  for (const [path, size] of resources) {
    const bytes = await readFile('dist' + path);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size);
    assert.equal((await context.request.get(server.url + path)).status(), 200);
  }
  assert.equal(await page.locator('link[rel=apple-touch-icon]').getAttribute('href'), '/icons/apple-touch-icon.png');
  assert.equal(await page.locator('link[rel=icon][sizes="32x32"]').getAttribute('href'), '/icons/favicon-32.png');
  assert.equal(await page.locator('.brand-icon').evaluate(el => el.complete && el.naturalWidth === 128), true);
  assert.doesNotMatch(await page.locator('meta[name=viewport]').getAttribute('content'), /user-scalable=no|maximum-scale=1/);
  const cdp = await context.newCDPSession(page);
  const appManifest = await cdp.send('Page.getAppManifest');
  assert.deepEqual(appManifest.errors, []);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, []);
  for (const language of ['fr', 'en', 'zh-CN', 'es']) {
    const t = source => translate(source, language);
    await page.evaluate(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' })), language);
    await page.reload();
    await page.getByRole('button', { name: t('Préférences'), exact: true }).click();
    await page.getByRole('dialog').getByText(t('Installer Détours'), { exact: true }).waitFor();
    await page.getByRole('dialog').locator('.install-help summary').click();
    for (const [width, height, zoom] of [[320, 740, 1], [390, 844, 1], [430, 932, 1], [844, 390, 1], [390, 360, 1], [640, 1000, 2]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      const dialog = page.getByRole('dialog');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language} home ${width} zoom ${zoom}`);
      assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${language} preferences ${width} zoom ${zoom}`);
      await dialog.getByRole('button', { name: t('Fermer'), exact: true }).focus();
      await page.keyboard.press('Tab'); assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)));
      matrix.push({ language, width, height, zoom, view: 'preferences', overflow: false });
      if (width === 320) await page.screenshot({ path: `${output}/screenshots/install-${language}-320.png` });
    }
    await page.evaluate(() => { document.documentElement.style.zoom = ''; });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: t('Créer depuis un planning'), exact: true }).click();
    const source = page.getByRole('dialog').getByRole('textbox', { name: t('Ton programme'), exact: true });
    await source.fill('# Escale\nVille: Albi\nJour 1\n- Musée rouge');
    for (const [width, height] of [[320, 740], [390, 360], [430, 932], [844, 390]]) {
      await page.setViewportSize({ width, height }); await source.focus();
      await source.scrollIntoViewIfNeeded(); await expect(source).toBeInViewport();
      assert.ok(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      matrix.push({ language, width, height, view: 'import-focused', overflow: false });
    }
    await page.keyboard.press('Escape');
  }
  await page.evaluate(() => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'fr', theme: 'light' })));
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const cacheIcons = await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find(name => /^a-l-est-[a-f0-9]{12}$/.test(name)));
    return Promise.all(['/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png', '/icons/brand-128.png', '/icons/brand-dark-128.png', '/palettes.css', '/palette-bootstrap.js', '/icons/favicon-32.png', '/icons/favicon-48.png'].map(async p => !!(await cache.match(p))));
  });
  assert.ok(cacheIcons.every(Boolean));
  await context.setOffline(true);
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Lot 02 : note conservée hors ligne');
  await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
  await page.close();
  const reopened = await context.newPage(); await reopened.goto(server.url);
  reopened.on('pageerror', error => errors.push(error.message));
  await reopened.getByRole('button', { name: 'Ouvrir Chine 2027', exact: true }).click();
  await reopened.getByRole('button', { name: 'Menu', exact: true }).click();
  await reopened.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  await expect(reopened.getByRole('textbox', { name: 'Notes personnelles', exact: true })).toHaveValue('Lot 02 : note conservée hors ligne');
  await expect(reopened.locator('.offline-status')).toHaveClass(/offline-ready/);
  await context.setOffline(false); await reopened.reload();
  await expect(reopened.getByRole('textbox', { name: 'Notes personnelles', exact: true })).toHaveValue('Lot 02 : note conservée hors ligne');
  const notebooksBefore = await reopened.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('a-l-est-trip-v2:'))));
  await reopened.getByRole('button', { name: 'Préférences', exact: true }).click();
  await reopened.getByRole('radio', { name: 'Sombre', exact: true }).check();
  await reopened.locator('.palette-collection > summary').click();
  await reopened.getByRole('radio', { name: 'Violet origami', exact: true }).check();
  await reopened.keyboard.press('Escape');
  await context.setOffline(true); await reopened.close();
  const custom = await context.newPage(); await custom.goto(server.url);
  custom.on('pageerror', error => errors.push(error.message));
  await expect(custom.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(custom.locator('html')).toHaveAttribute('data-palette', 'violet');
  await custom.locator('.brand-icon').evaluate(el => el.decode());
  assert.equal(await custom.locator('.brand-icon').getAttribute('src'), '/icons/brand-dark-128.png');
  assert.equal(await custom.locator('.brand-icon').getAttribute('data-logo-palette'), 'violet');
  assert.match(await custom.locator('.brand-icon').evaluate(el => getComputedStyle(el).filter), /^url\(/);
  assert.equal(await custom.locator('meta[name=theme-color]').getAttribute('content'), paletteTokens('violet', 'dark')['--surface-alt']);
  assert.equal(await custom.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--surface-alt').trim()), paletteTokens('violet', 'dark')['--surface-alt']);
  assert.deepEqual(await custom.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('a-l-est-trip-v2:')))), notebooksBefore);
  assert.deepEqual(await custom.evaluate(key => JSON.parse(localStorage.getItem(key)), PALETTES_KEY), { version: 1, light: 'signature', dark: 'violet' });
  await context.setOffline(false); await custom.reload();
  await expect(custom.locator('html')).toHaveAttribute('data-palette', 'violet');
  assert.deepEqual(errors, []);
  const build = JSON.parse(await readFile('dist/build-info.json', 'utf8'));
  await writeFile(`${output}/mobile-validation.json`, JSON.stringify({ buildId: build.id, browser: context.browser()?.version(), profile, engine: 'Chromium desktop; CSS zoom and reduced viewport, not physical keyboard/safe areas', matrix, resources, manifestErrors: appManifest.errors, installability, cacheIcons, closeReopenOffline: true, reconnect: true, customPaletteOfflineReopen: true, notebooksUnchangedByPalette: true, errors, physicalIphone: 'NON EXÉCUTÉ', osInstallation: 'NON EXÉCUTÉ' }, null, 2));
  console.log(`PWA mobile compiled passed: ${matrix.length} layouts, icons served/cached, manifest/installability, four languages, offline edit/close/reopen/reconnect; build ${build.id}.`);
} catch (error) {
  const page = context.pages().at(-1);
  console.error({ lastLayouts: matrix.slice(-3), dialogs: await page?.locator('[role=dialog],dialog').allTextContents() });
  await page?.screenshot({ path: `${output}/screenshots/failure.png`, fullPage: true });
  throw error;
} finally { await context.close(); await server.close(); }
