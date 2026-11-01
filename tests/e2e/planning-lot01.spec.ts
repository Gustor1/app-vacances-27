import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

test('unprocessed source can become an activity or a durable note; assignment survives reload',async({page})=> {
 await page.goto('/');await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
 let dialog=page.getByRole('dialog');
 await dialog.getByLabel('Ouvrir un fichier texte ou Markdown',{exact:true}).setInputFiles({name:'brouillon.md',mimeType:'text/markdown',buffer:Buffer.from('# Escale\nVille: Albi\nJour 1\n- Musée rouge\nJour 2\n- Jardin bleu\nUn passage encore incompris.\nCorrection finale : vérifier la journée du musée.')});
 await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
 const passages=dialog.locator('.planning-passages');await expect(passages.locator('details')).toHaveCount(2);
 await passages.locator('summary').first().click();
 await expect(passages.locator('pre').first()).toHaveText('Un passage encore incompris.');
 await passages.getByLabel('Journée de destination',{exact:true}).first().selectOption('0:1');
 await passages.getByRole('button',{name:'Transformer en activité',exact:true}).first().click();
 await expect(dialog.locator('.planning-day').last().locator('.planning-item')).toHaveCount(2);
 await passages.locator('summary').first().click();
 await passages.getByRole('button',{name:'Conserver comme note',exact:true}).click();
 await expect(passages).toHaveCount(0);
 await dialog.getByLabel('Affectation ville / journée',{exact:true}).first().selectOption('0:1');
 await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();dialog=page.getByRole('dialog');
 await expect(dialog.locator('.planning-passages')).toHaveCount(0);
 await expect(dialog.locator('.planning-day').last().locator('.planning-item')).toHaveCount(3);
 await expect(dialog.locator('.planning-day').last().getByLabel('Lieu ou activité',{exact:true}).last()).toHaveValue('Musée rouge');
 await dialog.locator('details').filter({has:page.getByText('Texte source',{exact:true})}).locator('summary').click();
 await expect(dialog.locator('.planning-source').filter({hasText:'Correction finale'}).last()).toBeAttached();
 for(const width of [320,390]) {
  await page.setViewportSize({width,height:844});await dialog.getByLabel('Titre du voyage',{exact:true}).focus();await page.keyboard.press('Tab');
  expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await mkdir('docs/development/import-fiable-lot-01/screenshots',{recursive:true});
  await page.screenshot({path:`docs/development/import-fiable-lot-01/screenshots/review-${width}.png`});
 }
});

test('nearly empty recognition gives an explicit factual summary and source links',async({page})=> {
 await page.goto('/');await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Ton programme',{exact:true}).fill('Nous aimerions voyager sans programme précis.');
 await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
 await expect(dialog.getByText('Aucune activité proposée.',{exact:false})).toBeVisible();
 await expect(dialog.locator('.planning-summary').first()).toContainText('0 journées · 0 propositions');
 await dialog.locator('.planning-passages summary').first().click();await dialog.getByRole('link',{name:'Corriger la proposition',exact:true}).click();
 await expect(dialog.getByLabel('Ville, région ou lieu de séjour',{exact:true})).toBeFocused();
});

test('a long passage can become a durable activity without truncating its provenance',async({page})=> {
 await page.goto('/');await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();let dialog=page.getByRole('dialog');
 const quote='Un long passage '+ 'texte '.repeat(2000)+'.';const source='# Escale\nVille: Albi\nJour 1\n'+quote;
 await dialog.getByLabel('Ton programme',{exact:true}).fill(source);await dialog.getByRole('button',{name:'Reconnaître mon programme',exact:true}).click();
 await dialog.locator('.planning-passages summary').click();await dialog.getByRole('button',{name:'Transformer en activité',exact:true}).click();
 await expect(dialog.getByText('Nomme cette activité.',{exact:false})).toBeVisible();
 await dialog.getByLabel('Lieu ou activité',{exact:true}).fill('Activité nommée personnellement');
 await page.reload();await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();dialog=page.getByRole('dialog');
 await expect(dialog.getByLabel('Lieu ou activité',{exact:true})).toHaveValue('Activité nommée personnellement');
 const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('detours-planning-draft-v1')!));
 expect(session.source).toBe(source);expect(session.draft.cities[0].days[0].items[0].evidence.description.quote).toBe(quote);
});
