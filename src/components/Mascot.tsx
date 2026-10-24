import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';
import { useMascotPreferences } from '../MascotPreferences';
import './Mascot.css';
export type MascotState = 'welcome' | 'attention' | 'ready';
const messages: Record<MascotState, string> = {
  welcome: 'Un premier détour ? Crée ton carnet ou pars d’un planning à vérifier.',
  attention: 'Un passage demande ta relecture. Compare avec la source avant de créer le carnet.',
  ready: 'Cette copie du carnet et l’application sont disponibles hors ligne ici. Les liens et cartes de rues demandent Internet ; garde aussi une sauvegarde.',
};

export default function Mascot({ state }: { state: MascotState }) {
  const { enabled } = useMascotPreferences();
  const { t } = useLocale();
  if (!enabled) return null;
  return <div className="mascot-hint" data-mascot={state}>
    <p>{t(messages[state])}</p>
  </div>;
}

export function FirstNotebookMascot() {
  const { enabled, welcomeSeen, markWelcomeSeen } = useMascotPreferences();
  // Keep the first display stable, then suppress future mounts/openings for this scope.
  const [firstDisplay] = useState(!welcomeSeen);
  useEffect(() => { if (enabled && firstDisplay) markWelcomeSeen(); }, [enabled, firstDisplay, markWelcomeSeen]);
  return firstDisplay ? <Mascot state="welcome"/> : null;
}
