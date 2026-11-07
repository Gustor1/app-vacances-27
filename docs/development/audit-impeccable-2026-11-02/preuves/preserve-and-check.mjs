// Preserve regenerated test evidence, then restore only outputs initially clean.
import {readFile,writeFile,mkdir,cp,access,unlink,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd(),base=path.join(root,'docs/development/audit-impeccable-2026-11-02'),out=path.join(base,'preuves');
try{await access(path.join(out,'final-state.json'));throw Error('Audit already finalized: this preservation helper is one-shot.');}catch(e){if(e.code!=='ENOENT')throw e;}
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const initialChanged=new Set(['AGENTS.md','README.md','docs/development/COLLABORATION.md']);
const prefixes=['docs/development/logos-palettes/','docs/development/palettes-personnalisees/','docs/development/lot-04-lieux/screenshots/','docs/development/lot-05-compagnon/screenshots/','docs/development/lot-07-assistant/screenshots/','docs/development/lot-08-mascotte/screenshots/','docs/development/mascottes-integrees/','docs/development/import-fiable-lot-01/screenshots/','docs/development/lot-09-souvenirs/screenshots/'];
const generated=file=>prefixes.some(p=>file.startsWith(p))||file==='docs/development/lot-09-souvenirs/image-budgets.json';
const modified=git('diff','--name-only','-z').split('\0').filter(Boolean);
const tracked=modified.filter(f=>!initialChanged.has(f)&&generated(f));
const untracked=git('ls-files','--others','--exclude-standard','-z').split('\0').filter(f=>f&&generated(f));
for(const file of [...tracked,...untracked]){const dest=path.join(out,'generated-by-existing-tests',file);await mkdir(path.dirname(dest),{recursive:true});await cp(path.join(root,file),dest);}
const backup=path.join(tmpdir(),'detours-audit-preserve-20261102');
for(const prefix of prefixes){const src=path.join(backup,prefix);try{await access(src);await cp(src,path.join(root,prefix),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}}
if(tracked.length)git('restore','--worktree','--',...tracked);
for(const file of untracked){const resolved=path.resolve(root,file);if(!resolved.startsWith(root+path.sep)||!generated(file))throw Error('Unexpected cleanup path');await unlink(resolved);}
// Preserve isolated compiled-test screenshots/reports without copying sessions.
const independent=JSON.parse(await readFile(path.join(out,'independent-results.json'),'utf8'));
try{await cp(path.join(independent.sandbox,'docs'),path.join(out,'compiled-checks'),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
for(const [folder,label] of [['detours-audit-e2e-20261102','e2e-resumed-results'],['detours-audit-e2e-final-20261102','e2e-final-results']]){
 try{await cp(path.join(tmpdir(),folder),path.join(out,label),{recursive:true,filter:source=>!path.basename(source).startsWith('.playwright-artifacts-')&&!source.endsWith('.html')});}catch(e){if(e.code!=='ENOENT')throw e;}
}
const files=git('ls-files','-z','--cached','--others','--exclude-standard').split('\0').filter(f=>f&&!f.startsWith('docs/')&&!f.endsWith('.md')).sort();
const hash=createHash('sha256');for(const f of files)hash.update(f).update('\0').update(await readFile(path.join(root,f))).update('\0');
const fingerprint=hash.digest('hex');
const gate=JSON.parse(await readFile(path.join(out,'gate-validation.json'),'utf8'));
const status=git('status','--short');
const final={date:'2026-11-02',timezone:'Asia/Shanghai',head:git('rev-parse','HEAD').trim(),branch:git('branch','--show-current').trim(),fingerprint,initialFingerprint:gate.sourceFingerprint,sourceUnchanged:fingerprint===gate.sourceFingerprint,restoredTrackedTestOutputs:tracked,preservedNewTestOutputs:untracked,preservedOtherChanges:modified.filter(f=>!initialChanged.has(f)&&!generated(f)),status};
await writeFile(path.join(out,'final-state.json'),JSON.stringify(final,null,2));
await writeFile(path.join(out,'git-final.txt'),status);
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile(path.join(out,'inventaire-commandes.json'),JSON.stringify({packageScripts:pkg.scripts,unitFiles:(await readdir('tests')).filter(f=>f.endsWith('.test.mjs')),browserFiles:(await readdir('tests/e2e')).filter(f=>f.endsWith('.spec.ts')),scriptFiles:await readdir('scripts'),interpretation:'selection and exclusions documented in COUVERTURE.md; helpers/generators are not all standalone validations'},null,2));
console.log(JSON.stringify({sourceUnchanged:final.sourceUnchanged,restored:tracked.length,preservedNew:untracked.length,status}));
if(!final.sourceUnchanged)process.exitCode=1;
