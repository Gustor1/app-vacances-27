import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { archive, blankTrip } from '../../src/journeys';

const draftKey = 'detours-planning-draft-v1';
const lyonSource = '# Week-end lyonnais\n## Lyon\n### Jour 1 — 2027-05-02\n- 09:30 : Musée des Confluences\n- Après-midi : Parc de la Tête d’Or\n### Jour 2 — 2027-05-03\n- Matin : Vieux Lyon\nNote : prendre un parapluie.';

async function openImport(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  return page.getByRole('dialog');
}

test('a real Markdown file becomes corrected days and activities, survives reload and preserves the existing notebook', async ({ page }, testInfo) => {
  const existing = blankTrip({ title: 'Carnet conservé', currency: 'EUR', timezone: 'Europe/Paris' });
  const existingKey = 'a-l-est-trip-v2:' + existing.journey!.id;
  const existingRaw = JSON.stringify(archive(existing));
  await page.addInitScript(({ key, raw }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { key: existingKey, raw: existingRaw });
  let providerCalls = 0;
  page.on('request', request => { if (request.url().includes('/api/planning-extraction')) providerCalls++; });
  let dialog = await openImport(page);
  const filename = testInfo.outputPath('week-end-lyon.md');
  await writeFile(filename, lyonSource, 'utf8');
  await dialog.getByLabel('Ouvrir un fichier texte ou Markdown', { exact: true }).setInputFiles(filename);
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(lyonSource);
  await dialog.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  await expect(dialog.locator('.planning-day')).toHaveCount(2);
  await expect(dialog.locator('.planning-item')).toHaveCount(3);
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Week-end lyonnais');
  await expect(dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true })).toHaveValue('Lyon');
  await expect(dialog.getByLabel('Date (facultative)', { exact: true }).first()).toHaveValue('2027-05-02');
  await expect(dialog.getByLabel('Date (facultative)', { exact: true }).last()).toHaveValue('2027-05-03');
  await expect(dialog.getByLabel('Heure explicite (facultative)', { exact: true }).first()).toHaveValue('09:30');
  await expect(dialog.getByLabel('Heure explicite (facultative)', { exact: true }).nth(1)).toHaveValue('');
  await dialog.getByLabel('Lieu ou activité', { exact: true }).first().fill('Musée corrigé');
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await dialog.getByLabel('Conserver le texte original dans le carnet après création', { exact: true }).check();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')).length)).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Lieu ou activité', { exact: true }).first()).toHaveValue('Musée corrigé');
  await expect(dialog.locator('.planning-day')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Week-end lyonnais', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:' + sessionStorage.getItem('a-l-est-open-trip-v2'))!).state);
  expect(saved.cities[0].days).toHaveLength(2);
  expect(saved.cities[0].days[0].steps).toHaveLength(2);
  expect(saved.cities[0].days[0].steps[0].title).toBe('Musée corrigé');
  expect(saved.documents).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Planning — texte original', content: lyonSource })]));
  expect(saved.bookings).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), existingKey)).toBe(existingRaw);
  expect(providerCalls).toBe(0);
});

test('pasted source without a city keeps the missing city visible and requires correction before creation', async ({ page }) => {
  const dialog = await openImport(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const source = 'Jour 1\n- Matin : Musée de la ville\nJour 2\n- 14:00 : Balade au parc';
  await page.evaluate(text => navigator.clipboard.writeText(text), source);
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(source);
  await dialog.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  await expect(dialog.locator('.planning-day')).toHaveCount(2);
  await expect(dialog.locator('.planning-item')).toHaveCount(2);
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('');
  await expect(dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true })).toHaveValue('');
  await expect(dialog.getByText('Le titre du voyage ou une ville n’a pas pu être identifié avec certitude.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('a-l-est-trip-v2:')))).toBe(false);
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Deux journées à choisir');
  await dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true }).fill('Ma destination');
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const sourceAfter = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).source, draftKey);
  expect(sourceAfter).toBe(source);
});

test('invalid real files preserve the current source and valid replacement needs an explicit choice', async ({ page }, testInfo) => {
  let dialog = await openImport(page);
  const source = 'Mon texte à conserver\nJour 1 : promenade';
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(source);
  const invalid = [
    { name: 'voyage.pdf', content: Buffer.from('%PDF-1.7'), message: 'Document corrompu' },
    { name: 'binaire.txt', content: Buffer.from('Jour 1\u0000corrompu'), message: 'données binaires' },
    { name: 'encodage.txt', content: Buffer.from([0xc3, 0x28]), message: 'UTF-8 lisible' },
    { name: 'vide.md', content: Buffer.from('\n  '), message: 'ne contient pas de texte' },
    { name: 'long.md', content: Buffer.from('a'.repeat(50_001)), message: '50 000 caractères' },
    { name: 'gros.md', content: Buffer.from('a'.repeat(200_001)), message: '200 Ko' },
  ];
  for (const input of invalid) {
    const filename = testInfo.outputPath(input.name);
    await writeFile(filename, input.content);
    await dialog.getByLabel('Ouvrir un fichier texte ou Markdown', { exact: true }).setInputFiles(filename);
    await expect(dialog.getByRole('alert')).toContainText(input.message);
    await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(source);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).source, draftKey)).toBe(source);
  }
  const filename = testInfo.outputPath('remplacement.txt');
  await writeFile(filename, lyonSource, 'utf8');
  await dialog.getByLabel('Ouvrir un fichier texte ou Markdown', { exact: true }).setInputFiles(filename);
  await expect(dialog.getByRole('button', { name: 'Remplacer le texte', exact: true })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(source);
  await dialog.getByRole('button', { name: 'Annuler', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Remplacer le texte', exact: true })).not.toBeVisible();
  await dialog.getByLabel('Ouvrir un fichier texte ou Markdown', { exact: true }).setInputFiles(filename);
  await dialog.getByRole('button', { name: 'Remplacer le texte', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(lyonSource);
  await page.reload();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(lyonSource);
});

const languages = [
  ['en', 'Create from an itinerary', 'Recognize my itinerary', 'Open a text or Markdown file', '# London\nDay 1\n- Morning: British Museum\nDay 2\n- 14:00: Hyde Park'],
  ['zh-CN', '从行程创建', '识别我的行程', '打开文本或 Markdown 文件', '# 上海\n第1天\n- 上午：上海博物馆\n第2天\n- 14:00：外滩'],
  ['es', 'Crear desde un itinerario', 'Reconocer mi itinerario', 'Abrir un archivo de texto o Markdown', '# Madrid\nDía 1\n- Mañana: Museo del Prado\nDía 2\n- 14:00: Parque del Retiro'],
] as const;

for (const [language, trigger, recognize, fileLabel, source] of languages) {
  test(`local file recognition works in ${language} at 320px without overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript(lang => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: lang, theme: 'light' })), language);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: trigger, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const filename = testInfo.outputPath(`${language}.markdown`);
    await writeFile(filename, source, 'utf8');
    await dialog.getByLabel(fileLabel, { exact: true }).setInputFiles(filename);
    await expect(dialog.getByRole('button', { name: recognize, exact: true })).toBeEnabled();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: recognize, exact: true }).click();
    await expect(dialog.locator('.planning-day')).toHaveCount(2);
    await expect(dialog.locator('.planning-item')).toHaveCount(2);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('local-recognition.png'), fullPage: true });
  });
}
