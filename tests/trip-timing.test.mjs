import test from 'node:test';
import assert from 'node:assert/strict';
import { civilDay, tripTiming, eligibleTimingTrips, selectTimingTrip } from '../src/trip-timing.ts';
import { tripTimingDictionary } from '../src/locales/trip-timing.ts';
const trip = (start='2026-05-15', end='2026-05-17', status='planning', timezone='UTC', id='a') => ({departureDate:start,journey:{id,timezone,endDate:end,status}});
const at = date => new Date(date+'T12:00:00Z');
test('calendar boundaries include both departure and return, including a one-day stay',()=>{
 for(const [date,phase,value] of [['2026-04-03','upcoming',42],['2026-05-14','upcoming',1],['2026-05-15','during',1],['2026-05-16','during',2],['2026-05-17','during',3],['2026-05-18','past',1]]) {
  const r=tripTiming(trip(),at(date));assert.equal(r.phase,phase);assert.equal(r.before??r.day??r.since,value);assert.equal(r.total,3);
 }
 assert.equal(tripTiming(trip('2026-05-15','2026-05-15'),at('2026-05-15')).total,1);
});
test('leap dates, year boundary, DST and zones use civil days',()=>{
 assert.equal(tripTiming(trip('2028-02-28','2028-03-01'),at('2028-02-29')).day,2);
 assert.equal(tripTiming(trip('2026-12-31','2027-01-02'),at('2027-01-01')).day,2);
 for(const [start,end] of [['2026-03-28','2026-03-30'],['2026-10-24','2026-10-26']]) assert.equal(tripTiming(trip(start,end,'planning','Europe/Paris'),at(end)).day,3);
 const instant=new Date('2026-05-14T20:00:00Z');
 assert.equal(tripTiming(trip(undefined,undefined,'planning','Asia/Shanghai'),instant).phase,'during');
 assert.equal(tripTiming(trip(),instant).phase,'upcoming');
 assert.equal(civilDay('2026-02-29'),undefined);assert.equal(civilDay('2028-02-29')!==undefined,true);
});
test('missing, invalid, open-ended and explicit statuses never invent dates or mutate',()=>{
 assert.equal(tripTiming(trip('',''),at('2026-05-15')).phase,'missing');
 for(const t of [trip('bad'),trip('2026-05-15','bad'),trip('2026-05-15','2026-05-14')]) assert.equal(tripTiming(t).phase,'invalid');
 const t=trip('2026-05-15','');const before=JSON.stringify(t);const r=tripTiming(t,at('2026-06-15'));assert.equal(r.day,32);assert.equal(r.total,undefined);assert.equal(JSON.stringify(t),before);
 for(const status of ['cancelled','completed']) assert.equal(tripTiming(trip('2030-01-01','',status)).phase,status);
 assert.equal(tripTiming(trip(undefined,undefined,'planning','bad')).fallback,true);
});
test('selection ranks ongoing by recent start, future by earliest start, past by recent end; stable ties and shared participation',()=>{
 const instant=at('2026-05-16');const old=trip('2026-05-01','2026-06-30','planning','UTC','old'), current=trip(), future=trip('2026-06-01','2026-06-03','planning','UTC','future');
 assert.equal(selectTimingTrip([old,current,future],instant),current);
 assert.equal(selectTimingTrip([future,trip('2026-07-01')],instant),future);
 assert.equal(selectTimingTrip([trip('2026-04-01','2026-04-03'),trip('2026-04-20','2026-04-22','planning','UTC','recent')],instant).journey.id,'recent');
 assert.equal(selectTimingTrip([trip(undefined,undefined,'planning','UTC','z'),current],instant),current);
 assert.deepEqual(eligibleTimingTrips([current,old,future,trip('2026-05-15','','cancelled')],id=>id==='future',instant),[future]);
 assert.equal(selectTimingTrip([trip('','','completed')],instant),undefined);
});
test('all countdown messages have three translated dictionaries',()=>{for(let i=0;i<3;i++)assert.ok(Object.values(tripTimingDictionary(i)).every(v=>typeof v==='string'&&v.length));});
