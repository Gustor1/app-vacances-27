import type { ExchangeRate, Expense, StoredState } from './types.ts';
import { countryCurrencies } from './country-currencies.ts';

export function suggestedCurrency(countries: string[]): string | undefined {
  // Multiple destinations always require a deliberate reference choice.
  return countries.length === 1 ? countryCurrencies[countries[0]] : undefined;
}
export const currencyDigits = (currency: string) => new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits!;
export function roundMoney(amount: number, currency: string): number {
  const factor = 10 ** currencyDigits(currency);
  if (!Number.isFinite(amount * factor)) return NaN;
  return Math.round((amount + Number.EPSILON * amount) * factor) / factor;
}
export function conversionFor(expense: Pick<Expense, 'currency' | 'conversions'>, reference: string, legacyRates: Record<string, number> = {}): ExchangeRate | undefined {
  if (expense.currency === reference) return;
  if (expense.conversions !== undefined) return expense.conversions[reference];
  const rate = legacyRates[expense.currency];
  return Number.isFinite(rate) && rate > 0 ? { rate, date: '', source: 'legacy' } : undefined;
}
/** Freeze old undated rates before changing settings; never invent their date. */
export function freezeLegacyConversions(state: StoredState): StoredState {
  const reference = state.journey?.currency || 'CNY';
  const rates = state.exchangeRates || (state.cnyPerEuro ? { EUR: state.cnyPerEuro } : {});
  const budgetQuote = conversionFor({ currency: state.budgetCurrency || reference }, reference, rates);
  return { ...state, budgetConversions: state.budgetConversions ?? (budgetQuote ? { [reference]: budgetQuote } : {}), expenses: state.expenses?.map(expense => {
    if (expense.conversions !== undefined) return expense;
    const conversion = conversionFor(expense, reference, rates);
    return { ...expense, conversions: conversion ? { [reference]: conversion } : {} };
  }) };
}
/** Apply only to unconverted entries; updating a quote never reprices saved entries. */
export function applyMissingConversions(state: StoredState, currency: string, quote: ExchangeRate): StoredState {
  const reference = state.journey!.currency;
  const frozen = freezeLegacyConversions(state);
  return { ...frozen,
    expenses: frozen.expenses?.map(expense => expense.currency === currency && !expense.conversions?.[reference]
      ? { ...expense, conversions: { ...expense.conversions, [reference]: { ...quote } } } : expense),
    budgetConversions: frozen.budget !== undefined && (frozen.budgetCurrency || reference) === currency && !frozen.budgetConversions?.[reference]
      ? { ...frozen.budgetConversions, [reference]: { ...quote } } : frozen.budgetConversions,
  };
}
export async function fetchExchangeRate(from: string, to: string, fetcher: typeof fetch = fetch): Promise<ExchangeRate> {
  const response = await fetcher(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from.toLowerCase())}/${encodeURIComponent(to.toLowerCase())}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Rate unavailable');
  const quote = await response.json();
  const date = typeof quote.date === 'string' ? quote.date : '';
  if (quote.base !== from || quote.quote !== to || !Number.isFinite(quote.rate) || quote.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) throw new Error('Invalid rate');
  return { rate: quote.rate, date, source: 'frankfurter' };
}
