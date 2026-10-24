import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { archive, blankTrip } from '../src/journeys.ts';
import { checkServedBuild } from './build-identity.mjs';

const server = await productionTestServer();
server.update();
const browser = await chromium.launch(chromiumTestOptions()).catch(async error => { await server.close(); throw error; });
const screenshots = await mkdtemp(join(tmpdir(), 'detours-planning-import-'));
const errors = [];
const origin = new URL(server.url).origin;
async function profile() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url);
  await checkServedBuild(page, process.env.DETOURS_EXPECTED_BUILD_ID);
  return { context, page };
}
async function states(page) {
  return page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')).map(key => JSON.parse(localStorage.getItem(key)).state));
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page must fit the viewport');
}
async function readyOffline(context, page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  assert.equal(await page.evaluate(async () => { try { await fetch('/__planning_uncached_offline'); return false; } catch { return true; } }), true);
}
function equivalentContent(state) {
  const identities = new Map();
  function collect(value) {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      if (typeof value.id === 'string' && !identities.has(value.id)) identities.set(value.id, `identity-${identities.size}`);
      Object.values(value).forEach(collect);
    }
  }
  collect(state);
  function normalize(value) {
    if (typeof value === 'string') return identities.get(value) || value;
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'resume').map(([key, item]) => [identities.get(key) || key, normalize(item)]));
    return value;
  }
  const normalized = normalize(state);
  // The existing archive parser fills this optional empty metadata field.
  normalized.journey.highlights ||= '';
  return normalized;
}
async function mapWithLouvre(page) {
  // Open the day map, not the city overview: imported cities have no invented centre.
  await page.getByRole('button', { name: 'Mon planning', exact: true }).click();
  await page.getByRole('button', { name: 'Agrandir', exact: true }).click();
  const louvre = page.locator('.leaflet-marker-icon[title="1. Musée du Louvre"]');
  await expect(louvre).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  await louvre.click();
  await expect(page.locator('.leaflet-popup-content').getByRole('link', { name: /Ouvrir la carte/ })).toBeVisible();
  assert.equal(await page.locator('.leaflet-popup-content a').getAttribute('rel'), 'noopener noreferrer');
}

try {
  const { context, page } = await profile();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  const dialog = page.getByRole('dialog');
  assert.ok(await dialog.evaluate(element => element === document.activeElement || element.contains(document.activeElement)), 'Focus enters the modal');
  await dialog.getByLabel('Ton programme', { exact: true }).focus();
  await page.keyboard.press('Tab');
  assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Keyboard focus remains in the import dialog');
  await dialog.getByLabel('Ton programme', { exact: true }).fill('Programme fictif local : Paris, Louvre et hôtel.');
  await expect(dialog.getByRole('button', { name: 'Analyser mon programme', exact: true })).toBeDisabled();
  await expect(dialog).toContainText('Analyse IA distante indisponible');
  await dialog.getByRole('button', { name: 'Charger l’exemple 1', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remplacer le texte', exact: true }).click();
  const source = await dialog.locator('details').filter({ has: page.getByText('Texte source', { exact: true }) }).locator('pre').textContent();
  const preserved = await dialog.locator('details').filter({ has: page.getByText('Extraits conservés en notes', { exact: true }) }).locator('pre').textContent();
  assert.ok(preserved.includes('Budget estimé : 80 EUR'), 'Unstructured notes are reviewable before creation');
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Paris fictif corrigé');
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await dialog.getByLabel('Détails et informations', { exact: true }).first().fill('Correction personnelle conservée hors ligne.');
  const keepSource = dialog.getByRole('checkbox', { name: 'Conserver le texte original dans le carnet après création', exact: true });
  await keepSource.focus();
  if (!await keepSource.isChecked()) await page.keyboard.press('Space');
  await expect(keepSource).toBeChecked();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Review content fits its dialog');
    await page.screenshot({ path: join(screenshots, `review-${width}.png`), fullPage: false });
  }
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Musée du Louvre', exact: true })).toBeVisible();
  let [created] = await states(page);
  assert.equal(created.journey.title, 'Paris fictif corrigé');
  assert.equal(created.cities.length, 1);
  assert.equal(created.cities[0].coordinates, undefined);
  assert.equal(created.cities[0].days[0].steps.length, 2);
  assert.deepEqual(created.cities[0].days[0].steps[0].coordinates, [48.8606, 2.3376]);
  assert.equal(created.cities[0].days[0].steps[1].coordinates, undefined);
  assert.equal(created.cities[0].days[0].steps[0].description, 'Correction personnelle conservée hors ligne.');
  assert.equal(created.documents.find(document => document.title === 'Planning — texte original').content, source);
  assert.ok(created.documents.some(document => document.content.includes('Budget estimé : 80 EUR')));
  assert.equal((created.expenses || []).length, 0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Musée du Louvre', exact: true })).toBeVisible();
  await mapWithLouvre(page);
  await readyOffline(context, page);
  await mapWithLouvre(page);
  await page.getByRole('button', { name: 'Mon planning', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Musée du Louvre', exact: true })).toBeVisible();
  await expect(page.getByText('Correction personnelle conservée hors ligne.', { exact: true })).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    await page.screenshot({ path: join(screenshots, `planning-offline-${width}.png`), fullPage: false });
  }
  await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter ma sauvegarde', exact: true }).click();
  const download = await downloading;
  assert.equal(await download.failure(), null);
  const raw = await readFile(await download.path(), 'utf8');
  assert.ok(raw.includes('Correction personnelle conservée hors ligne.'));
  [created] = await states(page);
  const target = await profile();
  await readyOffline(target.context, target.page);
  await target.page.getByLabel('Choisir une sauvegarde JSON', { exact: true }).setInputFiles({ name: 'planning-export.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await expect(target.page.getByRole('button', { name: 'Mon carnet pratique', exact: true })).toBeVisible();
  await target.page.reload();
  const restored = await states(target.page);
  assert.equal(restored.length, 1);
  assert.deepEqual(equivalentContent(restored[0]), equivalentContent(created), 'Export/restore keeps equivalent data and relationships');
  await target.page.getByRole('button', { name: 'Mon planning', exact: true }).click();
  await expect(target.page.getByRole('heading', { name: 'Musée du Louvre', exact: true })).toBeVisible();
  await mapWithLouvre(target.page);
  await target.page.screenshot({ path: join(screenshots, 'restored-offline-map.png'), fullPage: false });

  // Exercise real local recognition from a file, with the network already off.
  // No annotated fixture or intercepted extraction response supplies the draft.
  const recognized = await profile();
  await readyOffline(recognized.context, recognized.page);
  await recognized.page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  const localDialog = recognized.page.getByRole('dialog');
  const existing=blankTrip({title:'Carnet antérieur protégé',currency:'EUR',timezone:'UTC'});
  const existingKey='a-l-est-trip-v2:'+existing.journey.id, existingRaw=JSON.stringify(archive(existing));
  await recognized.page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:existingKey,raw:existingRaw});
  const localSource = '# Lyon\n## Jour 1 — 2 mai 2027\n- 9h30 : Musée des Confluences\n- Après-midi : Parc de la Tête d’or\n## Jour 2 — 3 mai 2027\n- 10:00 : Vieux Lyon\n- Suggestion : Musée Gadagne\nBudget estimé : 100 EUR\nCorrection finale : vérifier le rattachement du parc.';
  await localDialog.getByLabel('Ouvrir un fichier texte ou Markdown', { exact: true }).setInputFiles({ name: 'weekend-lyon.md', mimeType: 'text/markdown', buffer: Buffer.from(localSource) });
  await expect(localDialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(localSource);
  await localDialog.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  await expect(localDialog.getByLabel('Titre de la journée', { exact: true })).toHaveCount(2);
  await expect(localDialog.getByLabel('Lieu ou activité', { exact: true })).toHaveCount(4);
  await expect(localDialog.getByLabel('Date (facultative)', { exact: true }).first()).toHaveValue('2027-05-02');
  await expect(localDialog.getByLabel('Heure explicite (facultative)', { exact: true }).first()).toHaveValue('09:30');
  await localDialog.locator('.planning-passages summary').filter({hasText:'Passage à vérifier'}).first().click();
  await expect(localDialog.locator('.planning-passages pre').first()).toContainText('Correction finale');
  await localDialog.getByRole('button',{name:'Conserver comme note',exact:true}).click();
  await localDialog.getByLabel('Affectation ville / journée',{exact:true}).nth(1).selectOption('0:1');
  await recognized.page.reload();
  await recognized.page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  await expect(localDialog.locator('.planning-day').last().getByLabel('Lieu ou activité',{exact:true}).last()).toHaveValue('Parc de la Tête d’or');
  await localDialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await localDialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await localDialog.getByLabel('Conserver le texte original dans le carnet après création', { exact: true }).check();
  await recognized.page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(recognized.page);
  await recognized.page.screenshot({ path: join(screenshots, 'local-recognition-offline-390.png'), fullPage: false });
  await localDialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(localDialog).toHaveCount(0);
  await recognized.page.reload();
  await expect(recognized.page.getByRole('heading', { name: 'Musée des Confluences', exact: true })).toBeVisible();
  const localTrip = (await states(recognized.page)).find(s=>s.journey.id!==existing.journey.id);
  assert.equal(localTrip.cities.length, 1);
  assert.deepEqual(localTrip.cities[0].days.map(day => day.date), ['2027-05-02', '2027-05-03']);
  assert.deepEqual(localTrip.cities[0].days.map(day => day.steps.length), [1, 2]);
  assert.equal(localTrip.cities[0].days[0].preparation.timings[localTrip.cities[0].days[0].steps[0].id].startTime, '09:30');
  assert.equal(localTrip.customBonus.length, 1);
  assert.equal(localTrip.customBonus[0].title, 'Musée Gadagne');
  assert.deepEqual(localTrip.bookings, []);
  assert.deepEqual(localTrip.expenses || [], []);
  assert.ok(localTrip.cities[0].days.every(day => day.steps.every(step => !step.coordinates)));
  assert.ok(localTrip.documents.some(document => document.content.includes('Budget estimé : 100 EUR')));
  assert.equal(localTrip.documents.find(document => document.title === 'Planning — texte original').content, localSource);

  assert.equal(await recognized.page.evaluate(key=>localStorage.getItem(key),existingKey),existingRaw);
  const localDownloading=recognized.page.waitForEvent('download');
  await recognized.page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();
  const localDownload=await localDownloading, localExport=await readFile(await localDownload.path(),'utf8');
  const localTarget=await profile(); await readyOffline(localTarget.context,localTarget.page);
  await localTarget.page.getByLabel('Choisir une sauvegarde JSON',{exact:true}).setInputFiles({name:'lot01.json',mimeType:'application/json',buffer:Buffer.from(localExport)});
  await localTarget.page.reload();
  assert.deepEqual(equivalentContent((await states(localTarget.page))[0]),equivalentContent(localTrip));

  const unknown = await profile();
  await unknown.page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  const unknownDialog = unknown.page.getByRole('dialog');
  await unknownDialog.getByLabel('Ton programme', { exact: true }).fill('Ville fictive, jour libre, lieu inconnu.');
  await unknownDialog.getByRole('button', { name: 'Saisir mon aperçu manuellement', exact: true }).click();
  await unknownDialog.getByLabel('Titre du voyage', { exact: true }).fill('Destination inconnue');
  await unknownDialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await unknownDialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await unknownDialog.getByLabel('Ville, région ou lieu de séjour', { exact: true }).fill('Ville fictive introuvable');
  await unknownDialog.getByLabel('Titre de la journée', { exact: true }).fill('Jour libre');
  await unknownDialog.getByRole('button', { name: 'Ajouter une activité', exact: true }).click();
  await unknownDialog.getByLabel('Lieu ou activité', { exact: true }).fill('Lieu inconnu');
  await expect(unknownDialog).toContainText('Lieu à préciser : aucun repère géographique ajouté.');
  await unknownDialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await unknown.page.getByRole('button', { name: 'La carte du voyage', exact: true }).click();
  await expect(unknown.page.locator('.leaflet-container')).toBeVisible();
  await expect(unknown.page.locator('.leaflet-marker-icon')).toHaveCount(0);
  const [unknownTrip] = await states(unknown.page);
  assert.equal(unknownTrip.cities[0].coordinates, undefined);
  assert.equal(unknownTrip.cities[0].days[0].steps[0].coordinates, undefined);
  assert.equal(unknownTrip.cities[0].days[0].date, undefined);
  assert.deepEqual(errors, []);
  console.log('Planning import production smoke passed: real local file recognition while offline (days, dates, times, activities, suggestion), explicit demonstration for one Louvre map marker, disabled remote extraction, keyboard/source choice, corrected preview, durable creation, unknown places without invented coordinates/dates, reload, worker/offline planning and map, real downloaded archive restored equivalently in another profile, 320/390/1440px, zero runtime errors.');
  console.log(`Temporary screenshots: ${screenshots}`);
} finally {
  await browser.close();
  await server.close();
}
