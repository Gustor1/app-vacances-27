import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchLiveQuotes,liveExpenseSummary,pairKey,RATE_CACHE_KEY,readRateCache} from '../src/live-rates.ts';
import {parseMoneyPreferences,MONEY_PREFERENCES_KEY} from '../src/money-preferences.ts';
import {AccountStorage} from '../src/cloud/storage.ts';

const live=(rate,date='2026-10-07')=>({rate,date,source:'frankfurter',fetchedAt:Date.now()});
const expense=(currency,amount)=>({id:currency,cityId:'',label:'Repas',amount,currency,category:'food',conversions:{}});
test('requête groupée : codes demandés, date réelle et conversions incomplètes',async()=>{
  const rows=[{base:'CNY',quote:'EUR',rate:.13,date:'2026-10-07'},{base:'CNY',quote:'USD',rate:.14,date:'2026-10-07'}];
  const result=await fetchLiveQuotes('CNY',['USD','EUR','EUR','CNY'],async url=>{assert.equal(url,'https://api.frankfurter.dev/v2/rates?base=cny&quotes=eur,usd');return new Response(JSON.stringify(rows));});
  assert.equal(result[pairKey('CNY','EUR')].rate,.13);assert.equal(result['CNY:USD'].date,'2026-10-07');
  assert.deepEqual(await fetchLiveQuotes('CNY',['EUR'],async()=>new Response('[]')),{});
  for(const bad of [[{...rows[0],base:'USD'}],[{...rows[0],quote:'JPY'}],[{...rows[0],date:'2026-02-30'}],[{...rows[0],rate:0}],[rows[0],rows[0]],{},null])await assert.rejects(()=>fetchLiveQuotes('CNY',['EUR'],async()=>new Response(JSON.stringify(bad))));
  await assert.rejects(()=>fetchLiveQuotes('CNY',['EUR'],async()=>new Response('{}',{status:429})));
});
test('total personnel est recalculé depuis les originaux sans modifier les conversions enregistrées',()=>{
  const saved=[{...expense('CNY',100),conversions:{EUR:{rate:.1,date:'2026-10-01',source:'manual'}}},expense('JPY',1000),expense('EUR',5)];
  const before=structuredClone(saved);
  const first=liveExpenseSummary(saved,'EUR',{'CNY:EUR':live(.13),'JPY:EUR':live(.006)});
  assert.equal(first.total,24);assert.deepEqual(first.dates,['2026-10-07']);
  assert.equal(liveExpenseSummary(saved,'EUR',{'CNY:EUR':live(.14),'JPY:EUR':live(.007)}).total,26);
  assert.deepEqual(saved,before);
  const missing=liveExpenseSummary(saved,'EUR',{'CNY:EUR':live(.13)});assert.equal(missing.total,undefined);assert.equal(missing.partial,18);assert.deepEqual(missing.missing,['JPY']);
  assert.equal(liveExpenseSummary([...saved,expense('EUR',5)],'EUR',{'CNY:EUR':live(.13),'JPY:EUR':live(.006)}).total,29);
});
test('cache public corrompu, date impossible ou horodatage futur ne donne jamais un faux taux',()=>{
  for(const raw of ['null','[]','{broken','42'])assert.deepEqual(readRateCache({getItem:()=>raw}),{});
  const quotes={'CNY:EUR':live(.13),'USD:EUR':{...live(.9),date:'2026-02-30'},'BAD:EUR':live(1),'JPY:EUR':{...live(.006),fetchedAt:Date.now()+100000},'EUR:USD':{...live(1),rate:-1}};
  const valid=readRateCache({getItem:key=>{assert.equal(key,RATE_CACHE_KEY);return JSON.stringify(quotes);}});
  assert.deepEqual(Object.keys(valid),['CNY:EUR']);
});
test('préférence personnelle valide et isolée par compte, aucun changement du carnet partagé',()=>{
  const values=new Map(),backing={get length(){return values.size;},getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),key:index=>[...values.keys()][index]};
  const alice=new AccountStorage(backing,'alice'),bob=new AccountStorage(backing,'bob');
  alice.setItem(MONEY_PREFERENCES_KEY,JSON.stringify({country:'FR',currency:'EUR'}));bob.setItem(MONEY_PREFERENCES_KEY,JSON.stringify({country:'JP',currency:'JPY'}));
  assert.deepEqual(parseMoneyPreferences(alice.getItem(MONEY_PREFERENCES_KEY)),{country:'FR',currency:'EUR'});
  assert.deepEqual(parseMoneyPreferences(bob.getItem(MONEY_PREFERENCES_KEY)),{country:'JP',currency:'JPY'});
  assert.deepEqual(alice.records(),[]);assert.deepEqual(bob.records(),[]);
  for(const raw of [null,'null','{bad','{"country":"XX","currency":"ZZZ"}'])assert.deepEqual(parseMoneyPreferences(raw),{country:'',currency:''});
});
