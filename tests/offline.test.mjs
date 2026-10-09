import test from 'node:test';
import assert from 'node:assert/strict';
import { contentDigest, checkOfflineAssets, readOfflineReceipt, offlineReceiptKey } from '../src/offline.ts';
import { tripSaveStatus } from '../src/cloud/status.ts';

async function fixture() {
  const bodies = new Map([['/assets/index-new.js','main entry'],['/assets/WorldView-lazy.js','lazy world'],['/index.html','<script src="/assets/index-new.js"></script>'],['/world-geography.json','{"world":true}']]);
  const files = [];
  for (const [path,body] of [...bodies].sort()) files.push({ path, bytes: new TextEncoder().encode(body).length, sha256: await contentDigest(body) });
  const info = { version: 1, id: await contentDigest(JSON.stringify(files)), entry: '/assets/index-new.js', files };
  bodies.set('/',bodies.get('/index.html')); bodies.set('/build-info.json',JSON.stringify(info));
  const name = `a-l-est-${info.id.slice(0,12)}`;
  const reader = { names: async () => ['a-l-est-previous-test',name], match: async (cache,path) => cache === name && bodies.has(path) ? new Response(bodies.get(path)) : undefined };
  return { info, reader, bodies };
}

test('hors ligne : manifeste de la version ouverte et ressources relues sans réseau', async () => {
  const { info, reader } = await fixture();
  assert.deepEqual(await checkOfflineAssets(reader,info.entry),{ready:true,mapReady:true,buildId:info.id,missing:[]});
  assert.equal((await checkOfflineAssets(reader,'/assets/index-old.js')).ready,false);
  assert.equal((await checkOfflineAssets(reader,info.entry,['/assets/style-other.css'])).ready,false);
});
test('hors ligne : un chunk différé absent ou un fichier corrompu ne passe pas pour disponible', async () => {
  const missing = await fixture(); missing.bodies.delete('/assets/WorldView-lazy.js');
  const first = await checkOfflineAssets(missing.reader,missing.info.entry);
  assert.equal(first.ready,false); assert.equal(first.mapReady,true); assert.deepEqual(first.missing,['/assets/WorldView-lazy.js']);
  const corrupt = await fixture(); corrupt.bodies.set('/assets/index-new.js','MAIN entry');
  assert.ok((await checkOfflineAssets(corrupt.reader,corrupt.info.entry)).missing.includes('/assets/index-new.js'));
  corrupt.bodies.set('/','bad cached navigation');
  assert.ok((await checkOfflineAssets(corrupt.reader,corrupt.info.entry)).missing.includes('/'));
});
test('hors ligne : manifeste altéré ou cache absent ne confirme aucune préparation', async () => {
  const { info, reader, bodies } = await fixture(); bodies.set('/build-info.json',JSON.stringify({...info,id:'0'.repeat(64)}));
  assert.equal((await checkOfflineAssets(reader,info.entry)).ready,false);
  assert.equal((await checkOfflineAssets({names:async()=>[],match:async()=>undefined},info.entry)).buildId,null);
});
test('contrôle daté : métadonnées bornées et isolées par compte/carnet, aucune source copiée', () => {
  const receipt = {version:1,checkedAt:'2026-10-08T10:00:00.000Z',tripDigest:'a'.repeat(64),buildId:'b'.repeat(64),ready:true};
  assert.deepEqual(readOfflineReceipt(JSON.stringify(receipt)),receipt);
  for(const raw of [null,'broken',JSON.stringify({...receipt,raw:'private notes'}),JSON.stringify({...receipt,checkedAt:'2026-02-30T10:00:00.000Z'}),' '.repeat(1025)]) assert.equal(readOfflineReceipt(raw),null);
  assert.notEqual(offlineReceiptKey('A','trip'),offlineReceiptKey('B','trip'));
  assert.notEqual(offlineReceiptKey('a:b','c'),offlineReceiptKey('a','b:c'));
});
test('synchronisation : copie, file, requête active, conflit, compte absent et échec local distincts', () => {
  const record = {revision:1,pending:true,lastSynced:'2026-10-08T10:00:00Z'};
  const input = {account:true,record,connected:true,online:true};
  assert.equal(tripSaveStatus(input),'En attente d’envoi');
  assert.equal(tripSaveStatus({...input,working:true}),'Synchronisation en cours…');
  assert.equal(tripSaveStatus({...input,working:true,online:false}),'En attente d’envoi');
  assert.equal(tripSaveStatus({...input,record:{...record,pending:false}}),'Synchronisé');
  assert.equal(tripSaveStatus({...input,record:{...record,pending:false},connected:false}),'Enregistré sur cet appareil');
  assert.equal(tripSaveStatus({...input,record:{...record,conflict:{}}}),'Conflit à résoudre');
  assert.equal(tripSaveStatus({...input,record:{...record,revoked:true}}),'Accès retiré');
  assert.equal(tripSaveStatus({...input,storageError:'quota'}),'Enregistrement local impossible');
  assert.equal(tripSaveStatus({...input,saving:true}),'Enregistrement sur cet appareil…');
  assert.equal(tripSaveStatus({account:false}),'Enregistré sur cet appareil');
});
import { offlineDictionary } from '../src/locales/offline.ts';
test('offline checklist and recovery translations are complete', () => {
  for (const index of [0,1,2]) {
    const dictionary=offlineDictionary(index);
    assert.ok(Object.keys(dictionary).length >= 25);
    assert.ok(Object.values(dictionary).every(value=>typeof value==='string' && value.trim().length > 0));
  }
});
