import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNvidiaClient, LIMITS, MODEL_PROFILES, SYSTEM_PROMPT, ENDPOINT } from './nvidia-import/client.mjs';
import { summary, evaluateNvidia } from './nvidia-import/evaluate.mjs';
import { oraclePlanning, envelope } from './nvidia-import/fixtures.mjs';
import { writeJson, loadJournal, acquireRunLock } from './nvidia-import/journal.mjs';

export const ROOT=resolve('docs/development/lot-06-bis-api-nvidia');
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function protocol(model=null) {
  if(model!==null&&!Object.hasOwn(MODEL_PROFILES,model))throw Error('model-not-reviewed');
  const paths=['tests/fixtures/planning/lot06-corpus.json','src/planning-import/parser.ts','src/planning-import/normalizations.ts','src/planning-import/public-contract.ts','src/planning-import/structured.ts','src/planning-import/import-kit.ts','scripts/lot06-core.mjs','scripts/nvidia-import/client.mjs','scripts/nvidia-import/evaluate.mjs','scripts/nvidia-import/fixtures.mjs','scripts/nvidia-import/journal.mjs','scripts/benchmark-nvidia-import.mjs'];
  const hashes=Object.fromEntries(await Promise.all(paths.map(async p=>[p,hash(await readFile(p))])));
  const freeze=JSON.parse(await readFile('docs/development/lot-06-modele/freeze.json','utf8'));
  if(hashes[paths[0]]!==freeze.hashes[paths[0]])throw Error('Lot06 corpus changed');
  const profile=model?MODEL_PROFILES[model]:null;
  const value={version:1,model,modelSelectionPending:model===null,referenceProfileOnly:'qwen/qwen3-next-80b-a3b-instruct',endpoint:ENDPOINT,limits:LIMITS,concurrency:1,parameters:{temperature:profile?.temperature??0,max_tokens:profile?.maxOutputTokens??null,stream:false,response_format:'not requested; capability not established',...(profile?.top_p!==undefined?{top_p:profile.top_p}:{}),...(profile?.seed!==undefined?{seed:profile.seed}:{})},
    criteria:{safetyNewFalseBookingOrCoordinates:0,regressionsOnRulesCorrect:0,assignmentGainRequired:true,omissionsDecreaseRequired:true,medianMsBelow:20000},prompt:SYSTEM_PROMPT,hashes};
  return {...value,fingerprint:hash(JSON.stringify(value))};
}
export async function prepareComparison() {
  await mkdir(ROOT,{recursive:true});
  try{await readFile(join(ROOT,'live/results.json'));throw Error('Live results exist; keep their saved comparison instead of preparing a blank one');}catch(error){if(error.code!=='ENOENT')throw error;}
  const p=await protocol();await writeJson(join(ROOT,'protocol.json'),p);
  const local=JSON.parse(await readFile('docs/development/lot-06-modele/analysis.json','utf8'));
  if(local.status!=='complete')throw Error('Lot06 incomplete');
  for(const path of ['src/planning-import/parser.ts','src/planning-import/normalizations.ts'])if(hash(await readFile(path))!==local.inputHashes[path])throw Error('Historical rules changed; establish a new baseline');
  const comparison={generatedAt:new Date().toISOString(),corpusSha256:p.hashes['tests/fixtures/planning/lot06-corpus.json'],localEvidenceSha256:hash(await readFile('docs/development/lot-06-modele/analysis.json')),
    rules:local.summary.rules,localModel:{...local.summary.model,warmGenerationMs:local.metrics.warmGenerationMs,model:'Qwen3-0.6B ONNX q8'},localHybrid:local.summary.hybrid,
    nvidia:{status:'NOT_EXECUTED',reason:'User deferred model selection and local key configuration until after implementation',model:null,attempts:0,usage:null,latencyMs:null,quality:null,cost:'not measured; no inference call made'},
    decision:'benchmark-only; no app/server integration; live comparison pending explicit model choice and key configuration',limits:['Internal compact format in lot06 differs from complete public JSON here.','Simulation results are transport tests, never model quality.','No iPhone or provider compatibility established.']};
  await writeJson(join(ROOT,'comparison.json'),comparison);return comparison;
}
export async function run({simulation=false,model=null}={}) {
  if(!model&&!simulation)throw Error('model-choice-required');
  const reference=model||'qwen/qwen3-next-80b-a3b-instruct';
  const p=await protocol(reference), directory=join(ROOT,simulation?'simulated':'live');
  const key=simulation?'SIMULATION_NOT_A_SECRET':process.env.NVIDIA_API_KEY;
  if(!key)throw Error('missing-key: configure NVIDIA_API_KEY locally, never in chat');
  const unlock=await acquireRunLock(directory);
  try {
    const journal=await loadJournal(directory,p.fingerprint);
    await writeJson(join(directory,'protocol.json'),{...p,frozenBeforeCalls:true,mode:simulation?'SIMULATION_ORACLE_NOT_MODEL_OUTPUT':'LIVE_EVALUATION'});
    const corpus=JSON.parse(await readFile('tests/fixtures/planning/lot06-corpus.json','utf8'));let current;
    if(journal.attempts.some(row=>!corpus.some(entry=>entry.id===row.id)))throw Error('Unknown case in journal');
    const fetchImpl=simulation?async()=>Response.json(envelope(JSON.stringify(oraclePlanning(current)))):globalThis.fetch;
    const client=createNvidiaClient({enabled:true,apiKey:key,model:reference,fetchImpl,reserveAttempt:()=>journal.reserve(current.id)});
    for(const entry of corpus) {
      if(journal.attempts.some(row=>row.id===entry.id))continue;
      const last=journal.attempts.at(-1);
      if(last?.cooldownUntil>Date.now())throw Error('Retry-After not elapsed');
      current=entry;
      try {
        const result=await client.extract(entry.source),evaluation=evaluateNvidia(entry,result);
        await journal.finish(entry.id,{result,evaluation});
      }catch(error) {
        // Only sanitized metadata, never an upstream error body or Authorization.
        const safe={code:error.code||'local-journal',status:error.status||null,retryAfterSeconds:error.retryAfterSeconds??null,latencyMs:error.latencyMs??null,requestBytes:error.requestBytes??null,provider:error.provider??null};
        if(journal.attempts.at(-1)?.id===entry.id&&journal.attempts.at(-1).status==='started')await journal.finish(entry.id,{error:safe,evaluation:evaluateNvidia(entry,null)});
        break; // No retries or cascade to another model/provider.
      }
    }
    const evaluations=corpus.map(entry=>{const row=journal.attempts.find(item=>item.id===entry.id);return row?{...(row.evaluation||evaluateNvidia(entry,null)),executionStatus:'attempted'}:{...evaluateNvidia(entry,null),rejected:false,executionStatus:'not-attempted'};});
    const output={mode:simulation?'SIMULATION_ORACLE_NOT_MODEL_OUTPUT':'LIVE_EVALUATION',status:journal.attempts.length===corpus.length&&journal.attempts.every(r=>r.status==='complete')?'complete':'incomplete',
      attempts:journal.attempts.length,expectedCases:corpus.length,notAttempted:corpus.filter(e=>!journal.attempts.some(row=>row.id===e.id)).map(e=>e.id),summary:summary(evaluations),evaluations,results:journal.attempts,
      note:simulation?'Outputs constructed from frozen expected annotations to test transport. Not NVIDIA performance.':'Synthetic corpus only; original and generated text kept separately. Human preview still mandatory.'};
    await writeJson(join(directory,'results.json'),output);
    if(!simulation) {
      const comparison=JSON.parse(await readFile(join(ROOT,'comparison.json'),'utf8'));
      const latencies=journal.attempts.filter(r=>r.result).map(r=>r.result.provider.latencyMs).sort((a,b)=>a-b);
      const local=JSON.parse(await readFile('docs/development/lot-06-modele/analysis.json','utf8'));
      comparison.nvidia={status:output.status,model:reference,attempts:output.attempts,quality:output.summary,latencyMs:{count:latencies.length,median:latencies[Math.floor(latencies.length/2)]??null,max:latencies.at(-1)??null},
        usage:journal.attempts.map(r=>({id:r.id,usage:r.result?.provider.usage??r.error?.provider?.usage??null})),cost:'not established by API; no payment flow permitted',
        regressions:local.rules.filter(r=>r.passed&&evaluations.find(e=>e.id===r.id)?.executionStatus==='attempted'&&!evaluations.find(e=>e.id===r.id)?.passed).map(r=>r.id),
        criteriaOutcome:output.status==='complete'?'requires human review of quality and terms':'not-assessable-incomplete'};
      comparison.decision='benchmark-only; review real results and provider conditions before any UI proposal';await writeJson(join(ROOT,'comparison.json'),comparison);
    }
    console.log(JSON.stringify({mode:output.mode,status:output.status,attempts:output.attempts,nvidiaNetworkCalls:simulation?0:output.attempts}));return output;
  }finally{await unlock();}
}
async function main() {
  const args=process.argv.slice(2);
  if(args.some((arg,index)=>!['--prepare','--simulate','--live','--model'].includes(arg)&&args[index-1]!=='--model'))throw Error('Unknown argument');
  const modes=['--prepare','--simulate','--live'].filter(mode=>args.includes(mode));if(modes.length>1)throw Error('Select one mode');
  if(args.includes('--live'))return run({model:args.includes('--model')?args[args.indexOf('--model')+1]:null});
  if(args.includes('--simulate')){await prepareComparison();return run({simulation:true});}
  return prepareComparison();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify({status:'not-executed-or-incomplete',code:error instanceof Error?error.message:'local-error'}));process.exitCode=1;});
