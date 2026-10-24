import { readFile, writeFile, mkdir, copyFile, mkdtemp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';

const directory='docs/development/lot-08-mascotte/';
const snapshot=resolve(process.argv[2]||'../detours-lot08-recovery-20261023');
const manifest=JSON.parse(await readFile(join(snapshot,'manifest.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const modifications=new Set(['README.md','src/main.tsx','src/locale-utils.ts','src/components/Preferences.tsx','src/components/JourneysApp.tsx','src/components/PlanningImport.tsx','src/components/OfflineStatus.tsx','scripts/verify-local.mjs']);
const additions=new Set(['src/mascot.ts','src/MascotPreferences.tsx','src/components/Mascot.tsx','src/components/Mascot.css','src/locales/mascot.ts','src/assets/mascot/welcome.svg','src/assets/mascot/attention.svg','src/assets/mascot/ready.svg','public/licenses/mascot.md','tests/mascot.test.mjs','tests/e2e/mascot.spec.ts','scripts/smoke-mascot.mjs','scripts/mascot-preservation.mjs']);
const changed=[],missing=[],restored=[];
for(const row of manifest.files) {
  let bytes;
  try { bytes=await readFile(row.file); } catch(e) { if(e.code==='ENOENT') {missing.push(row.file);continue;}throw e; }
  if(hash(bytes)===row.sha256)continue;
  // Only generated historical screenshots are eligible for automatic restoration.
  if(process.argv.includes('--restore-evidence') && row.file.startsWith('docs/development/') && row.file.endsWith('.png') && !modifications.has(row.file)) {
    const original=await readFile(join(snapshot,'source',row.file));
    if(hash(original)!==row.sha256)throw new Error('Snapshot hash differs: '+row.file);
    const preserved=join(directory,'regenerated',row.file);await mkdir(dirname(preserved),{recursive:true});await writeFile(preserved,bytes);await writeFile(row.file,original);
    restored.push({file:row.file,generatedHash:hash(bytes),restoredHash:row.sha256});
  } else changed.push(row.file);
}
const initial=new Set(manifest.files.map(r=>r.file));
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',maxBuffer:10000000}).split('\0').filter(Boolean);
const added=files.filter(f=>!initial.has(f));
const unexpectedChanges=changed.filter(f=>!modifications.has(f)),unexpectedAdditions=added.filter(f=>!additions.has(f)&&!f.startsWith(directory));
const result={snapshot,initialFingerprint:manifest.fingerprint,initialFiles:manifest.files.length,identical:manifest.files.length-changed.length-missing.length,changed,missing,unexpectedChanges,unexpectedAdditions,passed:!missing.length&&!unexpectedChanges.length&&!unexpectedAdditions.length};
await writeFile(directory+'preservation.json',JSON.stringify(result,null,2)+'\n');
if(restored.length)await writeFile(directory+'restored-evidence.json',JSON.stringify(restored,null,2)+'\n');
const excluded=new Set(['changes.json','preservation.json','lot08.patch','patch-check.json'].map(f=>directory+f));
const rows=await Promise.all([...changed,...added].filter(f=>!excluded.has(f)).map(async file=>{const bytes=await readFile(file);return {file,kind:initial.has(file)?'modified':'added',bytes:bytes.length,sha256:hash(bytes)};}));
await writeFile(directory+'changes.json',JSON.stringify(rows,null,2)+'\n');
if(!result.passed) {console.log(JSON.stringify(result));process.exitCode=1;} else {
  const temp=await mkdtemp(join(tmpdir(),'detours-lot08-patch-'));await mkdir(join(temp,'before'));await mkdir(join(temp,'after'));
  for(const file of [...changed,...added.filter(f=>additions.has(f))]) {
    for(const name of initial.has(file)?['before','after']:['after']) {const target=join(temp,name,file);await mkdir(dirname(target),{recursive:true});await copyFile(name==='before'?join(snapshot,'source',file):file,target);}
  }
  let patch;
  try {patch=execFileSync('git',['diff','--no-index','--binary','--','before','after'],{cwd:temp,encoding:'utf8',maxBuffer:20000000,stdio:['ignore','pipe','pipe']});}
  catch(e) {if(e.status!==1)throw e;patch=e.stdout;}
  patch=patch.split('\n').map(line=> /^(?:diff --git |--- |\+\+\+ )/.test(line) ? line.replaceAll('a/before/','a/').replaceAll('b/after/','b/').replaceAll('a/after/','a/').replaceAll('b/before/','b/') : line).join('\n');
  await writeFile(directory+'lot08.patch',patch);
  execFileSync('git',['apply','--reverse','--check','--ignore-space-change',directory+'lot08.patch'],{stdio:['ignore','pipe','pipe']});
  await writeFile(directory+'patch-check.json',JSON.stringify({passed:true,reverseCheckOnly:true,patch:'lot08.patch',sourceTemp:temp},null,2)+'\n');
  console.log(JSON.stringify({...result,patchReverseCheck:true,restored:restored.length}));
}
