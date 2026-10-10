import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
test('generated worker: push and click are same-origin, discreet, deduplicated and preserve offline handlers',async()=>{
  const directory=await mkdtemp(resolve(tmpdir(),'detours-worker-test-'));
  try {
    await mkdir(resolve(directory,'dist/assets'),{recursive:true});
    await writeFile(resolve(directory,'dist/index.html'),'<script type="module" src="/assets/index.js"></script>');await writeFile(resolve(directory,'dist/assets/index.js'),'export const fixture=true;');
    execFileSync(process.execPath,[resolve('scripts/build-sw.mjs')],{cwd:directory,stdio:'pipe'});
    const handlers={},shown=[],opened=[],navigated=[];
    const client={url:'https://detours.example/',navigate:async url=>navigated.push(url),focus:async()=>{}};
    const self={location:{origin:'https://detours.example'},addEventListener:(name,fn)=>handlers[name]=fn,registration:{showNotification:async(title,value)=>shown.push({title,value})},clients:{matchAll:async()=>[client],openWindow:async url=>opened.push(url)}};
    vm.runInNewContext(await readFile(resolve(directory,'dist/sw.js'),'utf8'),{self,URL,console});
    for(const name of ['install','activate','fetch','push','notificationclick'])assert.equal(typeof handlers[name],'function');
    let promise;const waitUntil=p=>promise=p;
    handlers.push({data:{json:()=>({tag:'occurrence',body:'Un engagement approche',url:'/?trip=exact&kind=step&object=exact-step'})},waitUntil});await promise;
    assert.equal(shown[0].value.tag,'occurrence');assert.equal(shown[0].value.renotify,false);assert.equal(shown[0].title,'Détours');
    handlers.push({data:{json:()=>({tag:'unsafe',url:'https://evil.invalid/'})},waitUntil});assert.equal(shown.length,1);
    let closed=false;handlers.notificationclick({notification:{close:()=>closed=true,data:shown[0].value.data},waitUntil});await promise;
    assert.ok(closed);assert.deepEqual(navigated,['https://detours.example/?trip=exact&kind=step&object=exact-step']);assert.deepEqual(opened,[]);
  }finally{if(!directory.startsWith(resolve(tmpdir(),'detours-worker-test-')))throw Error('Unexpected temporary path');await rm(directory,{recursive:true,force:true});}
});
