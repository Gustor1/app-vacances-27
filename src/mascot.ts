export const MASCOT_KEY = 'detours-mascot-v1';
export type MascotPreferences = { version: 1; enabled: boolean; welcomeSeen: boolean };
export const defaultMascotPreferences: MascotPreferences = { version: 1, enabled: true, welcomeSeen: false };

export function parseMascotPreferences(raw: string | null): MascotPreferences {
  try {
    const value = JSON.parse(raw || 'null');
    if (value?.version !== 1) return { ...defaultMascotPreferences };
    return { version: 1, enabled: typeof value.enabled === 'boolean' ? value.enabled : true, welcomeSeen: value.welcomeSeen === true };
  } catch { return { ...defaultMascotPreferences }; }
}
