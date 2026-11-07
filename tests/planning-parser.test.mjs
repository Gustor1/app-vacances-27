import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePlanning } from '../src/planning-import/parser.ts';
import { validateDraft, draftToTrip, correctField } from '../src/planning-import/draft.ts';
import { corpus } from './fixtures/planning/corpus.mjs';

for (const entry of corpus) test(`local recognition: ${entry.name}`, () => {
  const draft = parsePlanning(entry.source);
  assert.deepEqual(validateDraft(draft,entry.source,false,true),draft);
  assert.deepEqual(draft.cities.map(c=>c.name),entry.cities);
  const days=draft.cities.flatMap(c=>c.days),items=days.flatMap(d=>d.items);
  assert.equal(days.length,entry.days);assert.equal(items.length,entry.items);
  if ('date' in entry) assert.equal(days[0]?.date,entry.date);
  if ('time' in entry) assert.equal(items[0]?.time,entry.time);
  if (entry.times) assert.deepEqual(items.map(i=>i.time),entry.times);
  if (entry.titles) assert.deepEqual(items.map(i=>i.title),entry.titles);
  if (entry.periods) assert.deepEqual(items.map(i=>i.period),entry.periods);
  if (entry.kinds) assert.deepEqual(items.map(i=>i.kind),entry.kinds);
  if (entry.booked) assert.deepEqual(items.map(i=>i.booked),entry.booked);
  if (entry.description) assert.ok(items[0].description.includes(entry.description),items[0].description);
  for (const note of entry.notes || []) assert.ok(draft.notes.some(n=>n.includes(note)),note);
  for (const r of [draft,...draft.cities,...days,...items]) for (const evidence of Object.values(r.evidence)) assert.notEqual(evidence.origin,'user');
  for (const item of items) assert.equal(item.coordinates,null);
});

test('recognized clock and date survive conversion; unknown source survives without full-source document',()=>{
  const source='# Voyage\nVille: Paris\nJour 1 — 1 mai 2027\n- 9h30 Louvre\nBudget : 80 EUR';
  const draft=parsePlanning(source);
  const trip=draftToTrip(draft,{source,keepSource:false,departureDate:'',currency:'EUR',timezone:'UTC'});
  assert.equal(trip.cities[0].days[0].date,'2027-05-01');
  assert.equal(Object.values(trip.cities[0].days[0].preparation.timings)[0].startTime,'09:30');
  assert.ok(trip.documents.some(d=>d.content.includes('Budget : 80 EUR')));
});

test('normalization never authorizes unrelated dates or times from a broad citation',()=>{
  const source='# Voyage\nVille: Paris\nJour 1 — 1 mai 2027\n- 9h30 Louvre';
  const original=parsePlanning(source);
  for (const [field,bad] of [['date','2028-05-01'],['time','09:45']]) {
    const draft=structuredClone(original),target=field==='date'?draft.cities[0].days[0]:draft.cities[0].days[0].items[0];
    target[field]=bad;target.evidence[field]={origin:'source',quote:source};
    assert.throws(()=>validateDraft(draft,source,false,true));
  }
});

test('missing city cannot become a trip before user correction',()=>{
  const source='Jour 1\n- Louvre',draft=parsePlanning(source);
  const options={source,keepSource:true,departureDate:'',currency:'EUR',timezone:'UTC'};
  assert.throws(()=>draftToTrip(draft,options));
  draft.cities[0]=correctField(draft.cities[0],'name','Paris');
  const corrected=correctField(draft,'title','Paris');
  assert.equal(draftToTrip(corrected,options).cities[0].days[0].steps[0].title,'Louvre');
});

test('invalid and oversized source fails before parsing',()=>{
  for(const input of ['', '  ', null, 'x'.repeat(50001)]) assert.throws(()=>parsePlanning(input));
});

test('bundled original planning preserves its six destinations, seventeen days and ninety-two activities',()=>{
  const source=readFileSync(new URL('../public/documents/planning-original.md',import.meta.url),'utf8');
  const draft=parsePlanning(source);
  assert.deepEqual(draft.cities.map(c=>[c.name,c.days.length,c.days.flatMap(d=>d.items).length]),[
    ['SHENZHEN',3,15],['GUANGZHOU',3,12],['YANGSHUO',3,12],['CHONGQING / WULONG',4,23],['CHENGDU',3,21],['Suzhou',1,9],
  ]);
  assert.equal(draft.cities.flatMap(c=>c.days).length,17);
  assert.equal(draft.cities.flatMap(c=>c.days).flatMap(d=>d.items).length,92);
  assert.equal(draft.notes.length,4);
  assert.deepEqual(validateDraft(draft,source,false,true),draft);
});

test('provider booking claims reject the same uncertain evidence as local recognition',()=>{
  const cases=[
    'Hôtel ne sera réservé que demain','Hotel booked then cancelled','Quartier piéton, accès réservé aux riverains',
    'Hôtel réservé ?','Musée réservé sous réserve de disponibilité','Zone réservée','Hotel reserved seating',
  ];
  for(const title of cases) {
    const source=`# Voyage\nVille: Paris\nJour 1\n- ${title}`,draft=parsePlanning(source);
    const item=draft.cities[0].days[0].items[0];
    assert.equal(item.booked,false,title);
    item.booked=true;item.evidence.booked={origin:'source',quote:title};
    assert.throws(()=>validateDraft(draft,source),title);
    const corrected=correctField(item,'booked',true);draft.cities[0].days[0].items[0]=corrected;
    assert.equal(validateDraft(draft,source,true).cities[0].days[0].items[0].booked,true);
  }
});
