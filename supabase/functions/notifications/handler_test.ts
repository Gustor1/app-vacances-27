import assert from 'node:assert/strict';
import { notificationWorker } from './handler.ts';
import { loadWorkerConfiguration } from './bootstrap.ts';
import { defaultNotificationPreferences, planOccurrences, shiftDate } from '../../../src/notifications.ts';
import { dateInTimezone } from '../../../src/time.ts';
import { splitContent } from '../../../src/cloud/projection.ts';
import type { StoredState } from '../../../src/types.ts';

const environment={NOTIFICATION_WORKER_SECRET:'fixture-secret',NOTIFICATIONS_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-server-key',RESEND_API_KEY:'fixture-email-key',NOTIFICATION_EMAIL_FROM:'Détours <fixture@example.invalid>',NOTIFICATION_APP_ORIGIN:'https://detours.example'};
Deno.test('Vault loader uses privileged RPC and ignores unrelated environment keys',async()=>{
  await withEnvironment(async()=>{
    Deno.env.delete('NOTIFICATION_WORKER_SECRET');
    const originalFetch=globalThis.fetch;
    globalThis.fetch=async(input,init)=>{
      assert.equal(String(input),'https://fixture.supabase.invalid/rest/v1/rpc/detours_notification_worker_configuration');
      assert.equal(new Headers(init?.headers).get('apikey'),'fixture-server-key');
      return Response.json({NOTIFICATION_WORKER_SECRET:'fixture-vault-secret',NOTIFICATIONS_ENABLED:'true',SUPABASE_SERVICE_ROLE_KEY:'must-not-replace',RESEND_API_KEY:'must-not-enable'});
    };
    try {
      const loaded=await loadWorkerConfiguration();
      assert.equal(loaded.NOTIFICATION_WORKER_SECRET,'fixture-vault-secret');
      assert.equal(Deno.env.get('NOTIFICATION_WORKER_SECRET'),undefined);
      assert.equal(loaded.SUPABASE_SERVICE_ROLE_KEY,undefined);
      assert.equal(loaded.RESEND_API_KEY,undefined);
      assert.equal(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),'fixture-server-key');
      assert.equal(Deno.env.get('RESEND_API_KEY'),'fixture-email-key');
    }finally{globalThis.fetch=originalFetch;}
  });
});
async function withEnvironment(work:()=>Promise<void>){
  const old=new Map(Object.keys(environment).map(key=>[key,Deno.env.get(key)]));
  for(const [key,value] of Object.entries(environment))Deno.env.set(key,value);
  try{await work();}finally{for(const [key,value] of old)value===undefined?Deno.env.delete(key):Deno.env.set(key,value);}
}
Deno.test('worker refuses unauthorized requests and stays inert with switch off',async()=>{
  await withEnvironment(async()=>{
    assert.equal((await notificationWorker(new Request('https://detours.example',{method:'POST'}))).status,401);
    Deno.env.set('NOTIFICATIONS_ENABLED','false');
    const response=await notificationWorker(new Request('https://detours.example',{method:'POST',headers:{'x-notification-secret':'fixture-secret'}}));
    assert.deepEqual(await response.json(),{enabled:false});
    Deno.env.set('NOTIFICATIONS_ENABLED','true');
    const configured=await notificationWorker(new Request('https://detours.example',{method:'POST',headers:{'x-notification-secret':'vault-secret'}}),{NOTIFICATION_WORKER_SECRET:'vault-secret',NOTIFICATIONS_ENABLED:'false'});
    assert.deepEqual(await configured.json(),{enabled:false});
  });
});

for(const revoke of [false,true])Deno.test(`worker simulated email: recap snapshot and weather; revoked=${revoke}`,async()=>{
  await withEnvironment(async()=>{
    const zone='Asia/Shanghai',now=Date.now(),date=shiftDate(dateInTimezone(zone,new Date(now)),1);
    const recapTime=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(now-60000));
    const state:StoredState={version:1,journey:{id:'fixture-trip',title:'<Private title>',timezone:zone,currency:'EUR',destinations:'',description:'',cover:'',source:'custom',followsCatalog:false},departureDate:'',notes:{general:'PRIVATE NOTE'},favorites:[],done:[],bookings:[],cities:[{id:'city',name:'Shanghai',chineseName:'上海',subtitle:'',image:'',color:'#547764',notes:[],coordinates:[31.23,121.47],days:[{id:'day',date,title:'Jour',steps:[{id:'walk',title:'Balade',category:'walk',description:''}]}]}]};
    const preferences={...defaultNotificationPreferences(zone),email:true,recapTime};
    const source={record:{content:splitContent(state)},preferences,language:'en',email:'verified@example.invalid',activatedAt:new Date(now-172800000).toISOString(),sourceRevision:'fixture-revision',devices:[]};
    const row={...planOccurrences(state,preferences,'recipient',[],now-172800000)[0],status:'claimed',attempts:1,token:'fixture-token'};
    let sends=0,weatherCalls=0,sourceCalls=0;const finishes:Record<string,unknown>[]=[];
    const originalFetch=globalThis.fetch;
    globalThis.fetch=async(input,init)=>{
      const url=String(input);
      if(url.startsWith('https://api.open-meteo.com/')){weatherCalls++;return Response.json({daily:{time:[date],temperature_2m_min:[18],temperature_2m_max:[25],precipitation_probability_max:[80],uv_index_max:[4]}});}
      if(url==='https://api.resend.com/emails'){
        sends++;const payload=JSON.parse(String(init?.body));assert.deepEqual(payload.to,['verified@example.invalid']);assert.ok(!payload.html.includes('PRIVATE NOTE'));assert.ok(payload.html.includes('&lt;Private title&gt;'));assert.ok(payload.text.includes('Rain protection'));
        assert.match(new Headers(init?.headers).get('Idempotency-Key')!,/^[a-f0-9]{64}$/);return Response.json({id:'accepted-fixture'});
      }
      const name=url.split('/').at(-1)!;const args=JSON.parse(String(init?.body||'{}'));
      switch(name){
        case 'detours_notification_capabilities':return Response.json({enabled:true,email:true,push:false});
        case 'detours_notification_sources':return Response.json([{userId:'recipient',tripId:'fixture-trip',source}]);
        case 'detours_notification_reconcile':return new Response(null,{status:204});
        case 'detours_notification_claim':return Response.json([row]);
        case 'detours_notification_source':sourceCalls++;return Response.json(revoke && sourceCalls>=3?null:source);
        case 'detours_notification_begin':return Response.json(true);
        case 'detours_notification_finish':finishes.push(args);return new Response(null,{status:204});
        default:throw Error(`Unexpected network request ${name}`);
      }
    };
    try {
      const response=await notificationWorker(new Request('https://detours.example',{method:'POST',headers:{'x-notification-secret':'fixture-secret'},body:'{}'}));
      assert.equal(response.status,200);assert.equal(sends,revoke?0:1);assert.ok(weatherCalls<=1);
      assert.equal(finishes[0].p_state,revoke?'cancelled':'accepted');
      if(!revoke){const snapshot=finishes[0].p_recap as {revision:string;weather:unknown[]};assert.equal(snapshot.revision,row.revision);assert.equal(snapshot.weather.length,1);}
    }finally{globalThis.fetch=originalFetch;}
  });
});
