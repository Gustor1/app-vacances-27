import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { archive, blankTrip, tripKey, parseTrip } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';
import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';

const trip = blankTrip({title:'Places fixture'});
trip.cities=[{id:'paris',name:'Paris',chineseName:'',subtitle:'',color:'#657c50',image:'',notes:[],days:[{id:'d1',title:'Public visit',steps:[{id:'s1',title:'My Eiffel title',chineseName:'Personal correction',description:'PRIVATE_SENTINEL',category:'visit',coordinates:[1,2]},{id:'s2',title:'Other activity',description:'',category:'visit'}]}]}];
const raw=JSON.stringify(archive(trip)),key=tripKey(trip.journey!.id);
const claim=(value:unknown)=>[{rank:'normal',mainsnak:{datavalue:{value}}}];
const entity={entities:{Q243:{id:'Q243',labels:{fr:{value:'tour Eiffel'},en:{value:'Eiffel Tower'},zh:{value:'埃菲尔铁塔'},es:{value:'Torre Eiffel'}},descriptions:{fr:{value:'Paris monument'}},claims:{P1705:claim({text:'Tour Eiffel',language:'fr'}),P625:claim({latitude:48.8584,longitude:2.2945,globe:'http://www.wikidata.org/entity/Q2'}),P856:claim('https://www.toureiffel.paris/'),P18:claim('Example.jpg')}}}};
const photo={query:{pages:{1:{imageinfo:[{thumburl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/640px-Example.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Example.jpg',mime:'image/jpeg',thumbwidth:640,thumbheight:480,extmetadata:{Artist:{value:'<b>Test Author</b>'},LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}}}]}}}};
async function seed(page:Page,language:Language='fr',theme='light'){
 await page.goto('/');await page.evaluate(({raw,key,language,theme})=>{localStorage.setItem(key,raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme}));},{raw,key,language,theme});await page.reload();await page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:'Places fixture'}),exact:true}).click();
}
async function mocks(page:Page){
 const requests:string[]=[];await page.route('https://www.wikidata.org/w/api.php?**',async route=>{requests.push(route.request().url());const params=new URL(route.request().url()).searchParams;await route.fulfill({json:params.get('action')==='wbsearchentities'?{search:[{id:'Q243',label:'Eiffel Tower',description:'Paris monument'},{id:'Q123',label:'Eiffel Tower',description:'Replica in another city'}]}:entity});});
 await page.route('https://commons.wikimedia.org/w/api.php?**',route=>route.fulfill({json:photo}));return requests;
}
test('explicit candidate/field confirmation, original correction, remote credits, export/restore and offline removal',async({page,context})=>{
 test.setTimeout(60000);
 await page.route('https://thumb.wikimedia.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 const requests=await mocks(page);await seed(page);expect(requests).toEqual([]);
 await page.locator('#step-s1').getByRole('button',{name:'Compléter ce lieu',exact:true}).click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Nom du lieu ou identifiant Q',{exact:true}).fill('Eiffel');await dialog.getByLabel('Pays (facultatif)',{exact:true}).fill('France');await dialog.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();
 await expect(dialog.getByRole('button',{name:/Q123/})).toContainText('Replica');await dialog.getByRole('button',{name:/Q243/}).click();
 await expect(dialog.getByText('48.8584, 2.2945',{exact:false})).toBeVisible();expect(await dialog.locator('input:checked').count()).toBe(0);expect(await dialog.locator('img').count()).toBe(0);
 await dialog.getByRole('button',{name:'Afficher la photo distante',exact:true}).click();await expect.poll(()=>dialog.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await dialog.getByLabel('Coordonnées acceptées',{exact:true}).check();await dialog.getByLabel('Photo du lieu',{exact:true}).check();await dialog.getByRole('button',{name:'Confirmer ce lieu et les valeurs cochées',exact:true}).click();await expect(dialog).not.toBeVisible();
 await expect.poll(async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.cities[0].days[0].steps[0].place,key)).toMatchObject({qid:'Q243',values:{coordinates:[48.8584,2.2945],photo:{author:'Test Author'}}});
 let state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,key);expect(state.cities[0].days[0].steps[0].title).toBe('My Eiffel title');expect(state.cities[0].days[0].steps[0].chineseName).toBe('Personal correction');expect(state.cities[0].days[0].steps[0].coordinates).toEqual([1,2]);
 await expect(page.locator('#step-s1 .place-summary')).toContainText('Test Author');await expect(page.locator('#step-s1 .place-summary a').filter({hasText:'CC BY-SA 4.0'})).toHaveAttribute('href','https://creativecommons.org/licenses/by-sa/4.0/');
 // Personal form edits preserve the overlay, and clearing coordinates still works.
 await page.getByRole('button',{name:'Modifier My Eiffel title',exact:true}).click();await page.getByLabel('Lieu ou activité',{exact:true}).fill('My edited title');await page.getByRole('button',{name:'Enregistrer l’étape',exact:true}).click();await page.reload();await expect(page.locator('#step-s1 .place-summary')).toContainText('Q243');
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();const exported=await readFile((await (await promise).path())!,'utf8');const restored=parseTrip(exported);expect(restored.state.cities[0].days[0].steps[0].place?.values.photo?.author).toBe('Test Author');
 await context.setOffline(true);await expect(page.locator('#step-s1')).toContainText('My edited title');await page.locator('#step-s1').getByRole('button',{name:'Retirer l’association',exact:true}).click();await expect(page.locator('#step-s1 .place-summary')).toHaveCount(0);state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,key);expect(state.cities[0].days[0].steps[0].coordinates).toEqual([1,2]);
 expect(requests.join(' ')).not.toContain('PRIVATE_SENTINEL');expect(requests.join(' ')).not.toContain('Personal');
});

for(const language of ['fr','en','zh-CN','es'] as Language[])test('places '+language+' keyboard, reduced motion, 320px and 200% zoom',async({page})=>{
 const t=(key:string)=>translate(key,language);await mocks(page);await page.emulateMedia({reducedMotion:'reduce'});await seed(page,language,language==='en'?'dark':'light');
 const trigger=page.locator('#step-s1').getByRole('button',{name:t('Compléter ce lieu'),exact:true});await trigger.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:t('Rechercher sur Wikidata'),exact:true}).click();await dialog.getByRole('button',{name:/Q243/}).click();await expect(dialog.getByText(t('Coche uniquement les valeurs à accepter. Aucun champ n’est sélectionné automatiquement.'))).toBeVisible();
 for(const width of [320,375,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);}
 await page.setViewportSize({width:844,height:390});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.evaluate(()=>document.documentElement.style.zoom='1');
 await mkdir('docs/development/lot-04-lieux/screenshots',{recursive:true});await page.screenshot({path:`docs/development/lot-04-lieux/screenshots/${language}-390.png`});
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
});

test('empty, malformed, 429, cancellation and late response after switching activity',async({page})=>{
 await seed(page);let mode='empty';let finish:()=>void=()=>{};
 await page.route('https://www.wikidata.org/w/api.php?**',async route=>{
  if(mode==='late'){await new Promise<void>(resolve=>{finish=resolve;});await route.fulfill({json:{search:[{id:'Q243',label:'Late result'}]}}).catch(()=>{});return;}
  await route.fulfill(mode==='rate'?{status:429,headers:{'Retry-After':'120'},body:''}:mode==='bad'?{body:'{'}:{json:{search:[]}});
 });
 const open=()=>page.locator('#step-s1').getByRole('button',{name:'Compléter ce lieu',exact:true}).click();await open();let dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect(dialog.getByText('Aucun résultat. Modifie les termes de recherche.',{exact:true})).toBeVisible();
 mode='bad';await dialog.getByLabel('Nom du lieu ou identifiant Q').fill('Different');await dialog.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();
 mode='late';await dialog.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect(dialog.getByRole('status')).toBeVisible();await dialog.getByRole('button',{name:'Annuler',exact:true}).click();await dialog.getByRole('button',{name:'Fermer',exact:true}).click();await page.locator('#step-s2').getByRole('button',{name:'Compléter ce lieu',exact:true}).click();finish();dialog=page.getByRole('dialog');await expect(dialog).not.toContainText('Late result');await dialog.getByRole('button',{name:'Fermer',exact:true}).click();
 mode='rate';await open();dialog=page.getByRole('dialog');await dialog.getByLabel('Nom du lieu ou identifiant Q').fill('Rate test');await dialog.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('patienter');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.cities[0].days[0].steps.some((s:{place?:unknown})=>s.place),key)).toBe(false);
});

test('a late entity response cannot associate a different notebook',async({page})=>{
 await seed(page);const other=structuredClone(trip);other.journey!.id='other-place-trip';other.journey!.title='Other place notebook';await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:tripKey(other.journey!.id),raw:JSON.stringify(archive(other))});
 let release:()=>void=()=>{};let started=false;
 await page.route('https://www.wikidata.org/w/api.php?**',async route=>{started=true;await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({json:entity}).catch(()=>{});});
 await page.locator('#step-s1').getByRole('button',{name:'Compléter ce lieu',exact:true}).click();await page.getByLabel('Nom du lieu ou identifiant Q').fill('Q243');await page.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await expect.poll(()=>started).toBe(true);await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Mes voyages',exact:true}).click();await page.getByRole('button',{name:'Ouvrir Other place notebook',exact:true}).click();release();await expect(page.locator('.place-summary')).toHaveCount(0);
 for(const id of [trip.journey!.id,other.journey!.id])expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.cities[0].days[0].steps.some((s:{place?:unknown})=>s.place),tripKey(id))).toBe(false);
});

for(const role of ['reader','editor'] as const)test('places account '+role+' respects role and keeps associations personal',async({page,context})=>{
 await context.route('https://*.supabase.co/**',route=>route.fulfill({status:401,json:{message:'fixture unauthenticated'}}));await page.goto('/');
 const id='00000000-0000-4000-8000-000000000064';await page.evaluate(({id,key,raw,hint,role})=>{localStorage.setItem(hint,JSON.stringify({version:1,id}));localStorage.setItem('detours-account-v1:'+id+':'+key,JSON.stringify({version:1,raw,base:null,revision:1,privateRevision:0,pending:false,operation:'fixture',role}));},{id,key,raw,hint:ACCOUNT_HINT_KEY,role});await page.reload();await page.getByRole('button',{name:'Ouvrir Places fixture',exact:true}).click();
 const button=page.locator('#step-s1').getByRole('button',{name:'Compléter ce lieu',exact:true});if(role==='reader'){await expect(button).toBeDisabled();const record=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),`detours-account-v1:${id}:${key}`);expect(record.raw).toBe(raw);expect(record.pending).toBe(false);}else{await mocks(page);await button.click();await expect(page.getByRole('dialog')).toContainText('Elles ne sont pas envoyées');await page.getByLabel('Nom du lieu ou identifiant Q').fill('Q243');await page.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await page.getByLabel('Site officiel',{exact:true}).check();await page.getByRole('button',{name:'Confirmer ce lieu et les valeurs cochées',exact:true}).click();await expect(page.locator('#step-s1 .place-summary')).toContainText('Q243');}
});
