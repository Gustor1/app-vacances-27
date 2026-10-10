import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultNotificationPreferences } from '../src/notifications.ts';
import { deliveryPreferences, notificationIntent, writeNotificationIntent } from '../src/notification-form.ts';
const memory = () => { const data=new Map(); return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),length:0,key:()=>null}; };

test('existing channel combinations round-trip without replacing custom offsets, categories or overrides', () => {
  for(const activityPush of [false,true])for(const recapPush of [false,true])for(const email of [false,true]) {
    const p={...defaultNotificationPreferences('Europe/Paris'),activityPush,recapPush,email,followed:false,offsets:[7,1440,10080],categories:['food','hotel'],recapTime:'22:37',overrides:{'step:x':{mode:'custom',offsets:[23,3000]}}};
    assert.deepEqual(deliveryPreferences(p,notificationIntent(memory(),'trip',p)),p);
  }
});
test('local display intent survives channels off; changed remote preferences and other trips invalidate it', () => {
  const storage=memory(),p=defaultNotificationPreferences('Asia/Shanghai');
  const intent={program:false,activities:true,phone:false,email:false};
  writeNotificationIntent(storage,'trip',p,intent);
  assert.deepEqual(notificationIntent(storage,'trip',p),intent);
  assert.equal(notificationIntent(storage,'other',p).program,true);
  const remote={...p,recapPush:true};
  assert.deepEqual(notificationIntent(storage,'trip',remote),{program:true,activities:false,phone:true,email:false});
});
test('master pause keeps channels and setup; email-only delivery remains independent of phone', () => {
  const p={...defaultNotificationPreferences('Europe/Paris'),followed:false};
  const projected=deliveryPreferences(p,{program:true,activities:true,phone:false,email:true});
  assert.equal(projected.followed,false);assert.equal(projected.email,true);
  assert.equal(projected.activityPush,false);assert.equal(projected.recapPush,false);
  assert.deepEqual(projected.offsets,[30]);
});
test('repeated unrelated saves never activate another channel in a historical mixed configuration', () => {
  const storage=memory();
  const p={...defaultNotificationPreferences('Europe/Paris'),activityPush:true,email:true};
  const baseline=notificationIntent(storage,'trip',p);
  const changed={...baseline,email:false};
  const first=deliveryPreferences(p,changed,baseline);
  assert.equal(first.recapPush,false);assert.equal(first.email,false);assert.equal(first.activityPush,true);
  writeNotificationIntent(storage,'trip',first,changed);
  const restored=notificationIntent(storage,'trip',first);
  assert.deepEqual(deliveryPreferences(first,restored,restored),first);
  const onlyActivityOff=deliveryPreferences(p,{...baseline,activities:false},baseline);
  assert.equal(onlyActivityOff.recapPush,false);assert.equal(onlyActivityOff.email,true);
});
