import { test, expect, type Page } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import type { StoredState } from '../../src/types';

test.beforeEach(async({page})=>{await page.route('https://api.frankfurter.dev/v2/rates?**',route=>route.fulfill({status:503,json:{message:'fixture-unavailable'}}));});

async function budget(page: Page) {
  const menu=page.getByRole('button',{name:'Ouvrir le menu',exact:true});if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('button',{name:'Mes outils sur place',exact:true}).click();
  await page.getByRole('tab',{name:'Budget',exact:true}).click();
}
async function importTrip(page: Page, state: StoredState = blankTrip({title:'Budget multidevise',currency:'EUR'})) {
  await page.goto('/');
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({name:'budget.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive(state)))});
  await budget(page);
}
async function add(page: Page,label: string,amount='10',currency='USD') {
  await page.getByLabel('Libellé',{exact:true}).fill(label);await page.getByLabel('Montant',{exact:true}).fill(amount);
  await page.getByRole('combobox',{name:'Devise',exact:true}).fill(currency);
  await page.getByRole('button',{name:'Ajouter la dépense',exact:true}).click();
}
test('devise suggérée reste modifiable, choix explicite pour plusieurs pays',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Créer un voyage',exact:true}).click();
  const dialog=page.getByRole('dialog'),currency=dialog.getByRole('combobox',{name:'Devise de référence',exact:true});
  await expect(currency).toHaveValue('');await dialog.getByRole('checkbox',{name:'Japon',exact:true}).check();await expect(currency).toHaveValue('JPY');
  await dialog.getByRole('checkbox',{name:'Chine',exact:true}).check();await expect(currency).toHaveValue('');
  await dialog.getByRole('checkbox',{name:'Chine',exact:true}).uncheck();await expect(currency).toHaveValue('JPY');
  await currency.fill('EUR');await dialog.getByRole('checkbox',{name:'Chine',exact:true}).check();await expect(currency).toHaveValue('EUR');
  await dialog.getByLabel('Titre du voyage',{exact:true}).fill('Japon et Chine');await dialog.getByRole('button',{name:'Créer le carnet',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Ton premier détour',exact:true})).toBeVisible();
});
test('taux daté figé par dépense, rechargement et conversion manquante',async({page})=>{
  await importTrip(page);await add(page,'Premier repas');
  const totals=page.locator('.practical-card').filter({has:page.getByRole('heading',{name:'Mes dépenses',exact:true})});
  await expect(totals).toContainText('Total partiel en EUR');
  await page.getByLabel('1 unité de cette devise = combien de EUR ?', {exact:true}).fill('0,9');
  await page.getByLabel('Date du taux',{exact:true}).fill('2026-10-06');await page.getByRole('button',{name:'Enregistrer les réglages',exact:true}).click();
  await expect(totals).toContainText(/Total en EUR :\s*9,00/);
  await page.getByLabel('1 unité de cette devise = combien de EUR ?', {exact:true}).fill('0,8');
  await page.getByLabel('Date du taux',{exact:true}).fill('2026-10-07');await page.getByRole('button',{name:'Enregistrer les réglages',exact:true}).click();
  await expect(totals).toContainText(/Total en EUR :\s*9,00/);await add(page,'Deuxième repas');
  await expect(totals).toContainText(/Total en EUR :\s*17,00/);
  await expect(page.locator('.practical-expense').filter({hasText:'Premier repas'})).toContainText('0.9 EUR');
  await page.reload();await budget(page);await expect(totals).toContainText(/Total en EUR :\s*17,00/);
  await add(page,'Train','100','JPY');await expect(totals).toContainText('Total partiel en EUR');await expect(totals).toContainText('Taux manquants : JPY');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
test('proposition Frankfurter datée et erreur réseau sans faux total',async({page})=>{
  await page.route('https://api.frankfurter.dev/**',route=>route.fulfill({status:200,json:{base:'USD',quote:'EUR',rate:.85,date:'2026-10-06'}}));
  await importTrip(page);await add(page,'Taxi');
  await page.getByRole('button',{name:'Proposer le taux du jour',exact:true}).click();
  await expect(page.getByLabel('Date du taux',{exact:true})).toHaveValue('2026-10-06');
  await page.getByRole('button',{name:'Enregistrer les réglages',exact:true}).click();
  await expect(page.locator('.practical-expense')).toContainText('Frankfurter');
  await page.unroute('https://api.frankfurter.dev/**');await page.route('https://api.frankfurter.dev/**',route=>route.fulfill({status:503,json:{message:'unavailable'}}));
  await add(page,'Train','100','JPY');await page.getByRole('combobox',{name:'Devise à convertir',exact:true}).fill('JPY');
  await page.getByRole('button',{name:'Proposer le taux du jour',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Taux indisponible');await expect(page.locator('.practical-budget')).toContainText('Total partiel en EUR');
});
test('un ancien taux sans date ne convertit pas implicitement une nouvelle dépense',async({page})=>{
  const state=blankTrip({title:'Ancien budget',currency:'EUR'});state.exchangeRates={USD:.9};
  await importTrip(page,state);await add(page,'Nouveau repas');
  const totals=page.locator('.practical-card').filter({has:page.getByRole('heading',{name:'Mes dépenses',exact:true})});
  await expect(totals).toContainText('Total partiel en EUR');await expect(page.locator('.practical-expense')).toContainText('indisponible');
  await page.getByLabel('Date du taux',{exact:true}).fill('2026-10-07');await page.getByRole('button',{name:'Enregistrer les réglages',exact:true}).click();
  await expect(totals).toContainText(/Total en EUR :\s*9,00/);await expect(page.locator('.practical-expense')).toContainText('7 oct. 2026');
});
