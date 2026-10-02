import { appEnglish } from './locales/app-en.ts';
import { toolsEnglish } from './locales/tools-en.ts';
import { commonEnglish } from './locales/common-en.ts';

export type Language = 'fr' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type TranslationValues = Record<string, string | number>;
export const PREFERENCES_KEY = 'a-l-est-preferences-v1';
export type Preferences = { language: Language; theme: Theme };
export const defaults: Preferences = { language: 'fr', theme: 'system' };

export function parsePreferences(raw: string | null): Preferences {
  try {
    const value: unknown = JSON.parse(raw || 'null');
    if (!value || typeof value !== 'object') return defaults;
    const item = value as Record<string, unknown>;
    return {
      language: item.language === 'en' ? 'en' : 'fr',
      theme: item.theme === 'dark' || item.theme === 'light' ? item.theme : 'system',
    };
  } catch { return defaults; }
}
const dictionary: Record<string, string> = { ...commonEnglish, ...appEnglish, ...toolsEnglish };
export function translate(text: string, language: Language, values: TranslationValues = {}): string {
  const translated = language === 'en' && Object.hasOwn(dictionary, text) ? dictionary[text] : text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => values[key] !== undefined ? String(values[key]) : match);
}
