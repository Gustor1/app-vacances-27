import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPlanning } from '../scripts/evaluate-planning-stress.mjs';
import { parsePlanning } from '../src/planning-import/parser.ts';
import { stressCorpus } from './fixtures/planning/stress-corpus.mjs';

const expected = days => ({expected:[{name:'Paris',days:days.map(anchors=>({date:'',items:anchors.map(anchor=>({anchor}))}))}]});

test('stress evaluator never counts two names merged in one title as two activities',()=>{
  const draft=parsePlanning('Ville: Paris\nJour 1\n- Louvre puis Orsay');
  const result=assessPlanning(expected([['Louvre','Orsay']]),draft);
  assert.equal(result.mentions,2);assert.equal(result.separateItems,0);assert.equal(result.assignedItems,0);assert.equal(result.passed,false);
});

test('stress evaluator detects swapped days despite correct activity counts',()=>{
  const draft=parsePlanning('Ville: Paris\nJour 1\n- Louvre\nJour 2\n- Orsay');
  const result=assessPlanning(expected([['Orsay'],['Louvre']]),draft);
  assert.equal(result.separateItems,2);assert.equal(result.assignedItems,0);assert.equal(result.passed,false);
});

test('stress evaluator preserves intentional repeated visits on different days',()=>{
  const draft=parsePlanning('Ville: Paris\nJour 1\n- Louvre\nJour 2\n- Louvre');
  const result=assessPlanning(expected([['Louvre'],['Louvre']]),draft);
  assert.equal(result.separateItems,2);assert.equal(result.assignedItems,2);assert.equal(result.passed,true);
});

test('stress evaluator catches false times, extra activities and wrong cities',()=>{
  const entry=expected([['Louvre']]);entry.expected[0].days[0].items[0].time='';
  const timed=parsePlanning('Ville: Paris\nJour 1\n- 09:00 Louvre');
  assert.equal(assessPlanning(entry,timed).fieldErrors,1);
  const extra=parsePlanning('Ville: Paris\nJour 1\n- Louvre\n- Unknown');
  assert.equal(assessPlanning(entry,extra).passed,false);
  const wrongCity=parsePlanning('Ville: Lyon\nJour 1\n- Louvre');
  assert.equal(assessPlanning(entry,wrongCity).assignedItems,0);
});

test('stress corpus has 36 unique readable sources and source-grounded expectations',()=>{
  assert.equal(stressCorpus.length,36);assert.equal(new Set(stressCorpus.map(c=>c.id)).size,36);
  assert.equal(new Set(stressCorpus.map(c=>c.family)).size,6);
  const normalize=value=>value.toLowerCase().replace(/\s+/g,' ');
  for(const entry of stressCorpus) {
    assert.ok(entry.source.trim().length>0 && entry.source.length<=50000);
    for(const city of entry.expected) for(const day of city.days) for(const item of day.items) {
      assert.ok(normalize(entry.source).includes(normalize(item.anchor)),`${entry.id}: ${item.anchor}`);
    }
  }
});
