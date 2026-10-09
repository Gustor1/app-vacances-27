import { chromiumTestOptions } from './browser-test-options.ts';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { archive, blankTrip, chinaTrip, tripKey, recoveryKey } from '../src/journeys.ts';
import { splitContent } from '../src/cloud/projection.ts';
import { translate } from '../src/locale-utils.ts';

// Isolated browser profiles and simulated sessions; no real account is signed in or modified.
const server = await productionTestServer(); server.update();
const browser = await chromium.launch(chromiumTestOptions()).catch(async error => { await server.close(); throw error; });
const shots = 'docs/sync/screenshots'; await mkdir(shots, { recursive: true });
const config = await readFile('.env.local', 'utf8').catch(() => '');
const project = config.match(/^VITE_SUPABASE_URL=https:\/\/([a-z]+)\.supabase\.co/m)?.[1];
const trip = chinaTrip(undefined, 'ui-china'); trip.journey.title = 'Chine 2027 — Nouveau départ avec les amis';
const deleted = ['Japon — Kyoto avec les amis', 'France — Un grand détour'].map((title, i) => blankTrip({ title, id: 'ui-deleted-' + i }));
const errors = [];
async function profile(width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 980 } });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}
async function noOverflow(page) {
  const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && r.right>innerWidth+1;}).slice(0,10).map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'svg',right:Math.round(el.getBoundingClientRect().right)}))}));
  assert.ok(layout.width<=layout.viewport,'page must fit the viewport: '+JSON.stringify(layout));
}
async function accountLayout(page, header = '.journeys-topbar') {
  await noOverflow(page);
  const visible = await page.locator('.account-error').evaluate(el => { const r=el.getBoundingClientRect(),style=getComputedStyle(el); return r.x>=0 && r.right<=innerWidth && el.scrollHeight<=el.clientHeight+1 && !['hidden','clip'].includes(style.overflow) && style.textOverflow!=='ellipsis'; });
  assert.ok(visible, 'complete account error must fit without clipping');
  assert.ok(await page.evaluate(header => {
    const names=header==='.topbar'?['.search-box','.preferences-trigger','.account-button']:['.brand','.preferences-trigger','.account-button'];
    const boxes=names.map(name=>document.querySelector(header+' '+name).getBoundingClientRect());
    return boxes.every((a,i)=>boxes.slice(i+1).every(b=>a.right<=b.left || b.right<=a.left || a.bottom<=b.top || b.bottom<=a.top));
  },header), 'header controls must not overlap');
}
try {
  const { context, page } = await profile();
  await context.addInitScript(({ trip, recoveries }) => {
    localStorage.setItem('a-l-est-trip-v2:ui-china', trip);
    for (const [key, value] of recoveries) localStorage.setItem(key, value);
    localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language: 'fr', theme: 'dark' }));
  }, { trip: JSON.stringify(archive(trip)), recoveries: deleted.map(t => [recoveryKey(t.journey.id), JSON.stringify({ savedAt: '2026-10-07T00:00:00Z', raw: JSON.stringify(archive(t)) })]) });
  const worldRequests = []; page.on('request', r => { if (/WorldView-.*\.js/.test(r.url())) worldRequests.push(r.url()); });
  for (let i = 0; i < 2; i++) {
    if (i) await page.reload(); else await page.goto(server.url);
    const tab = page.getByRole('tab', { name: 'Mes voyages', exact: true }); await tab.waitFor();
    assert.ok(await tab.evaluate(el => parseFloat(getComputedStyle(el).borderRadius) >= 20), 'tabs must be styled on first arrival and reload');
    assert.equal(worldRequests.length, 0, 'world JS must remain lazy');
  }
  await noOverflow(page);
  await page.screenshot({ path: shots + '/ui-home-dark.png', fullPage: true });
  assert.equal(await page.locator('.journeys-recovery-item').count(), 2);
  for (const title of deleted.map(t => t.journey.title)) await page.locator('.journeys-recovery').getByRole('heading', { name: title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Connexion', exact: true }).click();
  await page.getByRole('group', { name: 'Actions du compte', exact: true }).waitFor();
  if (project) assert.equal(await page.getByRole('button', { name: 'Se connecter avec Google', exact: true }).isEnabled(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Connexion', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Connexion', exact: true }).click();
  await page.getByRole('button', { name: 'Mon compte et mes sauvegardes', exact: true }).click();
  assert.ok(await page.locator('.modal-content').evaluate(el => parseFloat(getComputedStyle(el).paddingLeft) >= 16));
  if (project) assert.equal(await page.getByText('Les comptes ne sont pas encore activés dans cette bêta. Tes carnets restent enregistrés sur cet appareil et exportables.', { exact: true }).count(), 0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Ouvrir ' + trip.journey.title, exact: true }).click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 980 }); await noOverflow(page);
    await page.getByRole('button', { name: 'Connexion', exact: true }).click();
    const rect = await page.locator('.account-menu').boundingBox(); assert.ok(rect.x >= 0 && rect.x + rect.width <= width);
    if (width === 320) await page.screenshot({ path: shots + '/ui-account-menu-mobile.png', fullPage: true });
    await page.keyboard.press('Escape');
    for (const title of await page.locator('.city-tab strong').all()) {
      assert.equal(await title.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'complete city names must fit their cards');
    }
  }
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  assert.equal(await page.locator('.journey-switch strong').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'full journal title must fit sidebar');
  await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
  await page.locator('.journey-card').getByRole('button', { name: 'Supprimer', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('[role=dialog]')?.contains(document.activeElement));
  assert.ok(await page.locator('.modal-content .form-actions').evaluate(el => parseFloat(getComputedStyle(el).gap) >= 8));
  await noOverflow(page); await page.screenshot({ path: shots + '/ui-delete-modal-mobile.png', fullPage: true });
  await page.keyboard.press('Escape'); await context.close();

  if (project) {
    const signed = await profile(390); const userId = '00000000-0000-4000-8000-000000000777';
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ exp, sub: userId, role: 'authenticated' })).toString('base64url') + '.ui-test-signature';
    const session = { access_token: token, refresh_token: 'ui-test-refresh', token_type: 'bearer', expires_at: exp, expires_in: 3600, user: { id: userId, email: 'ui-test@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-10-07T00:00:00Z' } };
    const pendingTrip = blankTrip({ id: 'ui-pending', title: 'Travail non envoyé' });
    const key = `detours-account-v1:${userId}:${tripKey('ui-pending')}`;
    const conflictTrip = blankTrip({id:'ui-conflict',title:'Carnet aux deux versions'});
    conflictTrip.journey.description='Mon idée sur cet appareil, avec une description suffisamment longue pour vérifier la lisibilité.';
    const remoteTrip=structuredClone(conflictTrip);remoteTrip.journey.description='Une autre idée préparée sur le deuxième appareil.';
    const conflictKey=`detours-account-v1:${userId}:${tripKey('ui-conflict')}`;
    const conflictRecord={version:1,raw:JSON.stringify(archive(conflictTrip)),base:splitContent(conflictTrip),revision:1,privateRevision:1,pending:true,operation:'ui-conflict-operation',role:'owner',conflict:{remote:splitContent(remoteTrip),revision:2,privateRevision:1,fields:[{path:'shared.journey.description',base:'Idée initiale',local:conflictTrip.journey.description,remote:remoteTrip.journey.description,kind:'field'}]}};
    await signed.context.route(`https://${project}.supabase.co/**`, route => {
      const url = route.request().url();
      if (url.includes('/logout')) return route.fulfill({ status: 200, body: '{}' });
      if (url.includes('detours_list_trips')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'ui-conflict', journey: conflictTrip.journey, departureDate: '', role: 'owner', revision: 2, privateRevision: 1, deleted: false }]) });
      if (url.includes('/rest/v1/detours_world')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Simulated offline save' }) });
    });
    await signed.context.addInitScript(({ project, session, key, raw,conflictKey,conflictRecord }) => {
      localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify(session));
      localStorage.setItem(key, JSON.stringify({ version: 1, raw, base: null, revision: 0, privateRevision: 0, pending: true, operation: 'ui-test-operation', role: 'owner' }));
      localStorage.setItem(conflictKey,JSON.stringify(conflictRecord));
    }, { project, session, key, raw: JSON.stringify(archive(pendingTrip)),conflictKey,conflictRecord });
    await signed.page.goto(server.url);
    // Wait for the refused send; checking layout before its error arrives misses the regression.
    await signed.page.locator('.account-error').waitFor();
    for (const language of ['fr','en','zh-CN','es']) {
      await signed.page.evaluate(language => localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'dark'})),language);
      await signed.page.reload(); await signed.page.locator('.account-error').waitFor();
      const normalError=translate('Synchronisation indisponible. Tes changements restent sur cet appareil ; réessaie après reconnexion.',language);
      assert.equal(await signed.page.locator('.account-error').innerText(),normalError);
      for (const width of [320,390,1440]) {
        await signed.page.setViewportSize({width,height:980});
        await accountLayout(signed.page);
        // Layout stress only: the real failed RPC above produced the normal translated error.
        const longError=normalError+' '+('RéférenceTrèsLongueSansEspace中文'.repeat(12));
        await signed.page.locator('.account-error').evaluate((el,text)=>{el.textContent=text;},longError);
        await accountLayout(signed.page);
        assert.equal(await signed.page.locator('.account-error').innerText(),longError);
        await signed.page.locator('.account-error').evaluate((el,text)=>{el.textContent=text;},normalError);
        if(language==='fr')await signed.page.locator('.journeys-topbar').screenshot({path:shots+`/l2-account-error-${width}.png`});
      }
      // Reflow equivalent of a 1440x980 viewport at 200% browser zoom.
      await signed.page.setViewportSize({width:720,height:490});
      await accountLayout(signed.page);
      const trigger=signed.page.getByRole('button',{name:translate('Mon compte',language),exact:true});
      await trigger.focus(); await signed.page.keyboard.press('Enter');
      const menu=signed.page.getByRole('group',{name:translate('Actions du compte',language),exact:true}); await menu.waitFor();
      await signed.page.keyboard.press('Tab');
      assert.equal(await menu.evaluate(el=>el.contains(document.activeElement)),true,'keyboard enters account actions');
      assert.notEqual(await signed.page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),'none','account action focus is visible');
      await signed.page.keyboard.press('Escape');
      assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'Escape returns focus to account');
      await trigger.click();
      await signed.page.getByRole('button',{name:translate('Mon compte et mes sauvegardes',language),exact:true}).click();
      const dialog=signed.page.getByRole('dialog');await dialog.waitFor();
      await noOverflow(signed.page);
      assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'account dialog fits at 200% reflow');
      await signed.page.keyboard.press('Tab');
      assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'focus stays inside dialog');
      await signed.page.keyboard.press('Escape'); await trigger.waitFor();
      await signed.page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
      assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'closing the dialog returns focus to account');
      await signed.page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:'Travail non envoyé'}),exact:true}).click();
      await signed.page.locator('.topbar .account-error').waitFor();
      for(const width of [320,390,1440]) {
        await signed.page.setViewportSize({width,height:980});
        await accountLayout(signed.page,'.topbar');
        assert.ok(await signed.page.locator('.topbar .search-box').evaluate(el=>el.getBoundingClientRect().width>=100),'trip search remains usable beside an error');
        if(language==='fr'&&width===320)await signed.page.locator('.topbar').screenshot({path:shots+'/l2-trip-error-320.png'});
      }
      await signed.page.setViewportSize({width:720,height:490});
      await accountLayout(signed.page,'.topbar');
      const menuButton=signed.page.getByRole('button',{name:translate('Ouvrir le menu',language),exact:true});
      if(await menuButton.isVisible())await menuButton.click();
      await signed.page.getByRole('button',{name:translate('Mes voyages',language),exact:true}).click();
      console.log(`Account errors, long text, layouts, 200% reflow and keyboard verified: ${language}.`);
    }
    await signed.page.evaluate(()=>localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language:'fr',theme:'dark'})));
    await signed.page.reload(); await signed.page.locator('.account-error').waitFor();
    await signed.page.getByRole('button', { name: 'Mon compte', exact: true }).click();
    await signed.page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
    const conflict=signed.page.locator('.account-conflict');await conflict.waitFor();
    for(const width of [320,390,1440]) {
      await signed.page.setViewportSize({width,height:980});
      await noOverflow(signed.page);
      const layout=await conflict.locator('.conflict-exports button').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
      assert.equal(layout.length,2);
      assert.ok(layout[1].y>=layout[0].y+layout[0].height+8||layout[1].x>=layout[0].x+layout[0].width+8,'conflict exports must have a visible gap');
      await conflict.scrollIntoViewIfNeeded();
      await signed.page.screenshot({path:shots+`/conflict-redesign-${width}.png`,fullPage:false});
    }
    for(const [label,description] of [['Exporter ma version',conflictTrip.journey.description],['Exporter la version distante',remoteTrip.journey.description]]) {
      const downloading=signed.page.waitForEvent('download');await conflict.getByRole('button',{name:label,exact:true}).click();
      const download=await downloading;const exported=JSON.parse(await readFile(await download.path(),'utf8'));
      assert.equal(exported.state.journey.description,description);
    }
    assert.equal(await conflict.getByRole('button',{name:'Appliquer mes choix',exact:true}).isEnabled(),false);
    await conflict.getByRole('radio',{name:/Version distante/}).check();
    assert.equal(await conflict.getByRole('button',{name:'Appliquer mes choix',exact:true}).isEnabled(),true);
    await signed.page.setViewportSize({width:390,height:980});
    await signed.page.getByRole('dialog').getByText('Des changements attendent un envoi. Ils resteront dans le cache isolé de ce compte. Exporte-les ou synchronise avant de quitter.', { exact: true }).waitFor();
    await signed.page.getByRole('button', { name: 'Confirmer la déconnexion', exact: true }).click();
    await signed.page.getByRole('button', { name: 'Connexion', exact: true }).waitFor();
    assert.equal(await signed.page.evaluate(() => localStorage.getItem('detours-last-account-v1')), null);
    assert.ok(await signed.page.evaluate(key => localStorage.getItem(key)?.includes('Travail non envoyé'), key), 'sign-out must preserve account recovery');
    await noOverflow(signed.page); await signed.context.close();
  } else console.log('Simulated signed-in scenario NOT RUN: configured Supabase build required.');
  assert.deepEqual(errors, []);
  console.log('UI smoke passed: conflict export spacing and both download contents, radio choices, cold/reload tabs, lazy world, account menu keyboard, compiled Google config, 320/390/1440 layouts, recovery labels, modal spacing and pending sign-out cache preservation.');
} finally { await browser.close(); await server.close(); }
