import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { archive, blankTrip } from '../../src/journeys';

test('manual source, corrections and new notebook survive reload without replacing an existing notebook', async ({ page }) => {
  const existing = blankTrip({ title: 'Carnet existant', currency: 'EUR', timezone: 'Europe/Paris' });
  const key = 'a-l-est-trip-v2:' + existing.journey!.id;
  const raw = JSON.stringify(archive(existing));
  await page.addInitScript(({ key, raw }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { key, raw });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Analyser mon programme', exact: true })).toBeDisabled();
  await dialog.getByLabel('Ton programme', { exact: true }).fill('Lyon\nJour 1\nMatin : Musée imaginaire\nNote personnelle');
  await dialog.getByRole('button', { name: 'Saisir mon aperçu manuellement', exact: true }).click();
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Mon programme corrigé');
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true }).fill('Lyon');
  await dialog.getByLabel('Titre de la journée', { exact: true }).fill('Jour 1');
  await dialog.getByRole('button', { name: 'Ajouter une activité', exact: true }).click();
  await dialog.getByLabel('Lieu ou activité', { exact: true }).fill('Musée corrigé');
  await dialog.getByLabel('Période', { exact: true }).fill('Matin');
  await expect(dialog.getByLabel('Heure explicite (facultative)', { exact: true })).toHaveValue('');
  await page.reload();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Mon programme corrigé');
  await expect(dialog.getByLabel('Lieu ou activité', { exact: true })).toHaveValue('Musée corrigé');
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mon programme corrigé', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => {
    const key = 'a-l-est-trip-v2:' + sessionStorage.getItem('a-l-est-open-trip-v2');
    return JSON.parse(localStorage.getItem(key)!);
  });
  expect(saved.state.cities[0].days[0].steps[0]).toMatchObject({ title: 'Musée corrigé', period: 'Matin' });
  expect(saved.state.bookings).toEqual([]);
  expect(saved.state.cities[0].days[0].date || '').toBe('');
  expect(saved.state.expenses || []).toEqual([]);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter le carnet', exact: true }).click();
  const download = await downloadPromise;
  const exported = await readFile((await download.path())!, 'utf8');
  expect(exported).toContain('Musée corrigé');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
});

test('ambiguous fixture keeps conflicts visible and exclusion permits creating a notebook', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Charger l’exemple 3', exact: true }).click();
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Madrid');
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('conflits');
  await dialog.locator('.planning-item').last().getByLabel('Exclure', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Madrid', exact: true })).toBeVisible();
});

const localized = [
  ['fr', 'Créer depuis un planning', 'Charger l’exemple 2'],
  ['en', 'Create from an itinerary', 'Load example 2'],
  ['zh-CN', '从行程创建', '载入示例 2'],
  ['es', 'Crear desde un itinerario', 'Cargar ejemplo 2'],
] as const;
for (const [language, trigger, example] of localized) {
  for (const width of [320, 390]) {
    test(`review fits ${width}px and keyboard focus stays in dialog (${language})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript(lang => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: lang, theme: 'light' })), language);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: trigger, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: example, exact: true }).click();
      await expect(dialog.locator('.planning-item')).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await page.screenshot({ path: `test-results/planning-import-${language}-${width}.png`, fullPage: true });
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).not.toContain('user-scalable=no');
      expect(viewport).not.toContain('maximum-scale=1');
    });
  }
}
