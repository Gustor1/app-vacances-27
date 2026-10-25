import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { archive, blankTrip, parseTrip, tripKey } from '../src/journeys.ts';
const trip=blankTrip({title:'Offline places'});
const place={qid:'Q243',source:'https://www.wikidata.org/wiki/Q243',checkedAt:'2026-10-21T01:00:00.000Z',values:{coordinates:[48.8584,2.2945],website:'https://www.toureiffel.paris/',photo:{url:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/640px-Example.jpg',source:'https://commons.wikimedia.org/wiki/File:Example.jpg',author:'Test Author',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',width:640,height:480,mime:'image/jpeg'}}};
trip.cities=[{id:'paris',name:'Paris',chineseName:'',subtitle:'',color:'#657c50',image:'',notes:[],days:[{id:'day',title:'Visit',steps:[{id:'place-step',title:'Original personal title',description:'Original notes',category:'visit',coordinates:[1,2],place}]}]}];
const server=await productionTestServer();server.update();const browser=await chromium.launch(chromiumTestOptions());
try {
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/wikimedia|wikidata/.test(r.url()))requests.push(r.url());});
 await context.route('https://**/*',route=>route.abort());await page.goto(server.url);await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:tripKey(trip.journey.id),raw:JSON.stringify(archive(trip))});await page.reload();await page.getByRole('button',{name:'Ouvrir Offline places',exact:true}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon planning',exact:true}).click();await context.setOffline(true);await page.reload();
 await expect(page.locator('#step-place-step .place-summary')).toContainText('Test Author');assert.equal(await page.locator('.place-summary img').count(),0);assert.deepEqual(requests,[]);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();const restored=parseTrip(await readFile((await (await download).path()),'utf8'));assert.deepEqual(restored.state.cities[0].days[0].steps[0].place,place);
 await page.getByRole('button',{name:'Compléter ce lieu',exact:true}).click();await page.getByLabel('Nom du lieu ou identifiant Q').fill('Never cached place');await page.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();
 await mkdir('docs/development/lot-04-lieux/compiled',{recursive:true});await page.screenshot({path:'docs/development/lot-04-lieux/compiled/offline-390.png',fullPage:true});
 await page.getByRole('button',{name:'Retirer l’association',exact:true}).click();await expect(page.locator('.place-summary')).toHaveCount(0);await page.reload();await expect(page.locator('#step-place-step')).toContainText('Original personal title');
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,tripKey(trip.journey.id));assert.equal(saved.cities[0].days[0].steps[0].place,undefined);assert.deepEqual(saved.cities[0].days[0].steps[0].coordinates,[1,2]);assert.deepEqual(errors,[]);
 await writeFile('docs/development/lot-04-lieux/compiled/validation.json',JSON.stringify({date:new Date().toISOString(),passed:true,offlineReload:true,exportRoundtrip:true,remotePhotoNeverAutomaticallyLoaded:true,unavailableSearchPreservesNotebook:true,removalReload:true,errors},null,2));
 console.log('Places compiled offline passed: reload, credits, export, remote photo opt-in, unavailable search, removal and originals.');
} finally {await browser.close();await server.close();}
