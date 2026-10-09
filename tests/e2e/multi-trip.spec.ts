import { test, expect, type Page } from '@playwright/test';
import { archive, blankTrip, chinaTrip } from '../../src/journeys';

const errors: string[] = [];
test.beforeEach(async ({ page }) => { errors.length=0; page.on('pageerror', error => errors.push(error.message)); await page.route('https://api.frankfurter.dev/v2/rates?**', route => route.fulfill({ status: 503, json: { message: 'fixture-unavailable' } })); await page.goto('/'); });
test.afterEach(() => expect(errors).toEqual([]));

async function home(page: Page) {
  const menu=page.getByRole('button',{name:'Ouvrir le menu',exact:true});
  if(await menu.isVisible()) await menu.click();
  await page.getByRole('button',{name:'Mes voyages',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mes voyages',exact:true})).toBeVisible();
}
async function create(page: Page,title: string,currency='EUR',timezone='Europe/Paris') {
  await page.getByRole('button',{name:'Créer un voyage',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Titre du voyage',{exact:true}).fill(title);
  await dialog.getByRole('combobox',{name:'Devise de référence',exact:true}).fill(currency);
  await dialog.getByRole('combobox',{name:'Fuseau du voyage',exact:true}).fill(timezone);
  await dialog.getByRole('button',{name:'Créer le carnet',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Ton premier détour',exact:true})).toBeVisible();
}
async function nav(page:Page,label:string) {await page.getByRole('navigation',{name:'Navigation principale',exact:true}).getByRole('button',{name:label,exact:label!=='Mes envies & bonus'}).click();}
async function notes(page:Page,value:string) {await nav(page,'Mon carnet pratique');await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill(value);}
async function activeState(page:Page) {return page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+sessionStorage.getItem('a-l-est-open-trip-v2'))!).state);}

test('installation vierge, voyages vides et première étape sans journée sur mobile',async({page})=>{
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('a-l-est-trip-v2:')))).toHaveLength(0);
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('heading',{name:'Mes voyages',exact:true})).toBeVisible();
  await create(page,'Week-end en France');
  await page.getByRole('button',{name:'Ajouter une étape au voyage',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Ville, région ou lieu de séjour',{exact:true}).fill('Lyon');await dialog.getByRole('button',{name:'Enregistrer la ville',exact:true}).click();
  await expect(page.getByRole('button',{name:'Créer ma première journée',exact:true})).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await home(page);await expect(page.locator('.journey-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Ouvrir Week-end en France',exact:true}).click();await page.reload();
  await expect(page.getByRole('button',{name:'Créer ma première journée',exact:true})).toBeVisible();
});

test('Chine, Japon et France restent isolés après notes, recherche, export et rechargement',async({page})=>{
  await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();await notes(page,'Note Chine');const chinaId=(await activeState(page)).journey.id;
  await home(page);await create(page,'日本 · Japon','JPY','Asia/Tokyo');await notes(page,'京都 · À moi');const japanId=(await activeState(page)).journey.id;
  await page.getByLabel('Rechercher dans le carnet',{exact:true}).fill('Shenzhen');await expect(page.getByRole('heading',{name:'Aucun détour de ce nom',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Fermer',exact:true}).click();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter ma sauvegarde',exact:true}).click();const downloaded=await download;
  const fs=await import('node:fs/promises');const raw=await fs.readFile((await downloaded.path())!,'utf8');expect(raw).not.toContain('Shenzhen');expect(raw).not.toContain('CNY');
  const japan=await activeState(page);expect(japan.phrases).toEqual([]);expect(japan.bonusCatalog).toEqual([]);expect(japan.expenses).toBeUndefined();
  await home(page);await create(page,'France');await notes(page,'Note France');await home(page);
  await page.getByRole('button',{name:'Ouvrir 日本 · Japon',exact:true}).click();await page.reload();await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('京都 · À moi');
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+id)!).state.notes.general,chinaId)).toBe('Note Chine');
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+id)!).state.notes.general,japanId)).toBe('京都 · À moi');
});

test('duplication puis notes, activité, favoris et valise de la copie préservent l’original',async({page})=>{
  const original=chinaTrip();original.notes.general='Original';original.packing=[{id:'item',label:'Passeport',packed:true}];
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'china.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive(original)))});
  const imported=await activeState(page);await home(page);await page.getByRole('button',{name:'Dupliquer',exact:true}).click();await expect(page.locator('.journey-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Ouvrir Chine 2027 — copie',exact:true}).click();await notes(page,'Copie');
  await nav(page,'Mon planning');const firstStep=page.locator('.step-card').first();await firstStep.getByRole('button',{name:/Marquer comme visité/}).click();
  await nav(page,'Mes envies & bonus');await page.locator('.bonus-card').first().getByRole('button',{name:/Ajouter aux favoris/}).click();
  await nav(page,'Mes outils sur place');await page.getByRole('tab',{name:'Dans ma valise',exact:true}).click();await page.getByRole('checkbox',{name:'Passeport',exact:true}).uncheck();
  const copy=await activeState(page);const before=await page.evaluate(id=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+id)!).state,imported.journey.id);
  expect(before.notes.general).toBe('Original');expect(before.done).toEqual([]);expect(before.favorites).toEqual([]);expect(before.packing[0].packed).toBe(true);
  expect(copy.journey.id).not.toBe(before.journey.id);expect(copy.notes.general).toBe('Copie');expect(copy.done).toHaveLength(1);expect(copy.packing[0].packed).toBe(false);
});

test('deux onglets ouverts sur des carnets différents ne partagent aucune écriture',async({page,context})=>{
  await create(page,'Japon','JPY','Asia/Tokyo');await notes(page,'Japon');const japanId=(await activeState(page)).journey.id;await home(page);
  await create(page,'France');await notes(page,'France');const franceId=(await activeState(page)).journey.id;
  const second=await context.newPage();await second.goto('/');await second.getByRole('button',{name:'Ouvrir Japon',exact:true}).click();await notes(second,'京都 dans le deuxième onglet');
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('Lyon dans le premier onglet');await page.reload();await second.reload();
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Lyon dans le premier onglet');await expect(second.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('京都 dans le deuxième onglet');
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+id)!).id,japanId)).toBe(japanId);expect(await activeState(page)).toMatchObject({journey:{id:franceId}});
});

test('écriture en attente du carnet A après ouverture par import du carnet B',async({page})=>{
  await create(page,'A');await nav(page,'Mon carnet pratique');const id=(await activeState(page)).journey.id;
  await page.evaluate(id=>{void navigator.locks.request('a-l-est-trip-v2:'+id,()=>new Promise<void>(resolve=>{(window as unknown as {release:()=>void}).release=resolve;}));},id);
  await page.waitForFunction(()=>(window as unknown as {release?:()=>void}).release);
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('En attente dans A');
  const next=blankTrip({title:'B'});await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'b.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive(next)))});
  await expect(page.getByRole('heading',{name:'B',exact:true})).toBeVisible();
  await page.evaluate(()=>(window as unknown as {release:()=>void}).release());
  await expect.poll(()=>page.evaluate(id=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+id)!).state.notes.general,id)).toBe('En attente dans A');
  expect((await activeState(page)).notes.general).toBeUndefined();
});

test('échec de sauvegarde exportable puis reprise sans perdre la modification précédente',async({page})=>{
  await create(page,'Quota');await nav(page,'Mon carnet pratique');
  await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as unknown as {restoreStorage:()=>void}).restoreStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key.startsWith('a-l-est-trip-v2:'))throw new DOMException('Quota','QuotaExceededError');return original.call(this,key,value);};});
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('Note après quota');await expect(page.getByRole('alert')).toContainText('Sauvegarde locale impossible');
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter ma sauvegarde',exact:true}).click();const fs=await import('node:fs/promises');const exportData=JSON.parse(await fs.readFile((await (await downloading).path())!,'utf8'));expect(exportData.state.notes.general).toBe('Note après quota');
  await page.evaluate(()=>(window as unknown as {restoreStorage:()=>void}).restoreStorage());
  await page.getByRole('textbox',{name:'Adresses, contacts et repères pratiques',exact:true}).fill('Contact après reprise');await expect(page.getByRole('alert')).toHaveCount(0);await page.reload();
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Note après quota');await expect(page.getByRole('textbox',{name:'Adresses, contacts et repères pratiques',exact:true})).toHaveValue('Contact après reprise');
});

test('deux onglets sur le même carnet, brouillon ouvert et changement distant conservé',async({page,context})=>{
  await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();
  await page.getByRole('button',{name:'Modifier le titre de la journée',exact:true}).click();await page.getByRole('dialog').getByLabel('Le thème de cette journée',{exact:true}).fill('Mon titre en cours');
  const second=await context.newPage();await second.goto('/');await second.getByRole('button',{name:'Ouvrir Chine 2027',exact:true}).click();
  await second.getByRole('button',{name:'Modifier Arrivée à Shenzhen',exact:true}).click();await second.getByRole('dialog').getByLabel('Lieu ou activité',{exact:true}).fill('Arrivée modifiée ailleurs');await second.getByRole('dialog').getByRole('button',{name:'Enregistrer l’étape',exact:true}).click();
  await expect.poll(async()=>(await activeState(second)).cities[0].days[0].steps[0].title).toBe('Arrivée modifiée ailleurs');
  await page.getByRole('dialog').getByRole('button',{name:'Enregistrer la journée',exact:true}).click();await page.reload();
  await expect(page.getByRole('heading',{name:'Mon titre en cours',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Arrivée modifiée ailleurs',exact:true})).toBeVisible();
});

test('nouvelle devise de référence préserve le budget et les montants originaux',async({page})=>{
  const initial=blankTrip({title:'Budget',currency:'JPY',timezone:'Asia/Tokyo'});initial.budget=50000;initial.budgetCurrency='JPY';initial.exchangeRates={EUR:160};initial.expenses=[{id:'expense',cityId:'',label:'Repas',amount:1000,currency:'JPY',category:'food'}];
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'budget.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive(initial)))});await home(page);
  await page.getByRole('button',{name:'Modifier le voyage',exact:true}).click();await page.getByRole('dialog').getByRole('combobox',{name:'Devise de référence',exact:true}).fill('EUR');await page.getByRole('dialog').getByRole('button',{name:'Enregistrer',exact:true}).click();await page.getByRole('button',{name:'Ouvrir Budget',exact:true}).click();
  const updated=await activeState(page);expect(updated.budget).toBe(50000);expect(updated.budgetCurrency).toBe('JPY');expect(updated.expenses[0].currency).toBe('JPY');expect(updated.expenses[0].amount).toBe(1000);expect(updated.exchangeRates).toEqual({});
  await nav(page,'Mes outils sur place');await page.getByRole('tab',{name:'Budget',exact:true}).click();await expect(page.getByText(/Total partiel en EUR/)).toBeVisible();await expect(page.getByText(/Taux manquants : JPY/)).toBeVisible();
});

test('document personnel répertorié, conservé et exporté uniquement dans son carnet',async({page})=>{
  await create(page,'Japon');await nav(page,'Mon carnet pratique');
  await page.getByLabel('Choisir un document texte').setInputFiles({name:'Planning Kyoto.md',mimeType:'text/markdown',buffer:Buffer.from('# Kyoto\nMon rendez-vous personnel 京都 à 14 h')});
  await page.getByRole('button',{name:'Planning Kyoto.md',exact:true}).click();await expect(page.getByRole('dialog').getByRole('heading',{name:'Kyoto',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await page.reload();await expect(page.getByRole('button',{name:'Planning Kyoto.md',exact:true})).toBeVisible();
  expect((await activeState(page)).documents[0].content).toContain('京都 à 14 h');
  await home(page);await create(page,'France');await nav(page,'Mon carnet pratique');await expect(page.getByRole('button',{name:'Planning Kyoto.md',exact:true})).toHaveCount(0);expect((await activeState(page)).documents).toBeUndefined();
});
