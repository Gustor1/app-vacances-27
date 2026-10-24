import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { fixture } from './companion-fixture.mjs';
import { archive, parseTrip, tripKey } from '../src/journeys.ts';
const trip=fixture(),key=tripKey(trip.journey.id),out='docs/development/lot-05-compagnon/compiled';
const server=await productionTestServer();server.update();const browser=await chromium.launch(chromiumTestOptions());
try {
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];let bootstrapExternal=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.url)&&!r.url().startsWith('data:'))external.push(r.url());});
 await context.route('https://**/*',route=>route.abort());await page.goto(server.url);await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:JSON.stringify(archive(trip))});await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
 await page.locator('.now-shortcut').click();await page.getByLabel('Journée à consulter',{exact:true}).selectOption('d');await expect(page.locator('.companion')).toBeVisible();bootstrapExternal=[...external];external.length=0;await page.locator('.companion-check li').first().getByRole('button',{name:'Écarter pour ces données',exact:true}).click();
 await context.setOffline(true);await page.reload();await page.getByLabel('Journée à consulter',{exact:true}).selectOption('d');await expect(page.locator('.companion-check li')).toHaveCount(1);
 await page.getByRole('button',{name:'À montrer',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog).toContainText('测试路 10 号');await expect(dialog).not.toContainText('PRIVATE');await dialog.getByLabel('Hébergement de retour',{exact:true}).selectOption('c');await expect(dialog.locator('.now-return')).toContainText('测试旅馆');await page.keyboard.press('Escape');
 const ideas=page.locator('.companion-ideas');await ideas.getByLabel('Favoris uniquement',{exact:true}).check();await ideas.getByRole('button',{name:'Prévisualiser l’ajout',exact:true}).click();await dialog.getByRole('button',{name:'Confirmer l’ajout au programme',exact:true}).click();await expect(ideas.locator('li')).toHaveCount(0);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();const restored=parseTrip(await readFile((await (await download).path()),'utf8'));assert.equal(restored.state.companion.dismissed.length,1);assert.equal(restored.state.cities[0].days[0].steps.length,4);assert.equal(restored.state.notes.a,'PRIVATE_REF');
 await ideas.getByRole('button',{name:'Annuler cet ajout',exact:true}).click();await expect(ideas.locator('li')).toHaveCount(1);await page.reload();await page.getByLabel('Journée à consulter',{exact:true}).selectOption('d');const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,key);assert.equal(saved.cities[0].days[0].steps.length,3);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await mkdir(out,{recursive:true});await page.screenshot({path:out+'/offline.png',fullPage:true});await writeFile(out+'/validation.json',JSON.stringify({passed:true,generatedAt:new Date().toISOString(),offlineReload:true,dismissalPersisted:true,safeShowCard:true,ideasPreviewAdditionUndo:true,exportParsed:true,reloadAfterUndo:true,bootstrapExternal,companionExternal:external,errors},null,2));console.log('Companion compiled offline passed: checks, safe card, ideas, preview, undo, export and reload; no external requests during companion use (initial map requests recorded separately).');
} finally {await browser.close();await server.close();}
