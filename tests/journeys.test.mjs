import test from 'node:test';
import assert from 'node:assert/strict';
import { archive, blankTrip, chinaTrip, collectionArchive, duplicateTrip, legacyDiverged, LEGACY_COPY_KEY, listTrips, migrateLegacy, parseImport, readTrip, recoveryKey, tripKey, writeTrip } from '../src/journeys.ts';
import { STORAGE_KEY, BACKUP_KEY, validateState } from '../src/lib.ts';
import { initialCities } from '../src/data/trip.ts';
import { bonusItems } from '../src/data/bonus.ts';
import { journeyExpenseSummary } from '../src/practical-utils.ts';
import { localTimeInstant, transferTimeError } from '../src/time.ts';

class MemoryStorage {
  values = new Map();
  failOn = null;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.failOn === key) throw new Error('Quota exceeded'); this.values.set(key, String(value)); }
}
function legacy() {
  const state={version:1,cities:structuredClone(initialCities),favorites:[bonusItems[0].id,'sz-1-arrival'],done:['sz-1-arrival'],bookings:[bonusItems[0].id],notes:{general:'Passeport 中文',shenzhen:'Mon hôtel'},departureDate:'2027-05-01',budgetCny:5000,cnyPerEuro:7.8};
  state.customBonus=[{id:'my-bonus',cityId:'shenzhen',title:'Restaurant préféré',category:'food',description:'Personnel'}];
  state.expenses=[{id:'my-expense',cityId:'shenzhen',label:'Taxi',currency:'CNY',amount:70,category:'transport'}];
  state.stays=[{cityId:'shenzhen',name:'Hôtel',chineseName:'酒店',address:'Adresse exacte',checkIn:'2027-05-01',checkOut:'2027-05-03',notes:'Référence 123'}];
  state.transfers=[{id:'my-transfer',fromCityId:'shenzhen',toCityId:'guangzhou',label:'Train',mode:'train',departure:'2027-05-03T08:00',arrival:'2027-05-03T10:00',fromStation:'深圳北',toStation:'广州南',reference:'ABC',notes:'Billet personnel',booked:true}];
  state.packing=[{id:'my-item',label:'Passeport',packed:true}];
  state.documents=[{id:'my-document',title:'Planning.md',content:'# Mon planning\n京都 · arrivée'}];
  return state;
}

test('migration complète, source brute et récupération conservées ; reprise idempotente',()=>{
  const storage=new MemoryStorage(),before=legacy(),raw=JSON.stringify(before);
  storage.setItem(STORAGE_KEY,raw);storage.setItem(BACKUP_KEY,JSON.stringify({savedAt:'2026-10-06T00:00:00Z',raw}));
  const id=migrateLegacy(storage),state=readTrip(storage,id);
  assert.equal(validateState(state),true);assert.equal(state.journey.title,'Chine 2027');
  for(const key of ['favorites','done','bookings','notes','customBonus','expenses','stays','packing','departureDate','documents']) assert.deepEqual(state[key],before[key]);
  assert.equal(state.bonusCatalog[0].id,bonusItems[0].id);assert.equal(state.budget,5000);assert.equal(state.exchangeRates.EUR,7.8);
  assert.equal(state.transfers[0].departure,'2027-05-03T08:00');assert.equal(state.transfers[0].departureTimezone,'Asia/Shanghai');
  assert.equal(storage.getItem(STORAGE_KEY),raw);assert.equal(storage.getItem(LEGACY_COPY_KEY),raw);assert.equal(storage.getItem(recoveryKey(id)),storage.getItem(BACKUP_KEY));
  assert.equal(migrateLegacy(storage),id);assert.equal(listTrips(storage).length,1);
  storage.setItem(STORAGE_KEY,JSON.stringify({...before,notes:{general:'Ancien onglet'}}));
  assert.equal(legacyDiverged(storage),true);assert.equal(readTrip(storage,id).notes.general,'Passeport 中文');
});

test('absence de source : aucune création implicite ; source invalide ou quota : récupération intacte',()=>{
  const storage=new MemoryStorage();assert.equal(migrateLegacy(storage),null);assert.equal(storage.length,0);
  storage.setItem(STORAGE_KEY,'{bad 中文');assert.throws(()=>migrateLegacy(storage));assert.equal(storage.getItem(STORAGE_KEY),'{bad 中文');assert.equal(listTrips(storage).length,0);
  const raw=JSON.stringify(legacy());storage.setItem(STORAGE_KEY,raw);storage.failOn=tripKey('china-legacy');
  assert.throws(()=>migrateLegacy(storage));assert.equal(storage.getItem(LEGACY_COPY_KEY),raw);assert.equal(storage.getItem(STORAGE_KEY),raw);
  storage.failOn=null;assert.equal(migrateLegacy(storage),'china-legacy');assert.equal(listTrips(storage).length,1);
});

test('la migration ne réussit pas sans relecture de la sauvegarde',()=>{
  const storage=new MemoryStorage();storage.setItem(STORAGE_KEY,JSON.stringify(legacy()));
  const set=storage.setItem.bind(storage);storage.setItem=(key,value)=>{if(!key.startsWith('a-l-est-trip-v2:'))set(key,value);};
  assert.throws(()=>migrateLegacy(storage),/relue/);assert.ok(storage.getItem(STORAGE_KEY));
});

test('Chine, Japon et France sont indépendants ; un carnet vide ne reçoit aucun contenu Chine',()=>{
  const storage=new MemoryStorage(),china=chinaTrip(),japan=blankTrip({title:'Japon',currency:'JPY',timezone:'Asia/Tokyo'}),france=blankTrip({title:'Week-end',timezone:'Europe/Paris'});
  for(const state of [china,japan,france])writeTrip(storage,state);
  japan.notes.general='日本 京都';writeTrip(storage,japan);
  assert.equal(readTrip(storage,china.journey.id).notes.general,undefined);assert.equal(readTrip(storage,france.journey.id).notes.general,undefined);
  const stored=readTrip(storage,japan.journey.id);assert.equal(stored.notes.general,'日本 京都');assert.deepEqual(stored.cities,[]);assert.deepEqual(stored.phrases,[]);assert.deepEqual(stored.bonusCatalog,[]);assert.equal(stored.budgetCny,undefined);
  assert.equal(listTrips(storage).length,3);
});

test('duplication remappe toutes les relations sans perdre dates, coches ou montants',()=>{
  const original=chinaTrip(legacy());original.notes[bonusItems[0].id]='Note de bonus';original.resume={cityId:'shenzhen',dayId:original.cities[0].days[0].id,view:'planning'};
  const copy=duplicateTrip(original);
  assert.notEqual(copy.journey.id,original.journey.id);assert.notEqual(copy.cities[0].id,original.cities[0].id);assert.equal(copy.catalogBase,undefined);assert.equal(copy.journey.followsCatalog,false);
  assert.equal(copy.stays[0].cityId,copy.cities[0].id);assert.equal(copy.expenses[0].cityId,copy.cities[0].id);assert.equal(copy.transfers[0].fromCityId,copy.cities[0].id);
  assert.ok(copy.favorites.includes(copy.bonusCatalog[0].id));assert.equal(copy.notes[copy.bonusCatalog[0].id],'Note de bonus');assert.equal(copy.resume.cityId,copy.cities[0].id);assert.equal(copy.resume.dayId,copy.cities[0].days[0].id);
  assert.equal(copy.packing[0].packed,true);assert.equal(copy.expenses[0].amount,70);assert.equal(copy.transfers[0].booked,true);assert.equal(copy.departureDate,original.departureDate);assert.equal(validateState(copy),true);
  assert.notEqual(copy.documents[0].id,original.documents[0].id);assert.equal(copy.documents[0].content,original.documents[0].content);
  copy.notes.general='Copie';copy.cities[0].days[0].steps[0].title='Copie';copy.packing[0].packed=false;
  assert.equal(original.notes.general,'Passeport 中文');assert.equal(original.packing[0].packed,true);assert.equal(original.cities[0].days[0].steps[0].title,'Arrivée à Shenzhen');
});

test('imports anciens, nouveaux et collection : copies supplémentaires ; format inconnu rejeté',()=>{
  const original=chinaTrip(legacy()),japan=blankTrip({title:'日本'});
  const old=parseImport(JSON.stringify(legacy()))[0];assert.equal(old.notes.general,'Passeport 中文');assert.ok(old.bonusCatalog.length);
  const next=parseImport(JSON.stringify(archive(original)))[0];assert.notEqual(next.journey.id,original.journey.id);assert.equal(next.journey.title,original.journey.title);
  const collection=parseImport(JSON.stringify(collectionArchive([original,japan])));assert.equal(collection.length,2);assert.equal(collection[1].journey.title,'日本');
  assert.throws(()=>parseImport('{"version":999}'));assert.throws(()=>parseImport(JSON.stringify({version:2,scope:'collection',trips:[archive(original),{version:9}]})));
});

test('heures locales : deux fuseaux, passage saisonnier, heure inexistante et répétée',()=>{
  assert.equal(new Date(localTimeInstant('2027-05-02T09:15','Asia/Shanghai')).toISOString(),'2027-05-02T01:15:00.000Z');
  assert.equal(transferTimeError('2027-06-01T10:00','2027-06-01T09:30','Europe/Paris','Europe/London'),'');
  assert.match(transferTimeError('2027-06-01T10:00','2027-06-01T09:30','Europe/London','Europe/Paris'),/après/);
  assert.equal(localTimeInstant('2027-03-28T03:30','Europe/Paris')-localTimeInstant('2027-03-28T01:30','Europe/Paris'),3_600_000);
  assert.throws(()=>localTimeInstant('2027-03-28T02:30','Europe/Paris'),/n’existe pas/);assert.throws(()=>localTimeInstant('2027-10-31T02:30','Europe/Paris'),/répétée/);
  assert.equal(transferTimeError('','','Asia/Tokyo','Europe/Paris'),'');
});

test('devises : aucune conversion implicite, conversion explicite et overflow signalé',()=>{
  const expenses=[{amount:50,currency:'EUR'},{amount:1000,currency:'JPY'}];
  const partial=journeyExpenseSummary(expenses,'EUR');assert.equal(partial.total,undefined);assert.equal(partial.partial,50);assert.deepEqual(partial.missing,['JPY']);
  assert.equal(journeyExpenseSummary(expenses,'EUR',{JPY:.006}).total,56);
  assert.equal(journeyExpenseSummary([{amount:Number.MAX_VALUE,currency:'JPY'}],'EUR',{JPY:2}).total,undefined);
});
