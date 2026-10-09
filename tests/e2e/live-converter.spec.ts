import {test,expect,type Page} from '@playwright/test';
import {archive,blankTrip} from '../../src/journeys';

async function budget(page:Page){await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('button',{name:'Mes outils sur place',exact:true}).click();await page.getByRole('tab',{name:'Budget',exact:true}).click();}
async function start(page:Page){await page.goto('/');await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'budget.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive(blankTrip({title:'Chine en euros',currency:'CNY'}))))});await budget(page);await page.getByRole('combobox',{name:'Mon pays',exact:true}).selectOption('FR');await expect(page.getByRole('combobox',{name:'Ma devise',exact:true})).toHaveValue('EUR');}
async function add(page:Page,label:string,amount:string,currency:string){await page.getByLabel('Libellé',{exact:true}).fill(label);await page.getByLabel('Montant',{exact:true}).fill(amount);await page.getByRole('combobox',{name:'Devise',exact:true}).fill(currency);await page.getByRole('button',{name:'Ajouter la dépense',exact:true}).click();}
function converter(page:Page){return page.getByRole('region',{name:'Convertisseur de devises',exact:true});}
function snapshot(page:Page){return page.evaluate(()=>JSON.parse(localStorage.getItem('a-l-est-trip-v2:'+sessionStorage.getItem('a-l-est-open-trip-v2'))!).state);}

test('convertisseur connecté et dépenses synchronisées en devise locale et personnelle, taux enregistrés conservés',async({page})=>{
  let cny=8;let requests=0;
  await page.route('https://api.frankfurter.dev/v2/rates?**',route=>{requests++;const query=new URL(route.request().url()).searchParams,base=query.get('base')!.toUpperCase(),targets=query.get('quotes')!.toUpperCase().split(',');const values:Record<string,number>={EUR:1,CNY:cny,USD:1.25,JPY:160};return route.fulfill({json:targets.map(quote=>({base,quote,rate:values[quote]/values[base],date:'2026-10-07'}))});});
  await start(page);const result=converter(page).getByLabel('Résultat de la conversion');await expect(result).toContainText('12,50 EUR');
  const before=requests;await page.getByLabel('Montant à convertir',{exact:true}).fill('200');await expect(result).toContainText('25,00 EUR');expect(requests).toBe(before);
  await add(page,'Repas','80','CNY');await expect(page.locator('.personal-total-value')).toHaveText('10,00 EUR');
  await add(page,'Billet','10','USD');const totals=page.locator('.practical-card').filter({has:page.getByRole('heading',{name:'Mes dépenses',exact:true})});
  await expect(totals).toContainText(/Total en CNY :\s*144,00\s+CNY/);await expect(page.locator('.personal-total-value')).toHaveText('18,00 EUR');
  const saved=await snapshot(page);expect(saved.expenses[1].conversions.CNY).toEqual({rate:6.4,date:'2026-10-07',source:'frankfurter'});
  cny=10;await converter(page).getByRole('button',{name:'Actualiser les taux',exact:true}).click();await expect(result).toContainText('20,00 EUR');await expect(page.locator('.personal-total-value')).toHaveText('16,00 EUR');
  await expect(totals).toContainText(/Total en CNY :\s*144,00\s+CNY/);expect((await snapshot(page)).expenses).toEqual(saved.expenses);
  await page.getByRole('combobox',{name:'Mon pays',exact:true}).selectOption('US');await expect(page.getByRole('combobox',{name:'Ma devise',exact:true})).toHaveValue('USD');await expect(page.locator('.personal-total-value')).toHaveText('20,00 USD');expect((await snapshot(page)).journey.currency).toBe('CNY');
  await page.getByRole('button',{name:'Supprimer Billet',exact:true}).click();await page.locator('.practical-expense').filter({hasText:'Billet'}).getByRole('button',{name:'Supprimer',exact:true}).click();await expect(page.locator('.personal-total-value')).toHaveText('10,00 USD');
  await page.reload();await budget(page);await expect(page.getByRole('combobox',{name:'Ma devise',exact:true})).toHaveValue('USD');await expect(page.locator('.personal-total-value')).toHaveText('10,00 USD');
});
test('inversion, arrondis, montants invalides et changement de paire pendant une requête',async({page})=>{
  let release:()=>void=()=>{};const held=new Promise<void>(resolve=>{release=resolve;});let holdUsd=false;
  await page.route('https://api.frankfurter.dev/v2/rates?**',async route=>{const query=new URL(route.request().url()).searchParams,base=query.get('base')!.toUpperCase(),targets=query.get('quotes')!.toUpperCase().split(',');if(base==='USD'&&holdUsd)await held;const values:Record<string,number>={EUR:1,CNY:8,USD:1.25,JPY:160};await route.fulfill({json:targets.map(quote=>({base,quote,rate:values[quote]/values[base],date:'2026-10-07'}))});});
  await start(page);const region=converter(page),result=region.getByLabel('Résultat de la conversion');await expect(result).toContainText('12,50 EUR');await region.getByRole('button',{name:'Inverser les devises',exact:true}).click();await expect(result).toContainText('800,00 CNY');
  await page.getByLabel('Montant à convertir',{exact:true}).fill('0');await expect(result).toContainText('0,00 CNY');await page.getByLabel('Montant à convertir',{exact:true}).fill('oops');await expect(region.getByRole('alert')).toContainText('montant positif');await expect(result).toContainText('—');
  await page.getByLabel('Montant à convertir',{exact:true}).fill('1,234');await region.getByRole('combobox',{name:'Vers',exact:true}).selectOption('JPY');await expect(result).toContainText('197 JPY');
  await region.getByRole('combobox',{name:'Vers',exact:true}).selectOption('EUR');holdUsd=true;await region.getByRole('combobox',{name:'De',exact:true}).selectOption('USD');await region.getByRole('combobox',{name:'De',exact:true}).selectOption('JPY');await page.getByLabel('Montant à convertir',{exact:true}).fill('100');await expect(result).toContainText('0,63 EUR');release();await expect(region.getByRole('combobox',{name:'De',exact:true})).toHaveValue('JPY');await expect(result).toContainText('0,63 EUR');
  await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/live-converter-mobile.png',fullPage:true,animations:'disabled'});
});
test('hors ligne : cache daté disponible et paire manquante signalée, reprise automatique',async({page,context})=>{
  await page.route('https://api.frankfurter.dev/v2/rates?**',route=>{const query=new URL(route.request().url()).searchParams,base=query.get('base')!.toUpperCase(),targets=query.get('quotes')!.toUpperCase().split(',');const values:Record<string,number>={EUR:1,CNY:8,JPY:160};return route.fulfill({json:targets.map(quote=>({base,quote,rate:values[quote]/values[base],date:'2026-10-07'}))});});
  await start(page);const region=converter(page),result=region.getByLabel('Résultat de la conversion');await expect(result).toContainText('12,50 EUR');await context.setOffline(true);await page.getByLabel('Montant à convertir',{exact:true}).fill('200');await expect(result).toContainText('25,00 EUR');await expect(region).toContainText('Hors ligne');await expect(region).toContainText('7 oct. 2026');
  await region.getByRole('combobox',{name:'Vers',exact:true}).selectOption('JPY');await expect(result).toContainText('—');await expect(result).toContainText('indisponible');await context.setOffline(false);await expect(result).toContainText('4 000 JPY');
});
