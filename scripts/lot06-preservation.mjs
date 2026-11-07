import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const snapshot=resolve(process.argv[2]||'../detours-lot06-recovery-20261023');
const manifest=JSON.parse(await readFile(join(snapshot,'manifest.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const changed=[],missing=[];
for(const row of manifest.files) {
  try { if(hash(await readFile(row.file))!==row.sha256)changed.push(row.file); }
  catch(error){if(error.code==='ENOENT')missing.push(row.file);else throw error;}
}
const initial=new Set(manifest.files.map(f=>f.file));
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',maxBuffer:10000000}).split('\0').filter(Boolean);
const additions=files.filter(p=>!initial.has(p));
const allowed=p=>p.startsWith('docs/development/lot-06-modele/')||p.startsWith('scripts/lot06-')||p==='scripts/benchmark-lot06.mjs'||p==='tests/lot06-benchmark.test.mjs'||p==='tests/fixtures/planning/lot06-corpus.json';
const unexpectedAdditions=additions.filter(p=>!allowed(p));
const rows=await Promise.all(additions.filter(allowed).filter(p=>!p.endsWith('/preservation.json')&&!p.endsWith('/changes.json')&&!p.endsWith('/lot06.patch')).map(async file=>{const bytes=await readFile(file);return {file,bytes:bytes.length,sha256:hash(bytes)};}));
await writeFile('docs/development/lot-06-modele/changes.json',JSON.stringify(rows,null,2)+'\n');
const result={snapshot,initialFiles:manifest.files.length,identical:manifest.files.length-changed.length-missing.length,changed,missing,unexpectedAdditions,missionAdditions:rows.length,passed:!changed.length&&!missing.length&&!unexpectedAdditions.length};
await writeFile('docs/development/lot-06-modele/preservation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(!result.passed)process.exitCode=1;
