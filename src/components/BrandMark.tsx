import { useId } from 'react';
import { useLocale } from '../i18n';
import { paletteTokens } from '../palettes';
/** Decorative next to the visible Détours name; never duplicate it for screen readers. */
export default function BrandMark({ small = false }: { small?: boolean }) {
  const { resolvedTheme, palettes } = useLocale();
  const filterId = `bird-${useId()}`;
  const palette = palettes[resolvedTheme];
  const signature = palette === 'signature';
  const accent = paletteTokens(palette, resolvedTheme)['--action'].slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255);
  // Remap the existing paper folds to three shades of this palette's accent.
  // Alpha and the bird silhouette stay intact; Signature keeps its approved artwork.
  const channels = accent.map(value => [value * .42, value, value + (1 - value) * .42].join(' '));
  return <>
    {!signature && <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute', pointerEvents: 'none' }}><defs>
      <filter id={filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.6"/><feFuncG type="linear" slope="1.6" intercept="-.6"/><feFuncB type="linear" slope="1.6" intercept="-.6"/></feComponentTransfer>
        <feComponentTransfer><feFuncR type="table" tableValues={channels[0]}/><feFuncG type="table" tableValues={channels[1]}/><feFuncB type="table" tableValues={channels[2]}/></feComponentTransfer>
      </filter>
    </defs></svg>}
    <img className={small ? 'brand-symbol' : 'brand-icon'} data-logo-palette={palette} src={signature && resolvedTheme === 'light' ? '/icons/brand-128.png' : '/icons/brand-dark-128.png'} style={signature ? undefined : { filter: `url("#${filterId}")` }} width={small ? 15 : 42} height={small ? 15 : 42} alt="" aria-hidden="true"/>
  </>;
}
