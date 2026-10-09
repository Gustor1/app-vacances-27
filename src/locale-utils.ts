import { appEnglish } from './locales/app-en.ts';
import { toolsEnglish } from './locales/tools-en.ts';
import { commonEnglish } from './locales/common-en.ts';
import { journeysEnglish } from './locales/journeys-en.ts';
import { chinese } from './locales/zh.ts';
import { spanish } from './locales/es.ts';
import { betaDictionary } from './locales/beta.ts';
import { backupDictionary } from './locales/backup.ts';
import { offlineDictionary } from './locales/offline.ts';
import { nowDictionary } from './locales/now.ts';
import { preparationDictionary } from './locales/preparation.ts';
import { isValidDate } from './lib.ts';

export const interfaceLanguages = [
  { id: 'fr', label: 'Français', dateLocale: 'fr-FR' },
  { id: 'en', label: 'English', dateLocale: 'en-GB' },
  { id: 'zh-CN', label: '中文（简体）', dateLocale: 'zh-CN' },
  { id: 'es', label: 'Español', dateLocale: 'es-ES' },
] as const;
export type Language = typeof interfaceLanguages[number]['id'];
export function localeFor(language: Language): string {
  return interfaceLanguages.find(option => option.id === language)!.dateLocale;
}
/** A civil date has no instant or device timezone. Preserve its day during localization. */
export function formatCivilDate(value: string, language: Language): string {
  if (!isValidDate(value)) return value;
  return new Intl.DateTimeFormat(localeFor(language), { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}
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
      language: interfaceLanguages.find(option => option.id === item.language)?.id ?? 'fr',
      theme: item.theme === 'dark' || item.theme === 'light' ? item.theme : 'system',
    };
  } catch { return defaults; }
}
const dictionary: Record<string, string> = { ...commonEnglish, ...appEnglish, ...toolsEnglish, ...journeysEnglish, ...betaDictionary(0), ...backupDictionary(0), ...offlineDictionary(0), ...nowDictionary(0), ...preparationDictionary(0) };
const dictionaries: Record<Exclude<Language, 'fr'>, Record<string, string>> = { en: dictionary, 'zh-CN': { ...chinese, ...betaDictionary(1), ...backupDictionary(1), ...offlineDictionary(1), ...nowDictionary(1), ...preparationDictionary(1) }, es: { ...spanish, ...betaDictionary(2), ...backupDictionary(2), ...offlineDictionary(2), ...nowDictionary(2), ...preparationDictionary(2) } };
export function translate(text: string, language: Language, values: TranslationValues = {}): string {
  const selected = language === 'fr' ? undefined : dictionaries[language];
  const translated = selected && Object.hasOwn(selected, text) ? selected[text] : text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => values[key] !== undefined ? String(values[key]) : match);
}
