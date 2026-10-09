import { countryCodes } from './countries.ts';
import { validCurrency } from './lib.ts';

export const MONEY_PREFERENCES_KEY = 'detours-money-preferences-v1';
export type MoneyPreferences = { country:string; currency:string };
export function parseMoneyPreferences(raw:string|null): MoneyPreferences {
  try { const value=JSON.parse(raw||'{}');return {country:countryCodes.has(value.country)?value.country:'',currency:validCurrency(value.currency)?value.currency:''}; } catch { return {country:'',currency:''}; }
}
