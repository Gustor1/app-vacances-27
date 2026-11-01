import { test, expect } from '@playwright/test';
import { blankTrip, archive, tripKey } from '../../src/journeys';
import { mkdir } from 'node:fs/promises';

test('animated companions: three characters, narrow hitbox, drag, preferences and real trip shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.mascot-hint img')).toHaveCount(0);
  const button = page.locator('.floating-mascot .pet-button');
  const root = page.locator('.floating-mascot');
  expect(await button.evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + 2)); })).toBe(false);
  const before = (await root.boundingBox())!;
  await page.mouse.move(before.x + 48, before.y + 65);
  await page.mouse.down(); await page.mouse.move(before.x - 100 + 48, before.y - 100 + 65, { steps: 10 }); await page.mouse.up();
  expect((await root.boundingBox())!.x).toBeLessThan(before.x - 70);
  await expect(page.locator('#mascot-shortcuts')).toHaveCount(0);
  await button.focus(); await page.keyboard.press('Enter');
  await page.locator('#mascot-shortcuts').getByRole('button', { name: 'Préférences', exact: true }).click();
  for (const name of ['mochi', 'bivouac', 'pico']) {
    await page.locator('.mascot-picker > summary').click();
    await page.locator('.mascot-picker-options').getByRole('button', { name: name[0].toUpperCase() + name.slice(1), exact: true }).click();
    await expect(root).toHaveAttribute('data-character', name);
    await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
  }
  await page.locator('.mascot-picker > summary').click();
  await page.locator('.mascot-picker-options').getByRole('button', { name: 'Mochi', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Afficher la mascotte', exact: true }).uncheck();
  await expect(root).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.reload();
  await expect(root).toHaveCount(0);
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await expect(page.locator('.mascot-picker > summary')).toContainText('Mochi');
  await page.getByRole('checkbox', { name: 'Afficher la mascotte', exact: true }).check();
  await page.keyboard.press('Escape');
  const trip = blankTrip({ title: 'Voyage mascotte' });
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: tripKey(trip.journey!.id), raw: JSON.stringify(archive(trip)) });
  await page.reload();
  await page.getByRole('button', { name: 'Ouvrir Voyage mascotte', exact: true }).click();
  await expect(root).toHaveCount(1);
  await mkdir('docs/development/mascottes-integrees', { recursive: true });
  await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'docs/development/mascottes-integrees/mobile.png' });
  await button.focus(); await page.keyboard.press('Enter');
  await page.locator('#mascot-shortcuts').getByRole('button', { name: 'Voir Maintenant', exact: true }).click();
  await expect(page.locator('.now-view')).toBeVisible();
  await button.focus(); await page.keyboard.press('Enter');
  await page.locator('#mascot-shortcuts').getByRole('button', { name: 'Explorer les bonus', exact: true }).click();
  await expect(page.locator('#mascot-shortcuts')).toHaveCount(0);
});

test('touch drag, cancellation, reduced motion and viewport resizing', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const sprite = page.locator('.mascot-sprite'), trigger = page.locator('.pet-button'), root = page.locator('.floating-mascot');
  await expect(sprite).toHaveAttribute('data-ready', 'true');
  await expect(sprite).toHaveAttribute('data-frame', '0');
  // Synthetic touch pointers exercise the same handlers used by mobile browsers.
  const start = (await root.boundingBox())!;
  const pointer = { pointerId: 21, pointerType: 'touch', isPrimary: true, button: 0 };
  // Dispatch cannot create native pointer capture; stub only that browser primitive.
  await trigger.evaluate(el => { el.setPointerCapture = () => {}; el.hasPointerCapture = () => false; });
  await trigger.dispatchEvent('pointerdown', { ...pointer, clientX: start.x + 48, clientY: start.y + 65 });
  await trigger.dispatchEvent('pointermove', { ...pointer, clientX: start.x - 52, clientY: start.y - 35 });
  expect((await root.boundingBox())!.x).toBeLessThan(start.x - 70);
  await trigger.dispatchEvent('pointercancel', pointer);
  expect((await root.boundingBox())!.x).toBeCloseTo(start.x, 0);
  await trigger.dispatchEvent('pointerdown', { ...pointer, clientX: start.x + 48, clientY: start.y + 65 });
  await trigger.dispatchEvent('pointermove', { ...pointer, clientX: start.x - 52, clientY: start.y - 35 });
  await trigger.dispatchEvent('pointerup', pointer);
  await page.reload(); await expect(sprite).toHaveAttribute('data-ready', 'true');
  expect((await root.boundingBox())!.x).toBeLessThan(start.x - 70);
  await page.setViewportSize({ width: 320, height: 568 });
  const end = (await root.boundingBox())!;
  expect(end.x).toBeGreaterThanOrEqual(0); expect(end.x + end.width).toBeLessThanOrEqual(320);
  expect(end.y + end.height).toBeLessThanOrEqual(568);
  await context.close();
});

for (const notebook of [false, true]) test(`companion and menu stay reachable at every edge (${notebook ? 'notebook' : 'home'})`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (notebook) {
    const trip = blankTrip({ title: 'Limites écran' });
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: tripKey(trip.journey!.id), raw: JSON.stringify(archive(trip)) });
    await page.reload();
    await page.getByRole('button', { name: 'Ouvrir Limites écran', exact: true }).click();
  }
  const pet = page.locator('.floating-mascot'), button = pet.locator('.pet-button'), menu = page.locator('#mascot-shortcuts');
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
    for (const [x, y] of [[0, 0], [viewport.width, 0], [viewport.width, viewport.height], [0, viewport.height]]) {
      const start = (await pet.boundingBox())!;
      await page.mouse.move(start.x + start.width / 2, start.y + start.height * .7);
      await page.mouse.down(); await page.mouse.move(x, y, { steps: 5 }); await page.mouse.up();
      await expect(menu).toHaveCount(0);
      const rect = (await pet.boundingBox())!;
      const header = (await page.locator(notebook ? '.topbar' : '.journeys-topbar').boundingBox())!;
      expect(rect.y).toBeGreaterThanOrEqual(header.y + header.height);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
      if (notebook && viewport.width > 760) {
        const sidebar = (await page.locator('.sidebar').boundingBox())!;
        expect(rect.x).toBeGreaterThanOrEqual(sidebar.x + sidebar.width);
      }
      if (notebook && viewport.width === 390) {
        const bottom = (await page.locator('.mobile-bottom-nav').boundingBox())!;
        expect(rect.y + rect.height).toBeLessThanOrEqual(bottom.y);
      }
      // A visible bounding box alone is insufficient: navigation must not cover it.
      expect(await button.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height * .7)); })).toBe(true);
      await button.press('Enter');
      const box = (await menu.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y).toBeGreaterThanOrEqual(header.y + header.height); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      if (y === 0) { await expect(menu).toHaveAttribute('data-placement', 'below'); expect(box.y).toBeGreaterThanOrEqual(rect.y + rect.height); }
      await page.keyboard.press('Escape');
    }
  }
  // A short landscape viewport must keep the entire panel inside the screen and
  // allow reaching the last action through internal scrolling.
  await page.setViewportSize({ width: 568, height: 250 });
  await button.press('Enter');
  await expect.poll(async () => { const b = (await menu.boundingBox())!; return b.y >= 0 && b.y + b.height <= 250 && b.x >= 0 && b.x + b.width <= 568; }).toBe(true);
  await menu.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(menu).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
  expect(await button.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height * .7)); })).toBe(true);
});
