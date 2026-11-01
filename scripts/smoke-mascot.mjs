import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { fixture } from './assistant-fixture.mjs';
import { archive, tripKey } from '../src/journeys.ts';

const before = process.argv.includes('--before');
const out = `docs/development/lot-08-mascotte/${before ? 'before' : 'compiled'}`;
const server = await productionTestServer(); server.update();
const browser = await chromium.launch(chromiumTestOptions());
const trip=fixture(), key=tripKey(trip.journey.id), errors=[], external=[];
async function layout(page,state,theme) {
  const hint=page.locator(`[data-mascot="${state}"]`);
  for(const width of [320,390,1440]) {
    await page.setViewportSize({width,height:950});await hint.evaluate(e=>e.scrollIntoView({block:'center'}));
    assert.equal(await hint.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`${out}/${state}-${theme}-${width}.png`});
  }
  await page.setViewportSize({width:390,height:950});await page.evaluate(()=>document.documentElement.style.zoom='2');
  assert.equal(await hint.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,JSON.stringify(await hint.evaluate(e=>({state:e.getAttribute('data-mascot'),client:e.clientWidth,scroll:e.scrollWidth,children:[...e.children].map(c=>({tag:c.tagName,width:c.getBoundingClientRect().width,scroll:c.scrollWidth,flex:getComputedStyle(c).flex,padding:getComputedStyle(c).padding,margin:getComputedStyle(c).margin}))}))));
  await page.evaluate(()=>document.documentElement.style.zoom='1');
}
try {
  await mkdir(out,{recursive:true});
  for (const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width:390,height:950},reducedMotion:'reduce'});
    await context.route('https://**/*',r=>r.abort());
    const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!r.url().startsWith(server.url)&&!r.url().startsWith('data:'))external.push(r.url());});
    // Seed before the first render so the real first welcome is captured.
    await page.addInitScript(theme => { if(!localStorage.getItem('a-l-est-preferences-v1'))localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language:'fr',theme})); },theme);
    await page.goto(server.url);
    if(!before) await expect(page.locator('[data-mascot="welcome"]')).toBeVisible();
    await page.screenshot({path:`${out}/welcome-${theme}.png`});
    if(!before) await layout(page,'welcome',theme);
    await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
    const dialog=page.getByRole('dialog');await dialog.getByLabel('Ton programme',{exact:true}).fill('# Escale\nVille: Albi\nJour 1\n- Musée rouge\nUn passage encore incompris.');
    await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
    await expect(dialog.locator('.planning-passages')).toBeVisible();
    if(!before) await expect(page.locator('[data-mascot="attention"]')).toBeVisible();
    await dialog.locator('.planning-passages').scrollIntoViewIfNeeded(); await page.screenshot({path:`${out}/attention-${theme}.png`});
    if(!before) await layout(page,'attention',theme);
    await page.keyboard.press('Escape');
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:JSON.stringify(archive(trip))});await page.reload();
    await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
    await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
    await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
    if(!before) await expect(page.locator('[data-mascot="ready"]')).toBeVisible();
    await page.locator('.offline-status').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/ready-${theme}.png`});
    if(!before) {
      await layout(page,'ready',theme);
      assert.equal(await page.locator('[data-mascot="ready"]').ariaSnapshot(),'- paragraph: Cette copie du carnet et l’application sont disponibles hors ligne ici. Les liens et cartes de rues demandent Internet ; garde aussi une sauvegarde.');
    }
    if(!before) {
      external.length=0;await context.setOffline(true);await page.reload();
      await expect(page.locator('[data-mascot="ready"]')).toBeVisible();
      await expect(page.locator('.mascot-sprite')).toHaveAttribute('data-ready','true');
      await expect(page.locator('.mascot-sprite canvas')).toBeVisible();
      assert.deepEqual(external,[]);
      const raw=await page.evaluate(key=>localStorage.getItem(key),key);
      await page.getByRole('button',{name:'Préférences',exact:true}).click();await page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true}).uncheck();
      await expect(page.locator('.mascot-hint')).toHaveCount(0);await page.keyboard.press('Escape');await page.reload();await expect(page.locator('.mascot-hint')).toHaveCount(0);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw);
      await page.getByRole('button',{name:'Préférences',exact:true}).click();await page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true}).check();await page.keyboard.press('Escape');
      await expect(page.locator('[data-mascot="ready"]')).toBeVisible();
      // A modified, unsaved notebook must withdraw "ready" immediately.
      await page.evaluate(key=>{const a=JSON.parse(localStorage.getItem(key));a.state.notes.b='new revision';const raw=JSON.stringify(a);localStorage.setItem(key,raw);window.dispatchEvent(new StorageEvent('storage',{key,newValue:raw}));},key);
      await expect(page.locator('[data-mascot="ready"]')).toHaveCount(0);
      // Recheck succeeds on the new persisted copy, then deleting a cached resource invalidates it.
      await page.locator('.offline-status').getByRole('button',{name:'Vérifier',exact:true}).click();await expect(page.locator('[data-mascot="ready"]')).toBeVisible();
      await page.evaluate(async()=>{for(const name of await caches.keys())if(name.startsWith('a-l-est-')){const cache=await caches.open(name);for(const req of await cache.keys())if(new URL(req.url).pathname.includes('/assets/index-')&&req.url.endsWith('.js'))await cache.delete(req);}});
      await page.locator('.offline-status').getByRole('button',{name:'Vérifier',exact:true}).click();await expect(page.locator('[data-mascot="ready"]')).toHaveCount(0);
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/validation.json`,JSON.stringify({passed:true,before,generatedAt:new Date().toISOString(),errors,offline:!before,preferenceSurvivesReload:!before,tripUnchangedByPreference:!before,readyWithdrawnAfterRevisionAndCacheLoss:!before},null,2));
  console.log(`Mascot ${before?'baseline screenshots':'compiled offline, preference and readiness checks'} passed.`);
} finally { await browser.close(); await server.close(); }
