import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCloud } from './cloud/CloudProvider';
import { defaultMascotPreferences, MASCOT_KEY, parseMascotPreferences, type MascotPreferences } from './mascot';

type Character = 'pico' | 'mochi' | 'bivouac';
const LOOK_KEY = 'detours-mascot-look-v1';
type Preference = MascotPreferences & { character: Character; animated: boolean; setCharacter: (character: Character) => void; setAnimated: (animated: boolean) => void } & { error: boolean; setEnabled: (enabled: boolean) => void; markWelcomeSeen: () => void };
const Context = createContext<Preference | null>(null);

/** Mounted with key=scope: this device's personal preference never enters a trip or sync record. */
export function MascotPreferencesProvider({ children }: { children: ReactNode }) {
  const { storage } = useCloud();
  const read = () => {
    try { return { ...parseMascotPreferences(storage.getItem(MASCOT_KEY)), error: false }; }
    catch { return { ...defaultMascotPreferences, error: true }; }
  };
  const [value, setValue] = useState(read);
  const readLook = () => { try { const v = JSON.parse(storage.getItem(LOOK_KEY) || 'null'); return { character: (['pico','mochi','bivouac'].includes(v?.character) ? v.character : 'pico') as Character, animated: v?.animated !== false }; } catch { return { character: 'pico' as Character, animated: true }; } };
  const [look, setLook] = useState(readLook);
  const [lookError, setLookError] = useState(false);
  const updateLook = (patch: Partial<typeof look>) => { const next = { ...look, ...patch }; setLook(next); try { const raw = JSON.stringify(next); storage.setItem(LOOK_KEY, raw); if (storage.getItem(LOOK_KEY) !== raw) throw new Error('Not retained'); setLookError(false); } catch { setLookError(true); } };
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === null || event.key === storage.physicalKey(LOOK_KEY)) setLook(readLook());
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
  return <Context.Provider value={{ ...value, ...look, error: value.error || lookError, setCharacter: character => updateLook({ character }), setAnimated: animated => updateLook({ animated }), setEnabled: enabled => update({ enabled }), markWelcomeSeen }}>{children}</Context.Provider>;
}
export function useMascotPreferences() {
  const context = useContext(Context);
  if (!context) throw new Error('MascotPreferencesProvider is required.');
  return context;
}
