import type { Expense } from './types';
import { conversionFor, roundMoney } from './money.ts';

/** Keep currencies separate until the traveller provides their own exchange rate. */
export function expenseSummary(expenses: Expense[], cnyPerEuro?: number) {
  const totals: Record<string, number> = { CNY: 0, EUR: 0 };
  for (const expense of expenses) totals[expense.currency] += expense.amount;
  const hasRate = cnyPerEuro !== undefined && Number.isFinite(cnyPerEuro) && cnyPerEuro > 0;
  const totalCny = totals.EUR === 0 ? totals.CNY : hasRate ? totals.CNY + totals.EUR * cnyPerEuro! : undefined;
  return { totals, totalCny: totalCny !== undefined && Number.isFinite(totalCny) ? totalCny : undefined };
}

export function journeyExpenseSummary(expenses: Expense[], reference: string, rates: Record<string, number> = {}) {
  const totals: Record<string, number> = { [reference]: 0 };
  let partial = 0;
  const missing = new Set<string>();
  for (const expense of expenses) {
    totals[expense.currency] = (totals[expense.currency] || 0) + expense.amount;
    const quote = conversionFor(expense, reference, rates);
    const converted = expense.currency === reference ? roundMoney(expense.amount, reference) : quote ? roundMoney(expense.amount * quote.rate, reference) : undefined;
    if (converted !== undefined && Number.isFinite(converted)) partial += converted;
    else missing.add(expense.currency);
  }
  const finite = Number.isFinite(partial);
  const value = finite ? roundMoney(partial, reference) : undefined;
  const rounded = value !== undefined && Number.isFinite(value) ? value : undefined;
  return { totals, partial: rounded, total: rounded !== undefined && Number.isFinite(rounded) && !missing.size ? rounded : undefined, missing: [...missing] };
}

export function realDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function positiveAmount(value: string): number | undefined {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return;
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
