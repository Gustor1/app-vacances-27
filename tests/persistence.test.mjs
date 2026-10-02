import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCities } from '../src/data/trip.ts';
import { mergeChanges, mergeCatalog } from '../src/persistence.ts';
import { validateState, isValidDate, isValidDateTime, amapLink, normalizeSearch } from '../src/lib.ts';
const fresh=()=>({version:1,cities:structuredClone(initialCities),catalogBase:structuredClone(initialCities),favorites:[],done:[],bookings:[],notes:{},departureDate:''});

test('deux onglets conservent notes distinctes, visites et changements imbriqués',()=>{
 const base=fresh(),local=structuredClone(base),remote=structuredClone(base);
 local.notes.shenzhen='Mon hôtel';remote.notes.general='Mon billet';local.done=['sz-1-arrival'];remote.bookings=['sz-2-museum'];
 local.cities[0].days[0].steps[0].description='Arrivée avec bagages';remote.cities[0].subtitle='Nouveau sous-titre';
 const merged=mergeChanges(base,local,remote);
 assert.deepEqual(merged.notes,{general:'Mon billet',shenzhen:'Mon hôtel'});assert.deepEqual(merged.done,['sz-1-arrival']);assert.deepEqual(merged.bookings,['sz-2-museum']);
 assert.equal(merged.cities[0].subtitle,'Nouveau sous-titre');assert.equal(merged.cities[0].days[0].steps[0].description,'Arrivée avec bagages');assert.equal(validateState(merged),true);
});
test('collections créées simultanément et hébergements de villes différentes sont fusionnés',()=>{
 const base=fresh(),local=structuredClone(base),remote=structuredClone(base);
 local.expenses=[{id:'a',cityId:'shenzhen',label:'Repas',amount:20,currency:'CNY',category:'food'}];remote.expenses=[{id:'b',cityId:'chengdu',label:'Train',amount:15,currency:'EUR',category:'transport'}];
 local.stays=[{cityId:'shenzhen',name:'Hôtel A',chineseName:'',address:'',checkIn:'',checkOut:'',notes:''}];remote.stays=[{cityId:'chengdu',name:'Hôtel B',chineseName:'',address:'',checkIn:'',checkOut:'',notes:''}];
 const merged=mergeChanges(base,local,remote);assert.equal(merged.expenses.length,2);assert.equal(merged.stays.length,2);assert.equal(validateState(merged),true);
});
test('une suppression ou un nouvel ordre local ne supprime pas les nouveaux éléments distants',()=>{
 const base=[{id:'a',title:'A'},{id:'b',title:'B'},{id:'c',title:'C'}];const local=[base[2],base[0]];const remote=[...base,{id:'d',title:'D'}];
 assert.deepEqual(mergeChanges(base,local,remote).map(x=>x.id),['c','a','d']);
 assert.deepEqual(mergeChanges(['a','b'],['b'],['a','b','c']),['b','c']);
});
test('le nouveau catalogue complète les journées et corrige les champs non personnalisés',()=>{
 const state=fresh(),catalog=structuredClone(initialCities);state.cities[0].subtitle='Mon programme';state.cities[0].days[0].steps[0].description='Ma note';
 catalog[0].subtitle='Correction catalogue';catalog[0].days[0].title='Nouvelle appellation';catalog[0].days.push({id:'nouveau-jour',title:'Jour ajouté',steps:[]});catalog.push({id:'new-city',name:'Pékin',chineseName:'北京',subtitle:'',color:'#000',image:'',days:[],notes:[]});
 const merged=mergeCatalog(state,catalog);assert.equal(merged.cities[0].subtitle,'Mon programme');assert.equal(merged.cities[0].days[0].title,'Nouvelle appellation');assert.equal(merged.cities[0].days[0].steps[0].description,'Ma note');assert.equal(merged.cities[0].days.length,4);assert.ok(merged.cities.some(c=>c.id==='new-city'));assert.equal(validateState(merged),true);
});
test('les suppressions personnelles restent supprimées après mise à jour du catalogue',()=>{
 const state=fresh();state.cities[0].days=state.cities[0].days.slice(1);state.cities=state.cities.filter(c=>c.id!=='suzhou');
 const merged=mergeCatalog(state,initialCities);assert.equal(merged.cities[0].days.length,2);assert.ok(!merged.cities.some(c=>c.id==='suzhou'));
});
test('une ville retirée du catalogue reste conservée si elle contient des dépenses personnelles',()=>{
 const state=fresh();state.expenses=[{id:'expense',cityId:'shenzhen',label:'Repas',amount:20,currency:'CNY',category:'food'}];
 const merged=mergeCatalog(state,initialCities.filter(c=>c.id!=='shenzhen'));assert.ok(merged.cities.some(c=>c.id==='shenzhen'));assert.equal(validateState(merged),true);
});
test('les sauvegardes rejettent dates impossibles, ids vides et nouvelles collections malformées',()=>{
 for(const date of ['2027-99-99','2027-02-29','2027-04-31'])assert.equal(isValidDate(date),false);assert.equal(isValidDate('2028-02-29'),true);
 assert.equal(isValidDateTime('2027-05-01T24:00'),false);assert.equal(isValidDateTime('2027-05-01T12:60'),false);assert.equal(isValidDateTime('2027-05-01T08:15'),true);
 for(const mutator of [s=>s.departureDate='2027-99-99',s=>s.cities[0].days[0].id='',s=>s.cities[0].nights=Infinity,s=>s.expenses=[{id:'a',amount:NaN}],s=>s.packing=[{id:'',label:'Test',packed:true}],s=>s.cities[0].days[0].date='2027-02-29']){const state=fresh();mutator(state);assert.equal(validateState(state),false);}
 const noCoords=fresh();delete noCoords.cities[0].coordinates;assert.equal(validateState(noCoords),true);
});
test('Amap conserve une adresse de succursale précise et la recherche tolère les accents',()=>{
 const link=new URL(amapLink(initialCities[4],{title:'Restaurant',chineseName:'银锅',address:'M6座5层532号'}));assert.ok(link.searchParams.get('keyword').includes('M6座5层532号'));assert.equal(normalizeSearch('Pékin et l’Hôtel'),normalizeSearch("Pekin et l'Hotel"));
});
