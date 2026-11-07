import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocale } from '../i18n';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const InstallContext = createContext({ installed: false, available: false, prompt: async () => {} });

/** Listen from startup: Chromium may offer installation before Preferences opens. */
export function InstallProvider({ children }: { children: ReactNode }) {
  const [offer, setOffer] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const display = matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const before = (event: Event) => { event.preventDefault(); setOffer(event as InstallEvent); };
    const done = () => { setInstalled(true); setOffer(null); };
    sync();
    display.addEventListener('change', sync);
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', done);
    return () => {
      display.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  async function prompt() {
    if (!offer) return;
    setOffer(null);
    try { await offer.prompt(); await offer.userChoice; } catch { /* Manual instructions remain available. */ }
  }
  return <InstallContext.Provider value={{ installed, available: !!offer, prompt }}>{children}</InstallContext.Provider>;
}

export default function InstallHelp() {
  const { t } = useLocale();
  const { installed, available, prompt } = useContext(InstallContext);
  return <div className="install-help">
    <p role="status">{t(installed ? 'Détours est installé sur cet appareil.' : 'Ajoute Détours à ton écran d’accueil depuis le menu de ton navigateur.')}</p>
    {!installed && available && <button type="button" className="btn btn-primary" onClick={() => void prompt()}>{t('Installer le carnet')}</button>}
    <details className="offline-recovery"><summary>{t('Installer sur iPhone ou iPad')}</summary><ol>
      <li>{t('Ouvre ce site dans Safari, puis ouvre le menu Partager.')}</li>
      <li>{t('Choisis « Sur l’écran d’accueil ». Si proposé, active « Ouvrir comme app web », puis touche « Ajouter ».')}</li>
      <li>{t('Ouvre Détours depuis son icône, retrouve ton carnet puis vérifie sa disponibilité hors ligne avant le départ.')}</li>
    </ol></details>
    <p className="muted small">{t('Garde une sauvegarde avant de changer de navigateur ou de mode d’ouverture. Installer l’app ne transfère pas automatiquement tes carnets.')}</p>
  </div>;
}
