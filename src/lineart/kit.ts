// Small drawing kit shared by the country scenes: one-liners for static strokes,
// signage in the right script, window grids, water and things that drift.
import { el, pen, shape, blot, f, PAPER } from './lib/ink.ts';
import { SCENE_PEN, DETAIL_PEN } from './scene.ts';

/** Static open stroke. */
export const line = (parent: Element, d: string, w = SCENE_PEN): SVGPathElement => { const n = pen(parent, w); n.setAttribute('d', d); return n; };
/** Static paper-filled outline (occludes what is behind it). */
export const solidShape = (parent: Element, d: string, w = SCENE_PEN): SVGPathElement => { const n = shape(parent, w); n.setAttribute('d', d); return n; };
/** Static ink blot. */
export const ink = (parent: Element, d: string): SVGPathElement => { const n = blot(parent); n.setAttribute('d', d); return n; };
export const detail = (parent: Element, d: string, w = DETAIL_PEN): SVGPathElement => line(parent, d, w);

export const rect = (x: number, y: number, w: number, h: number): string => `M${f(x)} ${f(y)} L${f(x + w)} ${f(y)} L${f(x + w)} ${f(y + h)} L${f(x)} ${f(y + h)} Z`;

/** Grid of small window rectangles as one detail path. */
export function windowGrid(x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, skip?: (c: number, r: number) => boolean): string {
  let d = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!skip?.(c, r)) d += rect(x + c * (w + gx), y + r * (h + gy), w, h);
  return d;
}

/** Diluted background layer (far mountains, skylines across the water). */
export const farLayer = (parent: Element, opacity = 0.5): SVGGElement => el('g', { opacity }, parent);

export type Script = 'serif' | 'sans' | 'cjk' | 'brush';
const FONTS: Record<Script, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Helvetica Neue", Arial, sans-serif',
  cjk: '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Hiragino Sans", sans-serif',
  brush: '"KaiTi", "STKaiti", "Kaiti SC", "Noto Serif SC", "SimSun", serif',
};

/** Signage. `vertical` stacks the characters (Chinese and Japanese shop signs). */
export function label(parent: Element, x: number, y: number, text: string, size: number, script: Script = 'serif', vertical = false): void {
  const attrs = { 'font-size': size, fill: 'currentColor', 'font-family': FONTS[script], 'text-anchor': 'middle' };
  if (!vertical) {
    const node = el('text', { x, y, 'letter-spacing': script === 'cjk' || script === 'brush' ? size * 0.08 : size * 0.14, ...attrs }, parent);
    node.textContent = text;
    return;
  }
  [...text].forEach((char, i) => { el('text', { x, y: y + i * size * 1.08, ...attrs }, parent).textContent = char; });
}

/** Short horizontal ripples sliding with time, for rivers, harbours and bays. */
export function ripples(x0: number, x1: number, y0: number, rows: number, gap: number, t: number, speed = 6, seed = 0): string {
  let d = '';
  const span = x1 - x0;
  for (let r = 0; r < rows; r++) {
    const len = 7 + ((r * 7 + seed) % 5) * 2, step = 26 + ((r * 11 + seed) % 4) * 6;
    const shift = ((t * speed * (r % 2 ? 1 : -0.6) + r * 13 + seed) % step + step) % step;
    for (let x = -step + shift; x < span; x += step) {
      const a = Math.max(0, x), b = Math.min(span, x + len);
      if (b > a + 1) d += `M${f(x0 + a)} ${f(y0 + r * gap)} q${f((b - a) / 2)} ${f(-0.8)} ${f(b - a)} 0`;
    }
  }
  return d;
}

/** Position of something travelling along x and wrapping inside [min, max], with an edge fade (0..1). */
export function loop(start: number, speed: number, t: number, min: number, max: number, fade = 40): { x: number; alpha: number } {
  const span = max - min;
  const x = min + ((((start - min + speed * t) % span) + span) % span);
  return { x, alpha: Math.max(0, Math.min(1, (x - min) / fade, (max - x) / fade)) };
}

/** A static seated or standing figure built from strokes (no gait), in scene units around (x, G). */
export function stillFigure(parent: Element, x: number, ground: number, opts: { sit?: number; hat?: 'conical' | 'straw' | 'none' } = {}): SVGGElement {
  const g = el('g', {}, parent);
  const sit = opts.sit ?? 0;
  const hip = ground - (sit ? 13 : 26);
  const shoulder = hip - 20;
  solidShape(g, `M${x - 4} ${shoulder} Q${x + 1} ${shoulder - 3} ${x + 6} ${shoulder} L${x + 7} ${hip + 2} L${x - 5} ${hip + 2} Z`);
  if (sit) line(g, `M${x + 3} ${hip + 1} L${x + 13} ${hip + 2} L${x + 14} ${ground - 1}`, SCENE_PEN * 1.6);
  else line(g, `M${x - 1} ${hip + 2} L${x - 2} ${ground - 1} M${x + 3} ${hip + 2} L${x + 4} ${ground - 1}`, SCENE_PEN * 1.6);
  el('ellipse', { cx: x + 1.6, cy: shoulder - 5.4, rx: 2.4, ry: 3, fill: PAPER, stroke: 'currentColor', 'stroke-width': SCENE_PEN }, g);
  if (opts.hat === 'conical') solidShape(g, `M${x - 6} ${shoulder - 6} L${x + 1.6} ${shoulder - 13} L${x + 9.2} ${shoulder - 6} Z`, SCENE_PEN * 0.9);
  if (opts.hat === 'straw') solidShape(g, `M${x - 5} ${shoulder - 7} L${x + 8} ${shoulder - 7} L${x + 5} ${shoulder - 9} L${x - 2} ${shoulder - 9} Z`, SCENE_PEN * 0.9);
  return g;
}
