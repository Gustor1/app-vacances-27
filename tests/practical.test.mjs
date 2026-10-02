import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseSummary, realDate, positiveAmount } from '../src/practical-utils.ts';

test('le budget ne fusionne jamais euros et yuans sans taux renseigné', () => {
  const expenses = [{ amount: 80, currency: 'CNY' }, { amount: 20, currency: 'EUR' }];
  assert.deepEqual(expenseSummary(expenses), { totals: { CNY: 80, EUR: 20 }, totalCny: undefined });
  assert.equal(expenseSummary(expenses, 8).totalCny, 240);
  for (const rate of [0, -1, Infinity, NaN]) assert.equal(expenseSummary(expenses, rate).totalCny, undefined);
  assert.equal(expenseSummary([{ amount: 80, currency: 'CNY' }]).totalCny, 80);
  assert.equal(expenseSummary([]).totalCny, 0);
});

test('les dates impossibles et les montants invalides sont rejetés', () => {
  assert.equal(realDate('2028-02-29'), true);
  for (const value of ['2027-02-29', '2027-04-31', '2027-13-01', '2027-01-00', '2027-1-1', '']) assert.equal(realDate(value), false);
  assert.equal(positiveAmount(' 12,50 '), 12.5);
  for (const value of ['', '0', '-2', 'Infinity', '1e3', '12abc', '1,2,3']) assert.equal(positiveAmount(value), undefined);
});

test('les conversions dépassant les nombres finis ne produisent pas de faux total', () => {
  assert.equal(expenseSummary([{ amount: Number.MAX_VALUE, currency: 'EUR' }], 2).totalCny, undefined);
  assert.equal(expenseSummary([{ amount: Number.MAX_VALUE, currency: 'CNY' }, { amount: Number.MAX_VALUE, currency: 'CNY' }]).totalCny, undefined);
  assert.deepEqual(expenseSummary([{ amount: 12.5, currency: 'EUR' }]).totals, { CNY: 0, EUR: 12.5 });
  assert.equal(expenseSummary([{ amount: 12.5, currency: 'EUR' }], 8).totalCny, 100);
});

test('le parsing des montants reste strict et accepte la virgule française', () => {
  for (const value of ['+10', '1 000', '0.0', '0,00', '12.', '.5', '１２', '9'.repeat(400)]) assert.equal(positiveAmount(value), undefined);
  assert.equal(positiveAmount('0,01'), 0.01);
  assert.equal(positiveAmount('0012.50'), 12.5);
  assert.equal(realDate('2027-12-31'), true);
  assert.equal(realDate('2027-12-31T00:00:00Z'), false);
});
