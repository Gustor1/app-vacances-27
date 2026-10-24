import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
const fixture = (name: string) => path.resolve('tests/fixtures/planning/documents', name);
const key = 'detours-planning-draft-v1';
async function open(page: Page) {
  await page.goto('/'); await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  return page.getByRole('dialog');
}
test('PDF and DOCX binaries are reviewed locally; corrections and original extraction survive reload', async ({ page }) => {
  test.setTimeout(90_000);
  const requests: string[] = [];
  page.on('request', r => { if (r.method() !== 'GET' || !/^(127\.0\.0\.1|localhost)$/.test(new URL(r.url()).hostname)) requests.push(r.method() + ' ' + r.url()); });
  let dialog = await open(page);
  const source = dialog.getByRole('textbox', { name: 'Ton programme', exact: true });
  await source.fill('PRIVATE SOURCE TO PRESERVE');
  for (const name of ['simple.pdf', 'columns.pdf', 'table.pdf', 'lists-table.docx']) {
    await dialog.locator('input[type=file]').setInputFiles(fixture(name));
    await expect(dialog.locator('.notice pre')).toContainText(name.endsWith('.docx') ? 'Musée rouge' : name === 'columns.pdf' ? 'Musee gauche' : 'Musee rouge', { timeout: 30_000 });
    await expect(source).toHaveValue('PRIVATE SOURCE TO PRESERVE');
    await dialog.getByRole('button', { name: 'Annuler', exact: true }).click();
  }
  await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  await dialog.getByRole('button', { name: 'Remplacer le texte', exact: true }).click();
  const original = await source.inputValue(); await source.fill(original + '\nCorrection personnelle');
  await page.reload(); await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click(); dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(original + '\nCorrection personnelle');
  await dialog.locator('.planning-origin summary').click(); await expect(dialog.locator('.planning-origin pre')).toHaveText(original);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.sourceOrigin).toEqual({ kind: 'docx', name: 'lists-table.docx', originalText: original });
  await dialog.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  await expect(dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true })).toHaveValue('Albi'); expect(requests).toEqual([]);
});
test('protected, scanned, corrupt, false-extension and excessive binaries preserve the previous source', async ({ page }) => {
  const dialog = await open(page); const source = dialog.getByRole('textbox', { name: 'Ton programme', exact: true }); await source.fill('Texte précédent');
  for (const [name, message] of [['scan.pdf', 'Aucun texte extractible'], ['protected.pdf', 'mot de passe'], ['corrupt.pdf', 'corrompu'], ['fake.docx', 'extension incorrecte'], ['pages-51.pdf', '50 pages'], ['long.pdf', '50 000'], ['long.docx', '50 000'], ['zip-bomb.docx', 'Archive Word excessive'], ['entries.docx', 'Archive Word excessive'], ['forged-size.docx', 'Archive Word excessive'], ['active.docx', 'sans macros'], ['entity.docx', 'corrompu']]) {
    await dialog.locator('input[type=file]').setInputFiles(fixture(name));
    await expect(dialog.getByRole('alert'), name).toContainText(message); await expect(source).toHaveValue('Texte précédent');
  }
  for (const name of ['old.doc','macro.docm','renamed.pdf']) {
    await dialog.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from('text only') });
    await expect(dialog.getByRole('alert')).toContainText('extension incorrecte');
  }
  await dialog.locator('input[type=file]').setInputFiles({ name:'big.pdf', mimeType:'application/pdf', buffer:Buffer.alloc(10*1024*1024+1) });
  await expect(dialog.getByRole('alert')).toContainText('10 Mo'); await expect(source).toHaveValue('Texte précédent');
  await dialog.locator('input[type=file]').setInputFiles(fixture('simple.pdf')); await dialog.getByRole('button', { name:'Remplacer le texte', exact:true }).click(); await expect(source).toHaveValue(/Musee rouge/);
});
test('cancellation, timeout and a later file cannot overwrite a newer source', async ({ page }) => {
  const dialog = await open(page); const source = dialog.getByRole('textbox', { name:'Ton programme', exact:true }); await source.fill('Ancien brouillon');
  let release!: () => void; const hold = new Promise<void>(resolve => { release=resolve; });
  await page.route('**/document-pdf.ts*', async route => { await hold; await route.continue(); });
  await dialog.locator('input[type=file]').setInputFiles(fixture('simple.pdf')); await expect(dialog.getByRole('status')).toContainText('Lecture');
  await dialog.getByRole('button', { name:'Annuler', exact:true }).click(); await source.fill('Nouvelle saisie'); release(); await page.unrouteAll({behavior:'wait'});
  await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  await dialog.getByRole('button', { name:'Remplacer le texte', exact:true }).click(); await expect(source).toHaveValue(/Musée rouge/);
  await page.reload(); await page.getByRole('button', {name:'Créer depuis un planning',exact:true}).click();
  let releaseWorker!: () => void; const heldWorker=new Promise<void>(resolve=>{releaseWorker=resolve;});
  await page.route('**/docx.worker.ts*', async route=>{await heldWorker;await route.continue();});
  await page.clock.install(); await page.getByRole('dialog').locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  await expect(page.getByRole('status')).toContainText('Lecture'); await page.clock.fastForward(20_001);
  await expect(page.getByRole('alert')).toContainText('20 secondes');releaseWorker();await page.unrouteAll({behavior:'wait'});
  await expect(page.getByRole('textbox',{name:'Ton programme',exact:true})).toHaveValue(/Musée rouge/);
});
for (const [language, trigger, promptLabel, copy, copied, original] of [
  ['fr','Créer depuis un planning','Préparer mon planning avec mon IA','Copier les consignes','Modèle copié.','Texte extrait original'],
  ['en','Create from an itinerary','Prepare my itinerary with my AI','Copy instructions','Template copied.','Original extracted text'],
  ['zh-CN','从行程创建','用我的 AI 整理行程','复制说明','模板已复制。','原始提取文本'],
  ['es','Crear desde un itinerario','Preparar mi itinerario con mi IA','Copiar instrucciones','Plantilla copiada.','Texto extraído original'],
]) test(`localized document review and static clipboard at 320px: ${language}`, async ({ page, context }, info) => {
  await page.setViewportSize({width:320,height:844}); await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.addInitScript(language=>localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'light'})),language);
  await page.goto('/');await page.getByRole('button',{name:trigger,exact:true}).click();const dialog=page.getByRole('dialog');
  await dialog.locator('textarea').fill('PRIVATE NOTE NEVER TO COPY');
  await dialog.locator('summary').filter({hasText:promptLabel}).click(); await dialog.getByRole('button',{name:copy,exact:true}).click();
  await expect(dialog.getByRole('status')).toHaveText(copied); const clipboard=await page.evaluate(()=>navigator.clipboard.readText());expect(clipboard).not.toContain('PRIVATE NOTE');expect(clipboard).toContain('# ');
  await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  const replace=['Remplacer le texte','Replace the text','替换文本','Reemplazar el texto'][['fr','en','zh-CN','es'].indexOf(language)];
  await dialog.getByRole('button',{name:replace,exact:true}).click(); await dialog.locator('summary').filter({hasText:original}).click();
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true); await page.keyboard.press('Tab');expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);
  await page.screenshot({path:info.outputPath(`documents-${language}.png`)});
});
