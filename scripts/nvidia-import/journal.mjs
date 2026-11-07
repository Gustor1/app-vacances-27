import { mkdir, open, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export async function writeJson(path,value) {
  const text=JSON.stringify(value,null,2)+'\n';
  await writeFile(path+'.tmp',text,{encoding:'utf8',mode:0o600});
  if(await readFile(path+'.tmp','utf8')!==text)throw Error('Journal reread failed');
  await rename(path+'.tmp',path);
}
export async function acquireRunLock(directory) {
  await mkdir(directory,{recursive:true});
  const path=join(directory,'run.lock');
  let handle;
  try{handle=await open(path,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('Run lock present; inspect its PID before removing this exact stale lock.');throw error;}
  await handle.writeFile(JSON.stringify({kind:'detours-nvidia-benchmark',pid:process.pid}));
  await handle.close();
  return ()=>unlink(path);
}
export async function loadJournal(directory,fingerprint) {
  const path=join(directory,'attempts.json');let data;
  try{data=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;data={version:1,fingerprint,attempts:[]};}
  if(data.version!==1||data.fingerprint!==fingerprint||!Array.isArray(data.attempts)||data.attempts.length>100)throw Error('Journal/protocol mismatch');
  if(data.attempts.some((row,i)=>row.number!==i+1||typeof row.id!=='string'||!['started','complete','error','interrupted-unknown'].includes(row.status)))throw Error('Invalid attempt journal');
  for(const row of data.attempts)if(row.status==='started')row.status='interrupted-unknown';
  await writeJson(path,data);
  return {
    get attempts(){return data.attempts;},
    async reserve(id) {
      if(data.attempts.length>=100)throw Error('attempt-budget');
      if(data.attempts.some(row=>row.id===id))throw Error('Already attempted; no automatic repeat');
      const last=data.attempts.at(-1);
      if(last?.cooldownUntil>Date.now())throw Error('Retry-After not elapsed');
      data.attempts.push({number:data.attempts.length+1,id,status:'started',startedAt:new Date().toISOString()});
      await writeJson(path,data);
    },
    async finish(id,result) {
      const row=data.attempts.at(-1);
      if(row?.id!==id||row.status!=='started')throw Error('No pending attempt');
      Object.assign(row,result,{status:result.error?'error':'complete',endedAt:new Date().toISOString()});
      if(result.error?.code==='rate-limit')row.cooldownUntil=Date.now()+Math.max(60000,(result.error.retryAfterSeconds||0)*1000);
      await writeJson(path,data);
    },
  };
}
