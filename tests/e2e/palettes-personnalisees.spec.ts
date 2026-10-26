import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { archive, chinaTrip } from '../../src/journeys';
import { paletteIds, paletteNames, paletteTokens, PALETTES_KEY } from '../../src/palettes';
import { translate, type Language } from '../../src/locale-utils';

test.use({ reducedMotion: 'reduce' });
test.beforeEach(async ({ context }) => { await context.route('https://**/*', route => route.abort()); });
const output = 'docs/development/palettes-personnalisees';
const rgb = (hex: string) => `rgb(${hex.slice(1).match(/../g)!.map(v => parseInt(v, 16)).join(', ')})`;

async function openColors(page: import('@playwright/test').Page, language: Language = 'fr') {
  await page.getByRole('button', { name: translate('Préférences', language), exact: true }).click();
  await page.locator('.palette-collection > summary').click();
}

test('all twelve families apply both appearances, keep notebooks intact and remain usable at 390px', async ({ page, browserName }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 390, height: 844 });
  const trip = chinaTrip(undefined, 'palette-preserved'); trip.notes.personal = 'Texte personnel conservé 中文';
  await page.addInitScript(trip => { if (!localStorage.getItem('a-l-est-trip-v2:palette-preserved')) localStorage.setItem('a-l-est-trip-v2:palette-preserved', JSON.stringify(trip)); }, archive(trip));
  await page.goto('/');
  const original = await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:palette-preserved'));
  await openColors(page);
  const rows = [];
  for (const theme of ['light', 'dark'] as const) {
    await page.getByRole('radio', { name: theme === 'light' ? 'Clair' : 'Sombre', exact: true }).check();
    for (const id of paletteIds.filter(id => theme === 'dark' || id !== 'noir')) {
      await page.getByRole('radio', { name: paletteNames[id], exact: true }).check();
      await expect(page.locator('html')).toHaveAttribute('data-palette', id);
      const colors = paletteTokens(id, theme);
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(rgb(colors['--surface-alt']));
      await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', colors['--surface-alt']);
      expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:palette-preserved'))).toBe(original);
      rows.push({ browserName, theme, id, noOverflow: true, notebookUnchanged: true });
    }
    await page.getByRole('radio', { name: paletteNames.signature, exact: true }).check();
    await page.keyboard.press('Escape');
    await page.locator('.brand-icon').evaluate(el => (el as HTMLImageElement).decode());
    await mkdir(output + '/screenshots', { recursive: true });
    await page.screenshot({ path: `${output}/screenshots/${browserName}-${theme}-signature-390.png` });
    await openColors(page);
    await page.screenshot({ path: `${output}/screenshots/${browserName}-${theme}-collection-390.png` });
  }
  await page.getByRole('radio', { name: paletteNames.bordeaux, exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: paletteNames.corail, exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Réinitialiser les palettes', exact: true }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), PALETTES_KEY)).toEqual({ version: 1, light: 'signature', dark: 'signature' });
  await page.keyboard.press('Escape'); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.brand-icon')).toHaveAttribute('src', '/icons/brand-dark-128.png');
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:palette-preserved'))).toBe(original);
  await writeFile(`${output}/matrix-${browserName}.json`, JSON.stringify(rows, null, 2));
});

test('independent day/night choices survive reload, tab changes and legacy preference writes', async ({ page, context }) => {
  await page.goto('/'); await openColors(page);
  await page.getByRole('radio', { name: 'Clair', exact: true }).check();
  await page.getByRole('radio', { name: paletteNames.corail, exact: true }).check();
  const second = await context.newPage(); await second.goto('/'); await openColors(second);
  await second.getByRole('radio', { name: 'Sombre', exact: true }).check();
  await second.getByRole('radio', { name: paletteNames.glacier, exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'glacier');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), PALETTES_KEY);
  expect(saved).toEqual({ version: 1, light: 'corail', dark: 'glacier' });
  // Simulate an older app that only knows language and theme. The new key must remain intact.
  await second.evaluate(() => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'en', theme: 'light' })));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'corail');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-palette', 'corail');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), PALETTES_KEY)).toEqual(saved);
});

for (const behavior of ['throw', 'silent'] as const) {
  test(`palette saving ${behavior}: session choices work, failure is visible, notebooks and old settings are preserved`, async ({ page }) => {
    await page.addInitScript(({ key, behavior }) => {
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) { if (name === key) { if (behavior === 'throw') throw new Error('Unavailable'); return; } return write.call(this, name, value); };
    }, { key: PALETTES_KEY, behavior });
    await page.goto('/'); await openColors(page);
    await page.getByRole('radio', { name: 'Clair', exact: true }).check();
    await page.getByRole('radio', { name: paletteNames.violet, exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'violet');
    await expect(page.locator('.preferences-save-note')).toHaveText('Ces réglages restent actifs pour cette session, mais leur sauvegarde est indisponible.');
    await page.getByRole('radio', { name: 'Sombre', exact: true }).check();
    await page.getByRole('radio', { name: paletteNames.ocean, exact: true }).check();
    await page.getByRole('radio', { name: 'Clair', exact: true }).check();
    await expect(page.getByRole('radio', { name: paletteNames.violet, exact: true })).toBeChecked();
    expect(await page.evaluate(key => localStorage.getItem(key), PALETTES_KEY)).toBe(null);
    await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-palette', 'signature');
  });
}

test('unknown stored version is retained, defaults stay usable and changing language does not overwrite it', async ({ page }) => {
  const raw = '{"version":99,"light":"future-blue","dark":"future-red"}';
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: PALETTES_KEY, raw });
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-palette', 'signature');
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('radio', { name: 'English', exact: true }).check();
  expect(await page.evaluate(key => localStorage.getItem(key), PALETTES_KEY)).toBe(raw);
});

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`palette collection keyboard, narrow layout and 200% reflow in ${language}`, async ({ page }) => {
    await page.addInitScript(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' })), language);
    await page.goto('/'); await openColors(page, language);
    for (const [width, height, zoom] of [[320,740,1],[430,932,1],[844,390,1],[390,360,1],[640,1000,2]]) {
      await page.setViewportSize({ width, height }); await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      await page.getByRole('radio', { name: translate(paletteNames.soleil, language), exact: true }).check();
      expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: translate('Préférences', language), exact: true })).toBeFocused();
  });
}


test('automatic appearance follows the system while keeping both choices, including before React loads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, light: 'corail', dark: 'violet' }));
    localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'fr', theme: 'system' }));
  }, PALETTES_KEY);
  await page.route('**/src/main.tsx*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'violet');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(rgb(paletteTokens('violet', 'dark')['--surface-alt']));
  await page.unroute('**/src/main.tsx*'); await page.reload();
  await page.getByRole('button', { name: 'Préférences', exact: true }).waitFor();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'corail');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'violet');
  await expect(page.locator('.brand-icon')).toHaveAttribute('src', '/icons/brand-dark-128.png');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), PALETTES_KEY)).toEqual({ version: 1, light: 'corail', dark: 'violet' });
});
