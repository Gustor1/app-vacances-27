import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCloud } from './cloud/CloudProvider';
import { MAP_PREFERENCES_KEY, parseMapPreference, type MapProvider } from './map-preferences';

type Preference = { provider: MapProvider; error: boolean; setProvider: (provider: MapProvider) => void };
const MapPreferences = createContext<Preference | null>(null);
export function MapPreferencesProvider({ children }: { children: ReactNode }) {
  const { storage } = useCloud();
  const read = () => {
    try { return { provider: parseMapPreference(storage.getItem(MAP_PREFERENCES_KEY)), error: false }; }
    catch { return { provider: 'google' as const, error: true }; }
  };
  const [value, setValue] = useState(read);
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (!event.key || event.key === storage.physicalKey(MAP_PREFERENCES_KEY)) setValue(read());
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [storage]);
  function setProvider(provider: MapProvider) {
    let error = false;
    try {
      const raw = JSON.stringify({ provider });
      storage.setItem(MAP_PREFERENCES_KEY, raw);
      if (storage.getItem(MAP_PREFERENCES_KEY) !== raw) throw new Error('Preference not saved');
    } catch { error = true; }
    setValue({ provider, error });
  }
  return <MapPreferences.Provider value={{ ...value, setProvider }}>{children}</MapPreferences.Provider>;
}
export function useMapPreferences() {
  const value = useContext(MapPreferences);
  if (!value) throw new Error('MapPreferencesProvider is required.');
  return value;
}
