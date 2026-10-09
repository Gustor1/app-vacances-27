import { isValidDate, validCurrency } from './lib.ts';
import type { ExchangeRate, Expense } from './types.ts';
import { roundMoney } from './money.ts';

export const RATE_CACHE_KEY = 'detours-public-rates-v1';
export const RATE_MAX_AGE = 15 * 60 * 1000;
export type LiveQuote = ExchangeRate & { fetchedAt: number };
export const pairKey = (from: string, to: string) => `${from}:${to}`;
export function readRateCache(storage?: Pick<Storage,'getItem'>): Record<string, LiveQuote> {
  try {
    const value = JSON.parse(storage?.getItem(RATE_CACHE_KEY) || '{}');
    return Object.fromEntries(Object.entries(value).filter(([key, q]) => {
      const [from,to] = key.split(':');
      const quote = q as LiveQuote;
      return validCurrency(from) && validCurrency(to) && quote && quote.source === 'frankfurter' && Number.isFinite(quote.rate) && quote.rate > 0 && isValidDate(quote.date) && Number.isFinite(quote.fetchedAt) && quote.fetchedAt >= 0 && quote.fetchedAt <= Date.now();
    })) as Record<string, LiveQuote>;
  } catch { return {}; }
}
export async function fetchLiveQuotes(from: string, targets: string[], fetcher: typeof fetch = fetch): Promise<Record<string, LiveQuote>> {
  const to = [...new Set(targets)].filter(currency => validCurrency(currency) && currency !== from).sort();
  if (!validCurrency(from)) throw new Error('Invalid currency');
  if (!to.length) return {};
  const response = await fetcher(`https://api.frankfurter.dev/v2/rates?base=${from.toLowerCase()}&quotes=${to.map(code=>code.toLowerCase()).join(',')}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Rates unavailable');
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid rates');
  const result: Record<string, LiveQuote> = {};
  const fetchedAt = Date.now();
  for (const row of rows) {
    if (!row || row.base !== from || !to.includes(row.quote) || !Number.isFinite(row.rate) || row.rate <= 0 || !isValidDate(row.date)) throw new Error('Invalid rate');
    const key = pairKey(from,row.quote);
    if (result[key]) throw new Error('Duplicate rate');
    result[key] = { rate:row.rate,date:row.date,source:'frankfurter',fetchedAt };
  }
  // Missing pairs are intentionally absent: no rate is guessed or treated as 1.
  return result;
}
export function liveExpenseSummary(expenses: Expense[], target: string, quotes: Record<string, LiveQuote>) {
  let partial = 0;
  const missing = new Set<string>(), dates = new Set<string>();
  for (const expense of expenses) {
    const quote = quotes[pairKey(expense.currency,target)];
    const amount = expense.currency === target ? expense.amount : quote ? expense.amount * quote.rate : NaN;
    const converted = roundMoney(amount,target);
    if (!Number.isFinite(converted)) missing.add(expense.currency);
    else { partial += converted; if (expense.currency !== target && quote) dates.add(quote.date); }
  }
  const total = roundMoney(partial,target);
  return { partial:Number.isFinite(total) ? total : undefined, total:!missing.size && Number.isFinite(total) ? total : undefined, missing:[...missing], dates:[...dates].sort() };
}
