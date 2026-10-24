import { readFile, writeFile, readdir, stat, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { decodeProposal, score, summarize } from './lot06-core.mjs';
import { stressCorpus } from '../tests/fixtures/planning/stress-corpus.mjs';
import { assessPlanning } from './evaluate-planning-stress.mjs';
import { parsePlanning } from '../src/planning-import/parser.ts';

// Transformers.js chat returns messages, even with return_full_text:false.
// Re-evaluate the original assistant content, without any new inference or JSON repair.
export function assistantText(raw) {
  if(typeof raw==='string')return raw;
  if(Array.isArray(raw) && raw.at(-1)?.role==='assistant' && typeof raw.at(-1).content==='string') return raw.at(-1).content;
  throw Error('Unknown runtime output');
}

export function analyzeRow(entry,row,baseline,arm) {
  if(row.route==='rules-no-uncertainty')return row;
  let draft,rejection,rawText,proposal,proposalError;
  try {
    if(row.error)throw Error(row.error);
    rawText=assistantText(row.raw);
    try {
      const wire=JSON.parse(rawText);
      // A projection for measuring invalid raw proposals, NEVER an accepted draft.
      // Unknown nested fields remain in rawText and cause decodeProposal rejection.
      if(!Array.isArray(wire.cities))throw Error('No cities');
      const projected={cities:wire.cities.map(c=>({name:typeof c.name==='string'?c.name:'',days:(c.days||[]).map(d=>({date:d.date||'',items:(d.items||[]).map(i=>({title:typeof i.title==='string'?i.title:'',time:i.time||'',period:i.period||'',kind:i.kind,booked:i.booked,coordinates:i.coordinates??null}))}))}))};
      proposal=score(entry,projected);
    }catch(error){proposalError=String(error);}
    draft=decodeProposal(rawText,entry.source);
  }catch(error){rejection=String(error);}
  const evaluated=draft||(arm==='hybrid'?baseline.draft:{cities:[]});
  return {id:row.id,ms:row.ms,rawText,proposal,proposalError,rejected:!!rejection,rejection,route:draft?'model-validated':arm==='hybrid'?'rules-fallback':'rejected',...score(entry,evaluated),draft:evaluated};
}

export async function analyze() {
  const directory=resolve('docs/development/lot-06-modele'), tools=resolve(process.env.DETOURS_LOT06_TOOLS||'../detours-lot06-tools');
  const report=JSON.parse(await readFile(join(directory,'results.json'),'utf8'));
  const entries=JSON.parse(await readFile('tests/fixtures/planning/lot06-corpus.json','utf8'));
  const output={status:report.status,endedAt:report.endedAt,transportCorrection:'Unwrap final assistant content of Transformers.js chat array; no prompt or generation change, raw output retained in results.json.',rules:report.rules,model:[],hybrid:[]};
  output.inputHashes=Object.fromEntries(await Promise.all(['src/planning-import/parser.ts','src/planning-import/draft.ts','src/planning-import/review.ts','src/planning-import/normalizations.ts','scripts/evaluate-planning-stress.mjs','scripts/lot06-analyze.mjs'].map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
  const holdout=JSON.parse(await readFile('docs/development/import-fiable-lot-01/holdout.json','utf8'));
  output.historicalRules=Object.fromEntries([['stress',stressCorpus],['holdout',holdout]].map(([name,rows])=>{
    const results=rows.map(entry=>({id:entry.id,...assessPlanning(entry,parsePlanning(entry.source))}));
    return [name,{cases:results.length,passed:results.filter(r=>r.passed).length,expectedItems:results.reduce((n,r)=>n+r.expectedItems,0),assignedItems:results.reduce((n,r)=>n+r.assignedItems,0),results}];
  }));
  for(const arm of ['model','hybrid'])for(const row of report[arm]) {
    const entry=entries.find(e=>e.id===row.id), baseline=report.rules.find(r=>r.id===row.id);
    output[arm].push(analyzeRow(entry,row,baseline,arm));
  }
  const times=report.model.concat(report.hybrid).filter(r=>r.route!=='rules-no-uncertainty'&&typeof r.ms==='number').map(r=>r.ms).sort((a,b)=>a-b);
  const warmTimes=report.model.slice(1).concat(report.hybrid).filter(r=>r.route!=='rules-no-uncertainty'&&typeof r.ms==='number').map(r=>r.ms).sort((a,b)=>a-b);
  const observed=report.model.concat(report.hybrid).filter(r=>r.memory);
  const treeSize=async root=>{let size=0;for(const f of await readdir(root,{withFileTypes:true})){const p=join(root,f.name);size+=f.isDirectory()?await treeSize(p):(await stat(p)).size;}return size;};
  output.metrics={download:JSON.parse(await readFile(join(tools,'download.json'),'utf8')),installedRuntimeBytes:await treeSize(join(tools,'node_modules')),coldLoadMs:report.cold?.loadMs,coldProcessRss:report.cold?.memory?.rss,
    generationMs:{count:times.length,min:times[0],median:times[Math.floor(times.length/2)],max:times.at(-1)},maxObservedProcessRss:Math.max(0,...observed.map(r=>r.memory.rss)),maxProcessResourceRssKiB:Math.max(0,...observed.map(r=>r.resource?.maxRSS||0)),cancellation:report.cancellation,
    firstGenerationMs:report.model[0]?.ms,warmGenerationMs:{count:warmTimes.length,min:warmTimes[0],median:warmTimes[Math.floor(warmTimes.length/2)],max:warmTimes.at(-1),reloadOccurred:!!report.reload},
    limits:['Native Node CPU process, not browser WASM or WebGPU.','Process RSS includes runtime, tokenizer, activations and caches; not model RAM alone.','RAM sampled after requests; resourceUsage maxRSS is process lifetime high water mark.','Human correction time not measured at user request.','First local load is OS-cache-dependent and separate from download; no cold-cache disk claim.']};
  output.summary=Object.fromEntries(['rules','model','hybrid'].map(arm=>[arm,summarize(output[arm])]));
  output.rawProposals=Object.fromEntries(['model','hybrid'].map(arm=>[arm,{parseable:output[arm].filter(r=>r.proposal).length,...summarize(output[arm].filter(r=>r.proposal).map(r=>r.proposal))}]));
  output.regressions=Object.fromEntries(['model','hybrid'].map(arm=>[arm,output.rules.filter(r=>r.passed && output[arm].some(other=>other.id===r.id&&!other.passed)).map(r=>r.id)]));
  await copyFile(join(tools,'package-lock.json'),join(directory,'runtime-package-lock.json'));
  await copyFile(join(tools,'download.json'),join(directory,'download.json'));
  await writeFile(join(directory,'analysis.json'),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({status:output.status,summary:output.summary,rawProposals:output.rawProposals,regressions:output.regressions,metrics:{...output.metrics,download:{totalBytes:output.metrics.download.totalBytes,seconds:output.metrics.download.seconds}}},null,2));
  return output;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))await analyze();
