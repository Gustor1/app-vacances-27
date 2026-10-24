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
    await page.getByLabel('Choisir la mascotte', { exact: true }).selectOption(name);
    await expect(root).toHaveAttribute('data-character', name);
    await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready', 'true');
  }
  await page.getByLabel('Choisir la mascotte', { exact: true }).selectOption('mochi');
  await page.getByRole('checkbox', { name: 'Afficher la mascotte', exact: true }).uncheck();
  await expect(root).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.reload();
  await expect(root).toHaveCount(0);
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await expect(page.getByLabel('Choisir la mascotte', { exact: true })).toHaveValue('mochi');
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
