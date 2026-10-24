import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
const directory='docs/development/lot-07-assistant/',snapshot=resolve(process.argv[2]||'../detours-lot07-recovery-20261023');
const manifest=JSON.parse(await readFile(join(snapshot,'manifest.json'),'utf8')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const modifications=new Set(['README.md','src/App.tsx','src/hooks/useTravelState.ts','src/locale-utils.ts','scripts/verify-local.mjs']);
const additions=new Set(['src/assistant.ts','src/travel-write.ts','src/components/GuidedAssistant.tsx','src/components/GuidedAssistant.css','src/locales/assistant.ts','tests/assistant.test.mjs','tests/e2e/assistant.spec.ts','scripts/assistant-fixture.mjs','scripts/assistant-fixture.d.mts','scripts/assistant-preservation.mjs','scripts/smoke-assistant.mjs']);
const changed=[],missing=[];
for(const row of manifest.files){try{if(hash(await readFile(row.file))!==row.sha256)changed.push(row.file);}catch(e){if(e.code==='ENOENT')missing.push(row.file);else throw e;}}
const initial=new Set(manifest.files.map(r=>r.file));
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',maxBuffer:10000000}).split('\0').filter(Boolean);
const added=files.filter(f=>!initial.has(f)),unexpectedChanges=changed.filter(f=>!modifications.has(f)),unexpectedAdditions=added.filter(f=>!additions.has(f)&&!f.startsWith(directory));
const excluded=new Set(['changes.json','preservation.json','lot07.patch'].map(f=>directory+f));
const rows=await Promise.all([...changed,...added].filter(f=>!excluded.has(f)).map(async file=>{const bytes=await readFile(file);return {file,kind:initial.has(file)?'modified':'added',bytes:bytes.length,sha256:hash(bytes)};}));
await writeFile(directory+'changes.json',JSON.stringify(rows,null,2)+'\n');
const result={snapshot,initialFingerprint:manifest.fingerprint,initialFiles:manifest.files.length,identical:manifest.files.length-changed.length-missing.length,changed,missing,unexpectedChanges,unexpectedAdditions,passed:!missing.length&&!unexpectedChanges.length&&!unexpectedAdditions.length};
await writeFile(directory+'preservation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
