import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyMissingConversions, conversionFor, currencyDigits, fetchExchangeRate, freezeLegacyConversions, roundMoney, suggestedCurrency } from '../src/money.ts';
import { journeyExpenseSummary } from '../src/practical-utils.ts';
import { blankTrip, archive, parseTrip } from '../src/journeys.ts';
import { validateState } from '../src/lib.ts';
import { joinContent, splitContent } from '../src/cloud/projection.ts';

const expense = (currency='USD', amount=10) => ({id:'e', cityId:'', label:'Repas', amount, currency, category:'food', conversions:{}});
const quote = (rate, date='2026-10-07') => ({rate, date, source:'manual'});
test('devise proposée pour un pays connu, choix explicite pour plusieurs pays ou pays ambigu', () => {
  assert.equal(suggestedCurrency(['JP']), 'JPY'); assert.equal(suggestedCurrency(['CN']), 'CNY');
  assert.equal(suggestedCurrency(['FR']), 'EUR');
  for (const countries of [[], ['JP','CN'], ['FR','DE'], ['ZZ'], ['PA']]) assert.equal(suggestedCurrency(countries), undefined);
});
test('chaque dépense garde son taux, les changements de taux ne modifient que les montants non convertis', () => {
  let state={...blankTrip({title:'Budget', currency:'EUR'}), expenses:[expense()], exchangeRates:{USD:.8}};
  assert.equal(journeyExpenseSummary(state.expenses,'EUR',state.exchangeRates).total,undefined);
  state=applyMissingConversions(state,'USD',quote(.8));
  state=applyMissingConversions({...state,expenses:[...state.expenses,{...expense(),id:'next'}]},'USD',quote(.9));
  assert.equal(state.expenses[0].conversions.EUR.rate,.8);assert.equal(state.expenses[1].conversions.EUR.rate,.9);
  assert.equal(journeyExpenseSummary(state.expenses,'EUR',{USD:42}).total,17);
  assert.equal(conversionFor(state.expenses[0],'EUR').date,'2026-10-07');
});
test('les anciens taux sont figés sans inventer de date, y compris le budget original', () => {
  const e=expense();delete e.conversions;
  const old={...blankTrip({title:'Ancien',currency:'EUR'}),expenses:[e],exchangeRates:{USD:.8},budget:100,budgetCurrency:'USD'};
  const frozen=freezeLegacyConversions(old);
  assert.equal(applyMissingConversions(old,'USD',quote(2)).budgetConversions.EUR.rate,.8);
  const newer=applyMissingConversions({...frozen,exchangeRates:{USD:2}},'USD',quote(2));
  assert.equal(newer.expenses[0].conversions.EUR.rate,.8);assert.equal(newer.budgetConversions.EUR.rate,.8);
  assert.equal(newer.expenses[0].conversions.EUR.date,'');assert.equal(newer.expenses[0].conversions.EUR.source,'legacy');
  assert.equal(newer.budget,100);assert.equal(newer.budgetCurrency,'USD');assert.equal(old.expenses[0].conversions,undefined);
});
test('changement de référence aller-retour garde les originaux et toutes les conversions', () => {
  let state=applyMissingConversions({...blankTrip({title:'Euro',currency:'EUR'}),expenses:[expense()]},'USD',quote(.8));
  state={...state,journey:{...state.journey,currency:'JPY'},exchangeRates:{}};
  assert.equal(journeyExpenseSummary(state.expenses,'JPY').total,undefined);
  state=applyMissingConversions(state,'USD',quote(150));
  assert.equal(journeyExpenseSummary(state.expenses,'JPY').total,1500);
  assert.equal(journeyExpenseSummary(state.expenses,'EUR').total,8);
  assert.equal(state.expenses[0].amount,10);assert.equal(state.expenses[0].currency,'USD');
  assert.deepEqual(parseTrip(JSON.stringify(archive(state))).state.expenses,state.expenses);
  assert.deepEqual(joinContent(splitContent(state)).expenses,state.expenses);
});
test('arrondis par devise et par dépense, totals incomplets et débordements restent signalés', () => {
  assert.equal(currencyDigits('JPY'),0);assert.equal(currencyDigits('EUR'),2);assert.equal(currencyDigits('KWD'),3);
  assert.equal(roundMoney(1.005,'EUR'),1.01);assert.equal(roundMoney(1.5,'JPY'),2);assert.equal(roundMoney(1.2345,'KWD'),1.235);
  const e={...expense('USD',1),conversions:{EUR:quote(.335)}};
  assert.equal(journeyExpenseSummary([e,{...e,id:'2'}],'EUR').total,.68);
  const partial=journeyExpenseSummary([e,expense('JPY',100)],'EUR');assert.equal(partial.total,undefined);assert.equal(partial.partial,.34);
  assert.deepEqual(partial.missing,['JPY']);
  assert.equal(journeyExpenseSummary([{...expense('USD',Number.MAX_VALUE),conversions:{EUR:quote(2)}}],'EUR').total,undefined);
});
test('source des taux vérifiée, erreurs et réponses invalides ne deviennent jamais des conversions', async () => {
  const valid={date:'2026-10-07',base:'USD',quote:'EUR',rate:.9};
  assert.deepEqual(await fetchExchangeRate('USD','EUR',async url=>{assert.ok(url.endsWith('/usd/eur'));return new Response(JSON.stringify(valid));}),{...quote(.9),source:'frankfurter'});
  for (const changed of [{rate:0},{rate:-1},{base:'CNY'},{quote:'JPY'},{date:'2026-02-30'},{date:null}]) await assert.rejects(()=>fetchExchangeRate('USD','EUR',async()=>new Response(JSON.stringify({...valid,...changed}))));
  await assert.rejects(()=>fetchExchangeRate('USD','EUR',async()=>new Response('{}',{status:404})));
  await assert.rejects(()=>fetchExchangeRate('USD','EUR',async()=>{throw new TypeError('offline');}));
});
test('les sauvegardes et projections conservent et valident les taux datés', () => {
  const state={...blankTrip({title:'Valid'}),rateQuotes:{USD:quote(.9)},budgetConversions:{EUR:quote(1)},expenses:[{...expense(),conversions:{EUR:quote(.9)}}]};
  assert.equal(validateState(state),true);assert.deepEqual(joinContent(splitContent(state)).rateQuotes,state.rateQuotes);
  for (const bad of [{rate:0,date:'2026-10-07',source:'manual'},{rate:1,date:'',source:'manual'},{rate:1,date:'2026-02-30',source:'manual'},{rate:1,date:'2026-10-07',source:'made-up'}]) assert.equal(validateState({...state,expenses:[{...expense(),conversions:{EUR:bad}}]}),false);
});
