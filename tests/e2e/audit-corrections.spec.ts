import { test, expect } from '@playwright/test';
import { archive, chinaTrip, tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';

for (const language of ['fr','en','zh-CN','es'] as Language[]) {
  test(`work views wrap and local map names remain readable: ${language}`, async ({ page }, info) => {
    const trip=chinaTrip(undefined,'audit-responsive');
    await page.addInitScript(({key,raw,language})=>{
      if(!localStorage.getItem(key)) localStorage.setItem(key,raw);
      localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'light'}));
      sessionStorage.setItem('a-l-est-open-trip-v2','audit-responsive');
    },{key:tripKey(trip.journey!.id),raw:JSON.stringify(archive(trip)),language});
    await page.goto('/');
    await page.locator('.day-panel').waitFor();
    for(const width of [320,390,761,768,820,1024,1440]) {
      await page.setViewportSize({width,height:1024});
      for(const view of ['Mon carnet pratique','Mes outils sur place']) {
        if(width<=760) await page.getByRole('button',{name:translate('Ouvrir le menu',language),exact:true}).click();
        await page.locator('.sidebar').getByRole('button',{name:translate(view,language),exact:true}).click();
        await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        const actions=page.locator('.intro-actions');
        expect(await actions.evaluate(e=>Array.from(e.querySelectorAll('button')).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}))).toBe(true);
        if(width===768) await page.screenshot({path:info.outputPath(`${language}-${view==='Mon carnet pratique'?'notebook':'tools'}-768.png`)});
      }
    }
  });
}

test('compact import explains grouped titles, persists review and exposes details by keyboard',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  const dialog=page.getByRole('dialog');
  const source='ville: Toulouse\nj1 matin: capitole / aprem: jardin japonais / soir: canal du midi\nj2: couvent des jacobins + musée saint raymond';
  await dialog.getByLabel('Ton programme',{exact:true}).fill(source);
  await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
  await expect(dialog.locator('.planning-summary').first()).toHaveText('2 journées · 1 proposition · 2 passages à vérifier');
  await expect(page.locator('.floating-mascot')).toBeHidden();
  const details=dialog.locator('.planning-item-details');
  await expect(details).not.toHaveAttribute('open');
  const visible=await dialog.locator('input,select,textarea').evaluateAll(es=>es.filter(e=>e.getClientRects().length).length);
  expect(visible).toBeLessThan(25);
  await details.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open','');
  await dialog.locator('.planning-passages > details > summary').first().click();
  await dialog.getByRole('button',{name:'J’ai vérifié ce regroupement',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  await expect(dialog.locator('.planning-summary').first()).toHaveText('2 journées · 1 proposition · 1 passage à vérifier');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('detours-planning-draft-v1')!).source)).toBe(source);
});

test('native Chromium touch completes the mascot drag and leaves page scrolling available',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');
  await page.locator('.mascot-sprite[data-ready="true"]').waitFor();
  const pet=page.locator('.floating-mascot'), button=pet.locator('button');
  const before=(await pet.boundingBox())!;
  expect(await button.evaluate(e=>getComputedStyle(e).touchAction)).toBe('none');
  expect(await page.locator('.journeys-topbar button').evaluateAll((es,r)=>es.every(e=>{const b=e.getBoundingClientRect();return b.right<=r.x||b.left>=r.x+r.width||b.bottom<=r.y||b.top>=r.y+r.height;}),before)).toBe(true);
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:before.x+before.width*.5,y:before.y+before.height*.7}]});
  for(let i=1;i<=10;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:before.x+before.width*.5-i*10,y:before.y+before.height*.7+i*18}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect((await pet.boundingBox())!.x).toBeLessThan(before.x-70);
  const saved=await page.evaluate(()=>localStorage.getItem('detours-mascot-position-v1'));
  expect(saved).not.toBeNull();
  await button.focus();await page.keyboard.press('Shift+ArrowLeft');
  expect(await page.evaluate(()=>localStorage.getItem('detours-mascot-position-v1'))).not.toBe(saved);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:100,y:700}]});
  for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:700-i*40}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(50);
  await context.close();
});

test('indicative centre and numbered places have names and keyboard popups',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();
  const marker=page.getByRole('button',{name:'Shenzhen · centre indicatif',exact:true});
  await expect(marker).toBeVisible();await marker.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.leaflet-popup-content')).toContainText('Shenzhen · centre indicatif');
  await page.keyboard.press('Escape');await expect(page.locator('.leaflet-popup')).toHaveCount(0);
  await page.locator('.sidebar').getByRole('button',{name:'La carte du voyage',exact:true}).click();
  const city=page.getByRole('button',{name:'1. Shenzhen · 深圳',exact:true});
  await expect(city).toBeVisible();await city.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.leaflet-popup-content')).toContainText('Shenzhen');
});
