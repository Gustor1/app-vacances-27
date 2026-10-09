import { chromiumTestOptions } from './browser-test-options.ts';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { productionTestServer } from './production-server.mjs';
import { checkServedBuild } from './build-identity.mjs';
import { chromium } from '@playwright/test';
import { translate } from '../src/locale-utils.ts';

if (process.env.PRODUCTION_TEST_URL && process.env.DETOURS_ALLOW_NETWORK !== '1') {
  console.error('Contrôle URL distante NON EXÉCUTÉ : DETOURS_ALLOW_NETWORK=1 requis.');
  process.exit(2);
}

const server=process.env.PRODUCTION_TEST_URL ? null : await productionTestServer();
const browser = await chromium.launch(chromiumTestOptions()).catch(async error => { if (server) await server.close(); throw error; });
await mkdir('docs/transition/screenshots',{recursive:true});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.PRODUCTION_TEST_URL || server.url);
  const build = await checkServedBuild(page);
  console.log(`Served build verified: ${build.id}`);
  await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();
  await page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  if(server) {
    assert.ok(await page.evaluate(async()=> (await caches.keys()).includes('a-l-est-previous-test')));
    server.update();
    await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
    await page.evaluate(async()=>{
      for(let attempt=0;attempt<150;attempt++) {
        const names=await caches.keys();
        if(names.some(name=>name.startsWith('a-l-est-')&&name!=='a-l-est-previous-test') && !names.includes('a-l-est-previous-test')) return;
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      throw new Error('Updated service worker did not replace its previous cache.');
    });
    console.log('Service worker upgrade verified: previous cache replaced by current compiled assets.');
  }
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find(name => name.startsWith('a-l-est-') && name !== 'a-l-est-previous-test');
    const cache = await caches.open(name);
    const requests=await cache.keys();
    if(requests.length<2) throw new Error(JSON.stringify({names,name,requests:requests.map(request=>request.url)}));
    return { count: (await cache.keys()).length, planning: Boolean(await cache.match('/documents/planning-original.md')), bonus: Boolean(await cache.match('/documents/bonus-original.md')), geography: Boolean(await cache.match('/world-geography.json')), neutralCover: Boolean(await cache.match('/travel-landscape.svg')) };
  });
  assert.ok(cached.count > 15 && cached.planning && cached.bonus && cached.geography && cached.neutralCover, `All offline assets must be cached: ${JSON.stringify(cached)}`);
  await page.getByRole('button', { name: 'Jour 2', exact: true }).click();
  await page.locator('.leaflet-marker-icon[title="3. Lianhuashan Park"]').click();
  await page.locator('.leaflet-popup-content').getByRole('link', { name: /Ouvrir la carte/ }).waitFor();
  assert.match(await page.locator('#step-sz-2-park').getAttribute('class'), /highlighted/);
  await page.screenshot({ path: 'docs/transition/screenshots/production-china-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'La carte du voyage', exact: true }).click();
  await page.locator('.leaflet-geographicBackground-pane path:not([d="M0 0"])').first().waitFor();
  await page.screenshot({ path: 'docs/transition/screenshots/production-china-map.png', fullPage: true });
  await page.getByRole('button',{name:'Mon planning',exact:true}).click();
  await context.setOffline(true);
  await page.getByText('Tu es hors ligne.', { exact: false }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Un grand voyage, de beaux détours.' }).waitFor();
  assert.equal(await page.evaluate(async () => { try { await fetch('/__uncached_offline_probe'); return false; } catch { return true; } }), true, 'Uncached network requests must fail in offline mode');
  await page.getByLabel('Ma note pour Shenzhen').fill('Note conservée hors ligne');
  await page.reload();
  assert.equal(await page.getByLabel('Ma note pour Shenzhen').inputValue(), 'Note conservée hors ligne');
  await page.getByRole('button', { name: 'Mon carnet pratique', exact: true }).click();
  await page.getByRole('heading', { name: 'Ton carnet est prêt pour le hors-ligne', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Consulter le planning d’origine', exact: true }).click();
  await page.getByRole('dialog').getByRole('heading', { name: /SHENZHEN/ }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.getByRole('button', { name: 'Consulter la liste bonus', exact: true }).click();
  await page.getByRole('dialog').getByRole('heading', { name: 'Chengdu Bonus', exact: true }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.getByRole('button', { name: 'Mon planning', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'docs/transition/screenshots/production-china-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  await page.getByRole('dialog').getByRole('radio', { name: 'Sombre', exact: true }).check();
  await page.getByRole('dialog').getByRole('radio', { name: 'English', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.getByLabel('My note for Shenzhen', { exact: true }).inputValue(), 'Note conservée hors ligne');
  await page.locator('.mobile-bottom-nav').getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('tab', { name: 'Useful phrases', exact: true }).click();
  await page.getByText('请少放辣椒。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'docs/transition/screenshots/production-mobile-dark-english.png', fullPage: true });
  // Several journals remain creatable and navigable with the compiled app offline.
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'My trips',exact:true}).click();
  for(const [title,currency,timezone] of [['Japan','JPY','Asia/Tokyo'],['France','EUR','Europe/Paris']]) {
    await page.getByRole('button',{name:'Create a trip',exact:true}).click();
    await page.getByRole('dialog').getByLabel('Trip title',{exact:true}).fill(title);
    await page.getByRole('dialog').getByRole('combobox',{name:'Reference currency',exact:true}).fill(currency);
    await page.getByRole('dialog').getByRole('combobox',{name:'Trip timezone',exact:true}).fill(timezone);
    await page.getByRole('dialog').getByRole('button',{name:'Create journal',exact:true}).click();
    await page.getByRole('button',{name:'Travel notebook',exact:true}).click();
    await page.getByRole('textbox',{name:'Personal notes',exact:true}).fill(`Offline ${title}`);
    await page.getByRole('button',{name:'My trips',exact:true}).click();
  }
  await page.reload();
  assert.equal(await page.locator('.journey-card').count(),3);
  await page.screenshot({path:'docs/transition/screenshots/production-library-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Open Japan',exact:true}).click();
  await page.reload();
  assert.equal(await page.getByRole('textbox',{name:'Personal notes',exact:true}).inputValue(),'Offline Japan');
  await page.getByRole('button',{name:'Travel essentials',exact:true}).click();
  await page.getByRole('tab',{name:'Useful phrases',exact:true}).click();
  assert.equal(await page.getByText('请少放辣椒。',{exact:true}).count(),0);
  await page.getByRole('button',{name:'My trips',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'docs/transition/screenshots/production-library-mobile-dark.png',fullPage:true});
  // Newly added interface dictionaries must also work after a fully offline reload.
  let preferenceLabel = 'Preferences';
  for (const [language, label] of [['zh-CN', '中文（简体）'], ['es', 'Español']]) {
    const t = source => translate(source, language);
    await page.getByRole('button', { name: preferenceLabel, exact: true }).click();
    await page.getByRole('dialog').getByRole('radio', { name: label, exact: true }).check();
    await page.keyboard.press('Escape');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), language);
    assert.equal(await page.title(), `Détours — ${t('Mes voyages')}`);
    await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: 'Japan' }), exact: true }).click();
    await page.getByRole('button', { name: t('Menu'), exact: true }).click();
    await page.getByRole('button', { name: t('Mon carnet pratique'), exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: t('Notes personnelles'), exact: true }).inputValue(), 'Offline Japan');
    await page.getByRole('button', { name: t('Menu'), exact: true }).click();
    await page.getByRole('button', { name: t('Mes voyages'), exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `docs/transition/screenshots/production-library-${language}.png`, fullPage: true });
    preferenceLabel = t('Préférences');
  }
  // The new, lazy-loaded world view must work on its first opening OFFLINE.
  await page.getByRole('tab', { name: 'Mi mundo', exact: true }).click();
  await page.locator('.world-map .leaflet-interactive').first().waitFor();
  assert.equal(await page.getByText('0 países · 0 visitas confirmadas', { exact: true }).count(), 1);
  await page.getByRole('searchbox', { name: 'Buscar un país', exact: true }).fill('Japón');
  await page.getByRole('button', { name: /^Japón 0 visitas$/ }).click();
  await page.getByRole('button', { name: 'Añadir una estancia anterior', exact: true }).click();
  await page.getByLabel('Recuerdo de la estancia', { exact: true }).fill('Kyoto offline');
  await page.getByLabel('Año (opcional)', { exact: true }).fill('2018');
  await page.getByRole('button', { name: 'Guardar la estancia', exact: true }).click();
  // World writes acquire a Web Lock asynchronously; reload only after persistence.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('detours-world-v1') || '{}').visits?.some(visit => visit.label === 'Kyoto offline' && visit.country === 'JP'));
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('tab', { name: 'Mi mundo', exact: true }).click();
  await page.getByText('1 países · 1 visitas confirmadas', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'docs/transition/screenshots/production-world-mobile-dark-es.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => { const el = document.querySelector('.world-map'); return el && el.querySelector('svg')?.getBoundingClientRect().width >= el.getBoundingClientRect().width; });
  await page.screenshot({ path: 'docs/transition/screenshots/production-world-desktop.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Production smoke passed: map selection, local geography, service worker, offline reload, offline notes, both source documents, mobile overflow, four interface languages offline, Chinese phrases, zero runtime errors, several journals offline, no China content in Japan, world first opened offline and personal visits persisted.');
  console.log(`Offline cache verified: ${cached.count} requests.`);
} finally { await browser.close(); if(server) await server.close(); }
