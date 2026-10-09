import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import { PREFERENCES_KEY, translate, localeFor, type Language } from '../../src/locale-utils';

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`accueil ${language} : onglets, clavier, focus et date civile dans un fuseau occidental`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', timezoneId: 'America/Los_Angeles', viewport: { width: 320, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await page.goto('/');
      const trip = blankTrip({ id: 'l2-date', title: 'Civil date', timezone: 'Asia/Shanghai' }); trip.departureDate = '2027-05-01';
      await page.evaluate(({ trip, language, preferencesKey }) => { localStorage.setItem('a-l-est-trip-v2:' + trip.id, JSON.stringify(trip)); localStorage.setItem(preferencesKey, JSON.stringify({ language, theme: 'dark' })); }, { trip: archive(trip), language, preferencesKey: PREFERENCES_KEY });
      await page.reload();
      const tabs = page.getByRole('tablist', { name: translate('Accueil', language), exact: true });
      const trips = tabs.getByRole('tab', { name: translate('Mes voyages', language), exact: true });
      const world = tabs.getByRole('tab', { name: translate('Mon monde', language), exact: true });
      await expect(trips).toHaveAttribute('tabindex', '0');
      await expect(world).toHaveAttribute('tabindex', '-1');
      await trips.focus();
      expect(await trips.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
      await page.keyboard.press('ArrowRight');
      await expect(world).toBeFocused(); await expect(world).toHaveAttribute('aria-selected', 'true');
      const worldPanel = page.getByRole('tabpanel', { name: translate('Mon monde', language), exact: true });
      await expect(worldPanel).toBeVisible();
      expect(await world.getAttribute('aria-controls')).toBe(await worldPanel.getAttribute('id'));
      await page.keyboard.press('Tab'); await expect(worldPanel).toBeFocused();
      await page.keyboard.press('Shift+Tab'); await expect(world).toBeFocused();
      await world.focus(); await page.keyboard.press('Home'); await expect(trips).toBeFocused();
      await page.keyboard.press('End'); await expect(world).toBeFocused();
      await page.keyboard.press('ArrowRight'); await expect(trips).toBeFocused();
      await page.keyboard.press('ArrowLeft'); await expect(world).toBeFocused();
      await page.keyboard.press('ArrowLeft'); await expect(trips).toBeFocused();
      await world.focus(); await page.keyboard.press('Space'); await expect(world).toHaveAttribute('aria-selected', 'true');
      await trips.focus(); await page.keyboard.press('Enter'); await expect(trips).toHaveAttribute('aria-selected', 'true');
      const tripPanel = page.getByRole('tabpanel', { name: translate('Mes voyages', language), exact: true });
      await expect(tripPanel).toBeVisible();
      const date = tripPanel.locator('time[datetime="2027-05-01"]');
      const expected = new Intl.DateTimeFormat(localeFor(language), { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date('2027-05-01T00:00:00Z'));
      await expect(date).toHaveText(expected);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('.journeys-tabs .glass-selection')).toHaveAttribute('data-phase', 'rest');
    } finally { await context.close(); }
  });
}
