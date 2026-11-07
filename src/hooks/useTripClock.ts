import { useEffect, useState } from 'react';
/** One clock per mounted surface, never one timer per card. */
export function useTripClock() {
  const [instant, setInstant] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => setInstant(new Date());
    const visibility = () => {
      clearInterval(timer);
      if (!document.hidden) { update(); timer = setInterval(update, 60000); }
    };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('focus', update); };
  }, []);
  return instant;
}
