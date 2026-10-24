import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createNvidiaClient, inspectGenerated, requestBody, MODEL_PROFILES, LIMITS, ENDPOINT } from '../scripts/nvidia-import/client.mjs';
import { oraclePlanning, envelope } from '../scripts/nvidia-import/fixtures.mjs';
import { evaluateNvidia } from '../scripts/nvidia-import/evaluate.mjs';
import { writeJson, loadJournal, acquireRunLock } from '../scripts/nvidia-import/journal.mjs';
import { readStructuredPlanning, PUBLIC_PLANNING_SCHEMA } from '../src/planning-import/public-contract.ts';
import { importKit } from '../src/planning-import/import-kit.ts';
import { createSession, saveSession, loadSession, commitImport } from '../src/planning-import/persistence.ts';
import { correctField } from '../src/planning-import/draft.ts';
import { blankTrip, writeTrip, tripKey } from '../src/journeys.ts';

const corpus=JSON.parse(await readFile('tests/fixtures/planning/lot06-corpus.json','utf8'));
const entry=corpus[0], model=Object.keys(MODEL_PROFILES)[0], key='LOCAL_TEST_NOT_A_REAL_KEY';
const client=options=>createNvidiaClient({enabled:true,apiKey:key,model,fetchImpl:async()=>Response.json(envelope(JSON.stringify(oraclePlanning(entry)))),...options});
const hasCode=code=>error=>error.code===code;
async function scratch(t) {
  const prefix=join(tmpdir(),'detours-nvidia-'),directory=await mkdtemp(prefix);
  t.after(async()=>{assert.ok(resolve(directory).startsWith(resolve(prefix)));await rm(directory,{recursive:true});});return directory;
}

test('disabled, missing key, unknown model and invalid settings never make a request',async()=>{
  let calls=0;const fetchImpl=()=>{calls++;throw Error('No');};
  await assert.rejects(createNvidiaClient({apiKey:key,model,fetchImpl}).extract(entry.source),hasCode('disabled'));
  await assert.rejects(client({apiKey:'',fetchImpl}).extract(entry.source),hasCode('missing-key'));
  await assert.rejects(client({model:'https://evil.invalid',fetchImpl}).extract(entry.source),hasCode('model-not-reviewed'));
  assert.throws(()=>client({timeoutMs:90001}));assert.throws(()=>client({maxAttempts:101}));assert.equal(calls,0);
});
test('fixed endpoint, no redirect, key only in header, exact original text and strict public provenance',async()=>{
  let requested;
  const result=await client({endpoint:'https://evil.invalid',fetchImpl:async(url,options)=>{requested={url,options};return Response.json(envelope(JSON.stringify(oraclePlanning(entry))));}}).extract(entry.source);
  assert.equal(requested.url,ENDPOINT);assert.equal(requested.options.redirect,'error');
  assert.equal(requested.options.headers.Authorization,'Bearer '+key);assert.ok(!requested.options.body.includes(key));
  assert.deepEqual(JSON.parse(JSON.parse(requested.options.body).messages[1].content),{source:entry.source});
  assert.equal(result.originalSource,entry.source);assert.equal(result.origin,'external-ai');assert.ok(result.acceptedForPreview);assert.equal(result.requiresHumanReview,true);
  assert.equal(result.prepared.draft.evidence.title.origin,'external');assert.equal(result.prepared.source,result.generatedText);
  assert.equal(result.provider.usage,null);assert.ok(result.provider.requestBytes>0&&result.provider.responseBytes>0);
});
test('transport oracle covers all frozen languages and is explicitly distinct from real model quality',async()=>{
  const freeze=JSON.parse(await readFile('docs/development/lot-06-modele/freeze.json','utf8'));
  assert.equal(createHash('sha256').update(await readFile('tests/fixtures/planning/lot06-corpus.json')).digest('hex'),freeze.hashes['tests/fixtures/planning/lot06-corpus.json']);
  for(const e of corpus){const generated=JSON.stringify(oraclePlanning(e));readStructuredPlanning(generated);const result={generatedText:generated,...inspectGenerated(e.source,generated)};assert.equal(evaluateNvidia(e,result).passed,true,e.id);}
  assert.ok(importKit('en').includes(JSON.stringify(PUBLIC_PLANNING_SCHEMA,null,2)));
});
test('hostile source stays in one data message and never becomes tools or extra roles',()=>{
  const source=corpus.find(e=>e.id==='injection').source;
  const request=requestBody(source,model);
  assert.equal(request.messages.length,2);assert.equal(request.messages[0].role,'system');assert.equal(request.messages[1].role,'user');
  assert.deepEqual(JSON.parse(request.messages[1].content),{source});assert.equal(request.tools,undefined);assert.equal(request.response_format,undefined);
});
test('chosen MiniMax profile matches documented sampling and the frozen experiment output budget',()=>{
  const body=requestBody(entry.source,'minimaxai/minimax-m3.1-flash');
  assert.equal(body.model,'minimaxai/minimax-m3.1-flash');assert.equal(body.temperature,1);assert.equal(body.top_p,0.95);assert.equal(body.seed,0);
  assert.equal(body.max_tokens,8192);assert.equal(body.stream,false);assert.equal(body.response_format,undefined);assert.equal(body.messages[1].content,JSON.stringify({source:entry.source}));
});
for(const [name,edit] of [
  ['version',p=>p.version=77],['coordinates',p=>p.cities[0].days[0].items[0].coordinates=[48,2]],['field',p=>p.owner='admin'],
])test('public validator rejects '+name+' without altering source',()=>{
  const value=oraclePlanning(entry);edit(value);const result=inspectGenerated(entry.source,JSON.stringify(value));assert.equal(result.acceptedForPreview,false);assert.equal(result.contractValid,false);
});
for(const [name,edit] of [
  ['city',p=>p.cities[0].name='Invented City'],['date',p=>p.cities[0].days[0].date='2030-01-01'],['booking',p=>p.cities[0].days[0].items[0].reservation.status='confirmed'],['address',p=>p.cities[0].days[0].items[0].address='Unknown Address'],
])test('structurally valid invented '+name+' is refused by additional source guard',()=>{
  const value=oraclePlanning(entry);edit(value);const result=inspectGenerated(entry.source,JSON.stringify(value));assert.equal(result.contractValid,true);assert.equal(result.acceptedForPreview,false);assert.ok(result.issues.length);assert.equal(result.prepared,undefined);
});
test('negative reservation and valid literal date/time normalization are handled conservatively',()=>{
  const e=corpus.find(e=>e.id==='booking-negation'),p=oraclePlanning(e);p.cities[0].days[0].items[0].reservation.status='confirmed';
  assert.ok(inspectGenerated(e.source,JSON.stringify(p)).issues.some(i=>i.code==='unproven-booking'));
  const value=oraclePlanning(entry);value.cities[0].days[0].date='2027-05-15';value.cities[0].days[0].items[0].time='09:30';
  assert.equal(inspectGenerated(entry.source+'\n15 mai 2027 à 9h30',JSON.stringify(value)).acceptedForPreview,true);
});
test('an explicitly confirmed booking is permitted without changing external evidence into user evidence',()=>{
  const e={source:'Ville: Nantes\nJour 1\n- Hôtel Étoile : réservation confirmée, référence ABC-42',expected:[{name:'Nantes',days:[{date:'',items:[{anchor:'Hôtel Étoile',booked:true,kind:'stay'}]}]}]};
  const value=oraclePlanning(e);value.cities[0].days[0].items[0].reservation.reference='ABC-42';
  const result=inspectGenerated(e.source,JSON.stringify(value));assert.equal(result.acceptedForPreview,true);assert.equal(result.prepared.draft.cities[0].days[0].items[0].evidence.booked.origin,'external');
});
test('CLI refuses live execution without model choice or key, without creating a live run',()=>{
  for(const args of [['--live'],['--live','--model',model],['--live','--model','https://evil.invalid']]) {
    const result=spawnSync(process.execPath,['scripts/benchmark-nvidia-import.mjs',...args],{encoding:'utf8',env:{...process.env,NVIDIA_API_KEY:''}});
    assert.equal(result.status,1);assert.ok(/model-choice-required|missing-key|model-not-reviewed/.test(result.stderr));assert.ok(!result.stderr.includes(key));
  }
});
test('wrong assignment and lost alternatives fail business metrics even if structure is valid',()=>{
  const value=oraclePlanning(entry);value.cities[0].days.reverse();const generatedText=JSON.stringify(value);
  const result=evaluateNvidia(entry,{generatedText,...inspectGenerated(entry.source,generatedText)});assert.equal(result.passed,false);assert.ok(result.assignedItems<3);
  const e=corpus.find(e=>e.id==='alternative'),p=oraclePlanning(e);p.cities[0].days[0].items[1].type='activity';
  assert.equal(evaluateNvidia(e,{generatedText:JSON.stringify(p),...inspectGenerated(e.source,JSON.stringify(p))}).alternativeErrors,1);
});
test('omissions, merges, false bookings and missing notes are not hidden by JSON validity',()=>{
  const e=corpus.find(e=>e.id==='injection'),p=oraclePlanning(e);p.notes=[];
  const result=evaluateNvidia(e,{generatedText:JSON.stringify(p),...inspectGenerated(e.source,JSON.stringify(p))});assert.equal(result.expectedNotePassages,1);assert.equal(result.preservedNotePassages,0);
  const value=oraclePlanning(entry);value.cities[0].days[0].items[0].title='Jardin des plantes Passage Pommeraye';value.cities[0].days[0].items.splice(1);
  value.cities[0].days[0].items[0].reservation.status='confirmed';
  const bad=evaluateNvidia(entry,{generatedText:JSON.stringify(value),...inspectGenerated(entry.source,JSON.stringify(value))});assert.ok(bad.rawScore.falseBookings>0);assert.ok(bad.rawScore.omissions>0);assert.equal(bad.acceptedForPreview,false);assert.equal(bad.omissions,3);
});
test('invalid JSON and Markdown fences remain visible errors, not repaired responses',async()=>{
  for(const raw of ['{','```json\n{}\n```']){const result=await client({fetchImpl:async()=>Response.json(envelope(raw))}).extract(entry.source);assert.equal(result.generatedText,raw);assert.equal(result.contractValid,false);assert.equal(result.originalSource,entry.source);}
});
for(const [status,code] of [[401,'authentication'],[403,'forbidden'],[402,'payment-required'],[429,'rate-limit'],[500,'provider'],[503,'provider']])test('HTTP '+status+' is sanitized, counted and never retried',async()=>{
  let calls=0;const instance=client({fetchImpl:async()=>{calls++;return new Response('UPSTREAM_PRIVATE_CANARY '+key,{status,headers:{'Retry-After':'120'}});}});
  await assert.rejects(instance.extract(entry.source),error=>{assert.equal(error.code,code);assert.equal(error.status,status);assert.ok(!JSON.stringify(error).includes(key));assert.ok(!error.stack.includes('UPSTREAM_PRIVATE_CANARY'));assert.equal(error.retryAfterSeconds,120);return true;});
  assert.equal(calls,1);assert.equal(instance.attempts,1);
});
test('refusal, tool response, truncated output and malformed envelope do not become plannings',async()=>{
  for(const [payload,code] of [
    [envelope(null,{choices:[{finish_reason:'stop',message:{refusal:'refused'}}]}),'refused'],
    [envelope('{}',{choices:[{finish_reason:'tool_calls',message:{content:'{}',tool_calls:[{}]}}]}),'invalid-envelope'],
    [envelope('{}',{choices:[{finish_reason:'length',message:{content:'{}'}}],usage:{prompt_tokens:15,completion_tokens:4096,total_tokens:4111}}),'truncated'],
    [{choices:[]},'invalid-envelope'],
  ])await assert.rejects(client({fetchImpl:async()=>Response.json(payload)}).extract(entry.source),error=>{assert.equal(error.code,code);if(code==='truncated')assert.equal(error.provider.usage.total_tokens,4111);return true;});
});
test('provider token counters are retained, absent or malformed counters are unavailable',async()=>{
  const result=await client({fetchImpl:async()=>Response.json(envelope(JSON.stringify(oraclePlanning(entry)),{usage:{prompt_tokens:31,completion_tokens:71,total_tokens:102}}))}).extract(entry.source);
  assert.deepEqual(result.provider.usage,{prompt_tokens:31,completion_tokens:71,total_tokens:102});
  const unknown=await client({fetchImpl:async()=>Response.json(envelope(JSON.stringify(oraclePlanning(entry)),{usage:{total_tokens:'102'}}))}).extract(entry.source);assert.equal(unknown.provider.usage,null);
});
test('body byte limits, UTF-8 errors and API-key echo are rejected safely',async()=>{
  for(const [response,code] of [[new Response('x'.repeat(LIMITS.responseBytes+1)),'output-limit'],[new Response(Uint8Array.of(255)),'invalid-envelope'],[Response.json(envelope(key)),'sensitive-output']])await assert.rejects(client({fetchImpl:async()=>response}).extract(entry.source),hasCode(code));
  let calls=0;const instance=client({fetchImpl:async()=>{calls++;return new Response();}});
  await assert.rejects(instance.extract('x'.repeat(50001)),hasCode('input'));
  await assert.rejects(instance.extract('中'.repeat(49999)),hasCode('input'));assert.equal(calls,0);
});
test('double submission makes one call, cancellation rejects late fetch and allows another request',async()=>{
  let calls=0,resolveFetch;const original=entry.source;
  const instance=client({fetchImpl:()=>{calls++;return new Promise(done=>{resolveFetch=done;});}}),controller=new AbortController();
  const pending=instance.extract(original,{signal:controller.signal});
  await new Promise(done=>setImmediate(done));await assert.rejects(instance.extract(original),hasCode('busy'));
  controller.abort();await assert.rejects(pending,hasCode('cancelled'));
  resolveFetch(Response.json(envelope(JSON.stringify(oraclePlanning(entry)))));assert.equal(calls,1);assert.equal(entry.source,original);
});
test('pre-cancelled requests consume no attempt and timeout rejects fetch that ignores abort',async()=>{
  let calls=0;const cancelled=new AbortController();cancelled.abort();const instance=client({fetchImpl:async()=>{calls++;return new Response();}});
  await assert.rejects(instance.extract(entry.source,{signal:cancelled.signal}),hasCode('cancelled'));assert.equal(calls,0);
  const slow=client({timeoutMs:10,fetchImpl:()=>new Promise(done=>setTimeout(()=>done(Response.json(envelope('{}'))),40))});
  await assert.rejects(slow.extract(entry.source),hasCode('timeout'));
});
test('timeout includes reading a delayed response body',async()=>{
  const response=new Response(new ReadableStream({start(controller){setTimeout(()=>{try{controller.enqueue(new TextEncoder().encode('{}'));controller.close();}catch{/* cancelled */}},40);}}));
  await assert.rejects(client({timeoutMs:10,fetchImpl:async()=>response}).extract(entry.source),hasCode('timeout'));
});
test('in-process budget is bounded and durable reservation runs before each fetch',async()=>{
  const order=[];const instance=client({maxAttempts:2,reserveAttempt:()=>{order.push('reserve');},fetchImpl:async()=>{order.push('fetch');return Response.json(envelope(JSON.stringify(oraclePlanning(entry))));}});
  await instance.extract(entry.source);await instance.extract(entry.source);await assert.rejects(instance.extract(entry.source),hasCode('attempt-budget'));assert.deepEqual(order,['reserve','fetch','reserve','fetch']);
});
test('journal persists interruption, refuses replay, and a lock excludes simultaneous runs',async t=>{
  const directory=await scratch(t),unlock=await acquireRunLock(directory);
  await assert.rejects(acquireRunLock(directory),/Run lock/);
  let journal=await loadJournal(directory,'frozen');await journal.reserve('case-1');
  journal=await loadJournal(directory,'frozen');assert.equal(journal.attempts[0].status,'interrupted-unknown');await assert.rejects(journal.reserve('case-1'),/Already attempted/);
  await journal.reserve('case-2');await journal.finish('case-2',{error:{code:'rate-limit',retryAfterSeconds:120}});await assert.rejects(journal.reserve('case-3'),/Retry-After/);
  await unlock();const release=await acquireRunLock(directory);await release();
  await assert.rejects(loadJournal(directory,'changed-prompt'),/mismatch/);
});
test('100 durable attempts cannot be reset by a new client or fresh process state',async t=>{
  const directory=await scratch(t);
  await writeJson(join(directory,'attempts.json'),{version:1,fingerprint:'budget',attempts:Array.from({length:100},(_,i)=>({number:i+1,id:'case-'+i,status:'complete'}))});
  const journal=await loadJournal(directory,'budget');await assert.rejects(journal.reserve('case-101'),/attempt-budget/);assert.equal(journal.attempts.length,100);
});
test('existing review correction, reload and idempotent creation preserve the previous notebook',async()=>{
  class Storage {
    values=new Map();get length(){return this.values.size;}key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}
  }
  const storage=new Storage(),old=blankTrip({title:'Existing notebook'});writeTrip(storage,old);const oldRaw=storage.getItem(tripKey(old.journey.id));
  const result=await client().extract(entry.source),session={...createSession('local'),...result.prepared,currency:'EUR',timezone:'Europe/Paris'};
  session.draft=correctField(session.draft,'title','Correction humaine');saveSession(storage,session);const reloaded=loadSession(storage,'local');assert.equal(reloaded.draft.title,'Correction humaine');
  assert.equal(result.originalSource,entry.source);const state=commitImport(storage,reloaded);assert.equal(commitImport(storage,reloaded).journey.id,state.journey.id);
  assert.equal(storage.getItem(tripKey(old.journey.id)),oldRaw);assert.equal([...storage.values.keys()].filter(k=>k.startsWith('a-l-est-trip-v2:')).length,2);
  assert.equal(result.prepared.draft.evidence.title.origin,'external');assert.equal(reloaded.draft.evidence.title.origin,'user');
});
