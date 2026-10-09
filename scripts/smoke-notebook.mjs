/** Notebook layout in an isolated local profile; no real account or trip changed. */
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import {productionTestServer} from './production-server.mjs';
import {archive,chinaTrip} from '../src/journeys.ts';
const server=await productionTestServer();server.update();
const browser=await chromium.launch(process.platform==='win32'?{channel:'chrome'}:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'});
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
const trip=chinaTrip(undefined,'notebook-layout');trip.journey.title='Carnet pratique — vérification';trip.notes.general='Note conservée après la mise en page';
const shots='docs/sync/screenshots';await mkdir(shots,{recursive:true});
await context.route('https://*.supabase.co/**',route=>route.abort());
await context.addInitScript(raw=>{localStorage.setItem('a-l-est-trip-v2:notebook-layout',raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language:'fr',theme:'dark'}));},JSON.stringify(archive(trip)));
const documents=page.locator('section.panel').filter({has:page.getByRole('heading',{name:'Mes documents',exact:true})});
const details=page.locator('details.panel').filter({hasText:'Les détails à anticiper'});
const sources=page.getByRole('region',{name:'Tes documents d’origine',exact:true});
async function noOverflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page fits viewport');}
try{
 await page.goto(server.url);await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
 await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();await documents.waitFor();await documents.scrollIntoViewIfNeeded();
 await page.screenshot({path:shots+'/notebook-layout-current.png',fullPage:false});
 const padding=await documents.evaluate(el=>({left:parseFloat(getComputedStyle(el).paddingLeft),top:parseFloat(getComputedStyle(el).paddingTop)}));
 assert.ok(padding.left>=18&&padding.top>=18,'documents need inner spacing, actual '+JSON.stringify(padding));
 // Import a long name and verify both open and download paths preserve its text.
 const filename='planning-'+('long-nom-de-document-'.repeat(6))+'.md',content='# Carnet\n\nTexte du document à conserver.';
 await page.getByLabel('Choisir un document texte',{exact:true}).setInputFiles({name:filename,mimeType:'text/markdown',buffer:Buffer.from(content)});
 await expect(documents.getByRole('button',{name:filename,exact:true})).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await documents.getByRole('button',{name:'Télécharger',exact:true}).click();
 assert.equal(await readFile(await (await downloadPromise).path(),'utf8'),content);
 await documents.getByRole('button',{name:filename,exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Texte du document à conserver.');await page.keyboard.press('Escape');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1100});await noOverflow();
  for(const block of [documents,details,sources]){
   const box=await block.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,'card fits width');
   assert.ok(await block.evaluate(el=>parseFloat(getComputedStyle(el).paddingLeft)>=18),'all notebook cards are padded');
  }
  assert.equal(await details.evaluate(el=>getComputedStyle(el).display),'block','closed details stay compact');
  const spaces=await page.evaluate(()=>{const doc=document.querySelector('[aria-labelledby="documents-title"]').getBoundingClientRect(),details=document.querySelector('.notebook-details').getBoundingClientRect(),source=document.querySelector('[aria-labelledby="sources-title"]').getBoundingClientRect();return {first:details.top-doc.bottom,second:source.top-details.bottom};});
  assert.ok(spaces.first>=16&&spaces.second>=16,'sections have visible spacing');
  assert.ok(await documents.locator('.notebook-document-row').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'long filename fits row');
  await details.locator('summary').click();await expect(details.getByText('Trains sur 12306.',{exact:true})).toBeVisible();await noOverflow();await details.locator('summary').click();
  await documents.scrollIntoViewIfNeeded();
  await page.screenshot({path:shots+`/notebook-redesign-dark-${width}.png`,fullPage:false});
 }
 await page.getByRole('button',{name:'Préférences',exact:true}).click();
 await page.getByRole('radio',{name:'Clair',exact:true}).check();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.keyboard.press('Escape');await documents.scrollIntoViewIfNeeded();await noOverflow();
 await page.screenshot({path:shots+'/notebook-redesign-light-desktop.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Carnet pratique validé : marges, espaces, document long, import/ouverture/téléchargement intacts, détails déroulants, 320/390/1440 px, zéro erreur. Profil local isolé.');
}finally{await browser.close();await server.close();}
