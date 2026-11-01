import { test, expect } from '@playwright/test';
import { translate } from '../../src/locale-utils';

test('installation has the correct name and keeps the existing identity', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  const manifest = await response.json();
  expect(manifest.name).toBe('Détours');
  expect(manifest.short_name).toBe('Détours');
  expect(manifest.id).toBe('/');
  expect(manifest.start_url).toBe('/');
});

test('mascot previews work while hidden, with keyboard selection and persistence', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Afficher la mascotte', exact: true }).uncheck();
  const summary = page.locator('.mascot-picker > summary');
  await summary.focus(); await page.keyboard.press('Enter');
  const options = page.locator('.mascot-picker-options');
  await expect(options.getByRole('button')).toHaveCount(3);
  for (const preview of await options.locator('.mascot-picker-preview').all()) {
    await expect(preview).toHaveAttribute('data-ready', 'true');
    expect(await preview.locator('canvas').evaluate(el => {
      const data = (el as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 256, 256).data;
      return data.some((value, index) => index % 4 === 3 && value > 0);
    })).toBe(true);
  }
  await summary.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('mascot-picker-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await expect(options.getByRole('button', { name: 'Mochi', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(summary).toContainText('Mochi');
  await expect(summary).toBeFocused();
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await expect(summary).toContainText('Mochi');
  await expect(page.getByRole('checkbox', { name: 'Afficher la mascotte', exact: true })).not.toBeChecked();
});

test('black palette persists, follows automatic mode and is translated in every language', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('radio', { name: 'Automatique', exact: true }).check();
  await page.locator('.palette-collection > summary').click();
  await page.getByRole('radio', { name: 'Noir', exact: true }).check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'noir');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', '#000000');
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.locator('.palette-collection > summary').click();
  for (const [lang, name] of [['en', 'English'], ['zh-CN', '中文（简体）'], ['es', 'Español'], ['fr', 'Français']] as const) {
    await page.getByRole('radio', { name, exact: true }).check();
    await expect(page.getByRole('radio', { name: translate('Noir', lang), exact: true })).toBeChecked();
  }
  await page.screenshot({ path: test.info().outputPath('black-palette.png') });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'signature');
  await expect(page.getByRole('radio', { name: 'Noir', exact: true })).toHaveCount(0);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'noir');
});

