import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const directory='docs/development/lot-06-bis-api-nvidia/';
const snapshot=resolve(process.argv[2]||'../detours-lot06bis-recovery-20261023');
const manifest=JSON.parse(await readFile(join(snapshot,'manifest.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const changed=[],missing=[];
for(const row of manifest.files){try{if(hash(await readFile(row.file))!==row.sha256)changed.push(row.file);}catch(error){if(error.code==='ENOENT')missing.push(row.file);else throw error;}}
const initial=new Set(manifest.files.map(row=>row.file));
const current=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',maxBuffer:10000000}).split('\0').filter(Boolean);
const allowed=file=>file.startsWith(directory)||file.startsWith('scripts/nvidia-import/')||file==='scripts/benchmark-nvidia-import.mjs'||file==='tests/nvidia-import.test.mjs'||file==='tests/nvidia-live-analysis.test.mjs';
const excluded=new Set([directory+'changes.json',directory+'preservation.json',directory+'lot06bis.patch']);
const additions=current.filter(file=>!initial.has(file)),unexpectedAdditions=additions.filter(file=>!allowed(file));
const rows=await Promise.all(additions.filter(allowed).filter(file=>!excluded.has(file)).map(async file=>{const data=await readFile(file);return {file,bytes:data.length,sha256:hash(data)};}));
await writeFile(directory+'changes.json',JSON.stringify(rows,null,2)+'\n');
const result={snapshot,initialFiles:manifest.files.length,identical:manifest.files.length-changed.length-missing.length,changed,missing,unexpectedAdditions,missionAdditions:rows.length,passed:!changed.length&&!missing.length&&!unexpectedAdditions.length};
await writeFile(directory+'preservation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
