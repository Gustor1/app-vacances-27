import test from 'node:test';
import assert from 'node:assert/strict';
import { imageHeader, MEDIA_LIMITS, souvenirKey, SOUVENIR_EXCLUSION, exportSouvenirs, prepareSouvenirRestore } from '../src/souvenirs.ts';
import { souvenirDictionary } from '../src/locales/souvenirs.ts';
import { exportBackup, prepareRestore, applyRestore } from '../src/backup.ts';
import { archive, blankTrip, tripKey, parseTrip } from '../src/journeys.ts';

test('encoded image budgets reject unknown formats, truncated data and oversized pixels before decoding',()=>{
  for(const bytes of [new Uint8Array(),new TextEncoder().encode('<svg/>'),new Uint8Array([255,216,255,225,0,30])]) assert.throws(()=>imageHeader(bytes),/media-format/);
  const png=new Uint8Array(24);png.set([137,80,78,71,13,10,26,10]);const v=new DataView(png.buffer);v.setUint32(12,0x49484452);v.setUint32(16,4000);v.setUint32(20,3000);
  assert.deepEqual(imageHeader(png),{type:'image/png',width:4000,height:3000});
  v.setUint32(16,10000);assert.equal(imageHeader(png).width,10000);v.setUint32(20,10000);assert.throws(()=>imageHeader(png),/media-size/);
  v.setUint32(16,MEDIA_LIMITS.side+1);v.setUint32(20,1);assert.throws(()=>imageHeader(png),/media-size/);
  const jpeg=Uint8Array.from([255,216,255,192,0,8,8,0,60,0,80,3]);assert.deepEqual(imageHeader(jpeg),{type:'image/jpeg',width:80,height:60});
  const webp=new Uint8Array(30);webp.set(new TextEncoder().encode('RIFF'),0);webp.set(new TextEncoder().encode('WEBPVP8X'),8);webp[24]=79;webp[27]=59;assert.deepEqual(imageHeader(webp),{type:'image/webp',width:80,height:60});
});

test('scope keys cannot collide, including crafted separators and account switches',()=>{
  assert.notEqual(souvenirKey('local','a:b','c'),souvenirKey('local','a','b:c'));
  assert.notEqual(souvenirKey('account:a','trip','day'),souvenirKey('account:b','trip','day'));
  assert.notEqual(souvenirKey('local','trip','day'),souvenirKey('account:a','trip','day'));
});

test('versioned note package rejects malformed or duplicate entries and preserves existing values',async()=>{
  const rows=[{day:'d',caption:'souvenir <script>private</script>'}];
  const raw=await exportSouvenirs(rows);
  assert.deepEqual(await prepareSouvenirRestore(raw,['d'],[]),{writes:[{day:'d',before:null,value:{caption:rows[0].caption}}],skipped:0});
  assert.deepEqual(await prepareSouvenirRestore(raw,['d'],[{day:'d'}]),{writes:[],skipped:1});
  assert.deepEqual(await prepareSouvenirRestore(raw,['other'],[]),{writes:[],skipped:1});
  for(const value of [null,{version:2,scope:'detours-personal-media',entries:[]},{version:1,scope:'detours-personal-media',entries:[...rows,...rows]},{version:1,scope:'detours-personal-media',entries:[{day:'d',caption:'x'.repeat(501)}]}]) await assert.rejects(prepareSouvenirRestore(JSON.stringify(value),['d'],[]),/media-invalid/);
  await assert.rejects(exportSouvenirs([{day:'d',caption:'',photo:new Blob(['fake'],{type:'image/png'})}]),/media-invalid/);
});

test('historical trip/full backup formats still restore and the media exclusion travels inside every new backup',async()=>{
  class Storage { values=new Map(); get length(){return this.values.size;} key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);} }
  const source=new Storage(),target=new Storage(),trip=blankTrip({title:'Lot09 fictif'});source.setItem(tripKey(trip.journey.id),JSON.stringify(archive(trip)));
  assert.deepEqual(parseTrip(source.getItem(tripKey(trip.journey.id))).state,trip);
  const raw=await exportBackup(source,source);assert.ok(JSON.parse(raw).exclusions.includes(SOUVENIR_EXCLUSION));
  const plan=await prepareRestore(raw,target);applyRestore(target,plan);assert.equal(plan.trips,1);
  const historical=await prepareRestore(JSON.stringify(archive(trip)),new Storage());assert.equal(historical.trips,1);
});

test('all memory messages are translated with matching interpolation',()=>{
  for(const index of [0,1,2]) for(const [source,target] of Object.entries(souvenirDictionary(index))) {
    assert.ok(target);assert.notEqual(target,source);assert.deepEqual([...source.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...target.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort());
  }
});
