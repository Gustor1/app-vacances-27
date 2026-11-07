import { test, expect } from '@playwright/test';
import { blankTrip, archive } from '../../src/journeys';
import { mkdir } from 'node:fs/promises';
const evidence='docs/development/compteur-voyage/captures';
const seed=(id='timing',start='2026-05-15',end='2026-05-17')=>{const trip=blankTrip({title:id==='timing'?'Un printemps en Chine':'Un autre détour',timezone:'Asia/Shanghai'});trip.journey!.id=id;trip.journey!.status='planning';trip.departureDate=start;trip.journey!.endDate=end;return archive(trip);};
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-04-03T04:00:00Z')});await page.addInitScript(trips=>{if(!localStorage.getItem('timing-seeded')){for(const trip of trips)localStorage.setItem('a-l-est-trip-v2:'+trip.id,JSON.stringify(trip));localStorage.setItem('timing-seeded','yes');localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language:'fr',theme:'light'}));}},[seed(),seed('other','2026-08-01','2026-08-03')]);await page.goto('/');});
test('three phases render on mobile and desktop, actions open existing views',async({page})=>{
 await mkdir(evidence,{recursive:true});
 for(const [phase,time,action,view] of [['avant','2026-04-03T04:00:00Z','Préparer mon voyage','planning'],['pendant','2026-05-16T04:00:00Z','Voir ma journée','now'],['apres','2026-08-04T04:00:00Z','Revoir mes souvenirs','overview']]){
  await page.clock.setSystemTime(new Date(time));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  const card=page.locator('.trip-timing');await expect(card).toBeVisible();
  for(const [name,width] of [['desktop',1280],['mobile',390]]){await page.setViewportSize({width:width as number,height:900});await page.screenshot({path:`${evidence}/${phase}-${name}.png`,fullPage:true});}
  await card.getByRole('button',{name:action as string}).click();await expect(page.locator('.trip-timing-reminder')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('a-l-est-navigation-v2:')).map(k=>JSON.parse(sessionStorage.getItem(k)!).view))).toContain(view);
  await page.evaluate(()=>sessionStorage.setItem('a-l-est-open-trip-v2',''));await page.reload();
 }
});
test('manual selection, filter reset, date edit and midnight/visibility refresh',async({page})=>{
 const card=page.locator('.trip-timing');await expect(card).toContainText('J−42');
 await card.getByRole('combobox').selectOption('other');await expect(card).toContainText('Un autre détour');
 await page.locator('.journeys-filters select').first().selectOption('completed');await expect(card).toHaveCount(0);
 await page.locator('.journeys-filters select').first().selectOption('all');await expect(card).toContainText('Un printemps en Chine');
 await page.evaluate(()=>{const key='a-l-est-trip-v2:timing',v=JSON.parse(localStorage.getItem(key)!);v.state.departureDate='2026-04-04';localStorage.setItem(key,JSON.stringify(v));window.dispatchEvent(new Event('detours-storage'));});
 await expect(card).toContainText('Départ demain');
 await page.clock.setSystemTime(new Date('2026-04-03T16:01:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(card).toContainText('C’est le jour du départ !');
});
test('four languages, dark mode, 320px, keyboard and offline loaded journal',async({page,context})=>{
 for(const language of ['fr','en','zh-CN','es']){await page.evaluate(language=>localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'dark'})),language);await page.reload();await page.setViewportSize({width:320,height:900});await expect(page.locator('.trip-timing')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`${evidence}/sombre-320-${language}.png`,fullPage:true});}
 await page.locator('.trip-timing select').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.locator('.trip-timing button').click();await expect(page.locator('.trip-timing-reminder')).toBeVisible();await page.locator('.journey-back').evaluate((el: HTMLButtonElement)=>el.click());await expect(page.locator('.trip-timing')).toBeVisible();
 await context.setOffline(true);await page.locator('.trip-timing button').click();await expect(page.locator('.trip-timing-reminder')).toBeVisible();await context.setOffline(false);
});
