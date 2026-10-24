import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { translate, type Language } from '../../src/locale-utils';
import { MASCOT_KEY } from '../../src/mascot';
import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';

async function review(page: Page, language: Language = 'fr') {
  const t = (s: string) => translate(s, language);
  await page.getByRole('button', { name:t('Créer depuis un planning'), exact:true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(t('Ton programme'), {exact:true}).fill('# Escale\nVille: Albi\nJour 1\n- Musée rouge\nUn passage encore incompris.');
  await dialog.getByRole('button', {name:t('Reconnaître mon programme'),exact:true}).click();
  await expect(dialog.locator('[data-mascot="attention"]')).toBeVisible();
  return dialog;
}

for (const language of ['fr','en','zh-CN','es'] as Language[]) test(`mascot ${language}: genuine states, themes, widths, zoom, keyboard and accessible text`, async ({page}) => {
  const t = (s: string) => translate(s, language);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(language => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({language,theme:'light'})); }, language);
  await page.reload();
  await expect(page.locator('[data-mascot="welcome"]')).toBeVisible();
  // Decorative artwork is absent from the accessibility tree; the same adjacent text remains readable.
  await expect(page.locator('[data-mascot="welcome"]')).toMatchAriaSnapshot(`- paragraph: ${t('Un premier détour ? Crée ton carnet ou pars d’un planning à vérifier.')}`);
  await page.reload(); await expect(page.locator('[data-mascot="welcome"]')).toHaveCount(0);
  const dialog = await review(page, language);
  await expect(dialog.locator('[data-mascot="attention"]')).toMatchAriaSnapshot(`- paragraph: ${t('Un passage demande ta relecture. Compare avec la source avant de créer le carnet.')}`);
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => { const v=JSON.stringify({language:document.documentElement.lang,theme}); localStorage.setItem('a-l-est-preferences-v1',v); window.dispatchEvent(new StorageEvent('storage',{key:'a-l-est-preferences-v1',newValue:v})); }, theme);
    for (const width of [320,390,1440]) {
      await page.setViewportSize({width,height:950});
      expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth+1)).toBe(true);
      await dialog.locator('[data-mascot="attention"]').scrollIntoViewIfNeeded();
      await mkdir('docs/development/lot-08-mascotte/screenshots', {recursive:true});
      await page.screenshot({path:`docs/development/lot-08-mascotte/screenshots/review-${language}-${theme}-${width}.png`});
    }
  }
  await page.setViewportSize({width:390,height:950});
  await page.evaluate(() => { document.documentElement.style.zoom='2'; });
  expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth+1)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.zoom='1'; });
  expect(await page.locator('.mascot-hint').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  await dialog.locator('.planning-passages summary').first().focus(); await page.keyboard.press('Enter');
  await expect(dialog.locator('.planning-passages details').first()).toHaveAttribute('open','');
  await dialog.getByRole('button',{name:t('Conserver comme note'),exact:true}).click();
  await expect(dialog.locator('[data-mascot="attention"]')).toHaveCount(0);
  await expect(page.locator('[data-mascot="ready"]')).toHaveCount(0);
});

test('toggle is immediate, durable, keyboard accessible and leaves the import untouched', async ({page,context}) => {
  await page.goto('/'); await review(page); await page.keyboard.press('Escape');
  const before = await page.evaluate(() => localStorage.getItem('detours-planning-draft-v1'));
  await page.getByRole('button',{name:'Préférences',exact:true}).click();
  const toggle = page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true});
  await toggle.focus(); await page.keyboard.press('Space'); await expect(toggle).not.toBeChecked();
  await expect(page.locator('.mascot-hint')).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.reload();
  await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  await expect(page.locator('.planning-passages')).toBeVisible(); await expect(page.locator('.mascot-hint')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('detours-planning-draft-v1'))).toBe(before);
  const other = await context.newPage(); await other.goto('/'); await other.getByRole('button',{name:'Préférences',exact:true}).click();
  await other.getByRole('checkbox',{name:'Afficher la mascotte',exact:true}).check();
  await expect(page.locator('[data-mascot="attention"]')).toBeVisible();
  await other.close();
});

test('failed image and failed preference write leave all ordinary actions available', async ({page}) => {
  await page.goto('/'); await review(page);
  // Contextual messages no longer depend on decorative image loading.
  await expect(page.locator('[data-mascot="attention"] img')).toHaveCount(0);
  await expect(page.locator('[data-mascot="attention"] p')).toContainText('Compare avec la source');
  await page.keyboard.press('Escape');
  await page.evaluate(key => { const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v) { if(k.endsWith(key))throw new DOMException('full','QuotaExceededError'); original.call(this,k,v); }; }, MASCOT_KEY);
  await page.getByRole('button',{name:'Préférences',exact:true}).click();
  await page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true}).uncheck();
  await expect(page.getByRole('status').filter({hasText:'son réglage n’a pas pu être sauvegardé'})).toBeVisible();
  await page.keyboard.press('Escape'); await page.getByRole('button',{name:'Créer depuis un planning',exact:true}).click();
  await expect(page.locator('.mascot-hint')).toHaveCount(0); await expect(page.locator('.planning-passages')).toBeVisible();
});

test('account switch resets personal visibility and welcome without touching another scope', async ({page,context}) => {
  await context.route('https://*.supabase.co/**', r => r.fulfill({status:401,json:{message:'fixture'}}));
  await page.goto('/'); await page.getByRole('button',{name:'Préférences',exact:true}).click(); await page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true}).uncheck(); await page.keyboard.press('Escape');
  const a='00000000-0000-4000-8000-000000000081', b='00000000-0000-4000-8000-000000000082';
  let visitedA = false;
  for (const id of [a,b,a]) {
    await page.evaluate(({id,hint}) => { const v=JSON.stringify({version:1,id});localStorage.setItem(hint,v);window.dispatchEvent(new StorageEvent('storage',{key:hint,newValue:v})); }, {id,hint:ACCOUNT_HINT_KEY});
    await page.getByRole('button',{name:'Préférences',exact:true}).click();
    const toggle=page.getByRole('checkbox',{name:'Afficher la mascotte',exact:true});
    if (id===a && visitedA) { await expect(toggle).not.toBeChecked(); }
    else { await expect(toggle).toBeChecked(); }
    if (id===a && !visitedA) { await toggle.uncheck(); visitedA=true; }
    await page.keyboard.press('Escape');
  }
});
