import test from 'node:test';
import assert from 'node:assert/strict';
import { WikimediaClient, WikimediaError } from '../src/places/wikimedia.ts';
import { validAssociation, validPhoto, placeStep } from '../src/places/model.ts';
import { archive, blankTrip, parseTrip, duplicateTrip } from '../src/journeys.ts';
import { validateState } from '../src/lib.ts';
import { splitContent, joinContent } from '../src/cloud/projection.ts';
import { contentRaw, acceptRemote, syncRecord, recordContent } from '../src/cloud/engine.ts';
import { AccountStorage } from '../src/cloud/storage.ts';
import { mergeChanges } from '../src/persistence.ts';
const signal = () => new AbortController().signal;
const response = data => new Response(JSON.stringify(data));
const claim = value => [{rank:'normal', mainsnak:{datavalue:{value}}}];
const entity = {entities:{Q243:{id:'Q243',labels:{fr:{value:'Tour Eiffel'},zh:{value:'埃菲尔铁塔'}},descriptions:{fr:{value:'Monument à Paris'}},claims:{P625:claim({latitude:48.8584,longitude:2.2945,globe:'http://www.wikidata.org/entity/Q2'}),P856:claim('https://www.toureiffel.paris/'),P18:claim('Eiffel.jpg')}}}};
const photo = {url:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Eiffel.jpg/640px-Eiffel.jpg',source:'https://commons.wikimedia.org/wiki/File:Eiffel.jpg',author:'Photo Author',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',width:640,height:960,mime:'image/jpeg'};
const imageinfo = {query:{pages:{1:{imageinfo:[{thumburl:photo.url,descriptionurl:photo.source,thumbwidth:640,thumbheight:960,mime:photo.mime,width:4000,height:6000,extmetadata:{Artist:{value:'<a href="https://example.org">Photo Author</a>'},LicenseShortName:{value:photo.license},LicenseUrl:{value:photo.licenseUrl}}}]}}}};
const association = {qid:'Q243',source:'https://www.wikidata.org/wiki/Q243',checkedAt:'2026-10-21T01:00:00.000Z',values:{coordinates:[48.8584,2.2945],photo}};
const step = {id:'step-public',title:'Personal title',chineseName:'My correction',description:'PRIVATE NOTES',category:'visit',coordinates:[1,2]};

test('search only sends explicit public terms/language, candidates remain distinct, bounded cache and malformed response', async () => {
 const calls=[];const client=new WikimediaClient(async(url,options)=>{calls.push({url,options});return response({search:[{id:'Q243',label:'Eiffel Tower',description:'Paris'},{id:'Q123',label:'Eiffel Tower',description:'Replica'},{id:'bad',label:'invalid'}]});});
 const candidates=await client.search('Eiffel','Paris','France','en',signal());assert.equal(candidates.length,2);assert.notEqual(candidates[0].qid,candidates[1].qid);
 await client.search('Eiffel','Paris','France','en',signal());assert.equal(calls.length,1);
 const url=new URL(calls[0].url);assert.equal(url.searchParams.get('search'),'Eiffel Paris France');assert.equal(url.searchParams.get('origin'),'*');assert.equal(calls[0].options.credentials,'omit');assert.match(calls[0].options.headers['Api-User-Agent'],/Detours/);assert.ok(!calls[0].url.includes('PRIVATE'));
 assert.deepEqual(await new WikimediaClient(async()=>response({search:[]})).search('x','','','fr',signal()),[]);
 await assert.rejects(new WikimediaClient(async()=>response({})).search('x','','','fr',signal()),e=>e.code==='invalid');
});
test('targeted entity/Commons lookup validates coordinates, URLs, dimensions and full credits without injecting markup', async () => {
 const client=new WikimediaClient(async url=>response(String(url).includes('commons')?imageinfo:entity));const result=await client.details('Q243','fr',signal());
 assert.equal(result.qid,'Q243');assert.deepEqual(result.values.coordinates,[48.8584,2.2945]);assert.equal(result.values.chineseName,'埃菲尔铁塔');assert.deepEqual(result.values.photo,photo);assert.ok(validAssociation(result));
 for(const invalid of [{...photo,license:'Unknown'},{...photo,licenseUrl:'https://example.org'},{...photo,mime:'image/svg+xml'},{...photo,width:10000},{...photo,url:'javascript:alert(1)'},{...photo,url:'https://evil.example/a.jpg'},{...photo,author:''}]) assert.equal(validPhoto(invalid),false);
 for(const values of [{coordinates:[Infinity,0]},{coordinates:[91,0]},{coordinates:['1',2]},{website:'http://unsafe.example'},{website:'javascript:alert(1)'},{website:'https://user:password@example.org'},{photo:{...photo,height:0}}]) assert.equal(validAssociation({...association,values}),false);
 const bad=structuredClone(entity);bad.entities.Q243.claims.P625=claim({latitude:999,longitude:2,globe:'http://www.wikidata.org/entity/Q2'});bad.entities.Q243.claims.P856=claim('javascript:alert(1)');delete bad.entities.Q243.claims.P18;
 const noPhoto=await new WikimediaClient(async()=>response(bad)).details('Q243','fr',signal());assert.deepEqual(Object.keys(noPhoto.values).sort(),['chineseName','title']);
 const unsupported=structuredClone(imageinfo);unsupported.query.pages[1].imageinfo[0].extmetadata.LicenseShortName.value='GFDL';assert.equal(await new WikimediaClient(async()=>response(unsupported)).photo('test',signal()),undefined);
});
test('429/503 honor Retry-After seconds and dates, no automatic retries; timeout/cancel/malformed and bounded concurrency', async () => {
 for(const status of [429,503])for(const retry of ['120',new Date(Date.now()+120000).toUTCString()]){let calls=0;const client=new WikimediaClient(async()=>{calls++;return new Response('',{status,headers:{'Retry-After':retry}});});await assert.rejects(client.search('x','','','fr',signal()),e=>e.code==='rate');await assert.rejects(client.search('y','','','fr',signal()),e=>e.code==='rate');assert.equal(calls,1);}
 const malformed=new WikimediaClient(async()=>new Response('{'));await assert.rejects(malformed.search('x','','','fr',signal()),e=>e.code==='invalid');
 await assert.rejects(new WikimediaClient(async()=>response({error:{code:'maxlag'}})).search('x','','','fr',signal()),e=>e.code==='rate');
 const slow=(_,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(o.signal.reason),{once:true}));
 const keepAlive=setInterval(()=>{},1000);
 try{const timed=new WikimediaClient(slow,10);await assert.rejects(timed.search('x','','','fr',signal()),e=>e instanceof WikimediaError && e.code==='network');
 const client=new WikimediaClient(slow);const controller=new AbortController();const pending=client.search('x','','','fr',controller.signal);await assert.rejects(client.search('y','','','fr',signal()));controller.abort();await assert.rejects(pending,e=>e.name==='AbortError');}finally{clearInterval(keepAlive);}
});
test('accepted coordinates preserve personal title/originals; export/restore/duplicate, private projection and removal are reversible',()=>{
 const state=blankTrip({title:'Private journey'});state.cities=[{id:'city',name:'Paris',chineseName:'',subtitle:'',color:'',image:'',notes:[],days:[{id:'day',title:'Visit',steps:[{...step,place:association}]}]}];
 assert.ok(validateState(state));const projected=placeStep(state.cities[0].days[0].steps[0]);assert.equal(projected.title,step.title);assert.deepEqual(projected.coordinates,[48.8584,2.2945]);assert.deepEqual(state.cities[0].days[0].steps[0].coordinates,[1,2]);
 const restored=parseTrip(JSON.stringify(archive(state))).state;assert.deepEqual(restored,state);assert.deepEqual(duplicateTrip(state,'Copy').cities[0].days[0].steps[0].place,association);
 const content=splitContent(state);assert.equal(content.shared.cities[0].days[0].steps[0].place,undefined);assert.ok(!JSON.stringify(content).includes('Q243'));assert.equal(joinContent(content).cities[0].days[0].steps[0].place,undefined);assert.deepEqual(parseTrip(contentRaw('a-l-est-trip-v2:'+state.journey.id,content,JSON.stringify(archive(state)))).state.cities[0].days[0].steps[0].place,association);
 const another=structuredClone(content);another.private={notes:{},favorites:[],done:[],bookings:[],cityNotes:{},stayNotes:{},transferPrivate:{},bonusPrivate:{}};assert.equal(joinContent(another).cities[0].days[0].steps[0].place,undefined);
 const removed={...state.cities[0].days[0].steps[0],place:undefined};assert.deepEqual(placeStep(removed).coordinates,[1,2]);
 const changed={...state.cities[0].days[0].steps[0],title:'Latest personal correction'};const merged=mergeChanges(state.cities[0].days[0].steps[0],removed,changed);assert.equal(merged.title,'Latest personal correction');assert.equal(merged.place,undefined);
 const other={qid:'Q123',source:'https://www.wikidata.org/wiki/Q123',checkedAt:association.checkedAt,values:{website:'https://example.org/'}};
 assert.deepEqual(mergeChanges(undefined,other,association),other);
 const old=structuredClone(state);delete old.cities[0].days[0].steps[0].place;assert.ok(validateState(old));for(const invalid of [{...association,qid:'bad'},{...association,values:{website:'javascript:alert(1)'}}]){old.cities[0].days[0].steps[0].place=invalid;assert.equal(validateState(old),false);}
});
test('account/device associations never enter uploads and survive acknowledgement, remote updates, retry and late concurrent removal',async()=>{
 const values=new Map();const backing={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),key:i=>[...values.keys()][i]??null,get length(){return values.size;}};
 const storage=new AccountStorage(backing,'account-a'),other=new AccountStorage(backing,'account-b');
 const state=blankTrip({title:'Local account'});state.cities=[{id:'city',name:'Paris',chineseName:'',subtitle:'',color:'',image:'',notes:[],days:[{id:'day',title:'Visit',steps:[{...step,place:association}]}]}];const key='a-l-est-trip-v2:'+state.journey.id;
 storage.setItem(key,JSON.stringify(archive(state)));
 const content=recordContent(key,storage.getItem(key));assert.ok(!JSON.stringify(content).includes('Q243'));
 const remote={content,revision:1,private_revision:1,role:'editor',deleted:false,fullSharing:true,allowedFields:['notes','preparation']};
 let uploads=0;const transport={save:async(_key,_record,payload)=>{uploads++;assert.ok(!JSON.stringify(payload).includes('Q243'));return{status:'saved',record:remote};}};
 await syncRecord(storage,key,transport);assert.equal(storage.record(key).pending,false);assert.deepEqual(parseTrip(storage.getItem(key)).state.cities[0].days[0].steps[0].place,association);assert.equal(uploads,1);
 acceptRemote(storage,key,{...remote,revision:2});assert.deepEqual(parseTrip(storage.getItem(key)).state.cities[0].days[0].steps[0].place,association);
 acceptRemote(other,key,remote);assert.equal(parseTrip(other.getItem(key)).state.cities[0].days[0].steps[0].place,undefined);
 const pending=parseTrip(storage.getItem(key)).state;pending.cities[0].days[0].steps[0].place={...association,values:{website:'https://example.org/'}};storage.setItem(key,JSON.stringify(archive(pending)));
 await assert.rejects(syncRecord(storage,key,{save:async()=>{throw new Error('offline');}}));assert.equal(storage.record(key).pending,true);
 await syncRecord(storage,key,{save:async()=>{const changed=parseTrip(storage.getItem(key)).state;delete changed.cities[0].days[0].steps[0].place;storage.setItem(key,JSON.stringify(archive(changed)));return{status:'saved',record:remote};}});
 assert.equal(parseTrip(storage.getItem(key)).state.cities[0].days[0].steps[0].place,undefined);assert.equal(storage.record(key).pending,true);await syncRecord(storage,key,transport);assert.equal(storage.record(key).pending,false);
 const reader=new AccountStorage(backing,'reader');acceptRemote(reader,key,{...remote,role:'reader'});assert.throws(()=>reader.setItem(key,JSON.stringify(archive(state))),/Lecture seule/);
 const otherTrip=structuredClone(content);otherTrip.shared.journey.id='other-trip';assert.equal(parseTrip(contentRaw(key,otherTrip,JSON.stringify(archive(state)))).state.cities[0].days[0].steps[0].place,undefined);
});
