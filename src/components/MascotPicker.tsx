import { useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useMascotPreferences } from '../MascotPreferences';
import { useLocale } from '../i18n';
import { paletteTokens } from '../palettes';
import { createSprite, type Character } from '../mascots/sprites';

const characters = { pico: 'Pico', mochi: 'Mochi', bivouac: 'Bivouac' } as const;

function Preview({ character, accent }: { character: Character; accent: string }) {
  const mount = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!mount.current) return;
    const sprite = createSprite(mount.current, { character, accent, animated: false });
    return () => sprite.destroy();
  }, [character, accent]);
  return <span ref={mount} className="mascot-picker-preview" aria-hidden="true"/>;
}

export default function MascotPicker() {
  const { character, setCharacter } = useMascotPreferences();
  const { t, palettes, resolvedTheme } = useLocale();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const accent = paletteTokens(palettes[resolvedTheme], resolvedTheme)['--action'];
  return <details className="mascot-picker" ref={details} onKeyDown={event => {
    if (event.key === 'Escape' && details.current?.open) {
      event.preventDefault(); event.stopPropagation();
      details.current.open = false; summary.current?.focus();
    }
  }}>
    <summary ref={summary}>
      <Preview character={character} accent={accent}/>
      <span><span className="mascot-picker-label">{t('Choisir la mascotte')}</span><strong>{characters[character]}</strong></span>
      <ChevronDown size={18} aria-hidden="true"/>
    </summary>
    <div className="mascot-picker-options" role="group" aria-label={t('Choisir la mascotte')}>
      {Object.entries(characters).map(([id, name]) => <button key={id} type="button" aria-pressed={character === id} onClick={() => {
        setCharacter(id as Character);
        if (details.current) details.current.open = false;
        summary.current?.focus();
      }}>
        <Preview character={id as Character} accent={accent}/><span>{name}</span>
        {character === id && <Check size={18} aria-hidden="true"/>}
      </button>)}
    </div>
  </details>;
}
