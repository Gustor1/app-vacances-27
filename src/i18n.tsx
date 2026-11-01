import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { defaults, localeFor, parsePreferences, PREFERENCES_KEY, translate } from './locale-utils';
import type { Language, Preferences, Theme, TranslationValues } from './locale-utils';
import { defaultPalettes, isPaletteId, paletteFor, PALETTES_KEY, parsePalettes } from './palettes';
import type { Appearance, PaletteId, PalettePreferences } from './palettes';
export { parsePreferences, PREFERENCES_KEY, translate } from './locale-utils';
export type { Language, Theme, TranslationValues } from './locale-utils';

type LocaleContext = Preferences & {
  resolvedTheme: 'light' | 'dark';
  dateLocale: string;
  preferenceError: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  palettes: PalettePreferences;
  setPalette: (appearance: Appearance, palette: PaletteId) => void;
  resetPalettes: () => void;
  t: (text: string, values?: TranslationValues) => string;
};
const Locale = createContext<LocaleContext | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try { return parsePreferences(localStorage.getItem(PREFERENCES_KEY)); } catch { return defaults; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [preferenceError, setPreferenceError] = useState(false);
  const [palettes, setPalettes] = useState(() => {
    try { return parsePalettes(localStorage.getItem(PALETTES_KEY)); } catch { return { ...defaultPalettes }; }
  });
  const [paletteError, setPaletteError] = useState(false);
  const resolvedTheme = preferences.theme === 'system' ? systemDark ? 'dark' : 'light' : preferences.theme;
  const { language, theme } = preferences;
  const t = useCallback((text: string, values?: TranslationValues) => translate(text, language, values), [language]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    const receive = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) setPreferences(parsePreferences(event.newValue));
      if (event.key === PALETTES_KEY) { setPalettes(parsePalettes(event.newValue)); setPaletteError(false); }
      if (event.key === null) { setPreferences(defaults); setPalettes({ ...defaultPalettes }); setPaletteError(false); }
    };
    window.addEventListener('storage', receive);
    return () => { media.removeEventListener('change', update); window.removeEventListener('storage', receive); };
  }, []);
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.palette = palettes[resolvedTheme];
    document.documentElement.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paletteFor(palettes, resolvedTheme)['--surface-alt']);
  }, [language, resolvedTheme, palettes, t]);
  const updatePalette = (appearance?: Appearance, palette?: PaletteId) => {
    if (appearance && !isPaletteId(palette)) return;
    let next = { ...palettes };
    try {
      const raw = localStorage.getItem(PALETTES_KEY);
      if (raw && !paletteError) next = parsePalettes(raw);
      next = appearance && palette ? { ...next, [appearance]: palette } : { ...defaultPalettes };
      const serialized = JSON.stringify(next);
      localStorage.setItem(PALETTES_KEY, serialized);
      if (localStorage.getItem(PALETTES_KEY) !== serialized) throw new Error('Palette write was not retained');
      setPaletteError(false);
    } catch {
      next = appearance && palette ? { ...next, [appearance]: palette } : { ...defaultPalettes };
      setPaletteError(true);
    }
    setPalettes(next);
  };
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
  return <Locale.Provider value={{ language, theme, resolvedTheme, palettes, setPalette: updatePalette, resetPalettes: () => updatePalette(), dateLocale: localeFor(language), preferenceError: preferenceError || paletteError,
    setLanguage: language => update({ language }), setTheme: theme => update({ theme }), t }}>{children}</Locale.Provider>;
}
export function useLocale() {
  const context = useContext(Locale);
  if (!context) throw new Error('LocaleProvider is required.');
  return context;
}
