import { test, expect } from '@playwright/test';
import { MAP_PREFERENCES_KEY } from '../../src/map-preferences';

test('installation offer received before Preferences, dismissal and installed state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Préférences', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const offer = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(offer, { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
    window.dispatchEvent(offer);
  });
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('button', { name: 'Installer le carnet', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Installer le carnet', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText('Détours est installé sur cet appareil.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Préférences', exact: true })).toBeFocused();
});

for (const result of ['denied', 'granted', 'error', 'unsupported'] as const) {
  test(`storage persistence ${result}: no startup request, no notebook mutation`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(result => {
      Object.assign(window, { persistenceCalls: 0 });
      Object.defineProperty(navigator, 'storage', { configurable: true, value: result === 'unsupported' ? {} : {
        persisted: async () => false,
        persist: async () => {
          (window as unknown as { persistenceCalls: number }).persistenceCalls++;
          if (result === 'error') throw new Error('unavailable');
          return result === 'granted';
        },
      } });
    }, result);
    await page.goto('/');
    await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
    await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
    await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
    expect(await page.evaluate(() => (window as unknown as { persistenceCalls: number }).persistenceCalls)).toBe(0);
    const notebooks = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('a-l-est-trip-v2:')).map(k => [k, localStorage.getItem(k)])));
    const before = await notebooks();
    const action = page.getByRole('button', { name: 'Protéger le stockage sur cet appareil', exact: true });
    if (result === 'unsupported') await expect(action).toHaveCount(0);
    else {
      await action.click();
      await expect(page.getByText(result === 'granted' ? 'Stockage persistant accordé. Garde aussi une sauvegarde sur un autre support.' : 'Le navigateur n’a pas accordé la persistance. Tu peux continuer ; garde une sauvegarde.', { exact: true })).toBeVisible();
      if (result === 'granted') await expect(action).toBeDisabled();
      else await expect(action).toBeEnabled();
    }
    expect(await notebooks()).toEqual(before);
  });
}

test('maps external window and return preserve the notebook for Google and Amap', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await context.route('https://**/*', route => route.fulfill({ contentType: 'text/html', body: '<title>Navigation simulée</title><p>Carte externe factice</p>' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
  for (const provider of ['google', 'amap']) {
    await page.evaluate(({ key, provider }) => localStorage.setItem(key, JSON.stringify({ provider })), { key: MAP_PREFERENCES_KEY, provider });
    await page.reload();
    await page.getByRole('button', { name: 'Mon planning', exact: true }).click();
    const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('a-l-est-trip-v2:')).map(k => [k, localStorage.getItem(k)])));
    const actions = page.locator('.timeline .map-actions').first();
    await actions.locator('.map-route-toggle').click();
    const link = provider === 'google' ? actions.locator('.map-place-link') : actions.getByRole('link', { name: 'Y aller · Amap ↗', exact: true });
    const popupPromise = context.waitForEvent('page');
    await link.click();
    const popup = await popupPromise; await popup.waitForLoadState();
    expect(new URL(popup.url()).hostname).toBe(provider === 'google' ? 'www.google.com' : 'uri.amap.com');
    await popup.close(); await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    expect(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('a-l-est-trip-v2:')).map(k => [k, localStorage.getItem(k)])))).toEqual(before);
    await expect(page.locator('.timeline')).toBeVisible();
  }
});
