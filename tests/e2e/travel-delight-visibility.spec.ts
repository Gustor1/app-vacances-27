import { test, expect, type Page } from '@playwright/test';
import { fixture } from '../../scripts/companion-fixture.mjs';
import { archive, tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';

async function emptyNotebook(page: Page, language: Language = 'fr') {
  await page.route('https://**/*', route => route.abort());
  const state = fixture(); state.documents = []; state.expenses = [];
  await page.goto('/');
  await page.evaluate(({ raw, key, language }) => {
    localStorage.setItem(key, raw);
    localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: language === 'en' ? 'dark' : 'light' }));
  }, { raw: JSON.stringify(archive(state)), key: tripKey(state.journey!.id), language });
  await page.reload();
  await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: state.journey!.title }), exact: true }).click();
}
async function navigate(page: Page, label: string, language: Language = 'fr') {
  const item = page.locator('.nav-item').filter({ hasText: translate(label, language) });
  if (!await item.isVisible()) await page.getByRole('button', { name: translate('Ouvrir le menu', language), exact: true }).click();
  await item.click();
}

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`empty document folder is visible and opens the real file picker: ${language}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await emptyNotebook(page, language); await navigate(page, 'Mon carnet pratique', language);
    const folder = page.locator('.travel-folder-empty');
    await expect(folder).toBeVisible();
    const picker = page.waitForEvent('filechooser'); await folder.click();
    await (await picker).setFiles({ name: 'preuve-dossier.md', mimeType: 'text/markdown', buffer: Buffer.from('Document fictif de vérification.') });
    await expect(page.locator('.travel-folders')).toContainText('preuve-dossier.md');
    await expect(folder).toHaveCount(0);
  });

  test(`expense chart remains visible with no data or missing rates: ${language}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await emptyNotebook(page, language); await navigate(page, 'Mes outils sur place', language);
    await page.getByRole('tab', { name: translate('Budget', language), exact: true }).click();
    const chart = page.locator('.budget-breakdown'); await expect(chart).toBeVisible();
    await expect(chart.locator('.budget-donut-empty')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const form = page.locator('form').filter({ has: page.locator('input[name="label"]') });
    await form.locator('input[name="label"]').fill('Dépense sans taux'); await form.locator('input[name="amount"]').fill('100');
    await form.locator('input[name="currency"]').fill('JPY');
    await form.getByRole('button', { name: translate('Ajouter la dépense', language), exact: true }).click();
    await expect(chart.locator('.budget-donut-empty')).toBeVisible();
    await expect(chart.locator('.budget-donut-value strong')).toHaveText('—');
    await form.locator('input[name="label"]').fill('Dépense fictive'); await form.locator('input[name="amount"]').fill('20');
    await form.locator('input[name="currency"]').fill('EUR');
    await form.getByRole('button', { name: translate('Ajouter la dépense', language), exact: true }).click();
    await expect(chart.locator('.budget-donut-segment')).toHaveCount(1);
    await expect(chart.locator('.budget-donut-empty')).toHaveCount(0);
  });
}

test('import progress stays visible while scrolling on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 }); await page.goto('/');
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  const progress = page.locator('.travel-import-progress'); await expect(progress).toBeVisible();
  await page.locator('.modal-content').evaluate(element => { element.scrollTop = 700; });
  await expect(progress).toBeInViewport({ ratio: 1 });
  await expect(progress).toContainText('1 / 3');
});

const worldShift = (page: import('@playwright/test').Page) => page.locator('.world-line-art .line-art-world').evaluate(element => Number(/translate\((-?[\d.]+)/.exec(element.getAttribute('transform') ?? '')?.[1] ?? 0));

test('line-art tour movement is perceptible within the first two seconds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/');
  await page.locator('.world-line-art[data-play=true]').waitFor();
  await expect(page.locator('.world-line-art')).toHaveAttribute('aria-hidden', 'true');
  const start = await worldShift(page);
  await expect.poll(async () => Math.abs((await worldShift(page)) - start), { timeout: 1800, intervals: [200] }).toBeGreaterThan(2);
});

test('reduced motion starts on a still line-art frame but an explicit play action works', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.locator('.world-line-art .line-art-world').waitFor({ state: 'attached' });
  await expect(page.getByRole('button', { name: 'Animer l’illustration', exact: true })).toBeVisible();
  const still = await worldShift(page);
  await page.waitForTimeout(600);
  expect(await worldShift(page)).toBe(still);
  await page.getByRole('button', { name: 'Animer l’illustration', exact: true }).click();
  await expect.poll(async () => Math.abs((await worldShift(page)) - still), { timeout: 1800, intervals: [200] }).toBeGreaterThan(2);
  await page.getByRole('button', { name: 'Mettre l’illustration en pause', exact: true }).click();
  const paused = await worldShift(page);
  await page.waitForTimeout(500);
  expect(await worldShift(page)).toBe(paused);
});
