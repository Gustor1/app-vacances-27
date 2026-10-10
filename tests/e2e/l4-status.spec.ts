import { test, expect } from '@playwright/test';
import { archive, blankTrip, tripKey } from '../../src/journeys';
import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';

test('compte sans session : file conservée, changement de compte isolé et échec local explicite', async ({ page, context }) => {
  await context.route('https://*.supabase.co/**', route => route.fulfill({ status: 401, json: { message: 'fixture unauthenticated' } }));
  await page.goto('/');
  const ids = ['00000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000042'];
  const trips = ids.map((id,index) => {
    const trip = blankTrip({ id:'l4-same-trip', title:`Carnet privé ${index ? 'B' : 'A'}` });
    trip.notes.general = `Note privée ${index ? 'B' : 'A'}`;
    return { account:id, record:{version:1,raw:JSON.stringify(archive(trip)),base:null,revision:0,privateRevision:0,pending:true,operation:'l4-fixture',role:'owner'} };
  });
  await page.evaluate(({trips,hintKey,key}) => {
    for(const trip of trips) localStorage.setItem(`detours-account-v1:${trip.account}:${key}`,JSON.stringify(trip.record));
    localStorage.setItem(hintKey,JSON.stringify({version:1,id:trips[0].account,email:'a@example.invalid'}));
  },{trips,hintKey:ACCOUNT_HINT_KEY,key:tripKey('l4-same-trip')});
  await page.reload();
  await page.getByRole('button',{name:'Ouvrir Carnet privé A',exact:true}).click();
  await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Note privée A');
  await page.locator('.trip-menu-actions').getByRole('button',{name:'Synchronisation',exact:true}).click();
  await expect(page.locator('.trip-sync-panel .sync-state')).toHaveText(/En attente d’envoi/);
  await expect(page.locator('.trip-sync-panel .sync-state')).not.toHaveText(/cours/);
  await page.keyboard.press('Escape');
  await page.evaluate(({id,hintKey}) => {
    const raw=JSON.stringify({version:1,id,email:'b@example.invalid'});localStorage.setItem(hintKey,raw);
    window.dispatchEvent(new StorageEvent('storage',{key:hintKey,newValue:raw}));
  },{id:ids[1],hintKey:ACCOUNT_HINT_KEY});
  await expect(page.getByRole('button',{name:'Ouvrir Carnet privé B',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ouvrir Carnet privé A',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Ouvrir Carnet privé B',exact:true}).click();
  await page.getByRole('button',{name:'Mon carnet pratique',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Notes personnelles',exact:true})).toHaveValue('Note privée B');
  await page.evaluate(() => {
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key.includes('a-l-est-trip-v2:'))throw new DOMException('fixture quota','QuotaExceededError');return original.call(this,key,value);};
  });
  await page.getByRole('textbox',{name:'Notes personnelles',exact:true}).fill('Travail non enregistré');
  await expect(page.locator('.trip-sync-row [role=status]')).toHaveText(/Enregistrement local impossible/);
  const records = await page.evaluate(key => Object.keys(localStorage).filter(k => k.endsWith(key)).map(k => JSON.parse(localStorage.getItem(k)!)),tripKey('l4-same-trip'));
  expect(records.map(r=>JSON.parse(r.raw).state.notes.general).sort()).toEqual(['Note privée A','Note privée B']);
  expect(records.every(r=>r.pending)).toBe(true);
});
