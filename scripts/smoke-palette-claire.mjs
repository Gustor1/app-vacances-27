import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, webkit } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { archive, chinaTrip } from '../src/journeys.ts';

// Disposable profiles, synthetic example only. Run before and after on the same source server.
const phase = process.argv[2] || 'after';
const mapOnly = process.argv.includes('--map-only');
assert.ok(['before', 'after'].includes(phase));
const output = 'docs/development/palette-claire';
await mkdir(`${output}/${phase}`, { recursive: true });
const url = process.env.PALETTE_TEST_URL || 'http://127.0.0.1:5173';
const trip = chinaTrip(undefined, 'palette-fixture');
trip.journey.title = 'Carnet de démonstration';
const fixture = JSON.stringify(archive(trip));
const results = [], errors = [];

for (const engine of mapOnly ? ['chromium'] : ['chromium', 'webkit']) {
  const browser = await (engine === 'chromium' ? chromium.launch(chromiumTestOptions()) : webkit.launch());
  try {
    for (const width of mapOnly ? [1440] : engine === 'chromium' ? [320, 390, 430, 1440] : [390, 1440]) {
      for (const theme of mapOnly ? ['dark'] : ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 980 }, reducedMotion: 'reduce', colorScheme: theme, serviceWorkers: 'block' });
        await context.route('https://**/*', route => route.abort());
        await context.addInitScript(({ theme, fixture }) => {
          if (!sessionStorage.getItem('palette-seeded')) {
            localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'fr', theme }));
            localStorage.setItem('a-l-est-trip-v2:palette-fixture', fixture);
            sessionStorage.setItem('palette-seeded', '1');
          }
        }, { theme, fixture });
        const page = await context.newPage();
        page.on('pageerror', e => errors.push(e.message));
        async function capture(view) {
          if (mapOnly && view !== 'map') return;
          if (view === 'map') {
            await page.locator('.leaflet-geographicBackground-pane path').first().waitFor({ state: 'attached' });
            await page.waitForLoadState('networkidle');
          }
          await page.evaluate(() => { document.activeElement?.blur(); });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => ![...document.getAnimations()].some(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity));
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${engine} ${theme} ${width} ${view} viewport`);
          const styles = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height).map(el => {
            const s = getComputedStyle(el);
            return { tag: el.tagName, class: typeof el.className === 'string' ? el.className : '', color: s.color, background: s.backgroundColor, image: s.backgroundImage, border: s.borderColor, shadow: s.boxShadow, accent: s.accentColor, filter: s.filter };
          }));
          const name = `${engine}-${theme}-${width}-${view}`;
          const shot = await page.screenshot({ path: `${output}/${phase}/${name}.png`, animations: 'disabled' });
          results.push({ name, engine, theme, width, view, styles, imageSha256: createHash('sha256').update(shot).digest('hex') });
        }
        async function navigate(label) {
          if (width < 761) await page.getByRole('button', { name: 'Menu', exact: true }).click();
          await page.getByRole('navigation', { name: 'Navigation principale', exact: true }).getByRole('button', { name: label, exact: false }).click();
        }
        await page.goto(url);
        // A targeted recapture can apply the exact saved stylesheet, without altering the checkout.
        if (phase === 'before' && process.env.PALETTE_BASELINE_CSS) await page.addStyleTag({ content: await readFile(process.env.PALETTE_BASELINE_CSS, 'utf8') });
        await page.getByRole('button', { name: 'Ouvrir Carnet de démonstration', exact: true }).waitFor();
        await capture('home');
        await page.getByRole('button', { name: 'Préférences', exact: true }).click();
        await page.getByRole('dialog').waitFor();
        await capture('preferences');
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Créer un voyage', exact: true }).click();
        await page.getByRole('dialog').getByLabel('Titre du voyage', { exact: true }).fill('Brouillon de démonstration');
        await capture('form');
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Ouvrir Carnet de démonstration', exact: true }).click();
        await page.locator('.day-panel').waitFor();
        await capture('planning');
        await navigate('Mon carnet pratique');
        await page.locator('.offline-status').waitFor();
        await capture('notebook');
        if (width === 1440) {
          for (const [label, view] of [['Mes envies & bonus', 'bonus'], ['Vue d’ensemble', 'overview'], ['La carte du voyage', 'map'], ['Mes outils sur place', 'tools'], ['Maintenant', 'now'], ['Mes transports', 'transport']]) {
            await navigate(label); await capture(view);
          }
          await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
          await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
          await page.locator('.world-map').waitFor();
          await capture('world');
        }
        await context.close();
        console.log(`${phase}: ${engine} ${theme} ${width} passed`);
      }
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
if (mapOnly) {
  const existing = JSON.parse(await readFile(`${output}/${phase}.json`, 'utf8'));
  results.push(...existing.filter(r => !results.some(next => next.name === r.name)));
}
await writeFile(`${output}/${phase}.json`, JSON.stringify(results, null, 2));
if (phase === 'after') {
  const before = JSON.parse(await readFile(`${output}/before.json`, 'utf8'));
  // The user subsequently authorized replacing the brand artwork in both themes.
  // Compare common semantic HTML classes, excluding native map DOM whose loading is asynchronous.
  // Initial all-element comparison before the logo replacement is retained separately.
  const comparable = styles => {
    const groups = new Map();
    for (const style of styles) {
      if (style.tag !== style.tag.toUpperCase() || !style.class || /\b(?:brand-(?:mark|icon|symbol)|leaflet)/.test(style.class)) continue;
      const key = style.tag + '.' + style.class;
      groups.set(key, [...new Set([...(groups.get(key) || []), JSON.stringify(style)])].sort());
    }
    return groups;
  };
  const comparison = results.filter(r => r.theme === 'dark').map(r => {
    const old = before.find(b => b.name === r.name);
    const previous = comparable(old?.styles || []), current = comparable(r.styles);
    const keys = [...current.keys()].filter(key => previous.has(key));
    const differences = keys.filter(key => JSON.stringify(previous.get(key)) !== JSON.stringify(current.get(key)));
    return { name: r.name, scope: 'Common semantic HTML classes; authorized brand artwork, SVG and asynchronous Leaflet internals excluded', comparedClasses: keys.length, differences, stylesIdentical: keys.length > 0 && differences.length === 0, pixelsIdentical: old?.imageSha256 === r.imageSha256 };
  });
  await writeFile(`${output}/dark-comparison.json`, JSON.stringify(comparison, null, 2));
  assert.ok(comparison.every(r => r.stylesIdentical), 'dark computed appearance must remain unchanged; see dark-comparison.json');
}
console.log(`${phase}: ${results.length} captures, zero runtime errors`);
