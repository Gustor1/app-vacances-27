import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecap, checklistFor, defaultNotificationPreferences, normalizeOffsets, notificationInstant, parseNotificationPreferences, planOccurrences, projectProgram, recapDates, reminderItem } from '../src/notifications.ts';

const state = () => ({version:1,journey:{id:'trip',title:'Chine',timezone:'Asia/Shanghai'},cities:[{id:'city',name:'Shanghai',days:[{id:'day',date:'2027-05-01',steps:[{id:'walk',title:'Balade',category:'walk'},{id:'visit',title:'Musée',category:'visit'},{id:'hotel',title:'Hôtel',category:'hotel'}],preparation:{timings:{visit:{startTime:'10:00',durationMinutes:60},hotel:{startTime:'18:00'}}}}]}],done:[],bookings:['visit'],notes:{general:'PRIVATE'},transfers:[{id:'train',fromCityId:'city',toCityId:'b',label:'Train',departure:'2027-05-01T14:00',departureTimezone:'Asia/Shanghai',fromStation:'Shanghai',reference:'SECRET',notes:'PRIVATE',booked:true}]});

test('préférences : canaux éteints, catégories et délais stricts, déduplication',()=>{
  const p=defaultNotificationPreferences('Europe/Paris');
  assert.equal(p.email,false);assert.equal(p.activityPush,false);assert.ok(!p.categories.includes('hotel'));
  assert.deepEqual(normalizeOffsets([1440,60,30,15,30]),[15,30,60,1440]);
  for(const offsets of [[],[0],[10081],[1.5],[1,2,3,4,5,6]])assert.throws(()=>normalizeOffsets(offsets));
  assert.deepEqual(parseNotificationPreferences(JSON.stringify(p)),p);
  assert.throws(()=>parseNotificationPreferences(JSON.stringify({...p,email:'yes'})));
  assert.throws(()=>parseNotificationPreferences(JSON.stringify({...p,overrides:{visit:{mode:'custom',offsets:[-1]}}})));
});
test('dates : Shanghai/Paris, minuit, heure absente et répétée',()=>{
  assert.equal(new Date(notificationInstant('2027-05-01T10:00','Asia/Shanghai')).toISOString(),'2027-05-01T02:00:00.000Z');
  assert.equal(new Date(notificationInstant('2027-03-28T02:30','Europe/Paris')).toISOString(),'2027-03-28T01:00:00.000Z');
  assert.equal(new Date(notificationInstant('2027-10-31T02:30','Europe/Paris')).toISOString(),'2027-10-31T00:30:00.000Z');
  assert.throws(()=>notificationInstant('2027-02-30T10:00','Europe/Paris'));
  assert.deepEqual(recapDates(defaultNotificationPreferences('Asia/Shanghai'),new Date('2027-04-30T16:05Z')),{today:'2027-05-01',tomorrow:'2027-05-02'});
});
test('projection active, récaps agrégés, confidentialité et règles checklist sans mutation',()=>{
  const s=state(),before=structuredClone(s);
  s.cities[0].days.push({id:'day2',date:'2027-05-01',steps:[{id:'other',title:'Autre',category:'food'}]});
  const recap=buildRecap(s,'2027-05-01','Asia/Shanghai');
  assert.equal(recap.items.length,5);assert.ok(recap.items.find(i=>i.id==='walk').instant===undefined);
  assert.equal(JSON.stringify(recap).includes('PRIVATE'),false);assert.equal(JSON.stringify(recap).includes('SECRET'),false);
  const weather=[{date:'2027-05-01',rainProbability:50,uv:3}];
  assert.deepEqual(checklistFor(recap.items,weather),['Protection contre la pluie','Protection solaire','Chaussures adaptées à la marche']);
  assert.deepEqual(checklistFor(recap.items,[{rainProbability:49,uv:2.9}]),['Chaussures adaptées à la marche']);
  assert.equal(buildRecap(s,'2027-05-02','Asia/Shanghai'),null);
  s.cities[0].days[0].preparation.alternatives=[{id:'rain',stepIds:['walk']}];s.cities[0].days[0].preparation.activeAlternativeId='rain';
  assert.ok(!projectProgram(s).some(i=>i.id==='visit'));
  assert.deepEqual(before.done,[]);
});
test('occurrences : exceptions, plusieurs appareils, expiration, statut, pas de rattrapage',()=>{
  const s=state(),p={...defaultNotificationPreferences('Asia/Shanghai'),activityPush:true,email:true,recapPush:true,offsets:[15,30,60,1440]};
  const now=Date.parse('2027-04-28T00:00Z');
  let planned=planOccurrences(s,p,'alice',['phone','pc'],now);
  assert.equal(planned.filter(o=>o.type==='activity').length,16);
  assert.equal(planned.filter(o=>o.channel==='email').length,1);
  assert.equal(new Set(planned.map(o=>o.key)).size,planned.length);
  p.overrides={'step:hotel':{mode:'custom',offsets:[45]},'step:visit':{mode:'off'}};
  planned=planOccurrences(s,p,'alice',['phone'],now);
  assert.equal(planned.filter(o=>o.objectId==='step:hotel').length,1);
  assert.equal(planned.filter(o=>o.objectId==='step:visit').length,0);
  assert.equal(planned.find(o=>o.objectId==='step:hotel').expires-planned.find(o=>o.objectId==='step:hotel').due,300000);
  s.done=['hotel'];assert.equal(planOccurrences(s,p,'alice',['phone'],now).some(o=>o.objectId==='step:hotel'),false);
  s.journey.status='completed';assert.deepEqual(planOccurrences(s,p,'alice',['phone'],now),[]);
  delete s.journey.status;assert.deepEqual(planOccurrences(s,p,'alice',['phone'],Date.parse('2027-05-02T00:00Z')),[]);
  assert.equal(planOccurrences(s,p,'bob',['phone'],now)[0].key===planned[0].key,false);
});
test('charge synthétique : 50 éléments par jour, 5 voyages, 100 destinataires',()=>{
  const s=state();s.cities[0].days[0].steps=Array.from({length:50},(_,n)=>({id:`step${n}`,title:`Visit ${n}`,category:'visit'}));
  const start=performance.now();
  for(let account=0;account<100;account++)for(let trip=0;trip<5;trip++)assert.equal(buildRecap({...s,journey:{...s.journey,id:`trip${trip}`}},'2027-05-01','Asia/Shanghai').items.length,51);
  console.log(`500 récaps de 51 éléments : ${(performance.now()-start).toFixed(1)} ms (charge synthétique locale)`);
});
test('undated personal target remains configurable; weather cannot follow a moved location; indoor visits do not infer outdoor exposure',()=>{
  const s=state();delete s.cities[0].days[0].date;
  assert.equal(reminderItem(s,'step','hotel').date,'');assert.equal(reminderItem(s,'step','hotel').instant,undefined);assert.equal(reminderItem(s,'step','missing'),undefined);
  s.cities[0].days[0].date='2027-05-01';s.cities[0].coordinates=[31.23,121.47];
  const forecast={date:'2027-05-01',place:'Shanghai',source:'fixture',fetchedAt:'2027-04-30T10:00Z',targetKey:JSON.stringify(['2027-05-01',[31.23,121.47],'Asia/Shanghai']),uv:4};
  assert.equal(buildRecap(s,'2027-05-01','Asia/Shanghai',[forecast]).weather.length,1);
  s.cities[0].coordinates=[48.8,2.3];assert.equal(buildRecap(s,'2027-05-01','Asia/Shanghai',[forecast]).weather.length,0);
  assert.deepEqual(checklistFor([{category:'visit'}],[forecast]),[]);
  assert.deepEqual(normalizeOffsets([30,30,30,30,30,30]),[30]);
});
