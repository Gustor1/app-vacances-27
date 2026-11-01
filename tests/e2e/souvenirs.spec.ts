import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixture } from '../../scripts/companion-fixture.mjs';
import { archive, tripKey } from '../../src/journeys';
import { translate, type Language } from '../../src/locale-utils';

const trip=fixture();
async function seed(page: Page, language: Language='fr') {
  await page.goto('/');
  await page.evaluate(({raw,key,language})=>{localStorage.setItem(key,raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:language==='en'?'dark':'light'}));},{key:tripKey(trip.journey!.id),raw:JSON.stringify(archive(trip)),language});
  await page.reload();await page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:trip.journey!.title}),exact:true}).click();
  await page.locator('.souvenirs summary').click();
  await expect(page.locator('.souvenirs textarea')).toBeEnabled();
}
for (const language of ['fr','en','zh-CN','es'] as Language[]) test(`personal memory ${language}: durable caption, explicit print consent, keyboard, widths and no private leaks`,async({page})=>{
  const t=(s:string)=>translate(s,language);await seed(page,language);await page.emulateMedia({reducedMotion:'reduce'});
  const before=await page.evaluate(key=>localStorage.getItem(key),tripKey(trip.journey!.id));
  await page.getByLabel(t('Légende du souvenir'),{exact:true}).fill('<script>private MEMORY</script>');
  await page.getByRole('button',{name:t('Enregistrer le souvenir'),exact:true}).click();await expect(page.getByRole('status').filter({hasText:t('Souvenir enregistré sur cet appareil.')})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),tripKey(trip.journey!.id))).toBe(before);
  await page.reload();await page.locator('.souvenirs summary').click();await expect(page.locator('.souvenirs textarea')).toHaveValue('<script>private MEMORY</script>');
  await page.getByRole('button',{name:t('Préparer un souvenir imprimable'),exact:true}).click();const dialog=page.getByRole('dialog');
  await expect(page).toHaveTitle(t('Mes souvenirs de voyage'));
  await expect(dialog.getByRole('button',{name:t('Imprimer les journées choisies'),exact:true})).toBeDisabled();
  await dialog.getByRole('checkbox',{name:'Jour test',exact:true}).focus();await page.keyboard.press('Space');
  await expect(dialog.locator('.souvenir-preview')).not.toContainText('MEMORY');await expect(dialog.locator('.souvenir-preview')).not.toContainText('PRIVATE');
  await dialog.getByLabel(t('J’inclus mes légendes personnelles dans l’impression.'),{exact:true}).check();await expect(dialog.locator('.souvenir-preview')).toContainText('<script>private MEMORY</script>');expect(await page.evaluate(()=>Object.hasOwn(window,'injected'))).toBe(false);
  await page.evaluate(()=>{window.print=()=>{document.documentElement.dataset.printed='yes';};});await dialog.getByRole('button',{name:t('Imprimer les journées choisies'),exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-printed','yes');
  for(const width of [320,390,1440]) {await page.setViewportSize({width,height:950});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);}
  await page.setViewportSize({width:390,height:950});await page.evaluate(()=>{document.documentElement.style.zoom='2';});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.evaluate(()=>{document.documentElement.style.zoom='1';});
  await mkdir('docs/development/lot-09-souvenirs/screenshots',{recursive:true});await page.screenshot({path:`docs/development/lot-09-souvenirs/screenshots/preview-${language}.png`});
  await page.emulateMedia({media:'print'});await expect(page.locator('#souvenir-print-root')).toBeVisible();await expect(page.locator('#root')).toBeHidden();await expect(page.locator('#souvenir-print-root')).not.toContainText('PRIVATE');await page.screenshot({path:`docs/development/lot-09-souvenirs/screenshots/print-${language}.png`});await page.emulateMedia({media:'screen'});
  await page.keyboard.press('Escape');await page.getByRole('button',{name:t('Supprimer ce souvenir'),exact:true}).click();await page.getByRole('button',{name:t('Confirmer la suppression'),exact:true}).click();await expect(page.locator('.souvenirs textarea')).toHaveValue('');
});

test('real decoder: EXIF rotation, metadata removal, signatures, unsupported formats and bounded output',async({page})=>{
  await page.goto('/');
  const results=await page.evaluate(async()=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);
    const c=document.createElement('canvas');c.width=80;c.height=30;c.getContext('2d')!.fillRect(0,0,80,30);
    const original=await new Promise<Blob>(resolve=>c.toBlob(b=>resolve(b!),'image/jpeg'));
    const bytes=new Uint8Array(await original.arrayBuffer());
    // APP1 EXIF: little endian TIFF, one orientation entry, orientation 6 (90° CW).
    const exif=Uint8Array.from([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
    const oriented=new Blob([bytes.slice(0,2),exif,bytes.slice(2)],{type:'image/jpeg'});
    const source=await oriented.arrayBuffer();const photo=await m.preparePhoto(oriented);const output=new Uint8Array(await photo.arrayBuffer());
    const errors=[];
    for(const bad of [new Blob([bytes],{type:'image/png'}),new Blob(['HEIC fake'],{type:'image/heic'}),new Blob([new Uint8Array(m.MEDIA_LIMITS.input+1)],{type:'image/jpeg'}),new Blob([bytes.slice(0,12)],{type:'image/jpeg'})]) {
      try {await m.preparePhoto(bad);errors.push('accepted');}catch(e){errors.push((e as Error).message);}
    }
    const large=document.createElement('canvas');large.width=4000;large.height=3000;const big=await new Promise<Blob>(r=>large.toBlob(b=>r(b!),'image/png'));const small=await m.preparePhoto(big);const dimensions=m.imageHeader(new Uint8Array(await small.arrayBuffer()));
    return {header:m.imageHeader(output),hasExif:new TextDecoder().decode(output).includes('Exif'),unchanged:source.byteLength===oriented.size,errors,dimensions,bytes:photo.size,bigBytes:big.size,smallBytes:small.size};
  });
  expect(results.header).toEqual({type:'image/jpeg',width:30,height:80});expect(results.hasExif).toBe(false);expect(results.unchanged).toBe(true);expect(results.errors).toEqual(['media-format','media-format','media-size','media-format']);expect(results.dimensions.width).toBe(1600);expect(results.dimensions.height).toBe(1200);expect(results.smallBytes).toBeLessThanOrEqual(524288);
  await mkdir('docs/development/lot-09-souvenirs',{recursive:true});await writeFile('docs/development/lot-09-souvenirs/image-budgets.json',JSON.stringify(results,null,2));
});

test('IndexedDB atomic abort, quota failure, missing media, conflicts and account/trip isolation',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);
    await m.writeSouvenirs('account:a','t',[{day:'d',before:null,value:{caption:'old'}}]);
    const old=(await m.readSouvenirs('account:a','t'))[0];const errors=[];
    const original=IDBObjectStore.prototype.put;
    for(const interrupt of [false,true]) {
      IDBObjectStore.prototype.put=function(value,key){if(this.name==='memories'){if(interrupt){const result=original.call(this,value,key);this.transaction.abort();return result;}throw new DOMException('full','QuotaExceededError');}return original.call(this,value,key);};
      try{await m.writeSouvenirs('account:a','t',[{day:'d',before:old.revision,value:{caption:'lost'}},{day:'x',before:null,value:{caption:'partial'}}]);}catch(e){errors.push((e as Error).name);}
      IDBObjectStore.prototype.put=original;
    }
    const after=await m.readSouvenirs('account:a','t');
    await m.writeSouvenirs('account:a','t',[{day:'d',before:old.revision,value:{caption:'new'}}]);
    let conflict='';try{await m.writeSouvenirs('account:a','t',[{day:'d',before:old.revision,value:{caption:'stale'}}]);}catch(e){conflict=(e as Error).message;}
    const noB=await m.readSouvenirs('account:b','t'),noLocal=await m.readSouvenirs('local','t'),noTrip=await m.readSouvenirs('account:a','another');
    const current=(await m.readSouvenirs('account:a','t'))[0];await m.writeSouvenirs('account:a','t',[{day:'d',before:current.revision,value:null}]);
    return {errors,after:after.map((r:{caption:string})=>r.caption),conflict,noB,noLocal,noTrip,deleted:await m.readSouvenirs('account:a','t')};
  });
  expect(result.errors).toHaveLength(2);expect(result.after).toEqual(['old']);expect(result.conflict).toBe('media-conflict');expect(result.noB).toEqual([]);expect(result.noLocal).toEqual([]);expect(result.noTrip).toEqual([]);expect(result.deleted).toEqual([]);
});

test('photo package is bounded, integrity checked, restored without overwrite and idempotent',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);const c=document.createElement('canvas');c.width=100;c.height=50;
    const photo=await m.preparePhoto(await new Promise<Blob>(r=>c.toBlob(b=>r(b!),'image/png')));
    await m.writeSouvenirs('local','old',[{day:'d',before:null,value:{caption:'private',photo}},{day:'removed',before:null,value:{caption:'detached',photo}}]);
    const raw=await m.exportSouvenirs(await m.readSouvenirs('local','old'));const prepared=await m.prepareSouvenirRestore(raw,['d'],[]);
    await m.writeSouvenirs('local','restored',prepared.writes);const restored=await m.readSouvenirs('local','restored');const retry=await m.prepareSouvenirRestore(raw,['d'],restored);
    const corrupt=JSON.parse(raw);corrupt.entries[0].sha256='0'.repeat(64);let integrity='';try{await m.prepareSouvenirRestore(JSON.stringify(corrupt),['d'],[]);}catch(e){integrity=(e as Error).message;}
    const old=restored[0];await m.writeSouvenirs('local','restored',[{day:'d',before:old.revision,value:{caption:old.caption}}]);const missing=await m.readSouvenirs('local','restored');
    return {skipped:prepared.skipped,retry:retry.writes.length,caption:restored[0].caption,bytes:restored[0].photo.size,missingPhoto:missing[0].photo===undefined,integrity,raw};
  });
  expect(result.skipped).toBe(1);expect(result.retry).toBe(0);expect(result.caption).toBe('private');expect(result.bytes).toBeGreaterThan(0);expect(result.missingPhoto).toBe(true);expect(result.integrity).toBe('media-invalid');
});

test('global media budget refuses a large batch atomically and concurrent tabs preserve revisions',async({page,context})=>{
  await page.goto('/');
  const quota=await page.evaluate(async()=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);const c=document.createElement('canvas');c.width=10;c.height=10;
    const small=await new Promise<Blob>(r=>c.toBlob(b=>r(b!),'image/jpeg'));const padded=new Blob([small,new Uint8Array(m.MEDIA_LIMITS.output-small.size)],{type:'image/jpeg'});
    let message='';try{await m.writeSouvenirs('local','full',Array.from({length:65},(_,i)=>({day:`d${i}`,before:null,value:{caption:'quota',photo:padded}})));}catch(e){message=(e as Error).message;}
    return {message,rows:(await m.readSouvenirs('local','full')).length,attempted:65*padded.size};
  });
  expect(quota.message).toBe('media-quota');expect(quota.rows).toBe(0);expect(quota.attempted).toBeGreaterThan(32*1024**2);
  const other=await context.newPage();await other.goto('/');
  const write=(tab:Page,caption:string)=>tab.evaluate(async caption=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);
    try{await m.writeSouvenirs('local','race',[{day:'d',before:null,value:{caption}}]);return 'saved';}catch(e){return (e as Error).message;}
  },caption);
  const result=await Promise.all([write(page,'one'),write(other,'two')]);expect(result.sort()).toEqual(['media-conflict','saved']);await other.close();
});

test('cancel and unreadable photo recovery; deleting all days leaves the package accessible',async({page})=>{
  await seed(page);
  await page.locator('.souvenirs textarea').fill('unsaved');await page.getByRole('button',{name:'Annuler les modifications',exact:true}).click();await expect(page.locator('.souvenirs textarea')).toHaveValue('');
  await page.evaluate(async trip=>{
    const path='/src/souvenirs.ts';const m=await import(/* @vite-ignore */ path);
    const open=indexedDB.open(m.SOUVENIR_DB,1);const db=await new Promise<IDBDatabase>(r=>{open.onsuccess=()=>r(open.result);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('memories','readwrite');tx.objectStore('memories').put({key:m.souvenirKey('local',trip,'d'),scope:'local',trip,day:'d',revision:'corrupt',caption:'recoverable',photo:new Blob(['missing bytes'],{type:'image/jpeg'})});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
  },trip.journey!.id);
  await page.reload();await page.locator('.souvenirs summary').click();await expect(page.locator('.souvenirs')).toContainText('Photo illisible.');await expect(page.locator('.souvenirs textarea')).toHaveValue('recoverable');
  await page.getByRole('button',{name:'Retirer la photo avant enregistrement',exact:true}).click();await page.getByRole('button',{name:'Enregistrer le souvenir',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Souvenir enregistré'})).toBeVisible();
  await page.evaluate(key=>{const value=JSON.parse(localStorage.getItem(key)!);value.state.cities[0].days=[];localStorage.setItem(key,JSON.stringify(value));},tripKey(trip.journey!.id));await page.reload();await page.locator('.souvenirs summary').click();await expect(page.locator('.souvenirs')).toContainText('1 souvenir(s) de journées supprimées');await page.getByRole('button',{name:'Télécharger le paquet souvenirs',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('recoverable');await page.keyboard.press('Escape');
  await page.getByLabel('Je confirme la suppression des souvenirs de journées supprimées.',{exact:true}).check();await page.getByRole('button',{name:'Nettoyer les souvenirs détachés',exact:true}).click();await expect(page.locator('.souvenirs')).toContainText('0 souvenir(s),');
});
