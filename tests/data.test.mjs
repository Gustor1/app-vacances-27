import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCities } from '../src/data/trip.ts';
import { bonusItems } from '../src/data/bonus.ts';
import { amapLink, amapSearch, parseBackup, safeExternalUrl, validateState, toggleValue } from '../src/lib.ts';
const fresh = () => ({version:1,cities:structuredClone(initialCities),favorites:[],done:[],bookings:[],notes:{},departureDate:''});

test('le carnet importe les 17 jours, les 6 villes documentées et Shanghai à compléter', () => {
  const value = fresh();
  assert.equal(validateState(value),true);
  assert.equal(initialCities.length,7);
  assert.equal(initialCities.reduce((total,c)=>total+c.days.length,0),17);
  assert.equal(initialCities.find(c=>c.id==='shanghai').days.length,0);
  assert.equal(bonusItems.length,130);
  assert.equal(new Set(bonusItems.map(b=>b.id)).size,bonusItems.length);
  assert.ok(bonusItems.every(b=>initialCities.some(c=>c.id===b.cityId)));
  assert.deepEqual(parseBackup(JSON.stringify(value)),value);
});
test('les adresses ouvrent Amap avec la bonne requête chinoise encodée',()=>{
  const city=initialCities[0];
  const url=new URL(amapSearch('深圳','莲花山公园','福田区'));
  assert.equal(url.hostname,'uri.amap.com');
  assert.equal(url.searchParams.get('keyword'),'深圳 莲花山公园 福田区');
  assert.equal(url.searchParams.get('callnative'),'1');
  for (const c of initialCities) for(const d of c.days) for(const s of d.steps) assert.match(new URL(amapLink(c,s)).hostname,/(^|\.)amap\.com$/);
  for (const b of bonusItems) if(b.amapUrl) assert.match(new URL(amapLink(city,b)).hostname,/(^|\.)amap\.com$/);
});
test('les liens externes malveillants et les faux domaines Amap sont écartés',()=>{
  assert.equal(safeExternalUrl('javascript:alert(1)'),undefined);
  assert.equal(safeExternalUrl('http://example.com'),undefined);
  for(const url of ['https://example.com\\.amap.com/','https://amap.com.example.com/','javascript:alert(1)']) {
    assert.equal(new URL(amapLink(initialCities[0],{title:'Parc',amapUrl:url})).hostname,'uri.amap.com');
  }
});
test('un import altéré est rejeté avant de remplacer le carnet',()=>{
  assert.throws(()=>parseBackup('{broken'),/JSON valide/);
  assert.throws(()=>parseBackup(JSON.stringify({version:2})),/sauvegarde/);
  const value=fresh(); value.cities[0].coordinates=[91,100];
  assert.throws(()=>parseBackup(JSON.stringify(value)),/sauvegarde/);
  const invalid=fresh(); invalid.cities[0].days[0].steps[0].category='unknown';
  assert.equal(validateState(invalid),false);
  const duplicate=fresh(); duplicate.cities.push(duplicate.cities[0]);
  assert.equal(validateState(duplicate),false);
  assert.throws(()=>parseBackup('x'.repeat(5_000_001)),/volumineux/);
});
test('les listes personnelles se sauvegardent sans perdre les notes',()=>{
  const value=fresh();
  value.favorites=toggleValue(value.favorites,bonusItems[0].id);
  value.done=['sz-1-arrival']; value.notes={general:'Mes billets',shenzhen:'Hôtel à Futian'};
  value.bookings=['cq-1-raffles']; value.departureDate='2027-05-01';
  assert.deepEqual(parseBackup(JSON.stringify(value)),value);
  assert.deepEqual(toggleValue(value.favorites,bonusItems[0].id),[]);
});
test('les précisions du document bonus sont reliées aux activités réservables',()=>{
  const chongqing=initialCities.find(c=>c.id==='chongqing');
  const steps=chongqing.days.flatMap(d=>d.steps);
  assert.equal(steps.find(s=>s.id==='cq-1-raffles').booking,true);
  assert.equal(steps.find(s=>s.id==='cq-2-theatre').booking,true);
  assert.match(steps.find(s=>s.id==='cq-2-jiangbei').chineseName,/江滩公园/);
});
