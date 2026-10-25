// Execute only the checks not run after the failed common gate; never changes its status.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const gate=JSON.parse(await readFile(path.join(root,'docs/development/lot-09-souvenirs/gate/validation.json'),'utf8'));
const original=await readFile(path.join(root,'scripts/verify-local.mjs'),'utf8');
const prefix=original.slice(0,original.indexOf('console.log(`Vérification locale'))
  .replace("from './verify-runner.mjs'",`from '${pathToFileURL(path.join(root,'scripts/verify-runner.mjs')).href}'`);
const config=await import('data:text/javascript,'+encodeURIComponent(prefix+'\nexport {steps,env,output,fingerprint,sourceFingerprint};'));
const checks=[];let prepared=false;
console.log('Continuation distincte — sorties '+config.output);
for(const step of config.steps.filter(step=>gate.notRun.includes(step.name))) {
  if(step.cwd===config.output&&!prepared) {
    await mkdir(path.join(config.output,'dist'));await cp(path.join(root,'dist'),path.join(config.output,'dist'),{recursive:true});
    await writeFile(path.join(config.output,'.env.local'),'VITE_SUPABASE_URL=https://detourstest.supabase.co\n');prepared=true;
  }
  console.log('\nContrôle restant : '+step.name);const startedAt=new Date().toISOString();
  const exitCode=await new Promise(resolve=>{const child=spawn(process.execPath,[...(step.script?[step.script]:[]),...step.args],{cwd:step.cwd,env:config.env,stdio:'inherit'});child.once('error',()=>resolve(1));child.once('exit',code=>resolve(code??1));});
  checks.push({name:step.name,startedAt,finishedAt:new Date().toISOString(),exitCode,status:exitCode===0?'passed':'failed'});
  await writeFile('docs/development/lot-09-souvenirs/remaining-validation.json',JSON.stringify({globalGatePassed:false,sourceFingerprint:config.sourceFingerprint,sourceUnchanged:config.sourceFingerprint===await config.fingerprint(),output:config.output,checks,inProgress:true},null,2));
}
const sourceUnchanged=config.sourceFingerprint===await config.fingerprint();
const result={globalGatePassed:false,sourceFingerprint:config.sourceFingerprint,sourceUnchanged,output:config.output,checks,inProgress:false,passed:sourceUnchanged&&checks.every(check=>check.exitCode===0)};
await writeFile('docs/development/lot-09-souvenirs/remaining-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=result.passed?0:1;
