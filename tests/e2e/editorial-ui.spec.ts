import { test, expect } from '@playwright/test';
import { fixture } from '../../scripts/companion-fixture.mjs';
import { archive, tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`editorial library keeps long titles, actions and keyboard navigation reachable: ${language}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const t = (value: string) => translate(value, language);
    const title = 'De Kyoto aux chemins de traverse — un carnet pour prendre le temps de découvrir et de retrouver les bonnes adresses';
    const trips = Array.from({ length: 4 }, (_, index) => {
      const trip = fixture();
      trip.journey = { ...trip.journey!, id: `editorial-${index}`, title: `${title} ${index + 1}`, cover: '/travel-landscape.svg' };
      return { key: tripKey(trip.journey.id), raw: JSON.stringify(archive(trip)) };
    });
    await page.goto('/');
    await page.evaluate(({ language, trips }) => {
      localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' }));
      trips.forEach(({ key, raw }) => localStorage.setItem(key, raw));
    }, { language, trips });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(({ language, theme }) => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme })), { language, theme });
      for (const width of [320, 390, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 950 });
        await page.reload();
        await expect(page.locator('.journey-title')).toHaveCount(4);
        await expect(page.locator('.journey-title').first()).toContainText(title);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const unreachable = await page.locator('.journey-card button').evaluateAll(elements => elements.filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width <= 0 || rect.left < -1 || rect.right > innerWidth + 1;
        }).map(element => element.textContent));
        expect(unreachable).toEqual([]);
      }
    }
    const tabs = page.getByRole('tablist', { name: t('Accueil'), exact: true });
    await tabs.getByRole('tab', { name: t('Mes voyages'), exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.getByRole('tab', { name: t('Mon monde'), exact: true })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    const trigger = page.getByRole('button', { name: t('Créer un voyage'), exact: true });
    await trigger.click();
    await page.getByRole('dialog').getByLabel(t('Titre du voyage'), { exact: true }).fill('Brouillon conservé hors des carnets');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: `${title} 1` }), exact: true }).click();
    await page.locator('.nav-item').filter({ hasText: t('Vue d’ensemble') }).click();
    for (const width of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 950 });
      await page.reload();
      await expect(page.locator('.trip-overview')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.locator('.export-button').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    expect(await page.evaluate(trips => trips.map(({ key }) => localStorage.getItem(key)), trips)).toEqual(trips.map(trip => trip.raw));
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('a-l-est-trip-v2:')).length)).toBe(4);
  });
}
