import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCloud } from './cloud/CloudProvider';
import { defaultMascotPreferences, MASCOT_KEY, parseMascotPreferences, type MascotPreferences } from './mascot';

type Preference = MascotPreferences & { error: boolean; setEnabled: (enabled: boolean) => void; markWelcomeSeen: () => void };
const Context = createContext<Preference | null>(null);

/** Mounted with key=scope: this device's personal preference never enters a trip or sync record. */
export function MascotPreferencesProvider({ children }: { children: ReactNode }) {
  const { storage } = useCloud();
  const read = () => {
    try { return { ...parseMascotPreferences(storage.getItem(MASCOT_KEY)), error: false }; }
    catch { return { ...defaultMascotPreferences, error: true }; }
  };
  const [value, setValue] = useState(read);
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === null || event.key === storage.physicalKey(MASCOT_KEY)) setValue(read());
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [storage]);
  const update = useCallback((patch: Partial<Pick<MascotPreferences, 'enabled' | 'welcomeSeen'>>) => {
    let next: MascotPreferences = { version: 1, enabled: value.enabled, welcomeSeen: value.welcomeSeen, ...patch };
    let error = false;
    try {
      if (!value.error) next = { ...parseMascotPreferences(storage.getItem(MASCOT_KEY)), ...patch };
      const raw = JSON.stringify(next);
      storage.setItem(MASCOT_KEY, raw);
      if (storage.getItem(MASCOT_KEY) !== raw) throw new Error('Mascot preference not retained');
    } catch { error = true; }
    setValue({ ...next, error });
  }, [storage, value]);
  const markWelcomeSeen = useCallback(() => { if (!value.welcomeSeen) update({ welcomeSeen: true }); }, [value.welcomeSeen, update]);
  return <Context.Provider value={{ ...value, setEnabled: enabled => update({ enabled }), markWelcomeSeen }}>{children}</Context.Provider>;
}
export function useMascotPreferences() {
  const context = useContext(Context);
  if (!context) throw new Error('MascotPreferencesProvider is required.');
  return context;
}
