import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';

/** Check again when Safari resumes an open tab; never reload a draft automatically. */
export default function AppUpdate() {
  const { t } = useLocale();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const module = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src;
    if (!module) return;
    const abort = new AbortController();
    const registration = 'serviceWorker' in navigator
      ? navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => undefined)
      : Promise.resolve(undefined);
    let checking = false;
    let resumePending = false;
    const check = async () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine || abort.signal.aborted) return;
      if (checking) { resumePending = true; return; }
      checking = true;
      try {
        // The query also bypasses caches in workers from older releases.
        const url = new URL('/index.html', location.href);
        url.searchParams.set('app-update', String(Date.now()));
        const response = await fetch(url, { cache: 'no-store', signal: abort.signal });
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const latest = new DOMParser().parseFromString(await response.text(), 'text/html')
            .querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');
          if (latest && !abort.signal.aborted) setAvailable(new URL(latest, response.url).href !== module);
        }
        const worker = await registration;
        if (worker && !abort.signal.aborted) await worker.update();
      } catch { /* Keep the current journal usable offline. */ }
      finally {
        checking = false;
        // A resume during installation must still check the new release.
        if (resumePending) { resumePending = false; void check(); }
      }
    };
    const resume = () => { void check(); };
    resume();
    const interval = window.setInterval(resume, 5 * 60 * 1000);
    window.addEventListener('pageshow', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      abort.abort();
      clearInterval(interval);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);

  return available ? <aside className="app-update" role="status">
    <span>{t('Une nouvelle version est prête.')}</span>
    <button type="button" className="btn btn-primary" onClick={() => location.reload()}>{t('Mettre à jour')}</button>
  </aside> : null;
}
