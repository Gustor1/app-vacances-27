import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { fixture } from './companion-fixture.mjs';
import { archive, tripKey } from '../src/journeys.ts';

const out='docs/development/lot-09-souvenirs/compiled';
const server=await productionTestServer();server.update();
const browser=await chromium.launch(chromiumTestOptions());
const trip=fixture(), errors=[], external=[];
const contexts=[];
try {
  await mkdir(out,{recursive:true});
  const source=await browser.newContext({viewport:{width:390,height:950},reducedMotion:'reduce'});contexts.push(source);
  await source.route('https://**/*',r=>r.abort());
  const page=await source.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.url)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
  await page.goto(server.url);await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:tripKey(trip.journey.id),raw:JSON.stringify(archive(trip))});await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
  await page.locator('.souvenirs summary').click();await expect(page.locator('.souvenirs textarea')).toBeEnabled();
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=900;c.height=600;const ctx=c.getContext('2d');ctx.fillStyle='#42694c';ctx.fillRect(0,0,900,600);ctx.fillStyle='#f5d992';ctx.fillRect(100,100,350,350);return c.toDataURL('image/png').split(',')[1];});
  await page.getByLabel('Choisir une photo personnelle',{exact:true}).setInputFiles({name:'souvenir-fictif.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('.souvenirs img')).toBeVisible();
  await page.getByLabel('Légende du souvenir',{exact:true}).fill('Souvenir fictif · 中文 · España');await page.getByRole('button',{name:'Enregistrer le souvenir',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Souvenir enregistré'})).toBeVisible();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  external.length=0;await source.setOffline(true);await page.reload();await page.locator('.souvenirs summary').click();await expect(page.locator('.souvenirs textarea')).toHaveValue('Souvenir fictif · 中文 · España');await expect.poll(()=>page.locator('.souvenirs img').evaluate(img=>img.naturalWidth)).toBe(900);
  await page.getByRole('button',{name:'Télécharger le paquet souvenirs',exact:true}).click();let dialog=page.getByRole('dialog');await expect(dialog).toContainText('Souvenir fictif');let event=page.waitForEvent('download');await dialog.getByRole('button',{name:'Confirmer le téléchargement personnel',exact:true}).click();const media=await readFile(await (await event).path(),'utf8');assert.equal(JSON.parse(media).version,1);
  await page.getByRole('button',{name:'Préparer un souvenir imprimable',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByRole('checkbox',{name:'Jour test',exact:true}).check();await expect(dialog.locator('.souvenir-preview img')).toHaveCount(0);await expect(dialog.locator('.souvenir-preview')).not.toContainText('Souvenir fictif');await dialog.getByLabel('J’inclus mes photos personnelles dans l’impression.',{exact:true}).check();await dialog.getByLabel('J’inclus mes légendes personnelles dans l’impression.',{exact:true}).check();await expect(dialog.locator('.souvenir-preview')).not.toContainText('PRIVATE');await expect(dialog.locator('.souvenir-preview img')).toBeVisible();await page.screenshot({path:`${out}/mobile-preview.png`});
  await page.emulateMedia({media:'print'});await page.screenshot({path:`${out}/print.png`});await page.pdf({path:`${out}/impression-automatisee.pdf`,format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mes voyages',exact:true}).click();event=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger ma sauvegarde complète',exact:true}).click();const backup=await readFile(await (await event).path(),'utf8');assert.ok(JSON.parse(backup).exclusions.some(text=>text.includes('photos et légendes quotidiennes')));assert.ok(!backup.includes('Souvenir fictif'));
  const target=await browser.newContext({viewport:{width:390,height:950}});contexts.push(target);await target.route('https://**/*',r=>r.abort());const restored=await target.newPage();restored.on('pageerror',e=>errors.push(e.message));await restored.goto(server.url);
  await restored.getByLabel('Choisir une sauvegarde complète',{exact:true}).setInputFiles({name:'carnet.json',mimeType:'application/json',buffer:Buffer.from(backup)});await restored.getByRole('dialog').getByRole('button',{name:'Confirmer la restauration',exact:true}).click();await expect(restored.getByRole('status').filter({hasText:'Restauration terminée.'})).toBeVisible();await restored.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();await restored.locator('.souvenirs summary').click();await expect(restored.locator('.souvenirs textarea')).toHaveValue('');
  const upload=()=>restored.getByLabel('Importer un paquet souvenirs',{exact:true}).setInputFiles({name:'medias.json',mimeType:'application/json',buffer:Buffer.from(media)});
  await upload();await expect(restored.getByRole('dialog')).toContainText('Souvenir fictif');await restored.getByRole('dialog').getByRole('button',{name:'Confirmer la restauration',exact:true}).click();await expect(restored.locator('.souvenirs textarea')).toHaveValue('Souvenir fictif · 中文 · España');await expect.poll(()=>restored.locator('.souvenirs img').evaluate(img=>img.naturalWidth)).toBe(900);await upload();await expect(restored.getByRole('dialog').getByRole('button',{name:'Confirmer la restauration',exact:true})).toBeDisabled();await restored.keyboard.press('Escape');
  await restored.getByRole('button',{name:'Supprimer ce souvenir',exact:true}).click();await restored.getByRole('button',{name:'Confirmer la suppression',exact:true}).click();await expect(restored.locator('.souvenirs img')).toHaveCount(0);await expect(restored.locator('.souvenirs textarea')).toHaveValue('');
  assert.deepEqual(errors,[]);const inheritedMapRequests=external.filter(url=>/^https:\/\/[abc]\.tile\.openstreetmap\.org\//.test(url));const otherExternalRequests=external.filter(url=>!inheritedMapRequests.includes(url));assert.deepEqual(otherExternalRequests,[]);
  await writeFile(`${out}/validation.json`,JSON.stringify({passed:true,offlineReload:true,freshProfileRestore:true,restoreRetryNoOverwrite:true,deletion:true,mediaPackageBytes:Buffer.byteLength(media),backupExcludesMedia:true,automatedPrintPDF:true,physicalDevice:false,manualPrintDialog:false,errors,externalRequests:external,inheritedMapRequests,otherExternalRequests},null,2));
  console.log('Souvenirs compiled: offline photo, explicit print choices, separate backup, fresh restore, retry and delete passed.');
} finally {for(const context of contexts)await context.close();await browser.close();await server.close();}
