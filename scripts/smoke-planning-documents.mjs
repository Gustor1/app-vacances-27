import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { productionTestServer } from './production-server.mjs';
const output=path.resolve('docs/development/lot-03-documents/compiled');
await mkdir(output,{recursive:true});
const server=await productionTestServer();server.update();
const browser=await chromium.launch({channel:process.platform==='win32'?'chrome':undefined,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage(),errors=[],uploads=[],external=[],documentExternal=[],extraction=[];
let phase='setup';
page.on('pageerror',error=>errors.push(error.message));
context.on('request',request=>{if(request.method()!=='GET')uploads.push(request.url());if(!request.url().startsWith(server.url)&&!request.url().startsWith('data:')){external.push(request.url());if(phase==='extraction')documentExternal.push(request.url());}});
const key='detours-planning-draft-v1';
try {
 await page.goto(server.url);await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 // No extraction is opened online: both workers and every auxiliary resource
 // must be ready from the normal PWA preparation alone.
 await context.setOffline(true);await page.reload();
 for(const name of ['simple.pdf','columns.pdf','table.pdf','chinese.pdf','lists-table.docx']) {
  phase='extraction';
  await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();const dialog=page.getByRole('dialog');
  const fixture=fileURLToPath(new URL('../tests/fixtures/planning/documents/'+name,import.meta.url));
  const started=Date.now();await dialog.locator('input[type=file]').setInputFiles(fixture);
  await expect(dialog.locator('.notice pre')).toContainText(name==='chinese.pdf'?'博物馆':name.endsWith('.docx')?'Musée rouge':name==='columns.pdf'?'Musee gauche':'Musee rouge');
  await dialog.getByRole('button',{name:'Remplacer le texte',exact:true}).click();
  const session=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(session.source,session.sourceOrigin.originalText);
  await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
  const recognized=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).draft,key);
  extraction.push({name,sha256:createHash('sha256').update(await readFile(fixture)).digest('hex'),durationMs:Date.now()-started,source:session.source,pages:session.sourceOrigin.pages,
   parser:{title:recognized.title,cities:recognized.cities.map(c=>({name:c.name,days:c.days.map(d=>({date:d.date,activities:d.items.map(i=>({title:i.title,time:i.time,period:i.period}))}))}))}});
  if(name==='simple.pdf') {
   phase='notebook';
   assert.equal(recognized.cities[0].name,'Albi');assert.equal(recognized.cities[0].days[0].items.length,2);
   await dialog.getByLabel('Lieu ou activité',{exact:true}).first().fill('Musée corrigé hors ligne');
   await dialog.getByLabel('Devise de référence',{exact:true}).fill('EUR');await dialog.getByLabel('Fuseau du voyage',{exact:true}).fill('Europe/Paris');
   await dialog.getByLabel('Conserver le texte original dans le carnet après création',{exact:true}).check();
   await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
   const resumed=page.getByRole('dialog');await expect(resumed.getByLabel('Lieu ou activité',{exact:true}).first()).toHaveValue('Musée corrigé hors ligne');
   await resumed.getByRole('button',{name:'Créer et ouvrir le carnet',exact:true}).click();await expect(resumed).not.toBeVisible();
   const trip=await page.evaluate(()=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+sessionStorage.getItem('a-l-est-open-trip-v2'))).state);
   assert.ok(trip.documents.some(d=>d.content===session.source));
   await page.reload();await expect(page.getByRole('heading',{name:recognized.title,exact:true})).toBeVisible();
   // Clear only our synthetic draft and UI selection, never any user profile.
   await page.evaluate(key=>{localStorage.removeItem(key);sessionStorage.clear();},key);await page.goto(server.url);
  } else {
   await dialog.getByRole('button',{name:'Fermer',exact:true}).click();
   await page.evaluate(key=>localStorage.removeItem(key),key);await page.reload();
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);assert.deepEqual(documentExternal,[]);
 assert.ok(external.every(url=>/^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(url)));
 await page.screenshot({path:path.join(output,'offline-documents-390.png')});
 await writeFile(path.join(output,'validation.json'),JSON.stringify({passed:true,extraction,errors,uploads,documentExternal,offlineMapAttempts:external,offlineFirstUse:true,physicalDevice:false},null,2));
 console.log(JSON.stringify({passed:true,documents:extraction.length,output}));
} finally {await browser.close();await server.close();}
