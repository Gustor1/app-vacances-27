import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function nav(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Ouvrir le menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name, exact: name !== 'Mes envies & bonus' }).click();
}
async function downloadedText(page: Page, action: () => Promise<unknown>) {
  const waiting = page.waitForEvent('download');
  await action();
  return readFile((await (await waiting).path())!, 'utf8');
}
test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('deux onglets conservent des notes distinctes et une visite après rechargement', async ({ page, context }) => {
  const second = await context.newPage(); await second.goto('/');
  await page.getByLabel('Ma note pour Shenzhen', { exact: true }).fill('Note dans le premier onglet');
  await second.locator('main').getByRole('button', { name: /Guangzhou/ }).click();
  await second.getByLabel('Ma note pour Guangzhou', { exact: true }).fill('Note dans le second onglet');
  await page.getByRole('button', { name: 'Marquer comme visité : Arrivée à Shenzhen', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('Ma note pour Shenzhen', { exact: true })).toHaveValue('Note dans le premier onglet');
  await expect(page.getByRole('button', { name: 'Marquer à faire : Arrivée à Shenzhen', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('main').getByRole('button', { name: /Guangzhou/ }).click();
  await expect(page.getByLabel('Ma note pour Guangzhou', { exact: true })).toHaveValue('Note dans le second onglet');
  await second.close();
});

test('sauvegarde corrompue télécharge exactement les octets originaux', async ({ page }) => {
  const raw = '{bad-json\n  "notes": "à récupérer 中文"';
  await page.evaluate(value => localStorage.setItem('a-l-est-v1', value), raw);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('illisible');
  expect(await downloadedText(page, () => page.getByRole('button', { name: 'Télécharger le fichier original', exact: true }).click())).toBe(raw);
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-v1'))).toBe(raw);
});

test('nouvelle ville sans coordonnées n’invente aucun repère', async ({ page }) => {
  await page.locator('main').getByRole('button', { name: 'Ajouter une ville', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nom de la ville', { exact: true }).fill('Hangzhou');
  await dialog.getByRole('button', { name: 'Enregistrer la ville', exact: true }).click();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  await nav(page, 'La carte du voyage');
  await page.getByRole('button', { name: 'Tout le voyage', exact: true }).click();
  await expect(page.locator('.leaflet-marker-icon[title*="Hangzhou"]')).toHaveCount(0);
  await page.reload();
  await page.locator('main').getByRole('button', { name: /Hangzhou/ }).click();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
});

test('budget garde les devises séparées puis convertit au taux manuel', async ({ page }) => {
  await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  for (const [label, amount, currency] of [['Taxi', '70', 'CNY'], ['Billet', '10', 'EUR']]) {
    await page.getByLabel('Libellé', { exact: true }).fill(label);
    await page.getByLabel('Montant', { exact: true }).fill(amount);
    await page.getByRole('combobox', { name: 'Devise', exact: true }).selectOption(currency);
    await page.getByRole('button', { name: 'Ajouter la dépense', exact: true }).click();
  }
  const summary = page.locator('.practical-card').filter({ has: page.getByRole('heading', { name: 'Mes dépenses', exact: true }) });
  await expect(summary).toContainText('Renseignez votre taux');
  await expect(summary).not.toContainText('Total en yuans');
  await page.getByLabel('1 euro = combien de yuans ?', { exact: true }).fill('7,5');
  await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
  await expect(summary).toContainText(/Total en yuans :\s*145,00/);
  await page.reload(); await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  await expect(summary).toContainText(/Total en yuans :\s*145,00/);
  await page.getByLabel('1 euro = combien de yuans ?', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
  await expect(summary).not.toContainText('Total en yuans');
});

test('hébergement conserve nom chinois et adresse précise dans Amap', async ({ page }) => {
  await nav(page, 'Mes outils sur place');
  const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Shenzhen 深圳', exact: true }) });
  await card.getByRole('button', { name: 'Ajouter un hébergement', exact: true }).click();
  await card.getByLabel('Nom de l’hébergement', { exact: true }).fill('Mon hôtel');
  await card.getByLabel('Nom chinois', { exact: true }).fill('深圳酒店');
  await card.getByLabel('Adresse', { exact: true }).fill('福田区 101号');
  await card.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await page.reload(); await nav(page, 'Mes outils sur place');
  const href = await card.getByRole('link', { name: /Amap/ }).getAttribute('href');
  const keyword = new URL(href!).searchParams.get('keyword');
  expect(keyword).toContain('深圳酒店'); expect(keyword).toContain('福田区 101号');
});

test('trajet garde référence billet et heures chinoises après rechargement', async ({ page }) => {
  await nav(page, 'Mes transports'); await page.getByRole('button', { name: 'Ajouter un trajet', exact: true }).click();
  await page.getByLabel('Nom du trajet (facultatif)', { exact: true }).fill('Train audit');
  await page.getByLabel('Départ · heure chinoise (facultatif)', { exact: true }).fill('2027-05-02T09:15');
  await page.getByLabel('Arrivée · heure chinoise (facultatif)', { exact: true }).fill('2027-05-02T10:30');
  await page.getByLabel('Référence du billet (facultative)', { exact: true }).fill('E123456789');
  await page.getByRole('checkbox', { name: 'Billet réservé', exact: true }).check();
  await page.getByRole('button', { name: 'Enregistrer le trajet', exact: true }).click();
  await page.reload(); await nav(page, 'Mes transports');
  const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Train audit', exact: true }) });
  await expect(card).toContainText('02/05/2027 à 09:15'); await expect(card).toContainText('02/05/2027 à 10:30');
  await expect(card).toContainText('E123456789'); await expect(card.getByText('Réservé', { exact: true })).toBeVisible();
});

test('valise coche un essentiel et garde une liste vide après suppression', async ({ page }) => {
  await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Dans ma valise', exact: true }).click();
  await page.getByLabel('Ajouter un essentiel', { exact: true }).fill('Lunettes audit');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Lunettes audit', exact: true }).check();
  await page.reload(); await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Dans ma valise', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Lunettes audit', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Retirer Lunettes audit', exact: true }).click();
  await page.getByRole('button', { name: 'Retirer', exact: true }).click();
  await page.reload(); await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Dans ma valise', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Commencer avec les essentiels suggérés', exact: true })).toHaveCount(0);
});

test('phrases chinoises s’agrandissent et se copient', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await nav(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Phrases utiles', exact: true }).click();
  const phrase = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Peu de piment, s’il vous plaît.', exact: true }) });
  await phrase.getByRole('button', { name: 'Afficher en grand', exact: true }).click();
  await expect(phrase).toHaveClass(/is-large/); await expect(phrase.getByRole('button', { name: 'Réduire', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await phrase.getByRole('button', { name: 'Copier', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('请少放辣椒。');
});

test('vue d’ensemble exporte seulement les journées explicitement datées', async ({ page }) => {
  await nav(page, 'Mon carnet pratique'); await page.getByLabel(/Date de départ/).fill('2027-05-01');
  await nav(page, 'Vue d’ensemble');
  await expect(page.getByRole('button', { name: 'Exporter le calendrier (0)', exact: true })).toBeDisabled();
  await page.getByLabel('Date de Arrivée', { exact: true }).fill('2027-05-02');
  const ics = await downloadedText(page, () => page.getByRole('button', { name: 'Exporter le calendrier (1)', exact: true }).click());
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1); expect(ics).toContain('DTSTART;VALUE=DATE:20270502'); expect(ics).toContain('DTEND;VALUE=DATE:20270503');
  expect(ics).not.toContain('Musée et panorama');
  await page.reload(); await nav(page, 'Vue d’ensemble');
  await expect(page.getByLabel('Date de Arrivée', { exact: true })).toHaveValue('2027-05-02');
});

test('adresse personnelle ajoutée au programme conserve sa recherche Amap', async ({ page }) => {
  await nav(page, 'Mes envies & bonus'); await page.getByRole('button', { name: 'Ajouter une adresse', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nom de l’adresse', { exact: true }).fill('Restaurant audit');
  await dialog.getByLabel('Nom chinois', { exact: true }).fill('测试餐厅');
  await dialog.getByLabel('Adresse précise', { exact: true }).fill('福田区 12号');
  await dialog.getByRole('button', { name: 'Enregistrer l’adresse', exact: true }).click();
  await page.getByRole('button', { name: 'Restaurant audit', exact: true }).click(); dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click(); await nav(page, 'Mon planning');
  const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Restaurant audit', exact: true }) });
  await expect(card).toContainText('福田区 12号');
  const href = await card.getByRole('link', { name: 'Ouvrir dans Amap', exact: true }).getAttribute('href');
  expect(new URL(href!).searchParams.get('keyword')).toContain('福田区 12号');
});

test('mobile Escape ferme le menu et les favoris ne volent pas le focus du dialogue', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Ouvrir le menu', exact: true });
  await menu.click(); await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('button', { name: 'Ajouter un jour', exact: true })).toBeVisible();
  await nav(page, 'Mes envies & bonus');
  await page.locator('.bonus-card-title').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Garder cette envie', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Dans mes favoris', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
});


test('une nouvelle activité peut être ajoutée directement dans une autre journée', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajouter une étape à cette journée', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lieu ou activité', { exact: true }).fill('Activité du deuxième jour');
  await dialog.getByRole('combobox', { name: /Journée de cette étape/ }).selectOption({ index: 1 });
  await dialog.getByRole('button', { name: 'Enregistrer l’étape', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activité du deuxième jour', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jour 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activité du deuxième jour', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activité du deuxième jour', exact: true })).toBeVisible();
});
