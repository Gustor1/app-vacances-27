import { test, expect } from './fixtures';
import { translate, localeFor } from '../../src/locale-utils';

for (const [language, nativeLabel, title] of [
  ['zh-CN', '中文（简体）', '我的旅行'],
  ['es', 'Español', 'Mis viajes'],
] as const) {
  test(`${nativeLabel}: library, all views, dates, forms and saved notes`, async ({ page }) => {
    const t = (source: string) => translate(source, language);
    await page.goto('/');
    await expect(page).toHaveTitle(/^Détours —/);
    await expect(page.locator('.brand')).toContainText('détours');
    const note = 'Mi nota personnelle 中文 · 14 h';
    await page.getByLabel('Ma note pour Shenzhen', { exact: true }).fill(note);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:china-legacy')!).state.notes.shenzhen)).toBe(note);
    const before = await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'));
    await page.getByRole('button', { name: 'Préférences', exact: true }).click();
    await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
    await expect(page.getByRole('dialog').getByText(t('Langue de l’interface'), { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.getByLabel(translate('Ma note pour {city}', language, { city: 'Shenzhen' }), { exact: true })).toHaveValue(note);
    await expect(page.getByRole('heading', { name: 'Arrivée à Shenzhen', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'))).toBe(before);
    await page.getByRole('button', { name: t('Ajouter une étape à cette journée'), exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel(t('Lieu ou activité'), { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    const nav = page.getByRole('navigation', { name: t('Navigation principale'), exact: true });
    await nav.getByRole('button', { name: t('Vue d’ensemble'), exact: true }).click();
    await page.locator('input[type="date"]').first().fill('2027-03-12');
    // Capture the actual print document while avoiding the system print dialog.
    await page.evaluate(() => {
      const append = Element.prototype.append;
      Element.prototype.append = function (...nodes) {
        append.apply(this, nodes);
        for (const node of nodes) if (node instanceof HTMLIFrameElement && node.contentWindow) {
          node.contentWindow.print = () => {
            document.body.dataset.printLang = node.contentDocument!.documentElement.lang;
            document.body.dataset.printText = node.contentDocument!.body.textContent || '';
          };
        }
      };
    });
    await page.getByRole('button', { name: t('Imprimer tout le voyage'), exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-print-lang', language);
    const printed = await page.locator('body').getAttribute('data-print-text');
    expect(printed).toContain(note);
    expect(printed).toContain(new Date('2027-03-12T12:00:00Z').toLocaleDateString(localeFor(language), { dateStyle: 'medium', timeZone: 'UTC' }));
    await nav.getByRole('button', { name: t('Mon planning'), exact: true }).click();
    const date = new Date('2027-03-12T12:00:00Z').toLocaleDateString(localeFor(language), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    await expect(page.locator('.day-date')).toHaveText(date);
    await nav.getByRole('button', { name: t('La carte du voyage'), exact: true }).click();
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
    await nav.getByRole('button', { name: t('Mes envies & bonus') }).click();
    await page.getByRole('button', { name: t('Ajouter une adresse'), exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel(t('Nom de l’adresse'), { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await nav.getByRole('button', { name: t('Mes transports'), exact: true }).click();
    await page.getByRole('button', { name: t('Ajouter un trajet'), exact: true }).click();
    await expect(page.getByLabel(t('Nom du trajet (facultatif)'), { exact: true })).toBeVisible();
    await nav.getByRole('button', { name: t('Mes outils sur place'), exact: true }).click();
    for (const tab of ['Hébergements', 'Budget', 'Dans ma valise', 'Phrases utiles']) {
      await page.getByRole('tab', { name: t(tab), exact: true }).click();
      if (tab === 'Budget') await expect(page.getByLabel(t('Montant'), { exact: true })).toBeVisible();
    }
    await nav.getByRole('button', { name: t('Mon carnet pratique'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('Exporter ma sauvegarde'), exact: true })).toBeVisible();
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page).toHaveTitle(`Détours — ${title}`);
    await page.getByRole('button', { name: t('Créer un voyage'), exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel(t('Titre du voyage'), { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: 'Chine 2027' }), exact: true }).click();
    await nav.getByRole('button', { name: t('Mon planning'), exact: true }).click();
    await expect(page.getByLabel(translate('Ma note pour {city}', language, { city: 'Shenzhen' }), { exact: true })).toHaveValue(note);
  });

  test(`${nativeLabel}: 320px navigation, preferences and both themes fit`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/');
    const t = (source: string) => translate(source, language);
    for (const theme of ['light', 'dark']) {
      await page.getByRole('button', { name: /^(Préférences|偏好设置|Preferencias)$/ }).click();
      await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
      await page.getByRole('dialog').locator(`input[value="${theme}"]`).check();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/locales-${language}-${theme}-preferences.png` });
      await page.keyboard.press('Escape');
      const bottom = page.locator('.mobile-bottom-nav');
      for (const key of ['Planning', 'Carte', 'Bonus', 'Outils']) {
        await bottom.getByRole('button', { name: t(key), exact: true }).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language} ${theme} ${key}`).toBe(true);
      }
      await bottom.getByRole('button', { name: t('Menu'), exact: true }).click();
      await expect(page.locator('.sidebar')).toHaveClass(/open/);
      await page.keyboard.press('Escape');
      await bottom.getByRole('button', { name: t('Planning'), exact: true }).click();
      await page.screenshot({ path: `test-results/locales-${language}-${theme}-planning.png`, fullPage: true });
    }
  });
}
