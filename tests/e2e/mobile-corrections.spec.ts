import { test, expect } from './fixtures';
import { translate } from '../../src/locale-utils';
import type { Language } from '../../src/locale-utils';
import type { Page } from '@playwright/test';

async function openTrip(page: Page) {
  await page.goto('/');
  await expect(page.locator('.topbar')).toBeVisible();
}

async function menuView(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).isVisible()) await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.locator('#sidebar').getByRole('button', { name, exact: true }).click();
}

test.use({ viewport: { width: 320, height: 740 }, hasTouch: true });

test('catégorie Bonus réversible, favoris indépendants et activation clavier', async ({ page }) => {
  await openTrip(page);
  await page.locator('.mobile-bottom-nav').getByRole('button', { name: 'Bonus', exact: true }).click();
  const category = page.locator('.bonus-filters button').nth(1);
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  await category.focus();
  await page.keyboard.press('Enter');
  await expect(category).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.bonus-filters button').first()).toHaveAttribute('aria-pressed', 'true');
  const other = page.locator('.bonus-filters button').nth(2);
  await category.click(); await other.click();
  await expect(category).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Mes favoris', exact: true }).click();
  await other.click();
  await expect(page.getByRole('button', { name: 'Mes favoris', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(other).toHaveAttribute('aria-pressed', 'false');
});

for (const width of [320, 390, 430, 1440]) {
  test(`largeur ${width} : langues, vues, menu et résumé discret`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await openTrip(page);
    for (const language of ['fr', 'en', 'es', 'zh-CN'] as Language[]) {
      await page.evaluate(language => {
        const raw = JSON.stringify({ language, theme: 'light' });
        localStorage.setItem('a-l-est-preferences-v1', raw);
        window.dispatchEvent(new StorageEvent('storage', { key: 'a-l-est-preferences-v1', newValue: raw }));
      }, language);
      const t = (text: string) => translate(text, language);
      for (const name of ['Mon planning', 'Mes envies & bonus', 'Mes outils sur place', 'Mon carnet pratique']) {
        const menu = page.locator('.breadcrumb button').first();
        if (await menu.isVisible()) await menu.click();
        await page.locator('#sidebar').getByRole('button', { name: new RegExp('^' + t(name)) }).click();
        await expect(page.locator('main .trip-collaboration')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        if (name === 'Mon planning') {
          expect((await page.locator('.trip-summary').boundingBox())!.height).toBeLessThanOrEqual(64);
          if (width === 390 && language === 'fr') await page.screenshot({ path: 'test-results/mobile-planning-390.png', fullPage: false });
          await page.locator('.trip-summary').getByRole('button', { name: t('Partage'), exact: true }).click();
          await expect(page.getByRole('dialog', { name: t('Partage'), exact: true })).toBeVisible();
          await page.keyboard.press('Escape');
        } else await expect(page.locator('.trip-summary')).toHaveCount(0);
        if (await menu.isVisible()) await menu.click();
        await page.locator('.trip-menu-actions').getByRole('button', { name: t('Synchronisation'), exact: true }).click();
        await expect(page.getByRole('dialog', { name: t('Synchronisation du voyage'), exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        if (await menu.isVisible()) await expect(menu).toBeFocused();
      }
    }
    if (width === 390) await page.screenshot({ path: 'test-results/mobile-after-390.png', fullPage: true });
  });
}

test('note : trente secondes de saisie, focus et géométrie stables, reprise hors ligne', async ({ page, context }) => {
  test.setTimeout(90000);
  await openTrip(page);
  const note = page.locator('#city-note');
  await note.fill(''); await note.focus();
  const before = (await note.boundingBox())!;
  await page.evaluate(() => {
    const note = document.querySelector('#city-note')!;
    const state = { positions: [] as number[], focusLost: false, timer: 0 };
    state.timer = window.setInterval(() => { state.positions.push(note.getBoundingClientRect().top); state.focusLost ||= document.activeElement !== note; }, 50);
    Object.assign(window, { mobileNoteSamples: state });
  });
  await context.setOffline(true);
  const text = 'Une longue note, 中文, avec des lignes et des idées.\n'.repeat(8);
  await note.pressSequentially(text, { delay: 80 });
  const samples = await page.evaluate(() => {
    const state = (window as unknown as { mobileNoteSamples: { positions: number[]; focusLost: boolean; timer: number } }).mobileNoteSamples;
    clearInterval(state.timer); return state;
  });
  expect(samples.focusLost).toBe(false);
  expect(Math.max(...samples.positions) - Math.min(...samples.positions)).toBeLessThanOrEqual(1);
  expect((await note.boundingBox())!.height).toBe(before.height);
  await expect(note).toHaveValue(text);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:china-legacy')!).state.notes.shenzhen)).toBe(text);
  await context.setOffline(false); await page.reload();
  await expect(note).toHaveValue(text);
});

test('dates hébergement vides et remplies, phrases ajoutées en thème sombre', async ({ page }) => {
  await openTrip(page);
  await menuView(page, 'Mes outils sur place');
  await page.locator('.practical-card').filter({ has: page.getByRole('heading', { name: /Shenzhen/ }) }).getByRole('button', { name: 'Ajouter un hébergement', exact: true }).click();
  for (const input of await page.locator('input[type=date]').all()) {
    expect((await input.boundingBox())!.height).toBe(48);
    expect(await input.evaluate(el => el.getBoundingClientRect().width <= el.parentElement!.getBoundingClientRect().width)).toBe(true);
    await input.fill('2027-05-10'); await expect(input).toHaveValue('2027-05-10');
  }
  await page.getByRole('tab', { name: 'Phrases utiles', exact: true }).click();
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('radio', { name: 'Sombre', exact: true }).check(); await page.keyboard.press('Escape');
  const form = page.locator('.practical-phrase-add');
  await form.getByLabel('Signification', { exact: true }).fill('Un texte long à montrer');
  await form.getByLabel('Phrase locale', { exact: true }).fill('请问，在哪里？');
  await form.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await expect(page.locator('.practical-phrase').last()).toContainText('请问，在哪里？');
  const grid = (await page.locator('.practical-grid').boundingBox())!;
  expect((await form.boundingBox())!.y - grid.y - grid.height).toBeGreaterThanOrEqual(18);
  await form.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/mobile-phrases-dark-320.png', fullPage: false });
});

test('safe area simulée : commandes sous la découpe, fond continu, menu et accueil', async ({ page }) => {
  await openTrip(page);
  const css = await page.evaluate(() => [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText); } catch { return []; }
  }).join('\n').replaceAll('env(safe-area-inset-top)', '59px'));
  await page.addStyleTag({ content: css });
  expect((await page.locator('.breadcrumb').boundingBox())!.y).toBeGreaterThanOrEqual(59);
  expect(await page.locator('.topbar').evaluate(el => getComputedStyle(el, '::before').height)).toBe('59px');
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  expect((await page.locator('.sidebar .brand').boundingBox())!.y).toBeGreaterThanOrEqual(59);
  await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
  expect((await page.locator('.journeys-topbar .brand').boundingBox())!.y).toBeGreaterThanOrEqual(59);
  expect(await page.locator('.journeys-topbar').evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor));
  const viewport = await page.locator('meta[name=viewport]').getAttribute('content');
  expect(viewport).not.toMatch(/user-scalable=no|maximum-scale=1/);
});

test('champs mobiles et dates : taille de saisie, hauteur et largeur', async ({ page }) => {
  await openTrip(page);
  expect.soft(await page.locator('#city-note').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await page.getByRole('button', { name: 'Ajouter un jour', exact: true }).click();
  const fields = page.getByRole('dialog').locator('input');
  const text = await fields.first().boundingBox();
  const date = await page.getByRole('dialog').locator('input[type=date]').boundingBox();
  expect(Math.abs(text!.height - date!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(text!.width - date!.width)).toBeLessThanOrEqual(1);
});

test('espacement entre phrases et formulaire', async ({ page }) => {
  await openTrip(page);
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.getByRole('button', { name: 'Mes outils sur place', exact: true }).click();
  await page.getByRole('tab', { name: 'Phrases utiles', exact: true }).click();
  const grid = await page.locator('.practical-grid').boundingBox();
  const form = await page.locator('form').filter({ has: page.getByRole('heading', { name: 'Ajouter une phrase' }) }).boundingBox();
  expect(form!.y - (grid!.y + grid!.height)).toBeGreaterThanOrEqual(18);
});

test('partage : passer aux actions puis fermer rend le focus à un accès visible', async ({ page }) => {
  await openTrip(page);
  const trigger = page.locator('.trip-summary').getByRole('button', { name: 'Partage', exact: true });
  await trigger.click();
  await page.getByRole('dialog', { name: 'Partage', exact: true }).getByRole('button', { name: 'Partager', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Partager et historique', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
