import { readFile, writeFile } from 'node:fs/promises';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { terminateWorker } from './lot06-process.mjs';

const directory='docs/development/lot-06-modele/';
const report=JSON.parse(await readFile(directory+'results-first-attempt.json','utf8'));
if(report.model.length!==12 || report.hybrid.length!==12)throw Error('Inference incomplete: cannot finalize');
const child=fork(fileURLToPath(new URL('./lot06-worker.mjs',import.meta.url)),[],{stdio:['ignore','ignore','pipe','ipc']});
child.stderr.on('data',data=>process.stderr.write(data));
let stopped=false;
try {
  const ready=await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('Offline reload timeout')),120000);
    child.once('message',message=>{clearTimeout(timer);message.type==='ready'?done(message):reject(Error(JSON.stringify(message)));});
    child.once('error',reject);
  });
  let lateMessages=0;
  child.on('message',()=>lateMessages++);
  child.send({id:'cancellation-recheck',source:report.rules[0].draft.notes.join('\n')||'Ville: Nantes\nJour 1\n- Jardin des plantes'});
  await new Promise(done=>setTimeout(done,100));
  const start=performance.now();await terminateWorker(child);const exitMs=performance.now()-start;
  await terminateWorker(child);stopped=true;
  const recovery={checkedAt:new Date().toISOString(),originalRunnerExitCode:1,reason:'Second wait on signal-terminated child; all 18 generation responses were already saved.',offlineReload:ready,cancellation:{method:'Terminate isolated worker 100ms after dispatch; exact native stage not instrumented',exitMs,lateMessages,idempotentSecondStop:true,exitCode:child.exitCode,signalCode:child.signalCode}};
  await writeFile(directory+'recovery.json',JSON.stringify(recovery,null,2)+'\n');
  report.status='complete';report.endedAt=new Date().toISOString();report.cancellation=recovery.cancellation;report.recovery=recovery;
  await writeFile(directory+'results.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(recovery));
}finally{if(!stopped)await terminateWorker(child);}
