/** Device-local colors. Kept separate from the historical language/theme and notebook formats. */
export const PALETTES_KEY = 'detours-palettes-v1';
export type Appearance = 'light' | 'dark';
export const paletteIds = ['signature', 'porcelaine', 'eucalyptus', 'sauge', 'ocean', 'glacier', 'foret', 'bordeaux', 'corail', 'abricot', 'soleil', 'violet'] as const;
export type PaletteId = typeof paletteIds[number];
export type PalettePreferences = { version: 1; light: PaletteId; dark: PaletteId };
export const defaultPalettes: PalettePreferences = { version: 1, light: 'signature', dark: 'signature' };
export const isPaletteId = (id: unknown): id is PaletteId => typeof id === 'string' && paletteIds.some(value => value === id);
export function parsePalettes(raw: string | null): PalettePreferences {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || value.version !== 1) return { ...defaultPalettes };
    return { version: 1, light: isPaletteId(value.light) ? value.light : 'signature', dark: isPaletteId(value.dark) ? value.dark : 'signature' };
  } catch { return { ...defaultPalettes }; }
}

export const paletteNames: Record<PaletteId, string> = {
  signature: 'Signature Détours', porcelaine: 'Porcelaine', eucalyptus: 'Eucalyptus', sauge: 'Graphite & sauge',
  ocean: 'Nuit océan', glacier: 'Encre & glacier', foret: 'Forêt & jade', bordeaux: 'Bordeaux & ivoire',
  corail: 'Corail', abricot: 'Abricot & encre', soleil: 'Soleil & pétrole', violet: 'Violet origami',
};
type Seed = [background: string, surface: string, field: string, selected: string, accent: string, muted: string, border: string];
const seeds: Record<PaletteId, Record<Appearance, Seed>> = {
  signature: { light: ['#e8dfd0','#f7f2e9','#f2ebdf','#dce6d8','#3c6e59','#596459','#71806f'], dark: ['#19151b','#27222b','#302a33','#40313d','#e5c39d','#bdb0bd','#8c7e89'] },
  porcelaine: { light: ['#e9eeeb','#f8faf8','#eef3ef','#dbe9df','#31634f','#52645a','#728577'], dark: ['#161b19','#222c27','#2a352f','#33483b','#cadbcc','#aebfb3','#7b8f80'] },
  eucalyptus: { light: ['#e8dfd0','#f7f2e9','#f2ebdf','#deeadf','#41755f','#596459','#71806f'], dark: ['#17221e','#24352d','#2c4035','#375342','#b2cfbb','#b4c6ba','#82998a'] },
  sauge: { light: ['#e3e8dc','#f3f6ee','#eaf0e3','#d5e3cc','#456640','#576650','#74856c'], dark: ['#111614','#1e2722','#26312a','#324538','#b6cdb0','#a9b6a9','#7c8f7b'] },
  ocean: { light: ['#e1e9ef','#f3f7f9','#e9f0f5','#d0e4ef','#315d78','#526775','#718695'], dark: ['#182b3a','#263e50','#304b5e','#345268','#a2cdeb','#b7c7cd','#8199aa'] },
  glacier: { light: ['#e4eaf0','#f5f8fb','#ecf2f8','#d9e7f2','#365e7c','#536779','#74879a'], dark: ['#11151b','#202832','#27323e','#304458','#abcbe7','#abb7c3','#7b8e9f'] },
  foret: { light: ['#e2e9df','#f3f7f0','#e9f0e5','#d2e5d8','#2d6554','#4f6559','#6d8575'], dark: ['#132b25','#203c32','#28483d','#335849','#b1cfc0','#b0c6ba','#809d8d'] },
  bordeaux: { light: ['#efdfdf','#faf2ef','#f4e8e5','#ead3d9','#7b334c','#73565e','#9b747f'], dark: ['#2b1420','#3a2330','#452b3a','#573545','#e1b8b3','#cfb4c0','#a18290'] },
  corail: { light: ['#f0dfd3','#fcf3ec','#f5e8dd','#efcfc0','#a3432c','#775b4f','#a07c69'], dark: ['#251a17','#362622','#402e29','#54392f','#e7ac96','#c9b5aa','#a08679'] },
  abricot: { light: ['#f1d8c1','#fcf1e6','#f7e5d4','#eac8a9','#70472f','#705b4c','#9b7b62'], dark: ['#221c18','#322a22','#3c3227','#4d3b2c','#e3bd96','#c7b7a4','#9a8977'] },
  soleil: { light: ['#eae4cf','#faf6e9','#f2ecd9','#ecdfb4','#376963','#5b6555','#7a866e'], dark: ['#102a30','#193c41','#23494b','#335b55','#e7c767','#b3c6bd','#809b93'] },
  violet: { light: ['#eae0ef','#f8f2fa','#f0e6f4','#e2cfe9','#71447d','#6b5672','#92729b'], dark: ['#21182c','#30223f','#3a2b49','#4b355a','#dac0e7','#c3b2ce','#9580a6'] },
};

export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => hex.slice(1).match(/../g)!.map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
function readable(color: string, backgrounds: string[], minimum: number, dark: boolean): string {
  let rgb = color.slice(1).match(/../g)!.map(v => parseInt(v, 16));
  const hex = () => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
  for (let i = 0; i < 256 && backgrounds.some(bg => contrastRatio(hex(), bg) < minimum); i++) {
    rgb = rgb.map(v => Math.max(0, Math.min(255, v + (dark ? 1 : -1))));
  }
  return hex();
}
const rgba = (hex: string, opacity: number) => `rgba(${hex.slice(1).match(/../g)!.map(v => parseInt(v, 16)).join(', ')}, ${opacity})`;
export function paletteTokens(id: PaletteId, appearance: Appearance): Record<string, string> {
  const dark = appearance === 'dark';
  const [background, surface, field, selected, accent, muted, border] = seeds[id][appearance];
  const text = dark ? '#f0ede3' : '#253b32';
  const readableAccent = readable(accent, [background, surface, field, selected], 4.5, dark);
  const control = readable(border, [background, surface, field], 3, dark);
  const onAction = dark ? '#211c20' : '#faf6ee';
  return {
    '--surface': surface, '--surface-alt': background, '--field': field, '--surface-soft': field,
    '--text': text, '--muted': readable(muted, [background, surface, field, selected], 4.5, dark),
    '--line': rgba(border, dark ? .42 : .32), '--control-line': control,
    '--green': readableAccent, '--green-dark': readableAccent, '--selected-surface': selected,
    '--focus': readableAccent, '--action': readableAccent, '--action-hover': readableAccent,
    '--on-action': onAction, '--action-shadow': rgba(accent, .08), '--text-selection': rgba(accent, .22),
    '--glass': rgba(surface, .9), '--glass-heavy': rgba(field, .96), '--glass-chip': rgba(surface, .96),
    '--liquid': rgba(surface, .9), '--liquid-opaque': rgba(surface, .98),
    '--liquid-edge': rgba(dark ? '#ffffff' : '#faf6ee', dark ? .13 : .8),
    '--liquid-highlight': rgba(dark ? '#ffffff' : '#faf6ee', dark ? .04 : .4),
    '--header-liquid': rgba(background, .92), '--header-opaque': rgba(background, .99),
    '--brand-surface': dark ? surface : id === 'signature' ? '#e1d6c4' : field,
    '--shadow': `0 4px 24px ${rgba(dark ? '#000000' : '#253b32', .025)}`,
    '--floating-shadow': `0 16px 50px ${rgba(dark ? '#000000' : '#3b352b', dark ? .4 : .16)}`,
  };
}
export function paletteFor(preferences: PalettePreferences, appearance: Appearance) { return paletteTokens(preferences[appearance], appearance); }
