import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { defaults, parsePreferences, PREFERENCES_KEY, translate } from './locale-utils';
import type { Language, Preferences, Theme, TranslationValues } from './locale-utils';
export { parsePreferences, PREFERENCES_KEY, translate } from './locale-utils';
export type { Language, Theme, TranslationValues } from './locale-utils';

type LocaleContext = Preferences & {
  resolvedTheme: 'light' | 'dark';
  dateLocale: string;
  preferenceError: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (text: string, values?: TranslationValues) => string;
};
const Locale = createContext<LocaleContext | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try { return parsePreferences(localStorage.getItem(PREFERENCES_KEY)); } catch { return defaults; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [preferenceError, setPreferenceError] = useState(false);
  const resolvedTheme = preferences.theme === 'system' ? systemDark ? 'dark' : 'light' : preferences.theme;
  const { language, theme } = preferences;
  const t = useCallback((text: string, values?: TranslationValues) => translate(text, language, values), [language]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    const receive = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) setPreferences(parsePreferences(event.newValue));
    };
    window.addEventListener('storage', receive);
    return () => { media.removeEventListener('change', update); window.removeEventListener('storage', receive); };
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.title = t('À l’Est — Mon carnet de Chine');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#14231e' : '#244c40');
  }, [language, resolvedTheme, t]);
  const update = (next: Partial<Preferences>) => {
    let value = { ...preferences, ...next };
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      if (raw) value = { ...parsePreferences(raw), ...next };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
      setPreferenceError(false);
    } catch { setPreferenceError(true); }
    setPreferences(value);
  };
  return <Locale.Provider value={{ language, theme, resolvedTheme, dateLocale: language === 'en' ? 'en-GB' : 'fr-FR', preferenceError,
    setLanguage: language => update({ language }), setTheme: theme => update({ theme }), t }}>{children}</Locale.Provider>;
}
export function useLocale() {
  const context = useContext(Locale);
  if (!context) throw new Error('LocaleProvider is required.');
  return context;
}
