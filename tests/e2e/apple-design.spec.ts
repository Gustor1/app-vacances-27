import { test, expect } from '@playwright/test';

test('closing a sheet preserves keyboard navigation and an unsaved trip stays unsaved', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Créer un voyage', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Brouillon de test');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')))).toEqual([]);
});

test('a mobile sheet follows a drag, reverses without losing the draft, then dismisses on a flick', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Créer un voyage', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Brouillon conservé');
  await expect.poll(() => dialog.evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight))).toBeLessThan(1);
  const handle = await page.locator('.sheet-grabber').boundingBox();
  if (!handle) throw new Error('Mobile sheet grabber is missing');
  const x = handle.x + handle.width / 2, y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 90, { steps: 8 });
  expect(await dialog.evaluate(el => el.getBoundingClientRect().bottom - innerHeight)).toBeGreaterThan(70);
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Brouillon conservé');
  await expect.poll(() => dialog.evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight))).toBeLessThan(1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 230, { steps: 12 });
  await page.mouse.up();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Créer un voyage', exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ton prochain voyage commence ici.', exact: true })).toBeVisible();
});

test('reduced motion uses a static sheet and retains all keyboard controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Créer un voyage', exact: true }).click();
  const dialog = page.getByRole('dialog');
  expect(await dialog.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
