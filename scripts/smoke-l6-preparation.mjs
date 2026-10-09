import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { productionTestServer } from './production-server.mjs';
import { chromiumTestOptions } from './browser-test-options.ts';
import { raw,trip } from './l6-fixture.mjs';
const server=await productionTestServer();server.update();const browser=await chromium.launch(chromiumTestOptions());
try{
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url);await page.evaluate(raw=>localStorage.setItem('a-l-est-trip-v2:l6-demo',raw),raw);await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey.title,exact:true}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
 await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Mon planning',exact:true}).click();await context.setOffline(true);
 await page.locator('.day-preparation summary').click();await page.getByRole('button',{name:'Comparer Plan pluie',exact:true}).click();await page.getByRole('button',{name:'Adopter cette alternative',exact:true}).click();
 await expect(page.locator('.timeline .step-card')).toHaveCount(1);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:l6-demo')).state.cities[0].days[0].preparation.activeAlternativeId==='urban-alternative');await page.reload();await expect(page.locator('.timeline .step-card')).toHaveCount(1);
 await page.locator('.day-preparation summary').click();await expect(page.locator('.day-preparation')).toContainText('Le billet reste confirmé');
 await mkdir('docs/development/screenshots',{recursive:true});await page.screenshot({path:'docs/development/screenshots/l6-alternative-offline-390.png',fullPage:true});
 await page.getByRole('button',{name:'Revenir au plan initial',exact:true}).click();await expect(page.locator('.timeline .step-card')).toHaveCount(3);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:l6-demo')).state);assert.deepEqual(persisted.bookings,trip.bookings);assert.deepEqual(persisted.expenses,trip.expenses);assert.deepEqual(errors,[]);
 console.log('L6 compiled offline passed: compare/adopt, reload, booked activity warning, original restored, reservations/expenses preserved, reduced motion, no runtime errors.');
}finally{await browser.close();await server.close();}
