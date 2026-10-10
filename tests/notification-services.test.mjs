import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverBatch } from '../src/notification-delivery.ts';
import { renderRecapEmail } from '../src/notification-email.ts';
import { validPushEndpoint, registerPush, disablePush } from '../src/notification-push.ts';
test('push endpoints allow only known HTTPS providers, reject SSRF and authority tricks',()=>{
  for(const endpoint of ['https://fcm.googleapis.com/send/test','https://web.push.apple.com/test','https://updates.push.services.mozilla.com/wpush/v2/test'])assert.ok(validPushEndpoint(endpoint));
  for(const endpoint of ['http://fcm.googleapis.com/send/a','https://localhost/a','https://127.0.0.1/a','https://fcm.googleapis.com.evil.test/a','https://fcm.googleapis.com@127.0.0.1/a','https://fcm.googleapis.com:8443/a','https://web.push.apple.com/a#x'])assert.equal(validPushEndpoint(endpoint),false);
});
const recap={tripId:'private<&',tripTitle:'<script>alert(1)</script>',date:'2027-05-02',items:[{title:'Temple <b>',time:'09:00',timezone:'Asia/Shanghai',location:'A&B'}],weather:[],checklist:['Protection contre la pluie']};
test('shared recap email is escaped in four languages, carries safe deep link',()=>{
  for(const language of ['fr','en','es','zh-CN']){const message=renderRecapEmail(recap,language,'https://detours.example');assert.ok(!message.html.includes('<script>'));assert.ok(message.html.includes('&lt;script&gt;'));assert.ok(message.html.includes('kind=recap'));assert.ok(message.text.includes('09:00 (Asia/Shanghai)'));if(language!=='fr')assert.ok(!message.html.includes('Protection contre la pluie'));}
  assert.throws(()=>renderRecapEmail(recap,'en','javascript:alert(1)'));
});
const row={key:'one',recipient:'a',tripId:'trip',expires:300000,attempts:1,token:'claim',status:'claimed'};
const fixture=(valid=true)=>{const calls=[];return {calls,store:{claim:async()=>[{...row}],validate:async()=>valid,begin:async()=>{calls.push('begin');return true;},finish:async(_,status,next)=>calls.push({status,next})}};};
test('default switch prevents claim; stale or revoked occurrence never invokes provider',async()=>{
 const f=fixture();let sends=0;await deliverBatch(f.store,async()=>{sends++;return 'accepted';},0);assert.deepEqual(f.calls,[]);
 const revoked=fixture(false);await deliverBatch(revoked.store,async()=>{sends++;return 'accepted';},0,true);assert.equal(sends,0);assert.equal(revoked.calls[0].status,'cancelled');
});
test('accepted, explicit quota backoff and ambiguous provider failure remain distinct',async()=>{
 for(const result of ['accepted','retry','expired','failed']){const f=fixture();await deliverBatch(f.store,async()=>result,0,true);assert.equal(f.calls[1].status,{accepted:'accepted',retry:'pending',expired:'cancelled',failed:'failed'}[result]);if(result==='retry')assert.equal(f.calls[1].next,60000);}
 const f=fixture();await deliverBatch(f.store,async()=>{throw Error('timeout after acceptance');},0,true);assert.equal(f.calls[1].status,'uncertain');
});
test('attempt limit and expiry bound retry',async()=>{
 for(const attempts of [3,4]){const f=fixture();f.store.claim=async()=>[{...row,attempts}];await deliverBatch(f.store,async()=> 'retry',0,true);assert.equal(f.calls[1].status,'failed');}
 const f=fixture();await deliverBatch(f.store,async()=> 'accepted',300000,true);assert.equal(f.calls[0].status,'cancelled');
});
test('push enrollment: permission refusal, absent worker, account change and failed registration; disable all devices',async()=>{
 const originals=new Map(['window','navigator','Notification'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));let permission='granted',registration,unsubscribed=0,calls=[];
 const subscription={toJSON:()=>({endpoint:'https://fcm.googleapis.com/send/fixture',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}}),unsubscribe:async()=>{unsubscribed++;return true;}};
 const sw={active:true,pushManager:{getSubscription:async()=>subscription,subscribe:async()=>subscription}};
 const client={rpc:async(name,args)=>{calls.push({name,args});return {error:null};}};
 try{
  Object.defineProperty(globalThis,'window',{configurable:true,value:{isSecureContext:true,PushManager:{},Notification:{}}});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{getRegistration:async()=>registration}}});
  Object.defineProperty(globalThis,'Notification',{configurable:true,value:{requestPermission:async()=>permission}});
  const key=Buffer.alloc(65).toString('base64url');
  permission='denied';await assert.rejects(registerPush(client,key,'device'),/denied/);assert.equal(calls.length,0);
  permission='granted';await assert.rejects(registerPush(client,key,'device'),/Install or reload/);assert.equal(calls.length,0);
  registration=sw;await assert.rejects(registerPush(client,key,'device',()=>false),/cancelled/);assert.equal(calls.length,0);
  await registerPush(client,key,'device');assert.equal(calls[0].name,'detours_register_push');
  await assert.rejects(registerPush({rpc:async()=>({error:new Error('rejected')})},key,'device'),/rejected/);assert.equal(unsubscribed,1);
  await disablePush(client);assert.equal(calls.at(-1).args.p_device,null);assert.equal(unsubscribed,2);
 }finally{for(const [key,descriptor] of originals)descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];}
});
