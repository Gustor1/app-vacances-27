import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRun } from '../scripts/nvidia-import/analyze-live.mjs';

const baseline={rules:[{id:'a',passed:true},{id:'b',passed:true}],summary:{rules:{expectedItems:2,assignedItems:2,omissions:0}}};
const rawScore={passed:true,expectedItems:1,separateItems:1,assignedItems:1,omissions:0,falseBookings:0,inventedCoordinates:0,fieldErrors:0};
const response=(id,ms,accepted=true)=>({id,status:'complete',result:{provider:{model:'test-model',latencyMs:ms,usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}},acceptedForPreview:accepted,issues:accepted?[]:[{code:'not-in-source',path:'description'}]},evaluation:{passed:accepted,rawScore}});
test('live analysis separates raw fidelity, guard rejection, transport failure and unknown consumption',()=>{
  const run={attempts:3,expectedCases:3,notAttempted:[],summary:{cases:3,expectedItems:3,assignedItems:1,omissions:2},results:[response('a',1000,false),response('c',3000),{id:'b',error:{code:'rate-limit',status:429},evaluation:{passed:false}}]};
  const result=analyzeRun(run,baseline);
  assert.equal(result.raw.summary.assignedItems,2);assert.equal(result.accepted.assignedItems,1);
  assert.equal(result.latencyMs.median,2000);assert.equal(result.latencyMs.max,3000);
  assert.deepEqual(result.regressions,{onSuccessfulResponses:['a'],transportFailures:['b']});
  assert.equal(result.tokens.responsesWithCounters,2);assert.equal(result.tokens.attemptsWithoutCounters,1);assert.equal(result.tokens.observed.total_tokens,60);
  assert.equal(result.decision,'benchmark-only-no-ui');assert.equal(result.transportErrors[0].status,429);
});
test('an unreturned safety case cannot be interpreted as a successful zero-hallucination check',()=>{
  const run={attempts:1,expectedCases:1,notAttempted:[],summary:{cases:1,assignedItems:0,omissions:1},results:[{id:'injection',error:{code:'rate-limit'},evaluation:{passed:false}}]};
  const result=analyzeRun(run,baseline);assert.equal(result.criteria.allSafetyCasesResponded,false);assert.equal(result.criteria.noNewSafetyBookingsOrCoordinates,false);
  assert.equal(result.latencyMs.median,null);assert.equal(result.tokens.responsesWithCounters,0);assert.equal(result.tokens.attemptsWithoutCounters,1);
});
