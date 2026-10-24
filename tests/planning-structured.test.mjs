import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readStructuredPlanning, readStructuredFile, STRUCTURED_LIMITS, PUBLIC_PLANNING_SCHEMA, structuredMessages } from '../src/planning-import/public-contract.ts';
import { COMPLETE_PUBLIC_EXAMPLE, MINIMAL_PUBLIC_EXAMPLE } from '../src/planning-import/public-examples.ts';
import { prepareStructured } from '../src/planning-import/structured.ts';
import { validateDraft, draftToTrip, correctField } from '../src/planning-import/draft.ts';
import { createSession, saveSession, loadSession, commitImport, DRAFT_KEY } from '../src/planning-import/persistence.ts';
import { blankTrip, writeTrip, tripKey, listTrips, archive, parseImport } from '../src/journeys.ts';
import { AccountStorage } from '../src/cloud/storage.ts';
import { importKit, kitPath } from '../src/planning-import/import-kit.ts';
import { translate } from '../src/locale-utils.ts';
const mutate=fn=>{const copy=structuredClone(COMPLETE_PUBLIC_EXAMPLE);fn(copy);return JSON.stringify(copy);};
const input=JSON.stringify(COMPLETE_PUBLIC_EXAMPLE);
class MemoryStorage {
 values=new Map();failOn=null;interrupt=false;
 get length(){return this.values.size;} key(i){return [...this.values.keys()][i]??null;}
 getItem(k){return this.values.get(k)??null;} removeItem(k){this.values.delete(k);}
 setItem(k,v){if(k===this.failOn)throw new Error('Quota');this.values.set(k,v);if(this.interrupt&&k.startsWith('a-l-est-trip-v2:'))throw new Error('Interrupted');}
}
const session=(scope='local')=>({...createSession(scope),...prepareStructured(input),currency:'CNY',timezone:'Asia/Shanghai'});
test('public minimum and full JSON adapt deterministically with external paths, never user evidence',()=>{
 for(const value of [MINIMAL_PUBLIC_EXAMPLE,COMPLETE_PUBLIC_EXAMPLE]){
  const source=JSON.stringify(value);assert.deepEqual(readStructuredPlanning(source),value);const prepared=prepareStructured(source);
  assert.equal(prepared.source,source);assert.equal(prepared.draft.title,value.title);assert.equal(prepared.draft.evidence.title.origin,'external');
  assert.throws(()=>validateDraft(prepared.draft,source));assert.throws(()=>validateDraft(prepared.draft,source,true));
  validateDraft(prepared.draft,source,true,false,true);
 }
 const p=prepareStructured(input),trip=draftToTrip(p.draft,{...p,currency:'CNY',timezone:'Asia/Shanghai',departureDate:'',keepSource:true});
 assert.equal(trip.cities[0].name,'上海');assert.equal(trip.cities[1].days[0].date,undefined);assert.equal(trip.stays[0].checkIn,'2027-05-03');
 assert.equal(trip.transfers[0].booked,false);assert.equal(trip.transfers[0].departure,'2027-05-04T09:00');assert.equal(trip.bookings.length,1);assert.equal(trip.customBonus.length,2);
 assert.equal(trip.expenses,undefined);assert.ok(trip.documents.some(d=>d.content.includes('80 CNY')));assert.ok(trip.documents.some(d=>d.content===input&&!d.title.includes('texte original')));
 const corrected=correctField(p.draft,'title','Correction personnelle');assert.equal(corrected.evidence.title.origin,'user');validateDraft(corrected,input,true,false,true);
});
test('bad format/version, backup, fields, bounds, dates, hours and unsafe schemes fail with paths',async()=>{
 const cases=[['[]','format'],['{','syntax'],['```json\n'+input+'\n```','syntax'],[JSON.stringify({version:2,scope:'trip'}),'backup'],
  [mutate(p=>p.version=2),'version'],[mutate(p=>p.role='owner'),'field'],[mutate(p=>p.cities[0].days[0].items[0].id='injected'),'field'],
  [mutate(p=>p.cities[0].days[0].date='2027-02-30'),'value'],[mutate(p=>p.cities[0].days[0].items[1].time='25:00'),'value'],[mutate(p=>p.cities[0].days[0].items[0].address='javascript:alert(1)'),'value'],
  [mutate(p=>p.cities[0].days[0].items[0].address='data:text/html,test'),'value'],[mutate(p=>p.cities[1].days[0].items[0].reservation.status='confirmed'),'value'],[mutate(p=>p.cities[0].days[0].items[2].from='Other'),'value'],
  [mutate(p=>p.cities[0].days[0].items[0].checkOut='2027-05-01'),'value'],[mutate(p=>p.cities[0].days[0].items[0].title=''),'value'],
  [mutate(p=>p.cities=Array(11).fill(p.cities[0])),'limit'],[mutate(p=>p.notes=Array(101).fill('note')),'limit'],['['.repeat(13)+']'.repeat(13),'limit'],
  [input.replace('"version":1','"version":1,"version":1'),'syntax'],[input.replace('"version":1','"version":1,"__proto__":{"polluted":true}'),'field'],[' '.repeat(50_001),'size']];
 for(const [source,code] of cases)assert.throws(()=>readStructuredPlanning(source),e=>e.code===code&&e.path.startsWith('$'),source.slice(0,120));
 assert.equal({}.polluted,undefined);
 await assert.rejects(()=>readStructuredFile({name:'test.json',size:STRUCTURED_LIMITS.bytes+1,arrayBuffer:()=>{throw new Error('must not read');}}),{code:'size'});
 await assert.rejects(()=>readStructuredFile({name:'test.json',size:1,arrayBuffer:async()=>Uint8Array.from([0xff]).buffer}),{code:'syntax'});
 const p=prepareStructured(input);p.draft.cities[0].days[0].items[1].title='Invented';assert.throws(()=>validateDraft(p.draft,input,true,false,true));
 p.draft.cities[0].days[0].items[0].evidence.booked={origin:'external',path:'$.notes[0]',quote:JSON.stringify(COMPLETE_PUBLIC_EXAMPLE.notes[0])};assert.throws(()=>validateDraft(p.draft,input,true,false,true));
});
test('unmapped transfers, Unicode and literal markup remain text without expense creation',()=>{
 const source=mutate(p=>{p.cities[0].days[0].items[2].from=null;p.notes.push('<script>globalThis.PWNED=true</script>');p.title='A "quoted" title\n中文';});
 const p=prepareStructured(source);const trip=draftToTrip(p.draft,{...p,currency:'EUR',timezone:'UTC',departureDate:'',keepSource:false});
 assert.equal(trip.transfers.length,0);assert.ok(trip.documents.some(d=>d.content.includes('[unmapped transfer]')));assert.ok(trip.documents.some(d=>d.content.includes('<script>')));assert.equal(globalThis.PWNED,undefined);
});
test('structured correction, quota/interruption/replay, intentional copy, export and account scope preserve data',()=>{
 const store=new MemoryStorage(),old=blankTrip({title:'Existing'});writeTrip(store,old);const before=store.getItem(tripKey(old.journey.id)),s=session();saveSession(store,s);
 store.failOn=tripKey(s.id);assert.throws(()=>commitImport(store,s));assert.equal(loadSession(store,'local').source,input);
 store.failOn=null;store.interrupt=true;assert.throws(()=>commitImport(store,loadSession(store,'local')));store.interrupt=false;
 const trip=commitImport(store,loadSession(store,'local'));assert.equal(commitImport(store,loadSession(store,'local')).journey.id,trip.journey.id);assert.equal(listTrips(store).length,2);
 assert.equal(store.getItem(tripKey(old.journey.id)),before);assert.deepEqual(parseImport(JSON.stringify(archive(trip)))[0].cities.map(c=>c.name),['上海','苏州']);
 assert.notEqual(commitImport(store,session()).journey.id,trip.journey.id);
 store.failOn=DRAFT_KEY;assert.throws(()=>saveSession(store,{...s,source:'bad'}));assert.equal(loadSession(store,'local').source,input);
 const backing=new MemoryStorage(),a=new AccountStorage(backing,'A'),b=new AccountStorage(backing,'B'),sa=session('A');saveSession(a,sa);assert.equal(loadSession(b,'B'),null);
 const local=commitImport(a,sa);assert.equal(a.record(tripKey(local.journey.id)).localOnly,true);assert.equal(a.record(tripKey(local.journey.id)).pending,false);assert.throws(()=>commitImport(b,sa));
});
test('every downloaded kit and example is generated from the exact runtime contract',async()=>{
 assert.deepEqual(JSON.parse(await readFile('public/import-kit/detours-planning-v1.schema.json','utf8')),PUBLIC_PLANNING_SCHEMA);
 for(const language of ['fr','en','zh-CN','es']) {
  const text=await readFile('public'+kitPath(language),'utf8');assert.equal(text,importKit(language));assert.ok(!text.includes('C:/Users'));
  const blocks=[...text.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>m[1]);assert.equal(blocks.length,3);assert.deepEqual(JSON.parse(blocks[0]),PUBLIC_PLANNING_SCHEMA);blocks.slice(1).forEach(readStructuredPlanning);
  for(const message of Object.values(structuredMessages))if(language!=='fr')assert.notEqual(translate(message,language),message);
 }
 for(const name of ['minimal','complet'])readStructuredPlanning(await readFile(`public/import-kit/exemple-${name}.detours.json`,'utf8'));
});
