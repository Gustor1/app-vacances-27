import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import {productionTestServer} from './production-server.mjs';
import {archive,blankTrip,tripKey} from '../src/journeys.ts';
import {RATE_CACHE_KEY} from '../src/live-rates.ts';
import {checkServedBuild} from './build-identity.mjs';

if(process.env.DETOURS_ALLOW_NETWORK !== '1' || (process.env.BETA_TEST_URL && !process.env.DETOURS_EXPECTED_BUILD_ID)) {
  console.error('Contrôle réseau NON EXÉCUTÉ : DETOURS_ALLOW_NETWORK=1 requis ; pour une bêta, fournir DETOURS_EXPECTED_BUILD_ID.');
  process.exit(2);
}

const server=process.env.BETA_TEST_URL?{url:process.env.BETA_TEST_URL,update(){},async close(){}}:await productionTestServer();server.update();
const browser=await chromium.launch(process.platform==='win32'?{channel:'chrome'}:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const state=blankTrip({id:'converter-live',title:'Chine · mon budget en euros',currency:'CNY'});
  await context.addInitScript(({key,raw,id})=>{localStorage.setItem(key,raw);sessionStorage.setItem('a-l-est-open-trip-v2',id);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language:'fr',theme:'dark'}));},{key:tripKey(state.journey.id),raw:JSON.stringify(archive(state)),id:state.journey.id});
  await page.goto(server.url);
  const build=await checkServedBuild(page,process.env.DETOURS_EXPECTED_BUILD_ID);
  console.log(`Build du contrôle réseau : ${build.id}`);
  await page.getByRole('button',{name:'Mes outils sur place',exact:true}).click();await page.getByRole('tab',{name:'Budget',exact:true}).click();await page.getByRole('combobox',{name:'Mon pays',exact:true}).selectOption('FR');
  const region=page.getByRole('region',{name:'Convertisseur de devises',exact:true});
  await expect(region.getByLabel('Résultat de la conversion')).toContainText('EUR',{timeout:20000});
  const cache=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),RATE_CACHE_KEY),quote=cache['CNY:EUR'];
  assert.ok(quote&&quote.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(quote.date),'Real public API date/rate reachable with browser CORS');
  await page.getByLabel('Libellé',{exact:true}).fill('Déjeuner');await page.getByLabel('Montant',{exact:true}).fill('80');await page.getByRole('button',{name:'Ajouter la dépense',exact:true}).click();await expect(page.locator('.personal-total-value')).toContainText('EUR');
  await mkdir('docs/sync/screenshots',{recursive:true});
  await page.screenshot({path:'docs/sync/screenshots/converter-live-desktop.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'docs/sync/screenshots/converter-live-mobile.png',fullPage:true,animations:'disabled'});
  assert.deepEqual(errors,[]);
  console.log(`Convertisseur réel vérifié dans Chrome : 1 CNY = ${quote.rate} EUR, source datée ${quote.date}, dépense locale et équivalent personnel, sombre et mobile. Aucun taux simulé, aucun compte connecté.`);
} finally {await browser.close();await server.close();}
