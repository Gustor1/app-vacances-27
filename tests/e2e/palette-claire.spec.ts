import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { translate, type Language } from '../../src/locale-utils';

test.beforeEach(async ({ context }) => { await context.route('https://**/*', route => route.abort()); });

test('the approved bird is loaded and selection menus use the softened light field surface', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' }); await page.goto('/');
  const logo = page.locator('.brand-icon');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(128);
  await expect(page.locator('link[rel=icon][sizes="32x32"]')).toHaveAttribute('href', '/icons/favicon-32.png');
  const select = page.locator('.journeys-filters select').first();
  for (const item of [select, select.locator('option').last()]) {
    expect(await item.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(242, 235, 223)');
  }
  await select.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Connexion', exact: true }).click();
  const menu = page.locator('.account-menu'); await expect(menu).toBeVisible();
  expect(await menu.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(242, 235, 223)');
  await page.keyboard.press('Escape');
});

test('bootstrap resolves the palette before React, including an explicit dark preference', async ({ browser }) => {
  for (const [theme, system, resolved, color] of [
    ['light', 'dark', 'light', '#e8dfd0'], ['dark', 'light', 'dark', '#19151b'],
    ['system', 'dark', 'dark', '#19151b'], ['system', 'light', 'light', '#e8dfd0'],
  ] as const) {
    const context = await browser.newContext({ colorScheme: system });
    try {
      await context.addInitScript(theme => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'fr', theme })), theme);
      await context.route(/\/src\/main\.tsx(?:\?.*)?$/, route => route.abort());
      const page = await context.newPage(); await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', resolved);
      await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', color);
      expect(await page.locator('#root').innerHTML()).toBe('');
      expect(await page.locator('html').evaluate(el => el.style.colorScheme)).toBe(resolved);
    } finally { await context.close(); }
  }
});

test('theme changes sync between tabs, follow system settings and preserve notebook data', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light' }); await page.goto('/');
  await page.getByRole('button', { name: 'Ajouter l’exemple Chine', exact: true }).click();
  await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
  const data = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('a-l-est-trip-v2:')).map(k => [k, localStorage.getItem(k)])));
  const before = await data();
  const second = await context.newPage(); await second.goto('/');
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  for (const [label, theme, color] of [['Sombre', 'dark', '#19151b'], ['Clair', 'light', '#e8dfd0']] as const) {
    await page.getByRole('radio', { name: label, exact: true }).check();
    for (const tab of [page, second]) {
      await expect(tab.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(tab.locator('meta[name=theme-color]')).toHaveAttribute('content', color);
    }
  }
  await page.getByRole('radio', { name: 'Automatique', exact: true }).check();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await data()).toEqual(before);
});

test('rendered light surfaces, controls and composed translucent colors meet their contrast targets', async ({ page, browserName }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' }); await page.goto('/');
  const rows: { name: string; foreground: number[]; background: number[]; ratio: number; target: number }[] = [];
  async function contrast(selector: string, name: string, property = 'color', target = 4.5, pseudo: string | null = null) {
    const row = await page.locator(selector).first().evaluate((el, { name, property, target, pseudo }) => {
      const rgba = (value: string) => { const a = value.match(/[\d.]+/g)!.map(Number); return [a[0], a[1], a[2], a[3] ?? 1]; };
      const blend = (a: number[], b: number[]) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
      function background(element: Element | null): number[] {
        if (!element) return [255, 255, 255, 1];
        return blend(rgba(getComputedStyle(element).backgroundColor), background(element.parentElement));
      }
      const own = background(el), outer = background(el.parentElement);
      const bg = property === 'outlineColor' || property === 'borderTopColor' ? outer : own;
      const style = getComputedStyle(el, pseudo);
      const fg = blend(rgba(style.getPropertyValue(property.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()))), bg);
      const lum = (c: number[]) => c.slice(0, 3).map(v => v / 255).map(s => s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const a = lum(fg), b = lum(bg);
      return { name, foreground: fg, background: bg, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), target };
    }, { name, property, target, pseudo });
    rows.push(row); expect(row.ratio, name).toBeGreaterThanOrEqual(target);
  }
  await contrast('body', 'Texte principal sur lin');
  await contrast('.journeys-intro .muted', 'Texte secondaire sur lin');
  await contrast('.btn-primary', 'Texte sur bouton vert');
  await contrast('.brand', 'Marque sur barre translucide');
  await page.getByRole('button', { name: 'Créer un voyage', exact: true }).click();
  await contrast('.modal-heading h2', 'Titre sur surface crème');
  await contrast('.editor-form .field input', 'Saisie sur champ');
  await contrast('.editor-form .field input', 'Bordure du champ sur surface', 'borderTopColor', 3);
  await contrast('.editor-form .field input', 'Placeholder sur champ', 'color', 4.5, '::placeholder');
  await page.keyboard.press('Escape');
  const trigger = page.getByRole('button', { name: 'Préférences', exact: true });
  await trigger.focus(); await page.keyboard.press('Enter');
  await page.getByRole('radio', { name: 'Clair', exact: true }).check();
  await contrast('.theme-options label.selected', 'Texte sélectionné sur sauge');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  expect(await trigger.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await contrast('.preferences-trigger', 'Focus clavier sur lin', 'outlineColor', 3);
  await page.emulateMedia({ contrast: 'more' });
  await contrast('.brand', 'Marque sur repli opaque à contraste renforcé');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--glass').trim())).not.toContain('rgba');
  await mkdir('docs/development/palettes-personnalisees', { recursive: true });
  await writeFile(`docs/development/palettes-personnalisees/contrasts-${browserName}.json`, JSON.stringify(rows, null, 2));
});

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) {
  test(`light palette reflows preferences, form and import in ${language}, including zoom and landscape`, async ({ page }) => {
    test.setTimeout(90000);
    await page.addInitScript(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' })), language);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
    const t = (s: string) => translate(s, language);
    for (const [width, height, zoom] of [[320, 740, 1], [390, 844, 1], [430, 932, 1], [1440, 980, 1], [844, 390, 1], [390, 360, 1], [640, 1000, 2]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      for (const [action, view] of [['Préférences', 'preferences'], ['Créer un voyage', 'form'], ['Créer depuis un planning', 'import']]) {
        // CSS zoom on the root clips the existing sheet runtime (also with the saved CSS).
        // Keep the established 200% preferences check; test sheets at all six unzoomed sizes.
        if (zoom > 1 && view !== 'preferences') continue;
        await page.getByRole('button', { name: t(action), exact: true }).click();
        const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${view} ${width} zoom ${zoom}`).toBe(true);
        expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        if (view === 'import') {
          const input = dialog.getByRole('textbox', { name: t('Ton programme'), exact: true });
          await input.fill('Jour 1\n- Visite du musée'); await input.focus(); await input.scrollIntoViewIfNeeded();
          await expect(input).toBeInViewport();
        }
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
      }
    }
  });
}
