// Device-local choice for the home line-art animation, set from Preferences.
// 'auto' follows prefers-reduced-motion; 'on' plays even with reduced motion
// (an explicit choice); 'off' keeps the still frame.
import { useCallback, useSyncExternalStore } from 'react';

export const ILLUSTRATION_MOTION_KEY = 'detours-illustration-motion-v1';
export type IllustrationMotion = 'auto' | 'on' | 'off';
const CHANGE = 'detours-illustration-motion';
/** Last choice made in this tab: keeps working when storage is unavailable. */
let session: IllustrationMotion | null = null;

export function readIllustrationMotion(): IllustrationMotion {
  try {
    const value = localStorage.getItem(ILLUSTRATION_MOTION_KEY);
    return value === 'on' || value === 'off' ? value : session ?? 'auto';
  } catch { return session ?? 'auto'; }
}

function subscribe(notify: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === ILLUSTRATION_MOTION_KEY) notify(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE, notify);
  media.addEventListener('change', notify);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(CHANGE, notify); media.removeEventListener('change', notify); };
}

const snapshot = () => `${readIllustrationMotion()}|${matchMedia('(prefers-reduced-motion: reduce)').matches}`;

export function useIllustrationMotion() {
  const [mode, reducedFlag] = useSyncExternalStore(subscribe, snapshot).split('|') as [IllustrationMotion, string];
  const reduced = reducedFlag === 'true';
  const setAnimated = useCallback((animated: boolean) => {
    session = animated ? 'on' : 'off';
    try { localStorage.setItem(ILLUSTRATION_MOTION_KEY, session); } catch { /* storage unavailable: `session` keeps the choice for this tab */ }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return { animated: mode === 'on' || (mode === 'auto' && !reduced), forceMotion: mode === 'on', setAnimated };
}
