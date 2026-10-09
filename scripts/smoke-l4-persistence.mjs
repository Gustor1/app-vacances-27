import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';
import { productionTestServer } from './production-server.mjs';
import { raw, trip } from './l4-fixture.mjs';
const server=await productionTestServer();server.update();
const profile=await mkdtemp(join(tmpdir(),'detours-l4-disk-'));
let context;
const openNotebook=async page=>{
  await page.getByRole('button',{name:`Ouvrir ${trip.journey.title}`,exact:true}).click();
  await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
};
try {
  context=await chromium.launchPersistentContext(profile,{...chromiumTestOptions(),reducedMotion:'reduce'});
  let page=await context.newPage();await page.goto(server.url);
  await page.evaluate(raw=>localStorage.setItem('a-l-est-trip-v2:l4-terrain-20261008',raw),raw);
  await page.reload();await openNotebook(page);
  await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('PC-L4-1 après fermeture complète');
  await expect(page.locator('.local-status')).toHaveText('Carnet sauvegardé sur cet appareil');
  await context.close();context=null;
  context=await chromium.launchPersistentContext(profile,{...chromiumTestOptions(),offline:true,reducedMotion:'reduce'});
  page=await context.newPage();await page.goto(server.url);await openNotebook(page);
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('PC-L4-1 après fermeture complète');
  await expect(page.getByRole('button',{name:'Document factice L4',exact:true})).toBeVisible();
  await expect(page.locator('.offline-status')).toHaveClass(/offline-ready/);
  await context.setOffline(false);await page.reload();
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('PC-L4-1 après fermeture complète');
  console.log(`L4 disk-profile persistence passed: installed Chrome fully closed, reopened offline, note/document/cache preserved, reconnected. Isolated profile: ${profile}. Network emulation; no real-account or iPhone proof.`);
} finally {if(context)await context.close();await server.close();}
