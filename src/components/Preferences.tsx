import { useEffect, useRef, useState } from 'react';
import { Check, Languages, Monitor, Moon, SlidersHorizontal, Sun, X } from 'lucide-react';
import { useLocale } from '../i18n';
import type { Theme } from '../i18n';
import './Preferences.css';

export default function PreferencesButton() {
  const { t, theme, language, setTheme, setLanguage, preferenceError } = useLocale();
  const [open, setOpen] = useState(false);
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
      <fieldset><legend><Languages size={17}/> {t('Langue de l’interface')}</legend><div className="language-options">{(['fr', 'en'] as const).map(id => <label key={id} className={language === id ? 'selected' : ''}><input type="radio" name="language" value={id} checked={language === id} onChange={() => setLanguage(id)}/><span lang={id}>{id === 'fr' ? 'Français' : 'English'}</span>{language === id && <Check size={15} aria-hidden="true"/>}</label>)}</div><p className="muted">{t('Les documents d’origine et tes notes gardent leur langue.')}</p></fieldset>
      <p className="preferences-save-note" role="status">{t(preferenceError ? 'Ces réglages restent actifs pour cette session, mais leur sauvegarde est indisponible.' : 'Ces réglages sont mémorisés sur cet appareil.')}</p>
    </dialog>}
  </>;
}
