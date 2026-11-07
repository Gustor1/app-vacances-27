import test from 'node:test';
import assert from 'node:assert/strict';
import { addIdea, departureIssues, dismissIssue, emptyCompanion, localIdeas, showCard, undoIdea, validCompanion } from '../src/companion.ts';
import { archive, parseTrip, duplicateTrip } from '../src/journeys.ts';
import { validateState } from '../src/lib.ts';
import { mergeChanges } from '../src/persistence.ts';
import { splitContent } from '../src/cloud/projection.ts';
import { contentRaw, acceptRemote, syncRecord, recordContent } from '../src/cloud/engine.ts';
import { AccountStorage } from '../src/cloud/storage.ts';
import { nowDays } from '../src/now.ts';
import { companionDictionary } from '../src/locales/companion.ts';
import { fixture } from '../scripts/companion-fixture.mjs';
test('departure checks only prove explicit bookings, requirements and pairwise complete intervals; no optional-empty or start-only false positives',()=>{
 const s=fixture();assert.deepEqual(departureIssues(s).map(i=>i.kind),['booking','overlap']);
 let dismissed=dismissIssue(s,departureIssues(s)[1]);assert.equal(departureIssues(dismissed).length,1);
 dismissed.notes.other='unrelated';assert.equal(departureIssues(dismissed).length,1);
 dismissed.cities[0].days[0].preparation.timings.b.durationMinutes=50;assert.equal(departureIssues(dismissed).length,2);
 s.bookings=['a'];s.cities[0].days[0].preparation.timings.b={startTime:'10:30'};assert.deepEqual(departureIssues(s),[]);
 s.companion.requirements=[{id:'r',stepId:'b',field:'address'}];assert.equal(departureIssues(s)[0].kind,'required');s.cities[0].days[0].steps[2].address='Confirmed address';assert.deepEqual(departureIssues(s),[]);
 s.cities[0].days[0].steps[2].address='';s.done=['b'];assert.deepEqual(departureIssues(s),[]);
 s.done=[];s.cities[0].days[0].preparation.activeAlternativeId='rain';assert.deepEqual(departureIssues(s).map(i=>i.kind),['required']);
});
test('dismissals reevaluate date/timezone or relevant data, not notes; stale issue cannot suppress new evidence',()=>{
 const s=fixture(),issue=departureIssues(s)[0];let next=dismissIssue(s,issue);assert.equal(departureIssues(next).length,1);
 next.cities[0].days[0].date='2027-05-11';assert.equal(departureIssues(next).length,2);assert.equal(dismissIssue(next,issue),next);
 next.cities[0].timezone='Pacific/Honolulu';assert.equal(departureIssues(next).length,2);
 const b=fixture();b.cities[0].days[0].date='2026-10-08';b.cities[0].timezone='Pacific/Honolulu';assert.equal(nowDays(b,null,new Date('2026-10-09T01:00Z'))[0].day.id,'d');
});
test('city-only saved ideas honor favorites, exclusions, completion, unknown durations and duplicates without coordinates',()=>{
 const s=fixture(),c=s.cities[0],d=c.days[0];let ideas=localIdeas(s,c,d);assert.deepEqual(ideas.map(i=>i.id),['bonus','short','long']);assert.equal(ideas[0].duration,undefined);assert.equal(ideas[1].duration,20);assert.equal(ideas[0].favorite,true);
 s.companion.excluded=['short'];s.done=['long'];assert.deepEqual(localIdeas(s,c,d).map(i=>i.id),['bonus']);
 s.customBonus.push({...s.customBonus[0],id:'duplicate'});assert.equal(localIdeas(s,c,d).length,1);
 const added=addIdea(s,c.id,d.id,localIdeas(s,c,d)[0],'added');assert.equal(localIdeas(added,added.cities[0],added.cities[0].days[0]).length,0);assert.equal(added.notes.a,'PRIVATE_REF');assert.equal(added.cities[0].days[0].steps.at(-1).description,'Lieu enregistré');assert.ok(!JSON.stringify(added.cities[0].days[0].steps.at(-1)).includes('PRIVATE_TIP'));
 assert.equal(addIdea(added,c.id,d.id,ideas[0],'again'),added);
 const stale=fixture(),idea=localIdeas(stale,c,d)[0];stale.customBonus[0].title='Changed';assert.equal(addIdea(stale,'c','d',idea,'late'),stale);
 const active=fixture();active.cities[0].days[0].preparation.activeAlternativeId='rain';assert.equal(addIdea(active,'c','d',ideas[0],'blocked'),active);
});
test('undo preserves concurrent notes/bookings/completion/timing and unrelated changes; concurrent same idea shares deterministic identity',()=>{
 const s=fixture(),c=s.cities[0],d=c.days[0],idea=localIdeas(s,c,d)[0],next=addIdea(s,'c','d',idea,'stable');const inserted=next.cities[0].days[0].steps.at(-1);
 next.notes.other='other tab';const undo=undoIdea(next,inserted);assert.equal(undo.notes.other,'other tab');assert.equal(undo.cities[0].days[0].steps.length,3);
 for(const change of [s=>s.notes.stable='private note',s=>s.bookings.push('stable'),s=>s.done.push('stable'),s=>s.cities[0].days[0].preparation.timings.stable={durationMinutes:10},s=>s.cities[0].days[0].steps.at(-1).title='Edited']){const edited=structuredClone(next);change(edited);assert.equal(undoIdea(edited,inserted),edited);}
 const simultaneous=addIdea(s,'c','d',idea,'stable');assert.equal(mergeChanges(s,next,simultaneous).cities[0].days[0].steps.filter(x=>x.id==='stable').length,1);
});
test('validated optional device data roundtrips backups/duplicates, stays outside all projections, safe card is a whitelist',()=>{
 const s=dismissIssue(fixture(),departureIssues(fixture())[0]);s.companion.requirements=[{id:'r',stepId:'a',field:'address'}];s.companion.excluded=['bonus'];assert.ok(validateState(s));assert.deepEqual(parseTrip(JSON.stringify(archive(s))).state,s);assert.deepEqual(duplicateTrip(s,'Copy').companion,s.companion);
 assert.equal(splitContent(s).shared.companion,undefined);assert.equal(splitContent(s).private.companion,undefined);assert.deepEqual(parseTrip(contentRaw('a-l-est-trip-v2:'+s.journey.id,splitContent(s),JSON.stringify(archive(s)))).state.companion,s.companion);
 assert.deepEqual(showCard({...s.stays[0],reference:'SECRET'}),{title:'Hôtel choisi',chineseName:'测试旅馆',address:'测试路 10 号'});
 for(const bad of [{},{...emptyCompanion(),requirements:[{id:'r',stepId:'a',field:['address']}]},{...emptyCompanion(),requirements:[{id:'r',stepId:'a',field:{toString:'address'}}]},{...emptyCompanion(),requirements:[{id:'r',stepId:'a',field:'visa'}]},{...emptyCompanion(),dismissed:[{id:'x',fingerprint:'x'.repeat(16001)}]},{...emptyCompanion(),extra:'unknown'},{...emptyCompanion(),excluded:[{}]}])assert.equal(validCompanion(bad),false);
 const old=fixture();delete old.companion;assert.ok(validateState(old));
 for(let i=0;i<3;i++){const dict=companionDictionary(i);assert.ok(Object.values(dict).every(v=>v?.trim()));assert.equal(dict['Durée et déplacement à vérifier.'].includes('undefined'),false);}
});
test('account/device checks survive acknowledgement, remote refresh and interrupted upload; reader and other accounts isolated',async()=>{
 const values=new Map(),backing={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),key:i=>[...values.keys()][i]??null,get length(){return values.size;}};
 const s=fixture(),key='a-l-est-trip-v2:'+s.journey.id;s.companion.requirements=[{id:'r',stepId:'a',field:'address'}];
 const storage=new AccountStorage(backing,'a'),other=new AccountStorage(backing,'b');storage.setItem(key,JSON.stringify(archive(s)));
 const content=recordContent(key,storage.getItem(key));assert.equal(content.shared.companion,undefined);assert.equal(content.private.companion,undefined);
 const remote={content,revision:1,private_revision:1,role:'editor',deleted:false,fullSharing:true,allowedFields:['notes','preparation']};
 const transport={save:async(_key,_record,payload)=>{assert.equal(payload.shared.companion,undefined);assert.equal(payload.private.companion,undefined);return{status:'saved',record:remote};}};
 await syncRecord(storage,key,transport);assert.deepEqual(parseTrip(storage.getItem(key)).state.companion,s.companion);
 acceptRemote(storage,key,{...remote,revision:2});acceptRemote(other,key,remote);assert.equal(parseTrip(other.getItem(key)).state.companion,undefined);
 storage.setItem(key,JSON.stringify(archive({...s,notes:{...s.notes,d:'Changed'}})));await assert.rejects(syncRecord(storage,key,{save:async()=>{throw Error('offline');}}));assert.equal(storage.record(key).pending,true);
 await syncRecord(storage,key,{save:async()=>{const current=parseTrip(storage.getItem(key)).state;current.companion.excluded=['bonus'];storage.setItem(key,JSON.stringify(archive(current)));return{status:'saved',record:remote};}});assert.deepEqual(parseTrip(storage.getItem(key)).state.companion.excluded,['bonus']);assert.equal(storage.record(key).pending,true);
 const reader=new AccountStorage(backing,'reader');acceptRemote(reader,key,{...remote,role:'reader'});assert.throws(()=>reader.setItem(key,JSON.stringify(archive(s))),/Lecture seule/);
});
