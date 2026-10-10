import type { Occurrence } from './notifications.ts';
export type DeliveryStatus='pending'|'claimed'|'sending'|'accepted'|'cancelled'|'uncertain'|'failed';
export type DeliveryRow=Occurrence & {status:DeliveryStatus;attempts:number;token:string};
export type ProviderResult='accepted'|'retry'|'expired'|'uncertain'|'failed';
export interface DeliveryStore {
  claim(now:number,limit:number):Promise<DeliveryRow[]>;
  validate(row:DeliveryRow,now:number):Promise<boolean>;
  begin(row:DeliveryRow,now:number):Promise<boolean>;
  finish(row:DeliveryRow,status:DeliveryStatus,next?:number):Promise<void>;
}
/** Provider timeout/network failure is uncertain: never retry blindly after a
 * request may have been accepted. Only an explicit 429/503 is safe to retry. */
export async function deliverBatch(store:DeliveryStore,provider:(row:DeliveryRow)=>Promise<ProviderResult>,time:number|(()=>number),enabled=false,limit=50) {
  if(!enabled)return {claimed:0,accepted:0};
  const clock=typeof time==='function'?time:()=>time;
  const rows=await store.claim(clock(),Math.min(100,Math.max(1,limit)));let accepted=0;
  for(const row of rows) {
    const now=clock();
    if(now>=row.expires || !await store.validate(row,now)){await store.finish(row,'cancelled');continue;}
    if(!await store.begin(row,now))continue;
    let result:ProviderResult;try{result=await provider(row);}catch{result='uncertain';}
    if(result==='accepted'){await store.finish(row,'accepted');accepted++;}
    else if(result==='retry' && row.attempts<3 && now+60000*2**(row.attempts-1)<row.expires)await store.finish(row,'pending',now+60000*2**(row.attempts-1));
    else await store.finish(row,result==='uncertain'?'uncertain':result==='expired'?'cancelled':'failed');
  }
  return {claimed:rows.length,accepted};
}
export async function occurrenceTag(key: string): Promise<string> {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
