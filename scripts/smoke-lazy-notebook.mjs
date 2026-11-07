import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { archive, chinaTrip, tripKey } from '../src/journeys.ts';

const server=await productionTestServer();server.update();
const browser=await chromium.launch(chromiumTestOptions());
try {
  const context=await browser.newContext();
  await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.url);
  const trip=chinaTrip(undefined,'unopened-offline');
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:tripKey(trip.journey.id),raw:JSON.stringify(archive(trip))});
  await page.reload();
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/\/App-.*\.js/.test(r.name))),false);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
  await expect(page.locator('.day-panel')).toBeVisible();
  await page.getByRole('button',{name:'Mes voyages',exact:true}).click();
  await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  await page.getByLabel('Ton programme',{exact:true}).fill('# Escale hors ligne\nVille: Arles\nJour 1\n- Musée');
  await page.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
  await expect(page.locator('.planning-item')).toHaveCount(1);
  await page.getByLabel('Devise de référence',{exact:true}).fill('EUR');
  await page.getByLabel('Fuseau du voyage',{exact:true}).fill('Europe/Paris');
  await page.getByRole('button',{name:'Créer et ouvrir le carnet',exact:true}).click();
  await expect(page.locator('.day-panel')).toContainText('Musée');
  assert.deepEqual(errors,[]);
  console.log('First notebook opening and first local planning import succeed offline with previously unopened chunks; zero runtime errors.');
}finally{await browser.close();await server.close();}
