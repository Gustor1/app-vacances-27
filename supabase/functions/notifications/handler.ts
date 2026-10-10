import webpush from 'npm:web-push@3.6.7';
import { buildRecap, parseNotificationPreferences, planOccurrences, type Recap } from '../../../src/notifications.ts';
import { joinContent, type TripContent } from '../../../src/cloud/projection.ts';
import { deliverBatch, occurrenceTag, type DeliveryRow, type ProviderResult } from '../../../src/notification-delivery.ts';
import { renderRecapEmail, type NotificationLanguage } from '../../../src/notification-email.ts';
import { validPushEndpoint } from '../../../src/notification-endpoints.ts';
import { loadRecapWeather } from '../../../src/notification-weather.ts';
// Warm-isolate cache only; weather failure never blocks a message. Fixed 64
// trips / 64 forecasts per trip, no push subscriptions or content cached here.
const weatherMemory=new Map<string,string>();
const weatherStorage={get length(){return weatherMemory.size;},key:(index:number)=>[...weatherMemory.keys()][index]||null,getItem:(key:string)=>weatherMemory.get(key)||null,setItem:(key:string,value:string)=>{weatherMemory.delete(key);weatherMemory.set(key,value);while(weatherMemory.size>64)weatherMemory.delete(weatherMemory.keys().next().value!);},removeItem:(key:string)=>{weatherMemory.delete(key);}};

type Source={record:{content:TripContent};preferences:unknown;language:NotificationLanguage;email:string|null;activatedAt:string;sourceRevision:string;devices:{deviceId:string;endpoint:string;p256dh:string;auth:string}[]};
export async function notificationWorker(request: Request, configuration: Record<string,string> = {}): Promise<Response> {
const env=(name:string)=>configuration[name] ?? Deno.env.get(name) ?? '';
async function rpc<T>(name:string,args:Record<string,unknown>={}):Promise<T>{
 const key=env('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(env('SUPABASE_SECRET_KEYS')||'{}').default || '';
 const response=await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}), 'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!response.ok)throw Error(`RPC ${name}: ${response.status}`);const body=await response.text();return (body?JSON.parse(body):null) as T;
}
function planned(source:Source,user:string){const p=parseNotificationPreferences(JSON.stringify(source.preferences));return planOccurrences(joinContent(source.record.content),p,user,source.devices.map(d=>d.deviceId),Date.parse(source.activatedAt));}
const sourceFor=(row:DeliveryRow)=>rpc<Source|null>('detours_notification_source',{p_user:row.recipient,p_trip:row.tripId});
async function provider(row:DeliveryRow,weatherFetcher:typeof fetch,snapshots:Map<string,Recap>):Promise<ProviderResult>{
 // Re-read after claim/begin: never use queued content for an external message.
 const source=await sourceFor(row);if(!source)return 'expired';
 if(!planned(source,row.recipient).some(o=>o.key===row.key && o.revision===row.revision && o.due===row.due && o.expires>Date.now()))return 'expired';
 if(row.channel==='email'){
  if(!source.email || !env('RESEND_API_KEY') || !env('NOTIFICATION_EMAIL_FROM'))return 'failed';
  const prefs=parseNotificationPreferences(JSON.stringify(source.preferences));
  const state=joinContent(source.record.content),plain=buildRecap(state,row.objectId,prefs.timezone);if(!plain)return 'expired';
  const forecasts=await loadRecapWeather(weatherStorage,row.tripId,plain.items,{now:new Date(),fetcher:weatherFetcher});
  const recap=buildRecap(state,row.objectId,prefs.timezone,forecasts.weather)!;
  snapshots.set(row.key,recap);
  const message=renderRecapEmail(recap,source.language,env('NOTIFICATION_APP_ORIGIN'));
  const key=await occurrenceTag(row.key);
  const fresh=await sourceFor(row),caps=await rpc<{enabled:boolean;email:boolean}>('detours_notification_capabilities');
  if(!fresh || fresh.sourceRevision!==source.sourceRevision || !fresh.email || !caps.enabled || !caps.email || row.expires<=Date.now() || env('NOTIFICATIONS_ENABLED')!=='true')return 'expired';
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:env('NOTIFICATION_EMAIL_FROM'),to:[source.email],...message}),signal:AbortSignal.timeout(10000),redirect:'error'});
  return response.ok?'accepted':response.status===429?'retry':response.status>=500?'uncertain':'failed';
 }
 const device=source.devices.find(d=>d.deviceId===row.deviceId);if(!device || !validPushEndpoint(device.endpoint))return 'expired';
 if(!env('VAPID_PUBLIC_KEY') || !env('VAPID_PRIVATE_KEY') || !env('VAPID_SUBJECT'))return 'failed';
 const isRecap=row.type==='recap',kind=isRecap?'recap':row.objectId.split(':')[0],object=isRecap?row.objectId:row.objectId.slice(row.objectId.indexOf(':')+1);
 if(isRecap){const recap=buildRecap(joinContent(source.record.content),row.objectId,parseNotificationPreferences(JSON.stringify(source.preferences)).timezone);if(recap)snapshots.set(row.key,recap);}
 const body={fr:isRecap?'Votre récap est prêt':'Un engagement approche',en:isRecap?'Your recap is ready':'An event is coming up',es:isRecap?'Tu resumen está listo':'Se acerca una actividad',zh:isRecap?'每日摘要已就绪':'活动即将开始'}[source.language==='zh-CN'?'zh':source.language];
 const url=`/?trip=${encodeURIComponent(row.tripId)}&kind=${kind}&object=${encodeURIComponent(object)}`;
 try{await webpush.sendNotification({endpoint:device.endpoint,keys:{p256dh:device.p256dh,auth:device.auth}},JSON.stringify({tag:await occurrenceTag(row.key),body,url}),{vapidDetails:{subject:env('VAPID_SUBJECT'),publicKey:env('VAPID_PUBLIC_KEY'),privateKey:env('VAPID_PRIVATE_KEY')},TTL:Math.max(0,Math.floor((row.expires-Date.now())/1000)),timeout:10000});return 'accepted';}
 catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404 || status===410){await rpc('detours_notification_expire_device',{p_user:row.recipient,p_device:row.deviceId});return 'expired';}return status===429?'retry':status && status<500?'failed':'uncertain';}
}
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=env('NOTIFICATION_WORKER_SECRET');
 if(!secret || request.headers.get('x-notification-secret')!==secret)return new Response('Unauthorized',{status:401});
 // Requires BOTH environment switch and database switch. No migration creates cron.
 if(env('NOTIFICATIONS_ENABLED')!=='true')return Response.json({enabled:false});
 const caps=await rpc<{enabled:boolean}>('detours_notification_capabilities');if(!caps.enabled)return Response.json({enabled:false});
 const now=Date.now();let plannedCount=0;
 const snapshots=new Map<string,Recap>();
 let weatherCalls=0;
 const weatherFetcher:typeof fetch=async(input,options)=>{if(weatherCalls++>=8)throw Error('Weather batch budget reached');return fetch(input,{...options,redirect:'error'});};
 // Bounded 500 followed trips per invocation; offset rotates via scheduler body.
 let offset=0;try{offset=Math.max(0,Math.floor((await request.json()).offset||0));}catch{ /* default first page */ }
 for(let page=0;page<5;page++){
  const sources=await rpc<{userId:string;tripId:string;source:Source|null}[]>('detours_notification_sources',{p_limit:100,p_offset:offset+page*100});
  for(const item of sources){const occurrences=item.source?planned(item.source,item.userId).filter(o=>o.expires>now):[];await rpc('detours_notification_reconcile',{p_user:item.userId,p_trip:item.tripId,p_occurrences:occurrences,p_revision:item.source?.sourceRevision||''});plannedCount+=occurrences.length;}
  if(sources.length<100)break;
 }
 const result=await deliverBatch({
  claim:(clock,limit)=>rpc('detours_notification_claim',{p_now:new Date(clock).toISOString(),p_limit:limit}),
  validate:async row=>{const source=await sourceFor(row);return !!source && planned(source,row.recipient).some(o=>o.key===row.key && o.revision===row.revision && o.due===row.due && o.expires>Date.now()) && (row.channel!=='email' || !!source.email);},
  begin:(row)=>rpc('detours_notification_begin',{p_key:row.key,p_token:row.token,p_now:new Date().toISOString()}),
  finish:async(row,status,next)=>{await rpc('detours_notification_finish',{p_key:row.key,p_token:row.token,p_state:status,p_next:next?new Date(next).toISOString():null,p_recap:status==='accepted'?snapshots.get(row.key)||null:null});}
 },row=>provider(row,weatherFetcher,snapshots),()=>Date.now(),true,10);
 return Response.json({planned:plannedCount,...result,nextOffset:offset+500});
}
