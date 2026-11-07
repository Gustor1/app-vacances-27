// Audit harness only: executes existing checks without changing their assertions.
import {spawn} from 'node:child_process';
import {mkdir,cp,writeFile,mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd(), out=path.join(root,'docs/development/audit-impeccable-2026-11-02/preuves');
const sandbox=await mkdtemp(path.join(tmpdir(),'detours-audit-independent-'));
await cp(path.join(root,'dist'),path.join(sandbox,'dist'),{recursive:true});
await writeFile(path.join(sandbox,'.env.local'),'VITE_SUPABASE_URL=https://detourstest.supabase.co\n');
const env={...process.env,CI:'1',DETOURS_LOCAL_VERIFY:'1',VITE_SUPABASE_URL:'https://detourstest.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_fixture',VITE_ENABLE_COLLABORATION:'true',PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:'C:/Program Files/Google/Chrome/Application/chrome.exe'};
delete env.DETOURS_ALLOW_NETWORK;delete env.PRODUCTION_TEST_URL;delete env.BETA_TEST_URL;
const results=[];
const smoke=['production','backup','ui','common-sharing','l4-offline','l4-persistence','l5-now','l6-preparation','l8-release','planning-structured','planning-documents','companion','souvenirs','assistant','mascot','places','pwa-mobile','app-update','install-manifest','planning-import','notebook','palette-claire'];
const jobs=[
 ['e2e-all','node_modules/@playwright/test/cli.js',['test','--config',path.join(out,'audit.playwright.config.mts')],root],
 ['planning-analysis','node_modules/@playwright/test/cli.js',['test','--config','playwright.planning.config.ts','--output',path.join(out,'planning-analysis-results')],root],
 ...['test-sql-local','test-collaboration-sql-local','test-participation-money-sql-local'].map(n=>[n,`scripts/${n}.mjs`,[env.DETOURS_PGLITE_PATH],root]),
 ...smoke.map(n=>['smoke-'+n,`scripts/smoke-${n}.mjs`,[],sandbox]),
 ['measure-l8','scripts/measure-l8.mjs',[path.join(root,'dist'),path.join(out,'performance.json')],root],
 ['evaluate-planning','scripts/evaluate-planning.mjs',[path.join(out,'planning-evaluation.json')],root],
 ['evaluate-planning-stress','scripts/evaluate-planning-stress.mjs',[path.join(out,'planning-stress')],root],
];
await mkdir(out,{recursive:true});
console.log('Sandbox:',sandbox);
for(const [name,script,args,cwd] of jobs){
 const startedAt=new Date().toISOString();console.log('START',name);
 const log=await import('node:fs').then(fs=>fs.createWriteStream(path.join(out,name+'.log')));
 const code=await new Promise(resolve=>{const p=spawn(process.execPath,[path.join(root,script),...args],{cwd,env,stdio:['ignore','pipe','pipe']});p.stdout.pipe(log);p.stderr.pipe(log);p.on('error',e=>{log.write(String(e));resolve(-1)});p.on('exit',resolve)});
 log.end();results.push({name,code,startedAt,finishedAt:new Date().toISOString()});
 await writeFile(path.join(out,'independent-results.json'),JSON.stringify({sandbox,results},null,2));console.log('END',name,code);
}
