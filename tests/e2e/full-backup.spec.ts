import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { archive, blankTrip, chinaTrip, tripKey } from '../../src/journeys';
import { emptyWorld, WORLD_KEY } from '../../src/world';
import { PREFERENCES_KEY } from '../../src/locale-utils';
import { MONEY_PREFERENCES_KEY } from '../../src/money-preferences';
import { translate, type Language } from '../../src/locale-utils';

test('export réel puis restauration vierge retrouve contenus, relations et documents ; réessai sans doublon', async ({ page, browser }) => {
  const trip = JSON.parse(JSON.stringify(chinaTrip(undefined, 'backup-original')));
  trip.notes.general = 'Mon souvenir 中文 · España 😀';
  trip.documents = [{ id: 'doc-backup', title: 'Billet.md', content: '# Mon billet 中文' }];
  const world = { ...emptyWorld(), palette: 'ocean' as const, wishes: ['JP'], visits: [{ id: 'visit-original', stayId: trip.journey.id, journeyId: trip.journey.id, country: 'CN', label: 'Séjour confirmé 中文', year: 2027 }], participation: [trip.journey.id] };
  await page.goto('/');
  await page.evaluate(({ trip, world, keys }) => {
    localStorage.setItem(keys.trip, JSON.stringify({ version: 2, scope: 'trip', id: trip.journey.id, state: trip }));
    localStorage.setItem(keys.world, JSON.stringify(world));
    localStorage.setItem(keys.preferences, JSON.stringify({ language: 'fr', theme: 'dark' }));
    localStorage.setItem(keys.money, JSON.stringify({ country: 'FR', currency: 'EUR' }));
    localStorage.setItem('a-l-est-trip-v2:broken-backup', '{illisible 中文');
    localStorage.setItem('sb-fake-auth-token', 'SESSION_NOT_EXPORTED');
  }, { trip, world, keys: { trip: tripKey(trip.journey.id), world: WORLD_KEY, preferences: PREFERENCES_KEY, money: MONEY_PREFERENCES_KEY } });
  await page.reload();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger ma sauvegarde complète', exact: true }).click();
  const download = await downloadEvent;
  const raw = await readFile((await download.path())!, 'utf8');
  expect(raw).not.toContain('SESSION_NOT_EXPORTED');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    const target = await context.newPage();
    await target.goto('/');
    const upload = () => target.getByLabel('Choisir une sauvegarde complète', { exact: true }).setInputFiles({ name: 'backup-v3.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
    await upload();
    const dialog = target.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Bilan de restauration' })).toBeVisible();
    expect(await target.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')))).toHaveLength(0);
    await expect(dialog).toContainText('1 carnet(s) à retrouver.');
    await dialog.getByRole('button', { name: 'Confirmer la restauration', exact: true }).click();
    await expect(target.getByRole('status').filter({ hasText: 'Restauration terminée.' })).toBeVisible();
    await target.reload();
    const result = await target.evaluate(keys => {
      const trips = Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')).map(key => JSON.parse(localStorage.getItem(key)!).state);
      return { trips, world: JSON.parse(localStorage.getItem(keys.world)!), preferences: JSON.parse(localStorage.getItem(keys.preferences)!), money: JSON.parse(localStorage.getItem(keys.money)!) };
    }, { world: WORLD_KEY, preferences: PREFERENCES_KEY, money: MONEY_PREFERENCES_KEY });
    expect(result.trips).toHaveLength(1);
    const restored = result.trips[0];
    expect({ ...restored, journey: { ...restored.journey, id: trip.journey.id } }).toEqual(trip);
    expect(result.world).toEqual({ ...world, visits: world.visits.map(v => ({ ...v, stayId: restored.journey.id, journeyId: restored.journey.id })), participation: [restored.journey.id] });
    expect(result.preferences).toEqual({ language: 'fr', theme: 'dark' });
    expect(result.money).toEqual({ country: 'FR', currency: 'EUR' });
    await expect(target.getByText('1 source(s) brute(s) conservée(s) séparément.', { exact: true })).toBeVisible();
    expect(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await upload();
    await expect(target.getByRole('alert')).toContainText('déjà été restaurée');
    await expect(target.locator('.journey-card')).toHaveCount(1);
    await target.getByRole('button', { name: 'Ouvrir Chine 2027', exact: true }).click();
    await target.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
    await target.getByRole('navigation', { name: 'Navigation principale', exact: true }).getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
    await expect(target.getByRole('textbox', { name: 'Notes personnelles', exact: true })).toHaveValue(trip.notes.general);
    await expect(target.getByText('Billet.md', { exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test('corruption et manque de quota préservent les données ; reprise explicite après interruption', async ({ page }) => {
  const trip = chinaTrip(undefined, 'quota-source');
  await page.goto('/');
  const upload = (raw: string) => page.getByLabel('Choisir une sauvegarde complète').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await upload('{broken');
  await expect(page.getByRole('alert')).toContainText('invalide');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')))).toHaveLength(0);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key.startsWith('a-l-est-trip-v2:restored-')) throw new DOMException('Quota', 'QuotaExceededError'); original.call(this, key, value); };
    (window as unknown as { restoreSetItem: () => void }).restoreSetItem = () => { Storage.prototype.setItem = original; };
  });
  await upload(JSON.stringify(archive(trip)));
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmer la restauration', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('stockage');
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reprendre la restauration', exact: true })).toBeVisible();
  await page.reload(); // Removes the injected failure; durable journal survives.
  await upload(JSON.stringify(archive(trip)));
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmer la restauration', exact: true }).click();
  await expect(page.locator('.journey-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Reprendre la restauration', exact: true })).toHaveCount(0);
});

test('collection réelle de plus de 5 Mo restaurée dans Chrome sans doubler le quota', async ({ page, browser }) => {
  const trips = Array.from({ length: 11 }, (_, index) => {
    const trip = blankTrip({ id: `large-${index}`, title: `Grand carnet ${index}` });
    trip.documents = [{ id: 'document', title: 'Archive.txt', content: 'a'.repeat(460_000) }];
    return archive(trip);
  });
  await page.goto('/');
  await page.evaluate(trips => trips.forEach(trip => localStorage.setItem('a-l-est-trip-v2:' + trip.id, JSON.stringify(trip))), trips);
  await page.reload();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger ma sauvegarde complète', exact: true }).click();
  const raw = await readFile((await (await downloaded).path())!, 'utf8');
  expect(Buffer.byteLength(raw)).toBeGreaterThan(5_000_000);
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' });
  try {
    const target = await context.newPage(); await target.goto('/');
    await target.getByLabel('Choisir une sauvegarde complète').setInputFiles({ name: 'large-backup.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
    await expect(target.getByRole('dialog')).toContainText('11 carnet(s) à retrouver.');
    await target.getByRole('dialog').getByRole('button', { name: 'Confirmer la restauration', exact: true }).click();
    await expect(target.locator('.journey-card')).toHaveCount(11);
    await target.reload();
    const contents = await target.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')).map(key => JSON.parse(localStorage.getItem(key)!).state.documents[0].content));
    expect(contents).toEqual(Array(11).fill('a'.repeat(460_000)));
  } finally { await context.close(); }
});

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`bilan de sauvegarde ${language} : mobile, clavier et annulation sans écriture`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(({ language, key }) => localStorage.setItem(key, JSON.stringify({ language, theme: 'dark' })), { language, key: PREFERENCES_KEY });
    await page.reload();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const raw = JSON.stringify(archive(blankTrip({ title: 'Carnet 中文 · España' })));
      await page.getByLabel(translate('Choisir une sauvegarde complète', language), { exact: true }).setInputFiles({ name: 'trip.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: translate('Bilan de restauration', language), exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
      await dialog.getByRole('button', { name: translate('Annuler', language), exact: true }).click();
      expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')))).toHaveLength(0);
    }
  });
}
