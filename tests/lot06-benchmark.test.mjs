import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeProposal, score } from '../scripts/lot06-core.mjs';
import { assistantText, analyzeRow } from '../scripts/lot06-analyze.mjs';
import { terminateWorker } from '../scripts/lot06-process.mjs';
import { fork } from 'node:child_process';

const source='Ville: Angers\nJour 1\n- Château\n- Alternative : Musée si pluie\nHôtel non réservé';
const wire=()=>({cities:[{name:'Angers',days:[{title:'Jour 1',date:'',items:[{title:'Château',quote:'- Château',time:'',kind:'activity',booked:false,coordinates:null}]}]}]});
test('model proposal validates against source with generated fields never marked user',()=>{
  const draft=decodeProposal(JSON.stringify(wire()),source);
  assert.equal(draft.cities[0].days[0].items[0].evidence.title.origin,'source');
  assert.deepEqual(draft.notes,[source]);
});
test('invented title, booking, coordinates and unknown fields are rejected visibly',()=>{
  for(const change of [i=>i.title='Invented',i=>i.booked=true,i=>i.coordinates=[1,2],i=>i.evidence={origin:'user'}]) {
    const value=wire();change(value.cities[0].days[0].items[0]);
    assert.throws(()=>decodeProposal(JSON.stringify(value),source));
  }
  const value=wire();value.cities[0].days[0].items[0].quote='Hôtel non réservé';value.cities[0].days[0].items[0].title='Hôtel';value.cities[0].days[0].items[0].booked=true;
  assert.throws(()=>decodeProposal(JSON.stringify(value),source));
});
test('malformed, fenced, ungrounded and overlong responses are refused',()=>{
  for(const raw of ['{}','```json\n{}\n```','x'.repeat(100001)])assert.throws(()=>decodeProposal(raw,source));
  const value=wire();value.cities[0].days[0].items[0].quote='missing quote';assert.throws(()=>decodeProposal(JSON.stringify(value),source));
});
test('chat transport unwraps assistant content without treating prompt as output',()=>{
  const value=JSON.stringify(wire());
  assert.equal(assistantText([{role:'system',content:'never score me'},{role:'assistant',content:value}]),value);
  assert.equal(assistantText(value),value);
  assert.throws(()=>assistantText([{role:'user',content:value}]));
  const entry={source,expected:[{name:'Angers',days:[{date:'',items:[{anchor:'Château'}]}]}]};
  const baseline={draft:decodeProposal(value,source)};
  const result=analyzeRow(entry,{id:'transport',ms:1,raw:[{role:'assistant',content:value}]},baseline,'model');
  assert.equal(result.rejected,false);assert.equal(result.passed,true);
  const bad=wire();bad.cities[0].days[0].items[0].booked=true;
  const rejected=analyzeRow(entry,{id:'unsafe',raw:JSON.stringify(bad)},baseline,'hybrid');
  assert.equal(rejected.rejected,true);assert.equal(rejected.proposal.falseBookings,1);assert.equal(rejected.falseBookings,0);assert.equal(rejected.route,'rules-fallback');
});
test('scoring detects merged activities, wrong assignment, false booking and lost alternative',()=>{
  const entry={expected:[{name:'Angers',days:[{date:'',items:[{anchor:'Château',booked:false},{anchor:'Musée',kind:'alternative',booked:false}]}]}]};
  const value=wire(), item=value.cities[0].days[0].items[0];
  item.title='Château Musée';item.quote=source;
  // Assess a malicious raw-like draft without claiming it passed validation.
  const draft={cities:[{name:'Angers',days:[{date:'',items:[{...item,booked:true,coordinates:[1,2]}]}]}]};
  const result=score(entry,draft);assert.equal(result.separateItems,0);assert.equal(result.omissions,2);assert.equal(result.falseBookings,1);assert.equal(result.inventedCoordinates,1);
  const valid=decodeProposal(JSON.stringify(wire()),source);valid.cities[0].days[0].items.push({...valid.cities[0].days[0].items[0],title:'Musée',kind:'activity'});
  assert.equal(score(entry,valid).alternativeErrors,1);
  valid.cities[0].name='Other';assert.equal(score(entry,valid).assignedItems,0);
});
test('corpus and prompt remain frozen, all anchors have source and four languages covered',async()=>{
  const frozen=JSON.parse(await readFile('docs/development/lot-06-modele/freeze.json','utf8'));
  const fixes=JSON.parse(await readFile('docs/development/lot-06-modele/execution-fixes.json','utf8'));
  for(const [path,hash] of Object.entries(frozen.hashes).filter(([p])=>!p.endsWith('RAPPORT.md')))assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),path==='scripts/benchmark-lot06.mjs'?fixes.runnerSha256:hash,path);
  assert.equal(createHash('sha256').update(await readFile('docs/development/lot-06-modele/runner-initial.mjs.txt')).digest('hex'),frozen.hashes['scripts/benchmark-lot06.mjs']);
  assert.equal(createHash('sha256').update(await readFile('docs/development/lot-06-modele/protocol-initial.md')).digest('hex'),frozen.hashes['docs/development/lot-06-modele/RAPPORT.md']);
  const corpus=JSON.parse(await readFile('tests/fixtures/planning/lot06-corpus.json','utf8'));
  assert.equal(corpus.length,12);assert.equal(new Set(corpus.map(e=>e.id)).size,12);
  for(const e of corpus)for(const c of e.expected)for(const d of c.days)for(const i of d.items)assert.ok(e.source.includes(i.anchor));
  for(const language of ['fr','en','es','zh'])assert.ok(corpus.some(e=>e.id===language+'-prose'));
});
test('worker termination is idempotent for a real child terminated by signal',async()=>{
  const child=fork('-e',['setInterval(()=>{},1000)'],{execArgv:[],stdio:'ignore'});
  await terminateWorker(child);
  await terminateWorker(child);
  assert.ok(child.exitCode!==null || child.signalCode!==null);
});
