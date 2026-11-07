import {readFile,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'docs/development/audit-impeccable-2026-11-02/preuves');
let report;
for(;;){
 try{report=JSON.parse(await readFile(path.join(out,'independent-results.json'),'utf8'));await readFile(path.join(out,'e2e-final.json'));if(report.results.at(-1)?.name==='evaluate-planning-stress')break;}catch{}
 await new Promise(r=>setTimeout(r,3000));
}
const startedAt=new Date().toISOString();
const stream=createWriteStream(path.join(out,'smoke-l4-offline-retry.log'));
const env={...process.env,DETOURS_LOCAL_VERIFY:'1',PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:'C:/Program Files/Google/Chrome/Application/chrome.exe',VITE_SUPABASE_URL:'https://detourstest.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_fixture'};
delete env.PRODUCTION_TEST_URL;delete env.DETOURS_ALLOW_NETWORK;
const code=await new Promise(resolve=>{const p=spawn(process.execPath,[path.join(root,'scripts/smoke-l4-offline.mjs')],{cwd:report.sandbox,env,stdio:['ignore','pipe','pipe']});p.stdout.pipe(stream);p.stderr.pipe(stream);p.on('exit',resolve);p.on('error',()=>resolve(-1));});
stream.end();await writeFile(path.join(out,'offline-retry.json'),JSON.stringify({code,startedAt,finishedAt:new Date().toISOString(),isolation:'after both main browser suite and measure runner completed; assertions unchanged'},null,2));console.log('L4 isolated retry:',code);
