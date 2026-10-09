import { test, expect, type Page } from '@playwright/test';
import { archive, blankTrip, tripKey } from '../../src/journeys';
import { dateInTimezone } from '../../src/time';
import { MAP_PREFERENCES_KEY } from '../../src/map-preferences';
import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';

function fixture() {
  const trip = blankTrip({ id:'map-choice', title:'Cartes personnelles', countries:['CN'], timezone:'Asia/Shanghai' });
  trip.cities = [{id:'c',name:'Shanghai',chineseName:'上海',subtitle:'',image:'',color:'#547764',notes:[],mapProvider:'amap',coordinates:[31.23,121.47],days:[{id:'d',title:'Aujourd’hui',date:dateInTimezone('Asia/Shanghai'),steps:[{id:'first',title:'Le Bund',chineseName:'外滩',description:'',category:'visit',coordinates:[31.24,121.49]}]}]}];
  trip.stays = [{cityId:'c',name:'Hôtel test',chineseName:'测试旅馆',address:'Adresse factice',checkIn:'',checkOut:'',notes:''}];
  trip.customBonus = [{id:'bonus',cityId:'c',title:'Lieu bonus',description:'',category:'visit'}];
  trip.transfers = [{id:'transfer',fromCityId:'c',toCityId:'c',label:'Train test',mode:'train',fromStation:'Gare départ',toStation:'Gare arrivée',departure:'',arrival:'',reference:'',notes:'',booked:false}];
  return trip;
}
async function settings(page: Page, account = false) {
  await page.getByRole('button',{name:account?'Mon compte':'Connexion',exact:true}).click();
  await page.getByRole('button',{name:'Mon compte et mes sauvegardes',exact:true}).click();
  return page.getByLabel('Application de cartes préférée',{exact:true});
}
async function closeSettings(page: Page) {
  await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('choix personnel : Google par défaut, Amap dans toutes les vues, conservation après rechargement sans modifier le carnet',async({page})=>{
  await page.goto('/'); const raw=JSON.stringify(archive(fixture()));
  await page.evaluate(({raw,key})=>localStorage.setItem(key,raw),{raw,key:tripKey('map-choice')});await page.reload();
  await page.getByRole('button',{name:'Ouvrir Cartes personnelles',exact:true}).click();
  await expect(page.locator('#step-first .map-place-actions a')).toHaveAttribute('href',/^https:\/\/www.google.com/);
  const select = await settings(page); await expect(select).toHaveValue('google');
  await select.selectOption('amap');
  for(const width of [320,390,1440]) {await page.setViewportSize({width,height:1000}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:'test-results/map-preference-390.png'});
  await page.setViewportSize({width:1440,height:1000});await closeSettings(page);
  await expect(page.locator('#step-first .map-place-actions a')).toHaveAttribute('href',/^https:\/\/uri.amap.com/);
  await page.locator('.now-shortcut').click();await expect(page.locator('.now-view .map-place-actions a')).toHaveAttribute('href',/^https:\/\/uri.amap.com/);
  await page.getByRole('button',{name:'Mes outils sur place',exact:true}).click();await expect(page.locator('.practical-actions a')).toHaveAttribute('href',/^https:\/\/uri.amap.com/);
  await page.getByRole('button',{name:/^Mes envies & bonus/}).click();await expect(page.locator('.bonus-card-footer a')).toHaveAttribute('href',/^https:\/\/uri.amap.com/);
  await page.getByRole('button',{name:'Mes transports',exact:true}).click();const stations=page.locator('.transfer-actions a');await expect(stations).toHaveCount(2);for(const link of await stations.all()) await expect(link).toHaveAttribute('href',/^https:\/\/uri.amap.com/);
  await page.reload();await expect(await settings(page)).toHaveValue('amap');
  expect(await page.evaluate(key=>localStorage.getItem(key),tripKey('map-choice'))).toBe(raw);
});

test('préférence entre onglets et sauvegarde refusée : choix actif mais échec annoncé',async({page,context})=>{
  await page.goto('/');const first=await settings(page);const other=await context.newPage();await other.goto('/');const second=await settings(other);
  await second.selectOption('amap');await expect(first).toHaveValue('amap');
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.endsWith(key))throw new DOMException('fixture quota','QuotaExceededError');return original.call(this,k,v);};},MAP_PREFERENCES_KEY);
  await first.selectOption('google');await expect(first).toHaveValue('google');await expect(page.locator('.account-preferences')).toContainText('Ce choix reste actif pour cette session, mais sa sauvegarde est indisponible.');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).provider,MAP_PREFERENCES_KEY)).toBe('amap');
  await page.reload();await expect(await settings(page)).toHaveValue('amap');
});

test('préférences des comptes A et B et du mode local isolées, sans envoi de carnet',async({page,context})=>{
  await context.route('https://*.supabase.co/**',route=>route.fulfill({status:401,json:{message:'fixture unauthenticated'}}));
  await page.goto('/');const accounts=['00000000-0000-4000-8000-000000000051','00000000-0000-4000-8000-000000000052'];
  await page.evaluate(({hint,id})=>localStorage.setItem(hint,JSON.stringify({version:1,id})),{hint:ACCOUNT_HINT_KEY,id:accounts[0]});await page.reload();
  await (await settings(page,true)).selectOption('amap');await closeSettings(page);
  async function switchScope(id:string|null){await page.evaluate(({hint,id})=>{const raw=id?JSON.stringify({version:1,id}):null;if(raw)localStorage.setItem(hint,raw);else localStorage.removeItem(hint);window.dispatchEvent(new StorageEvent('storage',{key:hint,newValue:raw}));},{hint:ACCOUNT_HINT_KEY,id});}
  await switchScope(accounts[1]);await expect(await settings(page,true)).toHaveValue('google');await closeSettings(page);
  await switchScope(accounts[0]);await expect(await settings(page,true)).toHaveValue('amap');await closeSettings(page);
  await switchScope(null);await expect(await settings(page)).toHaveValue('google');
  const stored=await page.evaluate(key=>Object.keys(localStorage).filter(k=>k.endsWith(key)),MAP_PREFERENCES_KEY);expect(stored).toEqual([`detours-account-v1:${accounts[0]}:${MAP_PREFERENCES_KEY}`]);
});
