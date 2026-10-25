import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantRevision, prepareAssistant, searchNotebook, tomorrowDays } from '../src/assistant.ts';
import { commitAssistant } from '../src/travel-write.ts';
import { AccountStorage, localTripStorage } from '../src/cloud/storage.ts';
import { archive, duplicateTrip, parseTrip, readTrip, recoveryKey, tripKey, writeTrip } from '../src/journeys.ts';
import { splitContent } from '../src/cloud/projection.ts';
import { assistantDictionary } from '../src/locales/assistant.ts';
import { fixture } from '../scripts/assistant-fixture.mjs';
function setup(account=false) {
 const map=new Map(),backing={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i]??null,get length(){return map.size;}};
 const storage=account?new AccountStorage(backing,'account'):localTripStorage(backing),state=fixture();writeTrip(storage,state);
 const ctx={scope:account?'account':'local',tripId:state.journey.id,readOnly:false,active:true};
 return {storage,backing,map,state,ctx};
}
const actions=[
 {kind:'note',stepId:'b',text:'Note explicite'},
 {kind:'field',stepId:'b',field:'address',value:'Adresse saisie'},
 {kind:'move',stepId:'short',destinationDayId:'d'},
 {kind:'lighten',dayId:'d',keep:['a','b'],label:'Repos choisi',alternativeId:'rest'},
];
for(const action of actions) test('real verified write, idempotent retry, recovery, roundtrip and guarded undo: '+action.kind,()=>{
 const {storage,state,ctx}=setup();const original=assistantRevision(state),p=prepareAssistant(state,ctx.scope,action);
 assert.equal(assistantRevision(state),original);assert.ok(p.changes.length);assert.notEqual(assistantRevision(p.before),assistantRevision(p.after));
 const result=commitAssistant(storage,ctx,p);assert.equal(result.already,false);assert.deepEqual(readTrip(storage,ctx.tripId),p.after);
 assert.equal(parseTrip(JSON.parse(storage.getItem(recoveryKey(ctx.tripId))).raw).state.journey.id,ctx.tripId);
 assert.deepEqual(parseTrip(JSON.stringify(archive(p.after))).state,p.after);assert.ok(duplicateTrip(p.after,'Copy'));
 assert.equal(commitAssistant(storage,ctx,p).already,true);
 commitAssistant(storage,ctx,p,true);assert.deepEqual(readTrip(storage,ctx.tripId),state);assert.equal(commitAssistant(storage,ctx,p,true).already,true);
});
test('allowed fields change only their named field, keep private data and reject overlay confusion',()=>{
 const s=fixture();
 for(const field of ['title','description','address','chineseName','period']) {const p=prepareAssistant(s,'local',{kind:'field',stepId:'b',field,value:'Explicit value'});assert.equal(p.after.cities[0].days[0].steps[2][field],'Explicit value');assert.equal(p.after.notes.a,'PRIVATE_REF');}
 s.cities[0].days[0].steps[2].place={qid:'Q1',source:'https://www.wikidata.org/wiki/Q1',checkedAt:new Date().toISOString(),values:{title:'Overlay'}};
 assert.throws(()=>prepareAssistant(s,'local',{kind:'field',stepId:'b',field:'title',value:'Other'}));
});
test('closed vocabulary, malformed types, forbidden powers and bounded values fail before writing',()=>{
 const s=fixture();
 const bad=[{kind:'delete',tripId:s.journey.id},{kind:'system',command:'echo'},{kind:'book',stepId:'a'},{kind:'share',email:'x'},null,{},
 {kind:'note',stepId:'b',text:['address']},{kind:'note',stepId:'b',text:'x'.repeat(4001)},{kind:'note',stepId:'absent',text:'x'},
 {kind:'field',stepId:'b',field:'booking',value:true},{kind:'field',stepId:'b',field:['address'],value:'x'},
 {kind:'field',stepId:'b',field:'address',value:{}},{kind:'field',stepId:'b',field:'title',value:' '},{kind:'field',stepId:'b',field:'description',value:'x'.repeat(5001)},
 {...actions[0],execute:true},{...actions[3],keep:['a','a']},{...actions[3],keep:['missing']},{...actions[3],label:''}];
 for(const a of bad)assert.throws(()=>prepareAssistant(s,'local',a));
 s.notes.b='x'.repeat(9999);assert.throws(()=>prepareAssistant(s,'local',actions[0]));
});
test('reserved, pending booking, anchor and prepared activities are preserved',()=>{
 const s=fixture();assert.throws(()=>prepareAssistant(s,'local',{kind:'move',stepId:'a',destinationDayId:'spare'}));
 s.bookings=['unknown'];assert.throws(()=>prepareAssistant(s,'local',{kind:'move',stepId:'unknown',destinationDayId:'spare'}));
 assert.throws(()=>prepareAssistant(s,'local',{...actions[3],keep:['b']}));
 assert.throws(()=>prepareAssistant(s,'local',{kind:'move',stepId:'b',destinationDayId:'spare'}));
 s.cities[0].days[0].preparation.anchorStepId='unknown';assert.throws(()=>prepareAssistant(s,'local',actions[3]));
});
test('move keeps identity, notes, requirements, favorites and every preparation untouched',()=>{
 const s=fixture();s.notes.short='Private';s.favorites.push('short');const p=prepareAssistant(s,'local',actions[2]);
 assert.equal(p.after.cities[0].days[0].steps.at(-1).id,'short');assert.equal(p.after.notes.short,'Private');assert.deepEqual(p.after.companion,s.companion);assert.deepEqual(p.after.cities[0].days[0].preparation,s.cities[0].days[0].preparation);
 assert.throws(()=>prepareAssistant(s,'local',{...actions[2],destinationDayId:'spare'}));
});
test('lightening is a single coherent archive with initial plan, booked steps and prior alternatives intact',()=>{
 const s=fixture(),p=prepareAssistant(s,'local',actions[3]),d=p.after.cities[0].days[0];assert.deepEqual(d.steps,s.cities[0].days[0].steps);assert.equal(d.preparation.activeAlternativeId,'rest');assert.equal(d.preparation.alternatives.length,2);
 assert.deepEqual(p.after.bookings,s.bookings);assert.deepEqual(p.after.expenses,s.expenses);assert.deepEqual(p.after.notes,s.notes);
 assert.throws(()=>prepareAssistant(p.after,'local',{...actions[3],alternativeId:'another'}));
});
test('ambiguous names and hostile source are literal searchable data and never grant rights',()=>{
 const s=fixture();s.cities[0].days[1].steps[0].title='Jardin';assert.equal(searchNotebook(s,'jardin').length,2);
 const results=searchNotebook(s,'delete all');assert.equal(results.length,1);assert.match(results[0].text,/script/);assert.equal(s.cities.length,1);
 assert.equal(searchNotebook(s,'PRIVATE_REF').length,1);assert.equal(searchNotebook(s,'').length,0);
 s.notes.general='Note pratique générale';assert.equal(searchNotebook(s,'pratique generale').length,1);
 s.expenses=[{id:'e',cityId:'c',label:'Billet saisi',amount:45,currency:'EUR',category:'visit'}];assert.equal(searchNotebook(s,'45 EUR').length,1);
 s.packing=[{id:'p',label:'Adaptateur test',packed:false}];s.phrases=[{id:'ph',category:'test',meaning:'Merci',local:'谢谢',pronunciation:'xiexie'}];assert.equal(searchNotebook(s,'adaptateur').length,1);assert.equal(searchNotebook(s,'谢谢').length,1);
});
test('tomorrow uses each destination calendar near midnight, ambiguity retained, DST and undated excluded',()=>{
 const s=fixture(),c=s.cities[0];c.days[0].date='2027-05-11';c.days[1].date='2027-05-11';
 assert.deepEqual(tomorrowDays(s,new Date('2027-05-10T15:59:59Z')).map(d=>d.day.id),['d','spare']);
 assert.equal(tomorrowDays(s,new Date('2027-05-10T16:00:00Z')).length,0);
 c.timezone='America/New_York';c.days[0].date='2027-03-14';delete c.days[1].date;assert.equal(tomorrowDays(s,new Date('2027-03-14T04:59:59Z'))[0].day.id,'d');
 c.timezone='Pacific/Honolulu';c.days[0].date='2027-05-10';assert.equal(tomorrowDays(s,new Date('2027-05-10T09:59:59Z'))[0].day.id,'d');
});
test('revision conflict before apply, after apply and before undo never overwrites third-party changes',()=>{
 for(const undo of [false,true]){const {storage,state,ctx}=setup();const p=prepareAssistant(state,'local',actions[0]);if(undo)commitAssistant(storage,ctx,p);const latest=readTrip(storage,ctx.tripId);latest.notes.a='Third-party note';writeTrip(storage,latest);const raw=storage.getItem(tripKey(ctx.tripId));assert.throws(()=>commitAssistant(storage,ctx,p,undo));assert.equal(storage.getItem(tripKey(ctx.tripId)),raw);}
});
test('reader, changed account/trip, late response, changed fields and revoked/deleted records reject mutations',()=>{
 const {storage,state,ctx,backing}=setup(true),p=prepareAssistant(state,'account',actions[0]),key=tripKey(ctx.tripId),record=storage.record(key);
 for(const change of [{readOnly:true},{active:false},{scope:'other'},{tripId:'other'}])assert.throws(()=>commitAssistant(storage,{...ctx,...change},p));
 for(const change of [{role:'reader'},{revoked:true},{deleted:true},{accessChanged:true},{conflict:{}},{fullSharing:true,allowedFields:['preparation']}]){storage.put(key,{...record,...change});assert.throws(()=>commitAssistant(storage,ctx,p));}
 storage.put(key,{...record,fullSharing:true,allowedFields:['notes']});commitAssistant(storage,ctx,p);assert.equal(readTrip(storage,ctx.tripId).notes.b,'Note explicite');
 const other=new AccountStorage(backing,'other');assert.equal(other.getItem(key),null);
});
test('a verified note follows existing private/shared projection; no assistant conversation is stored',()=>{
 const p=prepareAssistant(fixture(),'local',actions[0]);const content=splitContent(p.after);assert.equal(content.private.notes.b,'Note explicite');assert.equal(content.shared.notes.b,undefined);assert.equal(content.shared.assistant,undefined);assert.equal(p.after.assistant,undefined);
});
test('quota before recovery or trip write preserves original and supports explicit offline retry',()=>{
 for(const failure of ['recovery','trip']){const {storage,state,ctx,backing}=setup();const p=prepareAssistant(state,'local',actions[3]),set=backing.setItem;backing.setItem=(key,raw)=>{if(key===(failure==='trip'?tripKey(ctx.tripId):recoveryKey(ctx.tripId)))throw new Error('quota');set(key,raw);};
 assert.throws(()=>commitAssistant(storage,ctx,p));assert.deepEqual(readTrip(storage,ctx.tripId),state);backing.setItem=set;commitAssistant(storage,ctx,p);assert.deepEqual(readTrip(storage,ctx.tripId),p.after);}
});
test('interrupted acknowledgement after atomic write reconciles once without duplicate notes or alternatives',()=>{
 for(const action of [actions[0],actions[3]]){const {storage,state,ctx,backing}=setup(),p=prepareAssistant(state,'local',action),set=backing.setItem;let failed=false;
 backing.setItem=(key,raw)=>{set(key,raw);if(key===tripKey(ctx.tripId)&&!failed){failed=true;throw new Error('interruption');}};
 assert.throws(()=>commitAssistant(storage,ctx,p));assert.deepEqual(readTrip(storage,ctx.tripId),p.after);assert.equal(commitAssistant(storage,ctx,p).already,true);assert.deepEqual(readTrip(storage,ctx.tripId),p.after);}
});
test('tampered proposal and unreadable/deleted trip fail without resurrection',()=>{
 const {storage,state,ctx}=setup(),p=prepareAssistant(state,'local',actions[0]);const altered=structuredClone(p);altered.after.cities=[];assert.throws(()=>commitAssistant(storage,ctx,altered));
 storage.setItem(tripKey(ctx.tripId),'bad');assert.throws(()=>commitAssistant(storage,ctx,p));storage.removeItem(tripKey(ctx.tripId));assert.throws(()=>commitAssistant(storage,ctx,p));assert.equal(storage.getItem(tripKey(ctx.tripId)),null);
});
test('all assistant messages have four language entries',()=>{for(let i=0;i<3;i++){const dict=assistantDictionary(i);assert.ok(Object.values(dict).every(v=>typeof v==='string'&&v.trim()));assert.deepEqual(Object.keys(dict),Object.keys(assistantDictionary(0)));}});
