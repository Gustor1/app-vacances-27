import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSteps, analyzeDay, validPreparation } from '../src/day-preparation.ts';
import { blankTrip, archive, parseTrip, duplicateTrip, returnTrip } from '../src/journeys.ts';
import { cleanReferences, validateState } from '../src/lib.ts';
import { splitContent, joinContent } from '../src/cloud/projection.ts';
import { mergeWithConflicts } from '../src/cloud/merge.ts';
import { nowDetails } from '../src/now.ts';
import { createTripCalendar } from '../src/calendar.ts';
import { preparationDictionary } from '../src/locales/preparation.ts';

function fixture(kind='urban') {
  const state=blankTrip({id:'l6-'+kind,title:'L6 '+kind,timezone:'UTC'});
  const day={id:'d',title:kind,date:'2026-10-09',steps:[
    {id:'a',title:kind==='excursion'?'Excursion réservée':kind==='transfer'?'Train réservé':'Jardin',description:'',category:kind==='transfer'?'transport':'visit',booking:true},
    {id:'b',title:'Musée intérieur',description:'',category:'visit',optional:true},
    {id:'c',title:'Promenade',description:'',category:'walk'},
  ],preparation:{anchorStepId:'a',startTime:'09:00',endTime:'18:00',marginMinutes:45,timings:{a:{durationMinutes:120,startTime:'09:00',source:'Saisie de test',checkedAt:'2026-10-09'},b:{durationMinutes:90,transferMinutes:30,fromStepId:'a'},c:{durationMinutes:60,transferMinutes:20,fromStepId:'b'}},alternatives:[{id:'rain',label:'Plan pluie',reason:'rain',stepIds:['b','c']}]}};
  state.cities=[{id:'city',name:'Ville de test',chineseName:'',subtitle:'',color:'#547764',image:'',notes:[],days:[day]}];
  state.bookings=['a'];state.expenses=[{id:'expense',cityId:'city',label:'Billet conservé',amount:10,currency:'EUR',category:'visit'}];
  return state;
}
test('L6 : données absentes restent incomplètes ; conflit uniquement avec heures et durées suffisantes',()=>{
  const day=fixture().cities[0].days[0];
  assert.equal(analyzeDay({...day,preparation:undefined}).complete,false);
  assert.equal(analyzeDay(day).complete,true);assert.deepEqual(analyzeDay(day).conflicts,[]);
  const conflict=structuredClone(day);conflict.preparation.timings.b.startTime='10:00';assert.deepEqual(analyzeDay(conflict).conflicts,['b']);
  delete conflict.preparation.timings.a.durationMinutes;assert.deepEqual(analyzeDay(conflict).conflicts,[]);assert.equal(analyzeDay(conflict).complete,false);
  const overloaded=structuredClone(day);overloaded.preparation.endTime='12:00';assert.ok(analyzeDay(overloaded).conflicts.includes('window'));
  const skip=structuredClone(day);skip.preparation.alternatives[0].stepIds=['a','c'];assert.ok(analyzeDay(skip,'rain').missing.includes('c'));assert.equal(analyzeDay(skip,'rain').complete,false);
});
for(const kind of ['urban','excursion','transfer'])test('L6 '+kind+' : adoption, réservations, dépenses, Maintenant et retour au plan initial',()=>{
  const state=fixture(kind),day=state.cities[0].days[0],baseline=structuredClone(day.steps),expenses=structuredClone(state.expenses);
  day.preparation.activeAlternativeId='rain';assert.deepEqual(activeSteps(day).map(s=>s.id),['b','c']);assert.deepEqual(day.steps,baseline);assert.deepEqual(state.expenses,expenses);assert.deepEqual(state.bookings,['a']);
  const details=nowDetails(state,state.cities[0],day);assert.equal(details.next.id,'b');assert.equal(details.reservation.id,'a');
  assert.equal(analyzeDay(day).anchorMissing,true);
  const calendar=createTripCalendar(state);assert.ok(calendar.includes('Musée intérieur'));assert.ok(!calendar.includes(day.steps[0].title));
  delete day.preparation.activeAlternativeId;assert.deepEqual(activeSteps(day),baseline);
});
test('L6 : archives, projection explicite, duplication et retour préservent les relations',()=>{
  const state=fixture();state.cities[0].days[0].preparation.activeAlternativeId='rain';
  assert.ok(validateState(state));const imported=parseTrip(JSON.stringify(archive(state))).state;assert.deepEqual(imported,state);
  const projected=splitContent(state),joined=joinContent(projected);assert.deepEqual(JSON.parse(JSON.stringify(joined.cities)),state.cities);assert.deepEqual(joined.bookings,state.bookings);assert.deepEqual(joined.expenses,state.expenses);
  const copy=duplicateTrip(state),day=copy.cities[0].days[0];assert.ok(validateState(copy));assert.notEqual(day.preparation.anchorStepId,'a');assert.equal(day.preparation.anchorStepId,day.steps[0].id);assert.equal(activeSteps(day)[0].id,day.steps[1].id);
  assert.equal(returnTrip(state,'Retour').cities[0].days[0].preparation.activeAlternativeId,undefined);
  const future=structuredClone(state);future.cities[0].days[0].preparation.privateSecret='NEVER SHARE';assert.equal(JSON.stringify(splitContent(future)).includes('NEVER SHARE'),false);
});
test('L6 : références supprimées nettoyées, ancien carnet accepté, valeurs invalides refusées',()=>{
  const state=fixture(),day=state.cities[0].days[0];const old=structuredClone(state);delete old.cities[0].days[0].preparation;assert.ok(validateState(old));
  for(const change of [p=>p.marginMinutes=-1,p=>p.timings.a.durationMinutes=0.5,p=>p.timings.a.startTime='25:00',p=>p.timings.a.checkedAt='2026-02-30',p=>p.alternatives[0].stepIds=['b','b'],p=>p.activeAlternativeId='unknown',p=>p.anchorStepId='missing']){const p=structuredClone(day.preparation);change(p);assert.equal(validPreparation(p,day.steps),false);}
  day.steps=day.steps.filter(s=>s.id!=='a');const cleaned=cleanReferences(state);assert.ok(validateState(cleaned));assert.equal(cleaned.cities[0].days[0].preparation.anchorStepId,undefined);assert.ok(!Object.hasOwn(cleaned.cities[0].days[0].preparation.timings,'a'));
});
test('L6 : concurrence indépendante conservée et sélection divergente signalée',()=>{
  const base=fixture(),a=structuredClone(base),b=structuredClone(base);a.cities[0].days[0].preparation.marginMinutes=60;b.notes.general='Une note distante';
  const merged=mergeWithConflicts(base,a,b);assert.equal(merged.conflicts.length,0);assert.equal(merged.value.notes.general,b.notes.general);
  b.cities[0].days[0].preparation.marginMinutes=90;assert.ok(mergeWithConflicts(base,a,b).conflicts.some(c=>c.path.includes('marginMinutes')));
});
test('L6 : traductions complètes et variables préservées',()=>{for(let i=0;i<3;i++)for(const[key,value]of Object.entries(preparationDictionary(i))){assert.ok(value);assert.deepEqual(value.match(/\{[^}]+\}/g)||[],key.match(/\{[^}]+\}/g)||[]);}});
