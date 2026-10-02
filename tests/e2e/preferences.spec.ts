import { test, expect, type Page } from '@playwright/test';

async function preferences(page: Page) {
  await page.getByRole('button', { name: /^(Préférences|Preferences)$/ }).click();
  return page.getByRole('dialog');
}
async function english(page: Page) {
  const dialog = await preferences(page);
  await dialog.getByRole('radio', { name: 'English', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}
async function navigate(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name, exact: name !== 'Ideas & extras' }).click();
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('dark preference persists and readable surfaces follow it', async ({ page }) => {
  const dialog = await preferences(page);
  await dialog.getByRole('radio', { name: 'Sombre', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-preferences-v1')!));
  expect(saved.theme).toBe('dark');
  const surface = await page.locator('.day-panel').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(surface).not.toBe('rgb(255, 254, 251)');
  await expect((await preferences(page)).getByRole('radio', { name: 'Sombre', exact: true })).toBeChecked();
});

test('automatic theme follows device changes but an explicit theme remains stable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const dialog = await preferences(page);
  await dialog.getByRole('radio', { name: 'Automatique', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await dialog.getByRole('radio', { name: 'Clair', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('English navigation and editable forms cover all main views', async ({ page }) => {
  await english(page);
  const dialog = await preferences(page);
  await expect(dialog.getByRole('radio', { name: 'Automatic', exact: true })).toBeVisible();
  await expect(dialog.getByText('Interface language', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await navigate(page, 'My itinerary');
  await page.getByRole('button', { name: 'Add an activity to this day', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Place or activity', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await navigate(page, 'Trip overview');
  await expect(page.getByRole('button', { name: 'Export calendar (0)', exact: true })).toBeDisabled();
  await navigate(page, 'Trip map');
  await expect(page.getByRole('button', { name: 'Zoom in on the map', exact: true })).toBeVisible();
  await navigate(page, 'Ideas & extras');
  await page.getByRole('button', { name: 'Add a place', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Add a personal place', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await navigate(page, 'My transport');
  await page.getByRole('button', { name: 'Add a journey', exact: true }).click();
  await expect(page.getByLabel('Journey name (optional)', { exact: true })).toBeVisible();
  await navigate(page, 'Travel essentials');
  await expect(page.getByRole('tab', { name: 'Accommodation', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  await expect(page.getByLabel('Amount', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Packing list', exact: true }).click();
  await page.getByRole('tab', { name: 'Useful phrases', exact: true }).click();
  await navigate(page, 'Travel notebook');
  await expect(page.getByRole('button', { name: 'Export my backup', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('interface language does not translate or rewrite personal notes and source content', async ({ page }) => {
  const note = 'Mon rendez-vous personnel 中文 à 14 h';
  await page.getByLabel('Ma note pour Shenzhen', { exact: true }).fill(note);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-v1')!).notes.shenzhen)).toBe(note);
  const before = await page.evaluate(() => localStorage.getItem('a-l-est-v1'));
  await english(page);
  await expect(page.getByLabel('My note for Shenzhen', { exact: true })).toHaveValue(note);
  await expect(page.getByRole('heading', { name: 'Arrivée à Shenzhen', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-v1'))).toBe(before);
  await page.reload();
  await expect(page.getByLabel('My note for Shenzhen', { exact: true })).toHaveValue(note);
});

test('two tabs synchronise theme and language preferences', async ({ page, context }) => {
  const second = await context.newPage();
  await second.goto('/');
  const dialog = await preferences(page);
  await dialog.getByRole('radio', { name: 'Sombre', exact: true }).check();
  await dialog.getByRole('radio', { name: 'English', exact: true }).check();
  await expect(second.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(second.locator('html')).toHaveAttribute('lang', 'en');
  const otherDialog = await preferences(second);
  await otherDialog.getByRole('radio', { name: 'Light', exact: true }).check();
  await otherDialog.getByRole('radio', { name: 'Français', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('preferences keyboard Escape returns focus to its trigger', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Préférences', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const width of [320, 390]) {
  test(`mobile navigation and layouts fit ${width}px in both languages and themes`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 844 });
    for (const language of ['fr', 'en'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        const dialog = await preferences(page);
        await dialog.locator(`input[name="language"][value="${language}"]`).check();
        await dialog.locator(`input[name="theme"][value="${theme}"]`).check();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.keyboard.press('Escape');
        const bottom = page.locator('.mobile-bottom-nav');
        await expect(bottom).toBeVisible();
        for (const label of language === 'fr' ? ['Planning', 'Carte', 'Bonus', 'Outils'] : ['Itinerary', 'Map', 'Extras', 'Tools']) {
          const button = bottom.getByRole('button', { name: label, exact: true });
          await button.click();
          await expect(button).toHaveAttribute('aria-current', 'page');
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${language} ${theme} ${label}`).toBe(true);
        }
        await bottom.getByRole('button', { name: 'Menu', exact: true }).click();
        await expect(page.locator('.sidebar')).toHaveClass(/open/);
        await page.keyboard.press('Escape');
        await expect(bottom.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
      }
    }
  });
}

test('selected map markers remain selected and their Amap popup follows the language', async ({ page }) => {
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  const marker = page.locator('.leaflet-marker-icon[title="3. Lianhuashan Park"]');
  await marker.click();
  await expect(marker).toHaveClass(/is-selected/);
  await english(page);
  await expect(marker).toHaveClass(/is-selected/);
  await expect(page.locator('.leaflet-popup-content').getByRole('link', { name: 'Search in Amap ↗', exact: true })).toBeVisible();
});
