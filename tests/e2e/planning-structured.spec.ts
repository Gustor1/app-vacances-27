import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { archive, blankTrip } from '../../src/journeys';
import { COMPLETE_PUBLIC_EXAMPLE, MINIMAL_PUBLIC_EXAMPLE } from '../../src/planning-import/public-examples';
import { readStructuredPlanning } from '../../src/planning-import/public-contract';
const key='detours-planning-draft-v1';
async function open(page: Page) { await page.goto('/');await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();return page.getByRole('dialog'); }
async function file(page: Page, value: unknown, name='test.detours.json') { await page.getByRole('dialog').locator('input[type=file]').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(typeof value==='string'?value:JSON.stringify(value))}); }

test('real JSON download/import, explicit replacement, correction, reload, confirmation and replay preserve the previous notebook',async({page})=>{
 test.setTimeout(60_000);
 const old=blankTrip({title:'Existing notebook'}),oldKey='a-l-est-trip-v2:'+old.journey!.id,oldRaw=JSON.stringify(archive(old));
 await page.addInitScript(({key,raw})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{key:oldKey,raw:oldRaw});
 const requests: string[]=[];page.on('request',r=>{if(r.method()!=='GET'||(!/^(127\.0\.0\.1|localhost)$/.test(new URL(r.url()).hostname)&&!/^https:\/\/[abc]\.tile\.openstreetmap\.org\//.test(r.url())))requests.push(r.url());});
 let dialog=await open(page);await dialog.getByRole('textbox',{name:'Ton programme',exact:true}).fill('PRIVATE SENTINEL');
 await dialog.locator('.planning-kit summary').click();
 const downloadPromise=page.waitForEvent('download');await dialog.getByRole('link',{name:'Télécharger un exemple fictif',exact:true}).click();const download=await downloadPromise;
 const downloaded=await readFile((await download.path())!,'utf8');readStructuredPlanning(downloaded);
 const result=JSON.parse(downloaded);result.notes.push('![TRACKER_SENTINEL](https://example.invalid/pixel-private.png) <script>globalThis.PWNED=true</script>');const raw=JSON.stringify(result);
 await file(page,raw,download.suggestedFilename());
 await expect(dialog.getByRole('textbox',{name:'Ton programme',exact:true})).toHaveValue('PRIVATE SENTINEL');
 await dialog.getByRole('button',{name:'Annuler',exact:true}).click();await file(page,raw);
 await dialog.getByRole('button',{name:'Remplacer le texte',exact:true}).click();
 await expect(dialog.getByText('Préparé avec une IA externe.',{exact:false}).first()).toBeVisible();
 await expect(dialog.getByLabel('Titre du voyage',{exact:true})).toHaveValue(COMPLETE_PUBLIC_EXAMPLE.title);
 await expect(dialog.getByLabel('Ville, région ou lieu de séjour',{exact:true}).first()).toHaveValue('上海');
 await expect(dialog.getByRole('textbox',{name:'Notes non structurées',exact:true})).toHaveValue(/80 CNY/);
 await dialog.getByLabel('Titre du voyage',{exact:true}).fill('Voyage corrigé');
 await dialog.getByLabel('Conserver le fichier IA externe dans le carnet après création',{exact:true}).check();
 await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();dialog=page.getByRole('dialog');
 await expect(dialog.getByLabel('Titre du voyage',{exact:true})).toHaveValue('Voyage corrigé');
 await dialog.getByRole('button',{name:'Créer et ouvrir le carnet',exact:true}).evaluate((button: HTMLButtonElement)=>{button.click();button.click();});
 await expect(dialog).not.toBeVisible();await page.reload();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+sessionStorage.getItem('a-l-est-open-trip-v2'))!).state);
 expect(state.journey.title).toBe('Voyage corrigé');expect(state.expenses).toBeUndefined();expect(state.transfers).toHaveLength(1);expect(state.bookings).toHaveLength(1);
 expect(state.documents.some((d: {content:string})=>d.content===raw)).toBe(true);expect(await page.evaluate(key=>localStorage.getItem(key),oldKey)).toBe(oldRaw);
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('a-l-est-trip-v2:')).length)).toBe(2);
 await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
 for(const name of ['Planning — notes non structurées','Planning — fichier IA externe (original personnel non vérifié)']) {
  await page.getByRole('button',{name,exact:true}).click();
  await expect(page.locator('.source-document')).toContainText('TRACKER_SENTINEL');
  await expect(page.locator('.source-document img')).toHaveCount(0);
  expect(await page.evaluate(()=>Object.hasOwn(globalThis,'PWNED'))).toBe(false);
  await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();
 }
 expect(requests).toEqual([]);
});
test('invalid JSON, versions, backup, fields and executable URLs do not overwrite a draft; errors export contains no values',async({page})=>{
 const dialog=await open(page),source=dialog.getByRole('textbox',{name:'Ton programme',exact:true});await source.fill('KEEP PRIVATE ORIGINAL');
 const invalid=structuredClone(COMPLETE_PUBLIC_EXAMPLE) as unknown as Record<string,unknown>;invalid.secret='SENSITIVE VALUE NEVER IN DIAGNOSTICS';
 for(const value of ['{','```json\n{}\n```',JSON.stringify({...MINIMAL_PUBLIC_EXAMPLE,version:9}),JSON.stringify({version:2,scope:'trip'}),JSON.stringify(invalid)]){
  await file(page,value);await expect(dialog.getByRole('alert')).toBeVisible();await expect(source).toHaveValue('KEEP PRIVATE ORIGINAL');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).source,key)).toBe('KEEP PRIVATE ORIGINAL');
 }
 const promise=page.waitForEvent('download');await dialog.getByRole('button',{name:'Télécharger les erreurs sans le planning',exact:true}).click();const diagnostic=await readFile((await (await promise).path())!,'utf8');
 expect(diagnostic).toContain('$.secret');expect(diagnostic).not.toContain('SENSITIVE VALUE');expect(diagnostic).not.toContain('KEEP PRIVATE');
 await file(page,' '.repeat(200_001));await expect(dialog.getByRole('alert')).toContainText('200 000');
 await dialog.locator('.planning-kit summary').click();await dialog.getByRole('button',{name:'Coller un résultat JSON',exact:true}).click();
 await dialog.getByRole('textbox',{name:'Résultat JSON',exact:true}).fill(JSON.stringify(MINIMAL_PUBLIC_EXAMPLE));await dialog.getByRole('button',{name:'Vérifier le JSON collé',exact:true}).click();
 await dialog.getByRole('button',{name:'Remplacer le texte',exact:true}).click();await expect(dialog.getByLabel('Titre du voyage',{exact:true})).toHaveValue(MINIMAL_PUBLIC_EXAMPLE.title);
});
test('structured quota failure and interrupted write remain recoverable through reload',async({page})=>{
 const dialog=await open(page);await file(page,COMPLETE_PUBLIC_EXAMPLE);await dialog.getByRole('button',{name:'Remplacer le texte',exact:true}).click();
 await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('a-l-est-trip-v2:'))throw new DOMException('Synthetic quota','QuotaExceededError');return set.call(this,k,v);};});
 await dialog.getByRole('button',{name:'Créer et ouvrir le carnet',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).source,key)).toBe(JSON.stringify(COMPLETE_PUBLIC_EXAMPLE));
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('a-l-est-trip-v2:')).length)).toBe(0);
 await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Créer et ouvrir le carnet',exact:true}).click();
 await expect(page.getByRole('dialog')).not.toBeVisible();expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('a-l-est-trip-v2:')).length)).toBe(1);
});
for(const [language,trigger,downloadLabel,replace,warning] of [
 ['fr','Créer depuis un planning','Télécharger les consignes pour mon IA','Remplacer le texte','Préparé avec une IA externe'],
 ['en','Create from an itinerary','Download instructions for my AI','Replace the text','Prepared with an external AI'],
 ['zh-CN','从行程创建','下载给我的 AI 的说明','替换文本','由外部 AI 整理'],
 ['es','Crear desde un itinerario','Descargar instrucciones para mi IA','Reemplazar el texto','Preparado con IA externa'],
])test(`downloaded localized kit, keyboard, JSON and 200% reflow: ${language}`,async({page},info)=>{
 await page.setViewportSize({width:320,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(language=>localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'light'})),language);
 await page.goto('/');await page.getByRole('button',{name:trigger,exact:true}).click();const dialog=page.getByRole('dialog');await dialog.locator('.planning-kit summary').click();
 const promise=page.waitForEvent('download');await dialog.getByRole('link',{name:downloadLabel,exact:true}).click();const text=await readFile((await (await promise).path())!,'utf8');
 const examples=[...text.matchAll(/```json\n([\s\S]*?)\n```/g)];expect(examples).toHaveLength(3);readStructuredPlanning(examples[1][1]);readStructuredPlanning(examples[2][1]);
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.evaluate(()=>{document.documentElement.style.zoom='2';});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);}
 await page.evaluate(()=>{document.documentElement.style.zoom='1';});await file(page,MINIMAL_PUBLIC_EXAMPLE);await dialog.getByRole('button',{name:replace,exact:true}).click();
 await expect(dialog.getByText(warning,{exact:false}).first()).toBeVisible();await page.keyboard.press('Tab');expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);
 await page.screenshot({path:info.outputPath(`kit-${language}.png`)});
});
