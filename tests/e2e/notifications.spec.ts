import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import { dateInTimezone } from '../../src/time';
import { shiftDate, notificationKey } from '../../src/notifications';
import { notificationCopy } from '../../src/notification-copy';
import type { Language } from '../../src/locale-utils';

for (const language of ['fr','en','es','zh-CN'] as Language[]) test(`Récaps ${language} : lecture, préférences, clavier, météo explicite et hors ligne`, async ({page,context}) => {
  const today=dateInTimezone('Asia/Shanghai'),tomorrow=shiftDate(today,1);
  const state=blankTrip({id:'notifications-test',title:'Carnet récaps',timezone:'Asia/Shanghai'});
  state.cities=[{id:'city',name:'Shanghai',chineseName:'上海',subtitle:'',image:'',color:'#547764',notes:[],coordinates:[31.23,121.47],days:[
    {id:'today',title:'Programme du jour',date:today,steps:[{id:'walk',title:'Balade 中文',description:'',category:'walk'}]},
    {id:'tomorrow',title:'Programme du lendemain',date:tomorrow,steps:[{id:'museum',title:'Musée demain',description:'',category:'visit'}],preparation:{timings:{museum:{startTime:'10:00',durationMinutes:60}}}},
  ]}];
  let weatherCalls=0;
  await page.route('https://api.open-meteo.com/**',async route=>{
    weatherCalls++;const date=new URL(route.request().url()).searchParams.get('start_date');
    await route.fulfill({json:{daily:{time:[date],temperature_2m_min:[18],temperature_2m_max:[25],precipitation_probability_max:[60],uv_index_max:[4]}}});
  });
  await page.goto('/');
  await page.evaluate(({raw,language})=>{localStorage.setItem('a-l-est-trip-v2:notifications-test',raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'dark'}));}, {raw:JSON.stringify(archive(state)),language});
  await page.goto('/?trip=notifications-test');
  const c=(key:Parameters<typeof notificationCopy>[1])=>notificationCopy(language,key);
  const trigger=page.getByRole('button',{name:c('title'),exact:true});
  await expect(trigger).toBeVisible();await expect(trigger.locator('.recap-unread')).toBeVisible();
  await trigger.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('Carnet récaps');
  await dialog.getByRole('button',{name:new RegExp(c('today'))}).click();
  await expect(dialog).toContainText('Balade 中文');
  expect(weatherCalls).toBe(0);
  await dialog.getByRole('button',{name:new RegExp(c('tomorrow'))}).click();
  await expect(dialog).toContainText('10:00 Musée demain');
  await expect(dialog).toContainText('Asia/Shanghai');
  await dialog.getByRole('button',{name:c('settings'),exact:true}).click();
  await dialog.getByText(c('advanced'),{exact:true}).click();
  await expect(dialog.getByRole('switch',{name:c('phoneChannel'),exact:true})).toBeDisabled();
  await expect(dialog.getByRole('switch',{name:c('emailChannel'),exact:true})).toBeDisabled();
  await dialog.getByLabel(c('offsets'),{exact:true}).fill('1440, 30, 15, 30');
  await dialog.getByLabel(c('quantity'),{exact:true}).fill('1');await dialog.getByLabel(c('unit'),{exact:true}).selectOption('60');await dialog.getByRole('button',{name:c('addDelay'),exact:true}).click();
  await dialog.getByRole('button',{name:c('save'),exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText(c('saved'));
  const preference=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),notificationKey(state.journey!.id));
  expect(preference.offsets).toEqual([15,30,60,1440]);expect(preference.email).toBe(false);
  await dialog.getByRole('button',{name:c('backRecaps'),exact:true}).click();
  await dialog.getByRole('button',{name:c('weatherLoad'),exact:true}).click();
  await expect(dialog).toContainText('18–25');expect(weatherCalls).toBe(2);
  for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  }
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
  await expect(trigger.locator('.recap-unread')).toHaveCount(0);
  await context.setOffline(true);await trigger.click();
  await dialog.getByRole('button',{name:new RegExp(c('tomorrow'))}).click();await expect(dialog).toContainText('18–25');
  await dialog.getByRole('button',{name:c('day'),exact:true}).click();
  await expect(page.getByRole('heading',{name:'Programme du lendemain',exact:true})).toBeVisible();
  await context.setOffline(false);
});

test('rappel personnel directement sur activité future et transport sans date, sans modifier le carnet',async({page})=>{
  const date=shiftDate(dateInTimezone('Asia/Shanghai'),10),state=blankTrip({id:'future-reminder',title:'Rappels futurs',timezone:'Asia/Shanghai'});
  state.cities=[{id:'city',name:'Ville',chineseName:'',subtitle:'',image:'',color:'#547764',notes:[],days:[{id:'future',title:'Journée future',date,steps:[{id:'hotel',title:'Hôtel futur',category:'hotel',description:''}],preparation:{timings:{hotel:{startTime:'18:00'}}}}]}];
  state.transfers=[{id:'undated-transfer',fromCityId:'city',toCityId:'city',label:'Train à préciser',mode:'train',departure:'',arrival:'',fromStation:'Gare',toStation:'',booked:false,notes:'',reference:''}];
  await page.goto('/');await page.evaluate(raw=>localStorage.setItem('a-l-est-trip-v2:future-reminder',raw),JSON.stringify(archive(state)));await page.goto('/?trip=future-reminder');
  const saved=await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:future-reminder'));
  const trigger=page.getByRole('button',{name:'Mon rappel · Hôtel futur',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Mon rappel',exact:true});await expect(dialog).toContainText(`${date} · 18:00`);
  await dialog.getByLabel('Mon rappel · Hôtel futur',{exact:true}).selectOption('custom');await dialog.getByLabel(/Délais.*Hôtel futur/).fill('60, 1440');
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Préférences enregistrées.');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  const preference=await page.evaluate(()=>JSON.parse(localStorage.getItem('detours-notifications-v1:future-reminder')!));expect(preference.overrides['step:hotel']).toEqual({mode:'custom',offsets:[60,1440]});
  await page.getByRole('navigation',{name:'Navigation principale',exact:true}).getByRole('button',{name:'Mes transports',exact:true}).click();
  await page.getByRole('button',{name:'Mon rappel · Train à préciser',exact:true}).click();await expect(dialog).toContainText('Date à renseigner');
  await dialog.getByLabel('Mon rappel · Train à préciser',{exact:true}).selectOption('off');await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('Préférences enregistrées.');await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:future-reminder'))).toBe(saved);
});

test('liens : identité exacte du voyage et de l’objet, issue absente sans ouvrir un autre carnet',async({page})=>{
  const state=blankTrip({id:'link-trip',title:'Voyage lien',timezone:'Asia/Shanghai'});
  state.cities=[{id:'city',name:'Ville',chineseName:'',subtitle:'',image:'',color:'#547764',notes:[],days:[{id:'target-day',title:'Journée cible',date:dateInTimezone('Asia/Shanghai'),steps:[{id:'target-step',title:'Visite cible',category:'visit',description:''}]}]}];
  await page.goto('/');await page.evaluate(raw=>localStorage.setItem('a-l-est-trip-v2:link-trip',raw),JSON.stringify(archive(state)));
  await page.goto('/?trip=link-trip&kind=step&object=target-step');
  await expect(page.getByRole('heading',{name:'Journée cible',exact:true})).toBeVisible();await expect(page.locator('.step-card.highlighted')).toContainText('Visite cible');
  await page.goto('/?trip=missing-trip&kind=step&object=target-step');
  await expect(page.getByRole('heading',{name:'Mes voyages',exact:true})).toBeVisible();
  await expect(page.locator('[role=alert]').first()).toBeVisible();
});
