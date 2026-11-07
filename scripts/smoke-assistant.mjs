import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { fixture } from './assistant-fixture.mjs';
import { archive, parseTrip, tripKey } from '../src/journeys.ts';
const trip=fixture(),key=tripKey(trip.journey.id),out='docs/development/lot-07-assistant/compiled';
const server=await productionTestServer();server.update();const browser=await chromium.launch(chromiumTestOptions());
try {
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.url)&&!r.url().startsWith('data:'))external.push(r.url());});await context.route('https://**/*',r=>r.abort());
 await page.goto(server.url);await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:JSON.stringify(archive(trip))});await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
 const bootstrapExternal=[...external];external.length=0;await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Rechercher dans ce carnet',{exact:true}).fill('PRIVATE_REF');await expect(dialog.locator('.assistant-results')).toContainText('PRIVATE_REF');
 await dialog.getByLabel('Activité concernée',{exact:true}).selectOption('b');await dialog.getByLabel('Texte à ajouter',{exact:true}).fill('Note hors ligne');await dialog.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();await expect(dialog.locator('.assistant-preview')).toContainText('Note hors ligne');
 await dialog.getByRole('button',{name:'Confirmer cette action',exact:true}).evaluate(b=>{b.click();b.click();});await expect(dialog.locator('.assistant-preview')).toHaveCount(0);
 await page.keyboard.press('Escape');await page.reload();await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await expect(dialog.getByRole('button',{name:'Prévisualiser l’annulation',exact:true})).toHaveCount(0);
 await dialog.getByLabel('Rechercher dans ce carnet',{exact:true}).fill('Note hors ligne');await expect(dialog.locator('.assistant-results')).toContainText('Note hors ligne');await page.keyboard.press('Escape');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();const exported=parseTrip(await readFile(await (await download).path(),'utf8'));assert.equal(exported.state.notes.b,'Note hors ligne');
 assert.deepEqual(external,[]);const firstAssistantExternal=[...external];
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mes voyages',exact:true}).click();await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'assistant.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
 // Import opens the classic planning map. Record those shell requests separately.
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
 const restoreBootstrapExternal=[...external];external.length=0;
 await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await dialog.getByLabel('Rechercher dans ce carnet',{exact:true}).fill('Note hors ligne');await expect(dialog.locator('.assistant-results')).toContainText('Note hors ligne');await expect(dialog.locator('.assistant-results')).toContainText('Jardin');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.notes.b,key),'Note hors ligne');
 await mkdir(out,{recursive:true});await page.screenshot({path:out+'/offline.png'});await writeFile(out+'/validation.json',JSON.stringify({passed:true,generatedAt:new Date().toISOString(),offlineReload:true,actualMutation:true,noDoubleNote:true,sessionClearedOnReload:true,exportAndImportCopy:true,bootstrapExternal,restoreBootstrapExternal,firstAssistantExternal,assistantExternal:external,errors},null,2));
 console.log('Assistant compiled offline passed: local search, preview, actual mutation, double click, reload, export and imported copy; no assistant external requests.');
} finally {await browser.close();await server.close();}
