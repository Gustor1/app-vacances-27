import { test, expect } from '@playwright/test';
import { raw,trip } from '../../scripts/l6-fixture.mjs';
import { tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';
import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';

for(const kind of ['urban','excursion','transfer'])test('L6 '+kind+' : comparer, annuler, adopter et revenir sans perdre billets/dépenses',async({page})=>{
  await page.goto('/');await page.evaluate(({raw,key})=>localStorage.setItem(key,raw),{raw,key:tripKey(trip.journey!.id)});await page.reload();
  await page.getByRole('button',{name:'Ouvrir '+trip.journey!.title,exact:true}).click();
  const day=trip.cities[0].days.find(d=>d.id===kind)!;await page.locator('.day-tabs').getByRole('button',{name:'Jour '+(trip.cities[0].days.indexOf(day)+1),exact:true}).click();
  const panel=page.locator('.day-preparation');await panel.locator('summary').click();const alt=day.preparation!.alternatives![0];
  await panel.getByRole('button',{name:'Comparer '+alt.label,exact:true}).click();await expect(page.locator('.timeline .step-card')).toHaveCount(3);
  await panel.getByRole('button',{name:'Fermer la comparaison',exact:true}).click();await expect(page.locator('.timeline .step-card')).toHaveCount(3);
  await panel.getByRole('button',{name:'Comparer '+alt.label,exact:true}).click();await panel.getByRole('button',{name:'Adopter cette alternative',exact:true}).click();
  await expect(page.locator('.timeline .step-card')).toHaveCount(alt.stepIds.length);
  await page.reload();await page.locator('.day-preparation summary').click();await expect(page.locator('.timeline .step-card')).toHaveCount(alt.stepIds.length);
  await page.locator('.day-preparation').getByRole('button',{name:'Revenir au plan initial',exact:true}).click();await expect(page.locator('.timeline .step-card')).toHaveCount(3);
  const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,tripKey(trip.journey!.id));expect(persisted.bookings).toEqual(trip.bookings);expect(persisted.expenses).toEqual(trip.expenses);expect(persisted.cities[0].days.find((d:{id:string})=>d.id===kind).steps).toEqual(day.steps);
});

for(const language of ['fr','en','zh-CN','es'] as Language[])test('L6 '+language+' : saisie, inconnues, comparaison, clavier et 320px',async({page})=>{
  const t=(key:string)=>translate(key,language);await page.goto('/');
  await page.evaluate(({raw,key,language})=>{localStorage.setItem(key,raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'light'}));},{raw,key:tripKey(trip.journey!.id),language});await page.reload();
  await page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:trip.journey!.title}),exact:true}).click();await page.locator('.day-preparation summary').click();
  const panel=page.locator('.day-preparation');await panel.getByRole('button',{name:t('Renseigner les durées et la marge'),exact:true}).click();
  const form=page.locator('.day-timing-form');await form.locator('[name="duration-0"]').fill('');await form.getByRole('button',{name:t('Enregistrer la préparation'),exact:true}).click();
  await expect(page.locator('.day-analysis')).toContainText(t('À compléter : durées, trajets, plage de la journée ou marge manquants.'));
  await panel.getByRole('button',{name:t('Créer une alternative'),exact:true}).click();await page.locator('.day-alternative-form [name=label]').fill('Mon plan calme');
  await page.locator('.day-alternative-form [name=step-0]').uncheck();await page.locator('.day-alternative-form [name=step-1]').check();
  await panel.getByRole('button',{name:t('Enregistrer l’alternative'),exact:true}).click();await expect(page.locator('.day-alternative-comparison')).toContainText('Mon plan calme');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:900});await panel.getByRole('button',{name:t('Fermer la comparaison'),exact:true}).focus();await expect(panel.getByRole('button',{name:t('Fermer la comparaison'),exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('.day-alternative-comparison')).toHaveCount(0);
});

test('L6 lecteur : comparaison disponible, adoption et formulaires bloqués',async({page,context})=>{
  await context.route('https://*.supabase.co/**',route=>route.fulfill({status:401,json:{message:'fixture unauthenticated'}}));await page.goto('/');
  const id='00000000-0000-4000-8000-000000000061';await page.evaluate(({id,key,raw,hint})=>{localStorage.setItem(hint,JSON.stringify({version:1,id}));localStorage.setItem('detours-account-v1:'+id+':'+key,JSON.stringify({version:1,raw,base:null,revision:1,privateRevision:0,pending:false,operation:'fixture',role:'reader'}));},{id,key:tripKey(trip.journey!.id),raw,hint:ACCOUNT_HINT_KEY});await page.reload();
  await page.getByRole('button',{name:'Ouvrir '+trip.journey!.title,exact:true}).click();await page.locator('.day-preparation summary').click();
  await expect(page.getByRole('button',{name:'Renseigner les durées et la marge',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Comparer Plan pluie',exact:true}).click();await expect(page.getByRole('button',{name:'Adopter cette alternative',exact:true})).toBeDisabled();
  const record=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!), 'detours-account-v1:'+id+':'+tripKey(trip.journey!.id));expect(record.raw).toBe(raw);expect(record.pending).toBe(false);
});
