import { test, expect, type Page } from './fixtures';
import { readFile } from 'node:fs/promises';

const notebook = (page: Page) => page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
const planning = (page: Page) => page.getByRole('button', { name: 'Mon planning', exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' })).toBeVisible();
});

test('naviguer entre villes et journées puis rechercher un lieu chinois', async ({ page }) => {
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Musée et panorama', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shenzhen Natural History Museum', exact: true })).toBeVisible();
  await page.locator('.city-tabs').getByRole('button', { name: /Guangzhou/ }).click();
  await expect(page.getByRole('heading', { name: 'Arrivée en soirée', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Visites et Canton Tower', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Rechercher dans le carnet' }).fill('拙政园');
  await page.getByRole('button', { name: /Jardin de l’Humble Administrateur.*Suzhou/ }).click();
  await expect(page.getByRole('heading', { name: 'Jardins, vieille ville et lac Jinji', exact: true })).toBeVisible();
  const place = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Jardin de l’Humble Administrateur', exact: true }) });
  await expect(place).toHaveClass(/highlighted/);
  const destination = await place.getByRole('link', { name: 'Ouvrir dans Amap' }).getAttribute('href');
  expect(new URL(destination!).hostname).toBe('uri.amap.com');
  expect(new URL(destination!).searchParams.get('keyword')).toContain('拙政园');
});

test('modifier une étape, la marquer visitée et retrouver les changements après rechargement', async ({ page }) => {
  await page.getByRole('button', { name: 'Modifier Arrivée à Shenzhen', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Lieu ou activité', exact: true }).fill('Arrivée à Shenzhen à 16 h');
  await dialog.getByRole('textbox', { name: 'Détails et informations', exact: true }).fill('Prendre le métro avec les bagages.');
  await dialog.getByRole('button', { name: 'Enregistrer l’étape', exact: true }).click();
  await page.getByRole('button', { name: 'Marquer comme visité : Arrivée à Shenzhen à 16 h', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Arrivée à Shenzhen à 16 h', exact: true })).toBeVisible();
  await expect(page.getByText('Prendre le métro avec les bagages.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marquer à faire : Arrivée à Shenzhen à 16 h', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('ajouter une ville, une journée et une étape avec son repère', async ({ page }) => {
  await page.locator('main').getByRole('button', { name: 'Ajouter une ville', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Ville, région ou lieu de séjour', exact: true }).fill('Pékin');
  await dialog.getByRole('textbox', { name: 'Nom local (facultatif)', exact: true }).fill('北京');
  await dialog.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('39.9042');
  await dialog.getByRole('spinbutton', { name: 'Longitude', exact: true }).fill('116.4074');
  await dialog.getByRole('button', { name: 'Enregistrer la ville', exact: true }).click();
  await page.getByRole('button', { name: 'Créer ma première journée', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Le thème de cette journée', exact: true }).fill('Palais et jardins');
  await dialog.getByRole('button', { name: 'Enregistrer la journée', exact: true }).click();
  await page.getByRole('button', { name: 'Ajouter une étape à cette journée', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Lieu ou activité', exact: true }).fill('Cité interdite');
  await dialog.getByRole('textbox', { name: 'Nom local (facultatif)', exact: true }).fill('故宫博物院');
  await dialog.getByRole('checkbox', { name: 'À réserver', exact: true }).check();
  await dialog.getByText('Placer un repère sur la carte (facultatif)', { exact: true }).click();
  await dialog.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('39.9163');
  await dialog.getByRole('spinbutton', { name: 'Longitude', exact: true }).fill('116.3972');
  await dialog.getByRole('button', { name: 'Enregistrer l’étape', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cité interdite', exact: true })).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon[title="1. Cité interdite"]')).toBeVisible();
  await page.reload();
  await page.locator('.city-tabs').getByRole('button', { name: /Pékin/ }).click();
  await expect(page.getByRole('heading', { name: 'Palais et jardins', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cité interdite', exact: true })).toBeVisible();
});

test('garder un bonus favori puis l’ajouter au bon jour', async ({ page }) => {
  await page.locator('.city-tabs').getByRole('button', { name: /Chengdu/ }).click();
  await page.getByRole('button', { name: /Mes envies & bonus/ }).click();
  await page.getByRole('button', { name: 'Ajouter aux favoris : Yue Bai Wei · U Fun', exact: true }).click();
  await page.getByRole('button', { name: 'Mes favoris', exact: true }).click();
  await expect(page.locator('.bonus-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Yue Bai Wei · U Fun', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Journée pour ce bonus', exact: true }).selectOption('chengdu-2');
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await planning(page);
  await expect(page.getByRole('heading', { name: 'Pandas, Wuhou et soirée au bord de l’eau', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yue Bai Wei · U Fun', exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.city-tabs').getByRole('button', { name: /Chengdu/ }).click();
  await page.getByRole('button', { name: /Mes envies & bonus/ }).click();
  await expect(page.getByRole('button', { name: 'Retirer des favoris : Yue Bai Wei · U Fun', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('enregistrer réservations, date et notes personnelles', async ({ page }) => {
  await notebook(page);
  await page.getByRole('checkbox', { name: /Shenzhen Natural History Museum/ }).check();
  await page.getByLabel(/Date de départ/).fill('2027-05-02');
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Prévoir une batterie externe et vérifier les gares.');
  await page.reload();
  await notebook(page);
  await expect(page.getByRole('checkbox', { name: /Shenzhen Natural History Museum/ })).toBeChecked();
  await expect(page.getByLabel(/Date de départ/)).toHaveValue('2027-05-02');
  await expect(page.getByRole('textbox', { name: 'Notes personnelles', exact: true })).toHaveValue('Prévoir une batterie externe et vérifier les gares.');
  await planning(page);
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  await expect(page.locator('#step-sz-2-museum').getByText('Réservé', { exact: true })).toBeVisible();
});

test('exporter puis importer une copie indépendante sans remplacer le carnet courant', async ({ page }) => {
  await notebook(page);
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Copie à conserver');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter ma sauvegarde', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('a-l-est-china-legacy.json');
  const path = (await file.path())!;
  const backup = JSON.parse(await readFile(path, 'utf8'));
  expect(backup.scope).toBe('trip');expect(backup.version).toBe(2);
  expect(backup.state.notes.general).toBe('Copie à conserver');expect(backup.state.cities).toHaveLength(7);
  await page.getByRole('textbox', { name: 'Notes personnelles', exact: true }).fill('Modification conservée dans l’original');
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles(path);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('a-l-est-open-trip-v2'))).not.toBe('china-legacy');
  await notebook(page);
  await expect(page.getByRole('textbox', {name:'Notes personnelles',exact:true})).toHaveValue('Copie à conserver');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:china-legacy')!).state.notes.general)).toBe('Modification conservée dans l’original');
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});
  await page.getByRole('button',{name:'Mes voyages',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Format inconnu');
  await expect(page.locator('.journey-card')).toHaveCount(2);
});

test('source corrompue récupérable et import dans un nouveau carnet sans l’écraser', async ({ page }) => {
  await notebook(page);
  await page.getByRole('textbox', {name:'Notes personnelles',exact:true}).fill('Sauvegarde de secours');
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter ma sauvegarde',exact:true}).click();const path=(await (await downloaded).path())!;
  await page.evaluate(() => localStorage.setItem('a-l-est-trip-v2:china-legacy','{"version":999}'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('invalide');
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles(path);
  await notebook(page);
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Sauvegarde de secours');
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('Persistance restaurée');await page.reload();await notebook(page);
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Persistance restaurée');
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'))).toBe('{"version":999}');
});

test('utiliser le menu et les vues sur mobile sans débordement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await noOverflow();
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await notebook(page);
  await expect(page.getByRole('heading', { name: 'Le carnet de voyage', exact: true })).toBeVisible();
  await noOverflow();
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.getByRole('button', { name: 'La carte du voyage', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Les petits points d’un grand voyage', exact: true })).toBeVisible();
  await noOverflow();
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await planning(page);
  await page.locator('.city-tabs').getByRole('button', { name: /Chongqing/ }).click();
  await expect(page.getByRole('heading', { name: 'Arrivée et centre-ville', exact: true })).toBeVisible();
  await noOverflow();
});
