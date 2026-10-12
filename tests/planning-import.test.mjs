import test from 'node:test';
import assert from 'node:assert/strict';
import { SYNTHETIC_EXAMPLES } from '../src/planning-import/fixtures.ts';
import { validateDraft, draftToTrip, applyDepartureDate, correctField, draftSummary } from '../src/planning-import/draft.ts';
import { createSession, saveSession, loadSession, clearSession, commitImport, DRAFT_KEY } from '../src/planning-import/persistence.ts';
import { archive, parseImport, readTrip, listTrips, tripKey, blankTrip, writeTrip } from '../src/journeys.ts';
import { AccountStorage } from '../src/cloud/storage.ts';
class MemoryStorage {
  values = new Map(); failOn = null; afterWrite = null;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key,value) { if (this.failOn === key) throw new Error('Quota'); this.values.set(key,String(value)); this.afterWrite?.(key); }
  removeItem(key) { this.values.delete(key); }
}
const options = source => ({ source,keepSource:true,departureDate:'',currency:'EUR',timezone:'UTC' });
const prepared = (scope='local', index=0) => ({ ...createSession(scope,SYNTHETIC_EXAMPLES[index].source), draft:structuredClone(SYNTHETIC_EXAMPLES[index].draft), currency:'EUR',timezone:'UTC' });

test('three annotated programmes preserve dates, nights, suggestions and conflicts', () => {
  for (const {source,draft} of SYNTHETIC_EXAMPLES) assert.deepEqual(validateDraft(draft,source),draft);
  const urban = draftToTrip(SYNTHETIC_EXAMPLES[0].draft,options(SYNTHETIC_EXAMPLES[0].source));
  assert.equal(urban.cities[0].days[0].steps[0].period,'Matin');
  assert.equal(urban.cities[0].days[0].preparation,undefined);
  assert.equal(urban.bookings.length,1); assert.equal(urban.expenses,undefined); assert.equal(urban.budget,undefined);
  const night = draftToTrip(SYNTHETIC_EXAMPLES[1].draft,options(SYNTHETIC_EXAMPLES[1].source));
  assert.equal(night.transfers[0].arrival,'2027-05-03T08:00'); assert.equal(night.transfers[0].booked,false);
  const ambiguous=structuredClone(SYNTHETIC_EXAMPLES[2].draft);
  assert.throws(()=>draftToTrip(ambiguous,options(SYNTHETIC_EXAMPLES[2].source)),/conflits/);
  ambiguous.cities[0].days[0].items[3].excluded=true;
  const mapped=draftToTrip(ambiguous,options(SYNTHETIC_EXAMPLES[2].source));
  assert.equal(mapped.cities[0].days[0].date,undefined); assert.equal(mapped.cities[0].days[0].steps.length,1);
  assert.equal(mapped.customBonus.length,2); assert.equal(mapped.bookings.length,0);
  assert.equal(mapped.cities[0].days[0].steps[0].coordinates,undefined);
  assert.match(mapped.documents[0].content,/Arrivée le 3 ou le 4/);
});
test('untrusted JSON, invented source values, HTML and impossible values do not gain authority', () => {
  const {source,draft}=SYNTHETIC_EXAMPLES[0];
  const mutate=fn=>{const d=structuredClone(draft);fn(d);return d;};
  for (const bad of [null,[], '{broken',mutate(d=>d.id='model-id'),mutate(d=>d.title='x'.repeat(141)),
    mutate(d=>d.cities[0].days[0].date='2027-02-29'),mutate(d=>d.cities[0].days[0].items[0].coordinates=[100,200]),
    mutate(d=>d.cities[0].days[0].items[0].address='<img src=x onerror=alert(1)>'),
    mutate(d=>d.evidence.title.origin='user'),mutate(d=>d.evidence.title.quote='invented'),
    mutate(d=>d.cities[0].days[0].items[0].booked=true)]) assert.throws(()=>validateDraft(bad,source));
  assert.throws(()=>validateDraft(draft,'x'.repeat(50001)));
  const d=mutate(d=>{d.cities[0].days[0].items[0].title='<script>alert(1)</script>'; d.cities[0].days[0].items[0].evidence.title={origin:'user',quote:''};});
  assert.equal(validateDraft(d,source,true).cities[0].days[0].items[0].title,'<script>alert(1)</script>');
});
test('explicit date choice and correction do not infer dates or hourly periods',()=>{
  const d=structuredClone(SYNTHETIC_EXAMPLES[2].draft), next=applyDepartureDate(d,'2027-05-07');
  assert.equal(d.cities[0].days[0].date,'');assert.equal(next.cities[0].days[0].date,'2027-05-07');
  const item=correctField(d.cities[0].days[0].items[3],'title','Hôtel Bêta');
  assert.equal(item.evidence.title.origin,'user');assert.equal(item.evidence.title.quote,'');
  assert.equal(draftSummary(d).conflicts,1);
});
test('incomplete manual corrections persist but cannot commit; invented descriptions reject',()=>{
  const storage=new MemoryStorage(),s=createSession('local','My notes');
  s.draft={version:1,title:'',cities:[{name:'',days:[{title:'',date:'',items:[],evidence:{title:{origin:'user',quote:''}}}],evidence:{name:{origin:'user',quote:''}}}],notes:['My notes'],evidence:{title:{origin:'user',quote:''}}};
  saveSession(storage,s);assert.deepEqual(loadSession(storage,'local'),s);assert.throws(()=>commitImport(storage,s));
  const d=structuredClone(SYNTHETIC_EXAMPLES[0].draft);d.cities[0].days[0].items[0].description='An invented detail';
  d.cities[0].days[0].items[0].evidence.description={origin:'source',quote:'Paris'};
  assert.throws(()=>validateDraft(d,SYNTHETIC_EXAMPLES[0].source));
});
test('fully user-authored preview works without source; provider still requires source',()=>{
  const d=structuredClone(SYNTHETIC_EXAMPLES[0].draft);
  for (const r of [d,...d.cities,...d.cities.flatMap(c=>c.days),...d.cities.flatMap(c=>c.days.flatMap(day=>day.items))]) for (const key of Object.keys(r.evidence)) r.evidence[key]={origin:'user',quote:''};
  d.notes=[];
  assert.throws(()=>validateDraft(d,''));
  assert.equal(draftToTrip(d,options('')).journey.title,'Paris');
});
test('explicitly excluded invalid hotel dates do not block the remaining itinerary',()=>{
  const {source}=SYNTHETIC_EXAMPLES[0],d=structuredClone(SYNTHETIC_EXAMPLES[0].draft),hotel=d.cities[0].days[0].items[1];
  hotel.checkOut='2027-04-01';hotel.evidence.checkOut={origin:'user',quote:''};hotel.excluded=true;
  assert.equal(draftToTrip(d,options(source)).stays.length,0);
  hotel.excluded=false;assert.throws(()=>draftToTrip(d,options(source)));
});
test('broad citations cannot silently discard unstructured source or invent approximate coordinates',()=>{
  const {source}=SYNTHETIC_EXAMPLES[0], d=structuredClone(SYNTHETIC_EXAMPLES[0].draft);
  d.evidence.title.quote=source;d.notes=[];
  const trip=draftToTrip(d,{...options(source),keepSource:false});
  assert.match(trip.documents[0].content,/Budget estimé : 80 EUR/);
  d.cities[0].days[0].items[0].coordinates=[48,2];
  assert.throws(()=>validateDraft(d,source));
});
test('confirmation summary includes all four preserved Paris notes before creation',()=>{
  const {source,draft}=SYNTHETIC_EXAMPLES[0];
  assert.equal(draftSummary(draft,source).unstructured,4);
});
test('recovery refuses a trip with mismatched journal content but reopens subsequent legitimate edits',()=>{
  const storage=new MemoryStorage(),s=prepared();saveSession(storage,s);
  storage.afterWrite=key=>{if(key===tripKey(s.id))throw new Error('Interrupted');};assert.throws(()=>commitImport(storage,s));storage.afterWrite=null;
  const corrupt=readTrip(storage,s.id);corrupt.journey.title='Other content';writeTrip(storage,corrupt);
  assert.throws(()=>commitImport(storage,loadSession(storage,'local')),/correspond/);
  const journal=loadSession(storage,'local');writeTrip(storage,journal.preparedTrip);commitImport(storage,journal);
  const edited=readTrip(storage,s.id);edited.notes.general='Later edit';writeTrip(storage,edited);
  assert.equal(commitImport(storage,loadSession(storage,'local')).notes.general,'Later edit');
});
test('durable session and repeated confirmation create a single independent trip',()=>{
  const storage=new MemoryStorage(), old=blankTrip({title:'Existing'});writeTrip(storage,old);
  const original=storage.getItem(tripKey(old.journey.id)), session=prepared();saveSession(storage,session);
  const trip=commitImport(storage,session), again=commitImport(storage,loadSession(storage,'local'));
  assert.equal(trip.journey.id,again.journey.id);assert.deepEqual(readTrip(storage,trip.journey.id),trip);
  assert.equal(listTrips(storage).length,2);assert.equal(storage.getItem(tripKey(old.journey.id)),original);
  const restored=parseImport(JSON.stringify(archive(trip)))[0];assert.deepEqual(restored.cities.map(c=>c.days.map(d=>d.steps.map(s=>s.title))),trip.cities.map(c=>c.days.map(d=>d.steps.map(s=>s.title))));
  assert.deepEqual(restored.documents.map(d=>d.content),trip.documents.map(d=>d.content));
  clearSession(storage,'local');assert.equal(loadSession(storage,'local'),null);assert.ok(readTrip(storage,trip.journey.id));
});
test('quota or interruption preserves source and stable identity, including after trip write',()=>{
  const storage=new MemoryStorage(),s=prepared();saveSession(storage,s);storage.failOn=tripKey(s.id);
  assert.throws(()=>commitImport(storage,s));assert.equal(loadSession(storage,'local').source,s.source);
  storage.failOn=null;storage.afterWrite=key=>{if(key===tripKey(s.id))throw new Error('Interrupted');};
  assert.throws(()=>commitImport(storage,s));storage.afterWrite=null;
  const result=commitImport(storage,loadSession(storage,'local'));assert.equal(result.journey.id,s.id);assert.equal(listTrips(storage).length,1);
  storage.failOn=DRAFT_KEY;assert.throws(()=>saveSession(storage,{...s,source:'Changed'}));assert.equal(loadSession(storage,'local').source,s.source);
});
test('two accounts and local space are isolated, imported account trips do not enqueue sync',()=>{
  const backing=new MemoryStorage(),a=new AccountStorage(backing,'A'),b=new AccountStorage(backing,'B');
  const s=prepared('A');saveSession(a,s);assert.equal(loadSession(b,'B'),null);assert.equal(loadSession(backing,'local'),null);
  const trip=commitImport(a,s);assert.equal(a.record(tripKey(trip.journey.id)).pending,false);
  assert.equal(a.record(tripKey(trip.journey.id)).localOnly,true);
  const next=structuredClone(trip);next.notes.general='Personal';writeTrip(a,next);
  assert.equal(a.record(tripKey(trip.journey.id)).pending,false);assert.equal(listTrips(b).length,0);
  a.attachLocalTrip(trip.journey.id);assert.equal(a.record(tripKey(trip.journey.id)).pending,true);
  assert.equal(a.record(tripKey(trip.journey.id)).localOnly,false);
  assert.throws(()=>commitImport(b,s),/espace/);
  const intentional=commitImport(a,prepared('A'));assert.notEqual(intentional.journey.id,trip.journey.id);
});
