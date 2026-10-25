import { useEffect, useRef, useState } from 'react';
import { Check, Languages, Monitor, Moon, Palette, SlidersHorizontal, Sun, X } from 'lucide-react';
import { useLocale } from '../i18n';
import type { Theme } from '../i18n';
import { interfaceLanguages } from '../locale-utils';
import { paletteIds, paletteNames, paletteTokens } from '../palettes';
import './Preferences.css';
import InstallHelp from './InstallHelp';
import { useMascotPreferences } from '../MascotPreferences';

export default function PreferencesButton() {
  const mascot = useMascotPreferences();
  const { t, theme, resolvedTheme, palettes, setPalette, resetPalettes, language, setTheme, setLanguage, preferenceError } = useLocale();
  const [open, setOpen] = useState(false);
  useEffect(() => { const show = () => setOpen(true); window.addEventListener('detours-open-preferences', show); return () => window.removeEventListener('detours-open-preferences', show); }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; trigger.current?.focus(); };
  }, [open]);
  const options: { id: Theme; label: string; icon: typeof Moon }[] = [
    { id: 'light', label: 'Clair', icon: Sun }, { id: 'dark', label: 'Sombre', icon: Moon }, { id: 'system', label: 'Automatique', icon: Monitor },
  ];
  return <>
    <button ref={trigger} className="preferences-trigger icon-btn" type="button" aria-label={t('Préférences')} aria-haspopup="dialog" onClick={() => setOpen(true)}><SlidersHorizontal size={19}/></button>
    {open && <dialog ref={dialog} className="preferences-dialog" aria-labelledby="preferences-title" onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false); } }}>
      <header><div><p className="eyebrow">{t('Personnalise ton carnet')}</p><h2 id="preferences-title">{t('Préférences')}</h2></div><button type="button" className="icon-btn" aria-label={t('Fermer')} onClick={() => setOpen(false)}><X size={20}/></button></header>
      <fieldset><legend>{t('Apparence')}</legend><div className="theme-options">{options.map(({ id, label, icon: Icon }) => <label key={id} className={theme === id ? 'selected' : ''}><input type="radio" name="theme" value={id} checked={theme === id} onChange={() => setTheme(id)}/><Icon size={23}/><span>{t(label)}</span>{theme === id && <Check size={13} className="theme-check" aria-hidden="true"/>}</label>)}</div><p className="muted">{t('Suit les réglages de ton appareil.')}</p></fieldset>
      <fieldset className="palette-settings"><legend><Palette size={17}/>{t('Couleurs')}</legend>
        <p className="muted">{t('Chaque apparence garde sa palette sur cet appareil.')}</p>
        <details className="palette-collection"><summary><span>{t('Plus de palettes')}</span><strong>{t(paletteNames[palettes[resolvedTheme]])}</strong></summary>
          <fieldset><legend>{t(resolvedTheme === 'light' ? 'Palette du mode clair' : 'Palette du mode sombre')}</legend>
            <div className="palette-options">{paletteIds.map(id => {
              const colors = paletteTokens(id, resolvedTheme);
              return <label key={id} className={palettes[resolvedTheme] === id ? 'selected' : ''}>
                <input type="radio" name="palette" value={id} checked={palettes[resolvedTheme] === id} onChange={() => setPalette(resolvedTheme, id)}/>
                <span className="palette-swatches" aria-hidden="true">{['--surface-alt', '--surface', '--action', '--selected-surface'].map(token => <i key={token} style={{ backgroundColor: colors[token] }}/>)}</span>
                <span>{t(paletteNames[id])}</span>{palettes[resolvedTheme] === id && <Check size={14} aria-hidden="true"/>}
              </label>;
            })}</div>
          </fieldset>
          <p className="muted">{t('Lin et vert le jour, prune et sable la nuit.')}</p>
          <button type="button" className="text-btn" onClick={resetPalettes}>{t('Réinitialiser les palettes')}</button>
        </details>
      </fieldset>
      <fieldset><legend><Languages size={17}/> {t('Langue de l’interface')}</legend><div className="language-options">{interfaceLanguages.map(({id, label}) => <label key={id} className={language === id ? 'selected' : ''}><input type="radio" name="language" value={id} checked={language === id} onChange={() => setLanguage(id)}/><span lang={id}>{label}</span>{language === id && <Check size={15} aria-hidden="true"/>}</label>)}</div><p className="muted">{t('Les documents d’origine et tes notes gardent leur langue.')}</p></fieldset>
      <fieldset><legend>{t('Afficher la mascotte')}</legend><label className="mascot-preference"><input type="checkbox" name="mascot" checked={mascot.enabled} onChange={event => mascot.setEnabled(event.target.checked)}/><span>{t('Afficher la mascotte')}</span></label><label>{t('Choisir la mascotte')}<select aria-label={t('Choisir la mascotte')} value={mascot.character} onChange={e => mascot.setCharacter(e.target.value as 'pico' | 'mochi' | 'bivouac')}><option value="pico">Pico</option><option value="mochi">Mochi</option><option value="bivouac">Bivouac</option></select></label><label className="mascot-preference"><input type="checkbox" checked={mascot.animated} onChange={e => mascot.setAnimated(e.target.checked)}/><span>{t('Animer la mascotte')}</span></label><p className="muted">{t('Déplace la mascotte avec le doigt ou la souris. Au clavier : Maj + flèches.')}</p><p className="muted">{t('Une hirondelle discrète pour les premiers pas, la relecture et le hors-ligne. Ce choix reste personnel sur cet appareil.')}</p>{mascot.error && <p role="status">{t('La mascotte suit ton choix pour cette session, mais son réglage n’a pas pu être sauvegardé. Réessaie dans Préférences.')}</p>}</fieldset>
      <fieldset><legend>{t('Installer Détours')}</legend><InstallHelp/></fieldset>
      <p className="preferences-save-note" role="status">{t(preferenceError ? 'Ces réglages restent actifs pour cette session, mais leur sauvegarde est indisponible.' : 'Ces réglages sont mémorisés sur cet appareil.')}</p>
    </dialog>}
  </>;
}
