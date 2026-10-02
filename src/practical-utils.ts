import type { Expense } from './types';

/** Keep currencies separate until the traveller provides their own exchange rate. */
export function expenseSummary(expenses: Expense[], cnyPerEuro?: number) {
  const totals = { CNY: 0, EUR: 0 };
  for (const expense of expenses) totals[expense.currency] += expense.amount;
  const hasRate = cnyPerEuro !== undefined && Number.isFinite(cnyPerEuro) && cnyPerEuro > 0;
  const totalCny = totals.EUR === 0 ? totals.CNY : hasRate ? totals.CNY + totals.EUR * cnyPerEuro! : undefined;
  return { totals, totalCny: totalCny !== undefined && Number.isFinite(totalCny) ? totalCny : undefined };
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
