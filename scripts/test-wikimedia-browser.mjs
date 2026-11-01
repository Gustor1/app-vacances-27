import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { archive, blankTrip, tripKey } from '../src/journeys.ts';
if(process.env.DETOURS_ALLOW_NETWORK!=='1'){console.log('NON EXÉCUTÉ : DETOURS_ALLOW_NETWORK=1 requis.');process.exit(2);}
const trip=blankTrip({title:'Public live Wikidata test'});trip.cities=[{id:'public-city',name:'Paris',chineseName:'',subtitle:'',color:'#657c50',image:'',notes:[],days:[{id:'public-day',title:'Visit',steps:[{id:'public-step',title:'Tour Eiffel',description:'',category:'visit'}]}]}];
const server=await productionTestServer();server.update();const browser=await chromium.launch(chromiumTestOptions());const requests=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:900}});page.on('requestfailed',r=>{if(/wikimedia|wikidata/.test(r.url()))errors.push({url:r.url(),error:r.failure()?.errorText});});page.on('response',r=>{if(/wikimedia|wikidata/.test(r.url()))requests.push({url:r.url(),status:r.status()});});
 await page.goto(server.url);await page.evaluate(({raw,key})=>localStorage.setItem(key,raw),{raw:JSON.stringify(archive(trip)),key:tripKey(trip.journey.id)});await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();await page.getByRole('button',{name:'Compléter ce lieu',exact:true}).click();await page.getByRole('button',{name:'Rechercher sur Wikidata',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Q243/}).click({timeout:45000});await expect(page.getByRole('dialog').getByLabel('Coordonnées acceptées',{exact:true})).toBeVisible({timeout:45000});
 await mkdir('docs/development/lot-04-lieux',{recursive:true});await page.screenshot({path:'docs/development/lot-04-lieux/live-browser.png'});await writeFile('docs/development/lot-04-lieux/browser-network.json',JSON.stringify({date:new Date().toISOString(),passed:true,realBrowserCORS:true,requests,errors,accepted:false,personalDataUsed:false},null,2));console.log('Real browser CORS and public entity comparison passed. No values accepted.');
}catch(error){await writeFile('docs/development/lot-04-lieux/browser-network.json',JSON.stringify({date:new Date().toISOString(),passed:false,requests,errors,error:String(error)},null,2));throw error;}finally{await browser.close();await server.close();}
