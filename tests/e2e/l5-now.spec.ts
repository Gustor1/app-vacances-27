import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import { dateInTimezone } from '../../src/time';
import { translate } from '../../src/locale-utils';
import type { Language } from '../../src/locale-utils';

for(const language of ['fr','en','zh-CN','es'] as Language[]) test(`Maintenant ${language} : deux actions, adresse locale, données du jour, clavier et dates`,async({page,context})=>{
  await context.setGeolocation(null);
  await page.goto('/');
  const state=blankTrip({id:'l5-test',title:'Test L5',timezone:'Asia/Shanghai'});
  const date=dateInTimezone('Asia/Shanghai');
  state.cities=[{id:'c',name:'Ville factice',chineseName:'测试城',subtitle:'',color:'#547764',image:'',notes:[],timezone:'Asia/Shanghai',mapProvider:'amap',days:[{id:'d',title:'Jour test',date,steps:[{id:'done',title:'Déjà fait',category:'visit',description:''},{id:'next',title:'Prochaine visite factice',chineseName:'测试景点',address:'测试路 20 号',category:'visit',description:''},{id:'booking',title:'Billet factice',category:'transport',description:'',booking:true}]},{id:'undated',title:'Sans date',steps:[]}]}];
  state.done=['done'];state.bookings=['booking'];state.notes={d:'Note pour ce jour',undated:'Note autre jour'};
  state.stays=[{cityId:'c',name:'Hôtel factice',chineseName:'测试旅馆',address:'测试路 10 号',checkIn:'',checkOut:'',notes:''}];
  await page.evaluate(({raw,language})=>{localStorage.setItem('a-l-est-trip-v2:l5-test',raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'dark'}));}, {raw:JSON.stringify(archive(state)),language});
  await page.reload();await page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:'Test L5'}),exact:true}).click();
  const t=(value:string)=>translate(value,language);
  const savedBefore=await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:l5-test'));
  await page.locator('.now-shortcut').click();
  await expect(page.locator('.now-view')).toContainText('Prochaine visite factice');
  await expect(page.locator('.now-view')).toContainText('Billet factice');
  await expect(page.locator('.now-view')).toContainText('Note pour ce jour');
  await expect(page.locator('.now-view')).not.toContainText('Note autre jour');
  const show=page.getByRole('button',{name:t('À montrer'),exact:true});await show.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toContainText('测试旅馆');await expect(dialog).toContainText('测试路 10 号');
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.evaluate(value=>navigator.clipboard.writeText(value),`before-copy-${language}`);
  await dialog.getByRole('button',{name:t('Copier le texte'),exact:true}).click();
  // Windows represents clipboard line breaks as CRLF; preserve the actual text check.
  expect((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n')).toBe('测试旅馆\n测试路 10 号');
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('fixture unavailable'))}});});
  await dialog.getByRole('button',{name:t('Copier le texte'),exact:true}).click();
  await expect(dialog.locator('.now-address')).toHaveText('测试路 10 号');
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(show).toBeFocused();
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});const layout=await page.evaluate(()=>({fits:document.documentElement.scrollWidth<=innerWidth,offenders:Array.from(document.querySelectorAll('button,input,select,p')).filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({class:e.className,text:e.textContent?.slice(0,60),right:e.getBoundingClientRect().right})).slice(0,8)}));expect(layout.fits,JSON.stringify(layout.offenders)).toBe(true);}
  await page.getByLabel(t('Journée à consulter'),{exact:true}).selectOption('undated');
  await expect(page.locator('.now-view')).toContainText('Note autre jour');
  await expect(page.locator('.now-view')).toContainText(t('Journée sans date : sélection manuelle'));
  await page.getByLabel(t('Date choisie'),{exact:true}).fill('2027-12-31');
  await expect(page.locator('.now-view')).toContainText(t('Aucune journée datée ne correspond. Choisis une journée ou attribue ses dates dans la vue d’ensemble.'));
  await page.getByRole('button',{name:t('Aujourd’hui dans le fuseau de chaque étape'),exact:true}).click();
  await page.getByRole('button',{name:t('Ouvrir cette journée'),exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'Jour test',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:l5-test'))).toBe(savedBefore);
});
