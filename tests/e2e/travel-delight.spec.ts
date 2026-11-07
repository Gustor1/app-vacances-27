import { test, expect, type Page } from '@playwright/test';
import { fixture } from '../../scripts/companion-fixture.mjs';
import { archive, tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';

const trip = fixture();
trip.journey = { ...trip.journey!, id: 'ui-demo', title: 'Les beaux détours — démo', currency: 'EUR' };
trip.cities[0].name = 'Première escale'; trip.cities[0].image = '/china-landscape.svg';
trip.cities.push({ ...structuredClone(trip.cities[0]), id: 'c2', name: 'Au bord de l’eau', image: '/travel-landscape.svg', days: [{ id: 'd3', title: 'Au fil de l’eau', steps: [] }, { id: 'd4', title: 'Le chemin du retour', steps: [] }] });
trip.documents = [{ id: 'document-demo', title: 'Les bonnes adresses.md', content: 'Un document fictif pour les essais.' }];
trip.expenses = [{ id: 'food', cityId: 'c', label: 'Déjeuner fictif', amount: 20, currency: 'EUR', category: 'food' }, { id: 'hotel', cityId: 'c', label: 'Nuit fictive', amount: 40, currency: 'EUR', category: 'hotel' }, { id: 'missing', cityId: 'c', label: 'Trajet sans taux', amount: 100, currency: 'JPY', category: 'transport' }];

async function seed(page: Page, language: Language = 'fr', photos = true) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' || route.request().url().startsWith('blob:') ? route.continue() : route.abort());
  await page.goto('/');
  await page.evaluate(({ raw, key, language }) => {
    localStorage.setItem(key, raw);
    localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: language === 'en' ? 'dark' : 'light' }));
  }, { key: tripKey(trip.journey!.id), raw: JSON.stringify(archive(trip)), language });
  if (photos) await page.evaluate(async () => {
    const path = '/src/souvenirs.ts'; const m = await import(/* @vite-ignore */ path);
    const img = new Image(); img.src = '/china-landscape.svg'; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 320;
    canvas.getContext('2d')!.drawImage(img, 0, 0, 480, 320);
    const photo = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg'));
    await m.writeSouvenirs('local', 'ui-demo', ['d', 'spare', 'd3', 'd4'].map(day => ({ day, before: null, value: { caption: day === 'd' ? '<script>Une légende personnelle</script>' : 'Souvenir fictif', photo } })));
    await m.writeSouvenirs('local', 'ui-demo', [{ day: 'removed', before: null, value: { caption: 'DETACHED_PRIVATE', photo } }]);
    await m.writeSouvenirs('account:other', 'ui-demo', [{ day: 'd', before: null, value: { caption: 'OTHER_ACCOUNT_PRIVATE', photo } }]);
    await m.writeSouvenirs('local', 'another-trip', [{ day: 'd', before: null, value: { caption: 'OTHER_TRIP_PRIVATE', photo } }]);
  });
  await page.reload();
  await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: trip.journey!.title }), exact: true }).click();
}

async function navigate(page: Page, label: string, language: Language = 'fr') {
  const item = page.locator('.nav-item').filter({ hasText: translate(label, language) });
  if (!await item.isVisible()) await page.getByRole('button', { name: translate('Ouvrir le menu', language), exact: true }).click();
  await item.click();
}

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) test(`photo box and album ${language}: keyboard, isolation, widths and reduced motion`, async ({ page }, testInfo) => {
  const t = (text: string) => translate(text, language);
  await seed(page, language); await navigate(page, 'Vue d’ensemble', language);
  await expect(page.locator('.memory-fan-print')).toHaveCount(4);
  const before = await page.evaluate(key => localStorage.getItem(key), tripKey('ui-demo'));
  const box = page.getByRole('button', { name: t('Ouvrir la boîte à photos'), exact: true });
  await box.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.memory-box-scene')).toHaveAttribute('data-open', 'true');
  await page.locator('.memory-fan-print').first().focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.memory-caption')).toHaveText('<script>Une légende personnelle</script>');
  await expect(dialog).not.toContainText(/OTHER_ACCOUNT_PRIVATE|OTHER_TRIP_PRIVATE|DETACHED_PRIVATE|PRIVATE_DAY|PRIVATE_REF/);
  await expect(dialog.locator('.memory-viewer > img')).toHaveAttribute('src', /^blob:/);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await page.getByRole('button', { name: t('Souvenir suivant'), exact: true }).click();
  await expect(dialog.locator('.memory-viewer h3')).toHaveText('Réserve');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await dialog.locator('.memory-viewer').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.locator('.memory-fan-print').first()).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), tripKey('ui-demo'))).toBe(before);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  if (process.env.DETOURS_UI_CAPTURE && language === 'fr') {
    await page.locator('.travel-memories').screenshot({ path: testInfo.outputPath('souvenirs-desktop.png') });
    await page.setViewportSize({ width: 390, height: 950 });
    await page.locator('.travel-memories').screenshot({ path: testInfo.outputPath('souvenirs-mobile.png') });
  }
});

test('empty memories, native peek, story navigation and import stepper', async ({ page }) => {
  await seed(page, 'fr', false); await navigate(page, 'Vue d’ensemble');
  await expect(page.locator('.memory-fan-print')).toHaveCount(0);
  await page.getByRole('button', { name: 'Aperçu de Jour test', exact: true }).click();
  const peek = page.locator('.travel-peek:popover-open'); await expect(peek).toContainText('Musée');
  await page.keyboard.press('Escape'); await expect(peek).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajouter un souvenir', exact: true }).click();
  await expect(page.locator('.souvenirs')).toHaveAttribute('open', '');
  await navigate(page, 'Vue d’ensemble');
  await page.getByRole('button', { name: 'Ouvrir les journées de Au bord de l’eau', exact: true }).click();
  await expect(page.locator('.day-heading')).toContainText('Au fil de l’eau');
  await page.locator('.journey-back').click();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  await expect(page.locator('.travel-stepper [aria-current=step]')).toContainText('Ton programme');
  await page.getByLabel('Ton programme', { exact: true }).fill('Voyage test\nParis\nJour 1\n- Musée');
  await page.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  await expect(page.locator('.travel-stepper [aria-current=step]')).toContainText('Vérifier le programme');
});

test('budget chart uses converted amounts; documents retain open and download actions', async ({ page }) => {
  await seed(page); await navigate(page, 'Mes outils sur place');
  await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  const chart = page.locator('.budget-breakdown');
  await expect(chart).toContainText('60,00');
  await expect(chart).toContainText('uniquement les montants convertis');
  await expect(chart.locator('.budget-donut-legend li')).toHaveCount(2);
  await chart.getByRole('button', { name: /Repas/ }).click();
  await expect(chart.locator('.budget-donut-value')).toContainText('20,00');
  await navigate(page, 'Mon carnet pratique');
  const folder = page.locator('.travel-folders'); await expect(folder).toContainText('Les bonnes adresses.md');
  await folder.getByRole('button', { name: 'Les bonnes adresses.md', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Un document fictif pour les essais.');
  await page.keyboard.press('Escape'); await expect(folder.getByRole('button', { name: 'Les bonnes adresses.md', exact: true })).toBeFocused();
});

test('move undo preserves order and a subsequent step edit prevents stale undo', async ({ page }) => {
  await seed(page);
  const titles = () => page.locator('.step-content h4').allTextContents();
  const original = await titles();
  await page.getByRole('button', { name: 'Descendre Musée', exact: true }).click();
  await expect(page.locator('.travel-toast')).toContainText('Activité déplacée.');
  await page.locator('.travel-toast').getByRole('button', { name: 'Annuler', exact: true }).click();
  expect(await titles()).toEqual(original);
  await page.getByRole('button', { name: 'Descendre Musée', exact: true }).click();
  await page.getByRole('button', { name: 'Modifier Musée', exact: true }).click();
  await page.getByRole('dialog').locator('input[name="title"]').fill('Musée modifié');
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer l’étape', exact: true }).click();
  await expect(page.locator('.travel-toast').getByRole('button', { name: 'Annuler', exact: true })).toHaveCount(0);
});

test('terrain animation can pause and remains static with reduced motion', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.topographic-art')).toHaveAttribute('data-play', 'true');
  await page.getByRole('button', { name: 'Mettre le relief en pause', exact: true }).click();
  await expect(page.locator('.topographic-art')).toHaveAttribute('data-animated', 'false');
  expect(await page.locator('.topographic-art g').evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.topographic-art g').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});

test('memory read failure can retry; caption-only memories remain available', async ({ page }) => {
  await seed(page, 'fr', false);
  await page.evaluate(async () => {
    const path = '/src/souvenirs.ts'; const m = await import(/* @vite-ignore */ path);
    await m.writeSouvenirs('local', 'ui-demo', [{ day: 'd', before: null, value: { caption: 'Un souvenir sans photo' } }]);
    const open = IDBFactory.prototype.open;
    (window as unknown as { restoreMemoryDb: () => void }).restoreMemoryDb = () => { IDBFactory.prototype.open = open; };
    IDBFactory.prototype.open = () => { throw new DOMException('Unavailable', 'SecurityError'); };
  });
  await navigate(page, 'Vue d’ensemble');
  await expect(page.locator('.travel-memories')).toContainText('Stockage des souvenirs indisponible.');
  await page.evaluate(() => { (window as unknown as { restoreMemoryDb: () => void }).restoreMemoryDb(); });
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await page.getByRole('button', { name: 'Ouvrir mon album', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Un souvenir sans photo');
  await page.getByRole('dialog').locator('.memory-album-print').click();
  await expect(page.getByRole('dialog').locator('.memory-image-missing')).toBeVisible();
});

test('home memory entry, mobile chart and folders remain usable at 320px', async ({ page }) => {
  await seed(page); await page.locator('.journey-back').click();
  await page.getByRole('button', { name: 'Mes souvenirs', exact: true }).click();
  await expect(page.locator('.travel-memories')).toBeVisible();
  await page.setViewportSize({ width: 320, height: 950 });
  await navigate(page, 'Mes outils sur place'); await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await navigate(page, 'Mon carnet pratique');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('.travel-folders').getByRole('button', { name: 'Les bonnes adresses.md', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Un document fictif pour les essais.');
});
