import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarize } from '../lot06-core.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const median=values=>{const a=[...values].sort((x,y)=>x-y);return a.length?a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2:null;};
export function analyzeRun(run,baseline) {
  const responded=run.results.filter(row=>row.result),errors=run.results.filter(row=>row.error),rawRows=responded.map(row=>row.evaluation?.rawScore).filter(Boolean);
  const latencies=responded.map(row=>row.result.provider.latencyMs);
  const usages=run.results.map(row=>({id:row.id,usage:row.result?.provider.usage??row.error?.provider?.usage??null}));
  const tokens={responsesWithCounters:usages.filter(row=>row.usage!==null).length,attemptsWithoutCounters:usages.filter(row=>row.usage===null).length,
    observed:Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens'].map(field=>[field,usages.reduce((n,row)=>n+(row.usage?.[field]||0),0)]))};
  const rawSummary=summarize(rawRows),accepted=run.summary;
  const regressionRows=baseline.rules.filter(row=>row.passed).map(row=>run.results.find(result=>result.id===row.id)).filter(row=>row&&!row.evaluation?.passed);
  const regressions={onSuccessfulResponses:regressionRows.filter(row=>row.result).map(row=>row.id),transportFailures:regressionRows.filter(row=>row.error).map(row=>row.id)};
  const safety=run.results.filter(row=>['booking-negation','alternative','injection','late-change'].includes(row.id)).map(row=>({id:row.id,status:row.error?'not-assessed-transport-error':'response-received',raw:row.evaluation?.rawScore??null}));
  const criteria={allCasesReceived:responded.length===run.expectedCases,noAcceptedRegression:regressionRows.length===0,
    assignmentGain:accepted.assignedItems>baseline.summary.rules.assignedItems,omissionsDecreased:accepted.omissions<baseline.summary.rules.omissions,
    medianUnder20Seconds:median(latencies)!==null&&median(latencies)<20000,
    allSafetyCasesResponded:safety.length===4&&safety.every(row=>row.status==='response-received'),
    noNewSafetyBookingsOrCoordinates:safety.every(row=>row.raw&&(row.raw.falseBookings||0)===0&&(row.raw.inventedCoordinates||0)===0)};
  return {model:responded[0]?.result.provider.model??null,mode:'REAL_NVIDIA_INFERENCE',attempts:run.attempts,responses:responded.length,transportErrors:errors.map(row=>({id:row.id,...row.error})),notAttempted:run.notAttempted,
    raw:{summary:rawSummary,expectedItemsInRespondedCases:rawSummary.expectedItems,expectedItemsFullCorpus:baseline.summary.rules.expectedItems,limit:'Raw title-anchor metrics exclude transport failures; not a proof of every generated field.'},
    accepted,regressions,criteria,decision:Object.values(criteria).every(Boolean)?'review-provider-conditions-before-prototype':'benchmark-only-no-ui',
    sourceGuardRejections:responded.filter(row=>!row.result.acceptedForPreview).map(row=>({id:row.id,issues:row.result.issues||[],diagnostic:row.result.diagnostic||null})),
    latencyMs:{count:latencies.length,min:latencies.length?Math.min(...latencies):null,median:median(latencies),max:latencies.length?Math.max(...latencies):null},tokens,
    cost:'Not supplied by endpoint; no monetary amount inferred',limits:['One synthetic small corpus, one generation per attempted case.','A seed does not establish provider determinism or a fixed backend revision.','Descriptions can be faithful paraphrases while the conservative literal guard refuses them.','A 429 is a transport failure, not evidence of model reasoning failure.','No conclusion about physical iPhone performance or regular production entitlement.']};
}
export async function analyzeFiles() {
  const directory='docs/development/lot-06-bis-api-nvidia/';
  const bytes=await readFile(directory+'live/results.json'),run=JSON.parse(bytes),protocol=JSON.parse(await readFile(directory+'live/protocol.json','utf8'));
  if(run.mode!=='LIVE_EVALUATION')throw Error('Expected real run, not simulation');
  const baseline=JSON.parse(await readFile('docs/development/lot-06-modele/analysis.json','utf8'));
  const output={generatedAt:new Date().toISOString(),...analyzeRun(run,baseline),model:protocol.model,runSha256:hash(bytes),protocolSha256:hash(await readFile(directory+'live/protocol.json')),analyzerSha256:hash(await readFile(fileURLToPath(import.meta.url))),parameters:protocol.parameters};
  await writeFile(directory+'live-analysis.json',JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({attempts:output.attempts,responses:output.responses,rawAssigned:output.raw.summary.assignedItems,acceptedAssigned:output.accepted.assignedItems,latencyMs:output.latencyMs,criteria:output.criteria,decision:output.decision},null,2));return output;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await analyzeFiles();
