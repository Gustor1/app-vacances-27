// Scene — Hong Kong: from the Tsim Sha Tsui promenade, Victoria Harbour with the
// Star Ferry and a red-sailed junk, the island skyline (IFC, Bank of China) under
// the Peak; then a dense Kowloon street: tenements, AC units, projecting neon
// signs, and a double-decker "ding ding" tram on its overhead wire.
import { el, f } from '../lib/ink.ts';
import { pendulum } from '../lib/motion.ts';
import { line, solidShape, detail, rect, farLayer, label, ripples, loop, windowGrid } from '../kit.ts';
import { G, SCENE_PEN, DETAIL_PEN, type SceneFactory } from '../scene.ts';

const WIDTH = 960;
const HARBOUR_END = 460;

export const hongkong: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: the Peak ridge and the island skyline
  const far = farLayer(g, 0.5);
  solidShape(far, `M0 ${G - 44} Q60 ${G - 150} 150 ${G - 160} Q230 ${G - 170} 300 ${G - 130} Q380 ${G - 96} ${HARBOUR_END} ${G - 110} L${HARBOUR_END} ${G - 44} Z`, SCENE_PEN * 0.7);
  ([[30, 22, 90], [56, 18, 70], [118, 20, 84], [142, 16, 100], [250, 22, 96], [276, 18, 78], [330, 26, 70], [360, 20, 104], [384, 24, 66], [412, 18, 88]] as const).forEach(([x, w, h]) => {
    solidShape(far, rect(x, G - 44 - h, w, h), SCENE_PEN * 0.7);
    detail(far, windowGrid(x + 3, G - 40 - h, Math.floor((w - 4) / 5), Math.floor(h / 8) - 1, 2.4, 3, 2.6, 5), DETAIL_PEN * 0.6);
  });
  // IFC: the tallest, stepped crown with fins
  const ix = 190;
  solidShape(far, `M${ix - 14} ${G - 44} L${ix - 12} ${G - 200} L${ix - 8} ${G - 206} L${ix - 6} ${G - 214} L${ix + 6} ${G - 214} L${ix + 8} ${G - 206} L${ix + 12} ${G - 200} L${ix + 14} ${G - 44} Z`, SCENE_PEN * 0.8);
  detail(far, `M${ix - 12} ${G - 196} L${ix + 12} ${G - 196} M${ix} ${G - 214} L${ix} ${G - 222} M${ix - 6} ${G - 46} L${ix - 5} ${G - 196} M${ix + 6} ${G - 46} L${ix + 5} ${G - 196}`);
  // Bank of China: triangulated prisms, the X braces, two masts
  const bx = 220;
  solidShape(far, `M${bx} ${G - 44} L${bx} ${G - 140} L${bx + 12} ${G - 172} L${bx + 18} ${G - 160} L${bx + 22} ${G - 140} L${bx + 26} ${G - 44} Z`, SCENE_PEN * 0.8);
  detail(far, `M${bx} ${G - 44} L${bx + 26} ${G - 76} M${bx + 26} ${G - 44} L${bx} ${G - 76} M${bx} ${G - 76} L${bx + 26} ${G - 108} M${bx + 26} ${G - 76} L${bx} ${G - 108} M${bx} ${G - 108} L${bx + 24} ${G - 136} M${bx + 25} ${G - 108} L${bx} ${G - 136} M${bx + 12} ${G - 172} L${bx + 12} ${G - 190} M${bx + 18} ${G - 160} L${bx + 18} ${G - 176}`);
  line(far, `M0 ${G - 44} L${HARBOUR_END} ${G - 44}`, DETAIL_PEN * 1.4);

  const harbour = detail(g, '');
  const ferry = el('g', {}, g);
  solidShape(ferry, 'M-28 0 L28 0 L24 7 L-24 7 Z', SCENE_PEN * 0.8);
  solidShape(ferry, rect(-24, -8, 48, 8), SCENE_PEN * 0.8);
  solidShape(ferry, rect(-20, -15, 40, 7), SCENE_PEN * 0.8);
  detail(ferry, `${Array.from({ length: 8 }, (_, i) => `M${-20 + i * 5.6} -5 l3 0`).join(' ')} M-2 -15 l0 -5 l4 0 l0 5`);
  const junk = el('g', {}, g);
  solidShape(junk, 'M-20 0 L18 0 Q24 -3 26 -8 L-26 -6 Q-24 -1 -20 0 Z', SCENE_PEN * 0.8);
  const sails = solidShape(junk, '', SCENE_PEN * 0.8);
  const battens = detail(junk, '');
  line(junk, 'M-8 -6 L-8 -44 M10 -7 L10 -38', SCENE_PEN * 0.7);

  // promenade railing
  line(g, `M0 ${G - 16} L${HARBOUR_END} ${G - 16} M0 ${G - 11} L${HARBOUR_END} ${G - 11}`, SCENE_PEN * 0.8);
  detail(g, Array.from({ length: 16 }, (_, i) => `M${6 + i * 28} ${G - 18} L${6 + i * 28} ${G}`).join(' '), SCENE_PEN * 0.8);

  // --- Kowloon street: tenements with AC boxes and neon signs
  const street = el('g', {}, g);
  ([[HARBOUR_END + 20, 96, 196], [HARBOUR_END + 116, 84, 214], [HARBOUR_END + 200, 110, 186], [HARBOUR_END + 310, 90, 206], [HARBOUR_END + 400, 80, 176]] as const).forEach(([x, w, h], i) => {
    solidShape(street, rect(x, G - h, w, h));
    detail(street, windowGrid(x + 5, G - h + 7, Math.floor((w - 8) / 9), Math.floor((h - 40) / 10), 6, 6, 3, 4), DETAIL_PEN * 0.75);
    // AC units hanging under some windows
    detail(street, Array.from({ length: 6 }, (_, k) => { const ax = x + 8 + ((k * 29 + i * 11) % (w - 20)), ay = G - h + 22 + k * 24; return ay > G - 46 ? '' : `${rect(ax, ay, 8, 5)} M${ax + 2} ${ay + 2.5} l4 0`; }).join(' '), SCENE_PEN * 0.6);
    // shop front at street level
    solidShape(street, rect(x + 4, G - 30, w - 8, 30), SCENE_PEN * 0.8);
    detail(street, `M${x + 4} ${G - 24} L${x + w - 4} ${G - 24}`);
  });
  // projecting signs, swinging a little on their brackets
  const signs = ([[HARBOUR_END + 60, G - 150, '茶餐廳'], [HARBOUR_END + 170, G - 170, '金行'], [HARBOUR_END + 250, G - 130, '押'], [HARBOUR_END + 350, G - 160, '麵家'], [HARBOUR_END + 430, G - 120, '藥行']] as const).map(([x, y, text]) => {
    const node = el('g', {}, street);
    const h = text.length * 14 + 10;
    solidShape(node, rect(-10, 0, 20, h), SCENE_PEN * 0.9);
    detail(node, rect(-7.6, 2.6, 15.2, h - 5.2));
    label(node, 0, 15, text, 12, 'cjk', true);
    line(street, `M${x} ${y} l0 -6 l-14 0`, SCENE_PEN * 0.6);
    return { x, y, node, p: pendulum(6, 1.6) };
  });

  // tram: rails, overhead wire, the double-decker itself
  line(g, `M${HARBOUR_END} ${G - 96} L${WIDTH} ${G - 96}`, DETAIL_PEN);
  const tram = el('g', {}, g);
  solidShape(tram, 'M-40 0 L-40 -44 Q-40 -48 -36 -48 L36 -48 Q40 -48 40 -44 L40 0 Z');
  solidShape(tram, 'M-42 -48 L42 -48 L40 -52 L-40 -52 Z', SCENE_PEN * 0.8);
  detail(tram, `${windowGrid(-35, -44, 7, 1, 7, 9, 3, 0)} ${windowGrid(-35, -26, 7, 1, 7, 9, 3, 0)} M-40 -30 L40 -30 M-40 -12 L40 -12 M0 -52 L-6 -68 L18 -68`);
  label(tram, 0, -32.6, '電車', 4.4, 'cjk');
  [-26, 26].forEach(x => solidShape(tram, `M${x - 4} 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z`, SCENE_PEN * 0.8));

  line(g, `M0 ${G} L${WIDTH} ${G} M0 ${G + 10} L${WIDTH} ${G + 10}`);
  detail(g, Array.from({ length: Math.floor(WIDTH / 24) }, (_, i) => `M${i * 24 + 9} ${G} l0 10`).join(' ') + ` M${HARBOUR_END} ${G + 4} L${WIDTH} ${G + 4} M${HARBOUR_END} ${G + 7} L${WIDTH} ${G + 7}`);

  return {
    id: 'hongkong',
    width: WIDTH,
    update({ t, dt, wind }) {
      harbour.setAttribute('d', ripples(0, HARBOUR_END, G - 38, 4, 5.5, t, 6, 2));
      const fp = loop(80, 11, t, 10, HARBOUR_END - 20, 34);
      ferry.setAttribute('transform', `translate(${f(fp.x)} ${f(G - 26 + Math.sin(t * 1.4) * 0.6)})`);
      ferry.setAttribute('opacity', f(fp.alpha));
      const jp = loop(360, -6, t, 10, HARBOUR_END - 20, 34);
      junk.setAttribute('transform', `translate(${f(jp.x)} ${f(G - 22 + Math.sin(t * 1.2 + 1) * 0.7)}) scale(0.8)`);
      junk.setAttribute('opacity', f(jp.alpha * 0.85));
      const belly = 2 + wind * 2;
      sails.setAttribute('d', `M-8 -42 Q${f(-20 - belly)} -26 -22 -9 L-8 -9 Z M10 -36 Q${f(-belly)} -22 -2 -10 L10 -10 Z`);
      battens.setAttribute('d', [0, 1, 2, 3].map(k => `M-8 ${-36 + k * 7} L${f(-16 - belly * 0.6 - k * 1.2)} ${-35 + k * 7}`).join(' ') + [0, 1, 2].map(k => ` M10 ${-30 + k * 7} L${f(1 - belly * 0.5)} ${-29 + k * 7}`).join(''));
      signs.forEach(s => { const a = s.p.step(wind * 0.3 + Math.sin(t * 0.7 + s.x) * 0.1, dt); s.node.setAttribute('transform', `translate(${s.x - 14} ${s.y}) rotate(${f(a * 20)})`); });
      const tp = loop(HARBOUR_END + 40, -16, t, HARBOUR_END - 40, WIDTH + 40, 40);
      tram.setAttribute('transform', `translate(${f(tp.x)} ${G - 1})`);
      tram.setAttribute('opacity', f(tp.alpha));
    },
  };
};
