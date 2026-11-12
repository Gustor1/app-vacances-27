// Scene — China, the long one (about 3.5× a usual country), in five stretches:
//  1. Shanghai, the Bund: promenade railing, the Huangpu and the Pudong skyline
//     (Oriental Pearl Tower, Jin Mao, SWFC, Shanghai Tower), a ferry crossing.
//  2. A shikumen lane: stone-gated houses, red lanterns, a baozi stall steaming,
//     an elder doing tai-chi under a plane tree.
//  3. Shanghai University, Baoshan campus (stylised): the gate inscribed 上海大学,
//     a lake with an arched bridge and willows, students cycling past.
//  4. Guilin / Yangshuo: karst peaks over the Li River, a bamboo raft with a
//     cormorant fisherman, bamboo on the bank.
//  5. Zhangjiajie: sandstone pillars crowned with pines, mist drifting between them.
import { el, f, place } from '../lib/ink.ts';
import { pendulum, seeded } from '../lib/motion.ts';
import { createPedestrian, pedestrianGait } from '../pedestrian.ts';
import { createCyclist } from '../cyclist.ts';
import { line, solidShape, ink, detail, rect, farLayer, label, ripples, loop, stillFigure } from '../kit.ts';
import { G, S, SCENE_PEN, DETAIL_PEN, type SceneFactory } from '../scene.ts';

const WIDTH = 2800;
const BUND = 0, LANE = 800, CAMPUS = 1360, GUILIN = 1980, ZJJ = 2400;

/** Ground with paving only where the stretch is paved. */
function chinaGround(g: Element) {
  line(g, `M0 ${G} L${WIDTH} ${G} M0 ${G + 10} L${WIDTH} ${G + 10}`);
  const paving = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) }, (_, i) => `M${from + i * step + 9} ${G} l0 10`).join(' ');
  detail(g, paving(BUND, LANE, 30) + paving(LANE, CAMPUS, 22) + paving(CAMPUS, GUILIN, 28));
  detail(g, Array.from({ length: 40 }, (_, i) => { const x = GUILIN + 10 + i * 20 + (i % 3) * 4; return `M${x} ${G} q1 -4 3 -6 M${x + 3} ${G} q0 -5 -1 -7`; }).join(' '));
}

/** A Guilin karst peak: steep, slightly concave flanks rising to a narrow, leaning, rounded summit. */
function karst(x: number, base: number, w: number, h: number, k = 0, shoulder = 0): string {
  const top = base - h, c = x + w * (0.5 + k);
  const right = shoulder
    ? ` C${f(c + w * 0.16)} ${f(top + h * 0.3)} ${f(c + w * 0.2)} ${f(top + h * 0.42)} ${f(c + w * 0.34)} ${f(top + h * 0.5)} C${f(x + w * 0.96)} ${f(top + h * 0.56)} ${f(x + w * 0.98)} ${f(base - h * 0.2)} ${x + w} ${base}`
    : ` C${f(c + w * 0.18)} ${f(top + h * 0.3)} ${f(x + w * 0.88)} ${f(base - h * 0.3)} ${x + w} ${base}`;
  return `M${x} ${base} C${f(x + w * 0.14)} ${f(base - h * 0.3)} ${f(c - w * 0.22)} ${f(top + h * 0.22)} ${f(c - w * 0.1)} ${f(top + 2)} Q${f(c)} ${f(top - 3)} ${f(c + w * 0.1)} ${f(top + 3)}${right} Z`;
}

function pine(parent: Element, x: number, y: number, s = 1) {
  line(parent, `M${x} ${y} L${x} ${f(y - 14 * s)}`, SCENE_PEN * 0.7);
  detail(parent, [0, 1, 2].map(k => `M${f(x - (9 - k * 2.6) * s)} ${f(y - (4 + k * 4) * s)} q${f((9 - k * 2.6) * s)} ${f(-2.4 * s)} ${f((18 - k * 5.2) * s)} 0`).join(' '), SCENE_PEN * 0.6);
}

function pillar(parent: Element, x: number, w: number, top: number, seed: number) {
  const r = seeded(seed);
  const left = Array.from({ length: 6 }, (_, i) => `L${f(x + r(-2, 3))} ${f(G - 20 - ((G - 20 - top) * (i + 1)) / 6)}`).join(' ');
  const right = Array.from({ length: 6 }, (_, i) => `L${f(x + w + r(-3, 2))} ${f(top + ((G - 20 - top) * (i + 1)) / 6)}`).join(' ');
  solidShape(parent, `M${x} ${G - 20} ${left} Q${f(x + w / 2)} ${f(top - 6)} ${x + w} ${top} ${right} Z`, SCENE_PEN * 0.8);
  detail(parent, Array.from({ length: Math.floor((G - 30 - top) / 14) }, (_, i) => `M${f(x + r(2, 6))} ${f(top + 12 + i * 14)} l${f(r(4, w - 8))} ${f(r(-1, 1))}`).join(' '));
  for (let k = 0; k < Math.max(1, Math.floor(w / 12)); k++) pine(parent, x + 5 + k * 10 + r(0, 3), top + 1, r(0.7, 1.1));
}

export const chine: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // ============ 1. The Bund and the Pudong skyline ============
  const pudong = farLayer(g, 0.55);
  line(pudong, `M${BUND} ${G - 44} L${LANE} ${G - 44}`, DETAIL_PEN * 1.4);
  // generic towers first so the landmarks overlap them
  ([[250, 26, 96], [282, 22, 120], [312, 30, 84], [346, 20, 132], [600, 28, 118], [634, 24, 90], [664, 32, 140], [704, 22, 100], [734, 30, 76], [140, 26, 70], [104, 30, 88]] as const).forEach(([x, w, h]) => {
    solidShape(pudong, rect(x, G - 44 - h, w, h), SCENE_PEN * 0.7);
    detail(pudong, Array.from({ length: Math.floor(h / 9) }, (_, i) => `M${x + 3} ${G - 50 - i * 9} l${w - 6} 0`).join(' '), DETAIL_PEN * 0.8);
  });
  // Oriental Pearl Tower
  const ox = 210;
  line(pudong, `M${ox - 24} ${G - 44} L${ox - 7} ${G - 98} M${ox + 24} ${G - 44} L${ox + 7} ${G - 98} M${ox - 4} ${G - 44} L${ox - 4} ${G - 160} M${ox + 4} ${G - 44} L${ox + 4} ${G - 160} M${ox - 2} ${G - 176} L${ox - 2} ${G - 196} M${ox + 2} ${G - 176} L${ox + 2} ${G - 196} M${ox} ${G - 200} L${ox} ${G - 232}`, SCENE_PEN * 0.8);
  solidShape(pudong, `M${ox - 16} ${G - 112} a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z`, SCENE_PEN * 0.8);
  solidShape(pudong, `M${ox - 10} ${G - 168} a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z`, SCENE_PEN * 0.8);
  solidShape(pudong, `M${ox - 4} ${G - 199} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z`, SCENE_PEN * 0.7);
  [[ox - 15, G - 64], [ox + 15, G - 64]].forEach(([x, y]) => solidShape(pudong, `M${x - 5} ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z`, SCENE_PEN * 0.6));
  detail(pudong, `M${ox - 15} ${G - 116} L${ox + 15} ${G - 116} M${ox - 9} ${G - 170} L${ox + 9} ${G - 170}`);
  // Jin Mao: stepped like a pagoda
  const jx = 410;
  const tiers = Array.from({ length: 10 }, (_, k) => [G - 44 - k * 15, 17 - k * 1.3] as const);
  solidShape(pudong, `M${jx - 17} ${G - 44} ${tiers.map(([y, hw]) => `L${f(jx - hw)} ${f(y - 15)} L${f(jx - hw + 1.3)} ${f(y - 15)}`).join(' ')} L${jx - 3} ${G - 204} L${jx + 3} ${G - 204} ${[...tiers].reverse().map(([y, hw]) => `L${f(jx + hw - 1.3)} ${f(y - 15)} L${f(jx + hw)} ${f(y)}`).join(' ')} Z`, SCENE_PEN * 0.8);
  detail(pudong, tiers.map(([y, hw]) => `M${f(jx - hw)} ${f(y - 15)} L${f(jx + hw)} ${f(y - 15)}`).join(' ') + ` M${jx} ${G - 204} L${jx} ${G - 222}`);
  // Shanghai World Financial Center: the "bottle opener"
  const wx = 470;
  solidShape(pudong, `M${wx - 16} ${G - 44} L${wx - 9} ${G - 222} L${wx + 9} ${G - 226} L${wx + 16} ${G - 44} Z`, SCENE_PEN * 0.8);
  solidShape(pudong, `M${wx - 6} ${G - 214} L${wx + 6} ${G - 216} L${wx + 7} ${G - 204} L${wx - 7} ${G - 202} Z`, SCENE_PEN * 0.6);
  detail(pudong, `M${wx} ${G - 46} L${wx} ${G - 200} M${wx - 13} ${G - 80} L${wx - 1} ${G - 210}`);
  // Shanghai Tower: twisting, tallest
  const sx = 540;
  solidShape(pudong, `M${sx - 22} ${G - 44} C${sx - 24} ${G - 120} ${sx - 14} ${G - 200} ${sx - 7} ${G - 252} L${sx + 6} ${G - 258} C${sx + 12} ${G - 210} ${sx + 24} ${G - 130} ${sx + 22} ${G - 44} Z`, SCENE_PEN * 0.8);
  detail(pudong, `M${sx - 18} ${G - 60} C${sx - 4} ${G - 100} ${sx + 18} ${G - 120} ${sx + 14} ${G - 160} C${sx + 10} ${G - 190} ${sx - 8} ${G - 214} ${sx - 4} ${G - 246}` + Array.from({ length: 9 }, (_, i) => ` M${sx - 20 + i * 1.4} ${G - 70 - i * 20} l${f(36 - i * 3.2)} -2`).join(''));

  const river = detail(g, '');
  const ferry = el('g', {}, g);
  solidShape(ferry, 'M-22 0 L22 0 L18 6 L-18 6 Z', SCENE_PEN * 0.8);
  solidShape(ferry, rect(-14, -7, 26, 7), SCENE_PEN * 0.7);
  detail(ferry, 'M-11 -4 l4 0 M-4 -4 l4 0 M3 -4 l4 0 M6 -7 l0 -5 l4 0');
  // promenade railing and two Bund lamp posts
  line(g, `M${BUND} ${G - 16} L${LANE - 20} ${G - 16} M${BUND} ${G - 11} L${LANE - 20} ${G - 11}`, SCENE_PEN * 0.8);
  detail(g, Array.from({ length: 26 }, (_, i) => `M${BUND + 6 + i * 30} ${G - 18} L${BUND + 6 + i * 30} ${G}`).join(' '), SCENE_PEN * 0.8);
  [90, 620].forEach(x => {
    line(g, `M${x} ${G} L${x} ${G - 70} M${x - 5} ${G} L${x + 5} ${G} M${x} ${G - 62} q-10 -2 -12 -8 M${x} ${G - 62} q10 -2 12 -8`);
    [[x - 12, G - 70], [x + 12, G - 70], [x, G - 76]].forEach(([lx, ly]) => solidShape(g, `M${lx - 3} ${ly} Q${lx} ${ly - 7} ${lx + 3} ${ly} Q${lx} ${ly + 3} ${lx - 3} ${ly} Z`, SCENE_PEN * 0.7));
  });

  // ============ 2. Shikumen lane ============
  const lane = el('g', {}, g);
  const house = (x: number, w: number) => {
    solidShape(lane, rect(x, G - 112, w, 112));
    solidShape(lane, `M${x - 4} ${G - 112} L${x + w + 4} ${G - 112} L${x + w - 10} ${G - 128} L${x + 10} ${G - 128} Z`);
    detail(lane, Array.from({ length: Math.floor(w / 5) }, (_, k) => `M${x + 2 + k * 5} ${G - 113} l2 -14`).join(' '));
    // brick coursing on the lower wall
    detail(lane, Array.from({ length: 10 }, (_, r) => `M${x + 2} ${G - 6 - r * 6} L${x + w - 2} ${G - 6 - r * 6}`).join(' '), DETAIL_PEN * 0.6);
    // the stone gate: pilasters, a carved pediment, black double door with rings
    const gx = x + w / 2 - 16;
    solidShape(lane, rect(gx - 6, G - 62, 44, 62));
    solidShape(lane, `M${gx - 10} ${G - 62} L${gx + 42} ${G - 62} L${gx + 42} ${G - 68} Q${gx + 16} ${G - 84} ${gx - 10} ${G - 68} Z`);
    detail(lane, `M${gx - 2} ${G - 69} Q${gx + 16} ${G - 80} ${gx + 34} ${G - 69} M${gx + 8} ${G - 70} q8 -6 16 0`);
    // lacquered double door: two leaves with sunk panels and ring knockers
    solidShape(lane, rect(gx, G - 54, 32, 54));
    detail(lane, `M${gx + 16} ${G - 54} L${gx + 16} ${G} ${rect(gx + 3, G - 50, 10, 20)} ${rect(gx + 19, G - 50, 10, 20)} ${rect(gx + 3, G - 26, 10, 22)} ${rect(gx + 19, G - 26, 10, 22)} M${gx + 12} ${G - 30} a1.8 1.8 0 1 0 0.1 0 M${gx + 20} ${G - 30} a1.8 1.8 0 1 0 0.1 0`, SCENE_PEN * 0.6);
    // upper floor window
    solidShape(lane, rect(x + w / 2 - 14, G - 104, 28, 24), SCENE_PEN * 0.8);
    detail(lane, `M${x + w / 2} ${G - 104} l0 24 M${x + w / 2 - 14} ${G - 92} l28 0`);
  };
  house(LANE + 20, 110); house(LANE + 250, 110); house(LANE + 370, 110);
  // lilong archway with a name plaque
  const ax = LANE + 140;
  solidShape(lane, `M${ax} ${G} L${ax} ${G - 96} L${ax + 100} ${G - 96} L${ax + 100} ${G} L${ax + 80} ${G} L${ax + 80} ${G - 60} Q${ax + 50} ${G - 86} ${ax + 20} ${G - 60} L${ax + 20} ${G} Z`);
  solidShape(lane, rect(ax + 30, G - 94, 40, 14), SCENE_PEN * 0.8);
  label(lane, ax + 50, G - 83.4, '福寿里', 9, 'brush');
  // plane tree (the French Concession streets) and the tai-chi elder
  const ptx = LANE + 220;
  solidShape(lane, `M${ptx - 3} ${G} Q${ptx - 2} ${G - 50} ${ptx - 2} ${G - 92} L${ptx + 3} ${G - 92} Q${ptx + 2} ${G - 50} ${ptx + 4} ${G} Z`);
  const planeCrown = solidShape(lane, '');
  const elder = LANE + 236;
  stillFigure(lane, elder, G);
  const taichi = line(lane, '', SCENE_PEN * 1.5);
  // baozi stall: steamer baskets and steam
  const bx = LANE + 500;
  solidShape(lane, rect(bx - 20, G - 26, 50, 26));
  stillFigure(lane, bx + 22, G - 0);
  [0, 1, 2].forEach(k => solidShape(lane, `M${bx - 14} ${G - 26 - k * 7} L${bx + 10} ${G - 26 - k * 7} L${bx + 10} ${G - 32 - k * 7} L${bx - 14} ${G - 32 - k * 7} Z`, SCENE_PEN * 0.8));
  solidShape(lane, `M${bx - 14} ${G - 47} Q${bx - 2} ${G - 54} ${bx + 10} ${G - 47} Z`, SCENE_PEN * 0.8);
  label(lane, bx + 5, G - 10, '包子', 6, 'brush');
  const steam = detail(lane, '');
  const lanterns = [LANE + 30, LANE + 120, LANE + 262, LANE + 470].map(x => ({ x, p: pendulum(8, 1.3), node: el('g', {}, lane) }));
  lanterns.forEach(l => {
    solidShape(l.node, 'M-6 3 Q-8 9 -6 15 L6 15 Q8 9 6 3 Z', SCENE_PEN * 0.8);
    detail(l.node, 'M-4 3 L4 3 M-4 15 L4 15 M0 -2 L0 3 M0 15 L0 20 M-1.4 9 a1.4 1.4 0 1 0 2.8 0');
  });

  // ============ 3. Shanghai University, Baoshan campus (stylised) ============
  const campus = farLayer(g, 0.6);
  line(campus, `M${CAMPUS + 200} ${G - 40} L${GUILIN - 40} ${G - 40}`, DETAIL_PEN * 1.4);
  solidShape(campus, rect(CAMPUS + 230, G - 128, 180, 88), SCENE_PEN * 0.8);
  detail(campus, `${Array.from({ length: 8 }, (_, r) => `M${CAMPUS + 236} ${G - 120 + r * 10} L${CAMPUS + 404} ${G - 120 + r * 10}`).join(' ')} ${Array.from({ length: 12 }, (_, c) => `M${CAMPUS + 244 + c * 14} ${G - 124} L${CAMPUS + 244 + c * 14} ${G - 44}`).join(' ')}`, DETAIL_PEN * 0.7);
  const ct = CAMPUS + 450;
  solidShape(campus, rect(ct - 13, G - 176, 26, 136), SCENE_PEN * 0.8);
  solidShape(campus, `M${ct - 17} ${G - 176} L${ct + 17} ${G - 176} L${ct} ${G - 200} Z`, SCENE_PEN * 0.8);
  solidShape(campus, `M${ct - 9} ${G - 160} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z`, SCENE_PEN * 0.7);
  const hands = line(campus, '', SCENE_PEN * 0.7);
  detail(campus, Array.from({ length: 8 }, (_, r) => `M${ct - 8} ${G - 140 + r * 12} l16 0`).join(' '));
  solidShape(campus, rect(CAMPUS + 490, G - 96, 110, 56), SCENE_PEN * 0.8);
  detail(campus, Array.from({ length: 4 }, (_, r) => `M${CAMPUS + 496} ${G - 86 + r * 12} L${CAMPUS + 594} ${G - 86 + r * 12}`).join(' '), DETAIL_PEN * 0.7);
  // the lake with an arched stone bridge
  const lake = detail(g, '');
  const bridge = CAMPUS + 480;
  solidShape(g, `M${bridge} ${G - 22} Q${bridge + 40} ${G - 52} ${bridge + 80} ${G - 22} L${bridge + 74} ${G - 22} Q${bridge + 40} ${G - 44} ${bridge + 6} ${G - 22} Z`, SCENE_PEN * 0.8);
  detail(g, `M${bridge + 14} ${G - 22} Q${bridge + 40} ${G - 4} ${bridge + 66} ${G - 22} M${bridge + 4} ${G - 26} Q${bridge + 40} ${G - 56} ${bridge + 76} ${G - 26}` + Array.from({ length: 7 }, (_, i) => ` M${bridge + 10 + i * 10} ${f(G - 28 - Math.sin((Math.PI * (i + 0.5)) / 7) * 22)} l0 -5`).join(''));
  const willows = [CAMPUS + 220, CAMPUS + 600].map(x => {
    line(g, `M${x - 3} ${G} Q${x - 4} ${G - 40} ${x} ${G - 80} M${x + 3} ${G} Q${x + 2} ${G - 40} ${x + 4} ${G - 80} M${x + 1} ${G - 60} q-14 -8 -20 -20 M${x + 2} ${G - 66} q14 -6 22 -18`);
    return { x, node: detail(g, '', DETAIL_PEN * 1.2) };
  });
  // the gate, on our side of the lake
  const gate = CAMPUS + 40;
  solidShape(g, rect(gate, G - 74, 18, 74));
  solidShape(g, rect(gate + 150, G - 74, 18, 74));
  solidShape(g, rect(gate - 10, G - 92, 188, 18));
  solidShape(g, rect(gate - 14, G - 96, 196, 4), SCENE_PEN * 0.8);
  label(g, gate + 84, G - 78.6, '上海大学', 12, 'brush');
  detail(g, `M${gate + 4} ${G - 70} l0 66 M${gate + 14} ${G - 70} l0 66 M${gate + 154} ${G - 70} l0 66 M${gate + 164} ${G - 70} l0 66`);
  // low hedge and a bench
  detail(g, Array.from({ length: 14 }, (_, i) => `M${CAMPUS + 230 + i * 10} ${G - 6} q5 -6 10 0`).join(' '), SCENE_PEN * 0.6);
  const cyclists = [
    { c: createCyclist(g, { bag: true }), speed: 52, start: CAMPUS + 20, dir: 1 as const },
    { c: createCyclist(g, { basket: true }), speed: 44, start: CAMPUS + 560, dir: -1 as const },
  ];
  const student = createPedestrian(g, { hat: 'none' });

  // ============ 4. Guilin / Yangshuo ============
  const peaksFar = farLayer(g, 0.35);
  const rf = seeded(5);
  for (let x = GUILIN - 20; x < ZJJ + 40; x += rf(30, 50)) solidShape(peaksFar, karst(x, G - 40, rf(30, 52), rf(80, 170), rf(-0.12, 0.14), rf() > 0.6 ? 1 : 0), SCENE_PEN * 0.7);
  const peaksNear = farLayer(g, 0.6);
  for (let x = GUILIN + 10; x < ZJJ; x += rf(60, 90)) {
    const w = rf(44, 70), h = rf(70, 140);
    solidShape(peaksNear, karst(x, G - 36, w, h, rf(-0.14, 0.12), rf() > 0.5 ? 1 : 0), SCENE_PEN * 0.8);
    detail(peaksNear, `M${f(x + w * 0.3)} ${f(G - 36 - h * 0.7)} q4 6 2 14 M${f(x + w * 0.62)} ${f(G - 36 - h * 0.55)} q-3 8 0 16`);
  }
  const liRiver = detail(g, '');
  const raft = el('g', {}, g);
  solidShape(raft, 'M-30 0 L22 0 Q30 -1 34 -7 L34 -4 Q30 3 22 4 L-30 4 Z', SCENE_PEN * 0.8);
  detail(raft, 'M-28 1.4 L26 1.4 M-28 2.8 L24 2.8');
  stillFigure(raft, -6, 0, { hat: 'straw' });
  line(raft, 'M-2 -30 L28 -54', SCENE_PEN * 0.7);
  [[14, -42], [22, -48]].forEach(([x, y]) => ink(raft, `M${x} ${y} q3 -5 6 -2 l2 -1 l-1 2 q-1 4 -6 3 Z M${x + 1} ${y + 1} l-2 4`));
  solidShape(raft, 'M-20 -14 L-16 -14 L-15 -8 L-21 -8 Z', SCENE_PEN * 0.6);
  // bamboo on the bank
  const bamboo = [GUILIN + 340, GUILIN + 352, GUILIN + 361, GUILIN + 372].map((x, i) => ({ x, h: 90 + i * 9, node: line(g, '', SCENE_PEN * 0.8), leaves: detail(g, '', SCENE_PEN * 0.6) }));

  // ============ 5. Zhangjiajie ============
  const zFar = farLayer(g, 0.38);
  [[ZJJ + 10, 22, 70], [ZJJ + 60, 18, 40], [ZJJ + 120, 26, 56], [ZJJ + 210, 20, 30], [ZJJ + 300, 24, 64], [ZJJ + 360, 18, 44]].forEach(([x, w, top], i) => pillar(zFar, x, w, top, 30 + i));
  const zMid = farLayer(g, 0.72);
  [[ZJJ + 30, 34, 70], [ZJJ + 150, 42, 46], [ZJJ + 250, 30, 90], [ZJJ + 330, 38, 60]].forEach(([x, w, top], i) => pillar(zMid, x, w, top, 50 + i));
  const mist = [0, 1, 2].map(() => solidShape(g, '', DETAIL_PEN * 1.2));
  const eagle = line(g, '', SCENE_PEN * 0.8);
  // stone railing of the mountain path
  line(g, `M${ZJJ} ${G - 14} L${WIDTH} ${G - 14}`, SCENE_PEN * 0.8);
  detail(g, Array.from({ length: 16 }, (_, i) => `M${ZJJ + 10 + i * 26} ${G - 16} L${ZJJ + 10 + i * 26} ${G}`).join(' '), SCENE_PEN * 0.9);

  chinaGround(g);
  const walkSpeed = pedestrianGait.speed * S;

  return {
    id: 'chine',
    width: WIDTH,
    update({ t, dt, wind }) {
      // 1. river and ferry
      river.setAttribute('d', ripples(BUND, LANE - 20, G - 38, 4, 5.5, t, 5));
      const fp = loop(BUND + 100, 9, t, BUND + 20, LANE - 40, 30);
      ferry.setAttribute('transform', `translate(${f(fp.x)} ${f(G - 26 + Math.sin(t * 1.6) * 0.5)})`);
      ferry.setAttribute('opacity', f(fp.alpha * 0.8));

      // 2. lane
      const b = Math.sin(t * 0.8) * 1.6 + wind * 2;
      planeCrown.setAttribute('d', `M${ptx - 4} ${G - 86} Q${f(ptx - 42 + b * 0.5)} ${G - 86} ${f(ptx - 36 + b * 0.7)} ${G - 116} Q${f(ptx - 30 + b)} ${G - 148} ${f(ptx + b)} ${G - 146} Q${f(ptx + 36 + b)} ${G - 146} ${f(ptx + 38 + b * 0.7)} ${G - 114} Q${f(ptx + 40 + b * 0.5)} ${G - 88} ${ptx + 4} ${G - 86} Z`);
      const a = t * 0.6, hx = elder + 1.6, hy = G - 44;
      taichi.setAttribute('d', `M${hx} ${hy} Q${f(hx + 8 * Math.cos(a))} ${f(hy + 2)} ${f(hx + 11 * Math.cos(a))} ${f(hy - 6 - 6 * Math.sin(a))} M${hx} ${hy} Q${f(hx - 6 * Math.cos(a + 1))} ${f(hy + 4)} ${f(hx - 10 * Math.cos(a + 1.2))} ${f(hy + 4 - 7 * Math.sin(a + 1.2))}`);
      steam.setAttribute('d', [0, 1, 2].map(k => { const u = ((t * 0.5 + k / 3) % 1), y = G - 54 - u * 26, x = bx - 8 + k * 7 + Math.sin(t * 2 + k) * 2; return u > 0.92 ? '' : `M${f(x)} ${f(y)} q3 -4 0 -8 q-3 -4 0 -8`; }).join(' '));
      lanterns.forEach((l, i) => { const ang = l.p.step(wind * 0.4 + Math.sin(t + i) * 0.12, dt); l.node.setAttribute('transform', `translate(${l.x} ${G - 108}) rotate(${f(ang * 57.3)})`); });

      // 3. campus
      hands.setAttribute('d', `M${ct} ${G - 160} l${f(6 * Math.sin(t * 0.05))} ${f(-6 * Math.cos(t * 0.05))} M${ct} ${G - 160} l${f(4 * Math.sin(t * 0.004 + 2))} ${f(-4 * Math.cos(t * 0.004 + 2))}`);
      lake.setAttribute('d', ripples(CAMPUS + 200, GUILIN - 40, G - 36, 3, 6, t, 3, 4));
      willows.forEach(({ x, node }, i) => {
        const sw = Math.sin(t * 0.9 + i) * 2 + wind * 3;
        node.setAttribute('d', Array.from({ length: 9 }, (_, k) => { const sx0 = x - 22 + k * 5.5, len = 34 + (k % 3) * 8; return `M${sx0} ${G - 92 + Math.abs(k - 4) * 3} q${f(sw * 0.4)} ${f(len / 2)} ${f(sw)} ${len}`; }).join(' '));
      });
      cyclists.forEach(({ c, speed, start, dir }) => {
        const p = loop(start, dir * speed, t, CAMPUS - 20, GUILIN - 20, 50);
        place(c.g, p.x, G, dir, S);
        c.g.setAttribute('opacity', f(p.alpha));
        c.draw((speed * dt) / S, t);
      });
      const sp = loop(CAMPUS + 300, walkSpeed, t, CAMPUS, GUILIN - 40, 40);
      place(student.g, sp.x, G, 1, S); student.g.setAttribute('opacity', f(sp.alpha)); student.draw(dt);

      // 4. Li River and the raft
      liRiver.setAttribute('d', ripples(GUILIN - 20, ZJJ, G - 34, 4, 5.5, t, 4, 9));
      const rp = loop(ZJJ - 60, -7, t, GUILIN + 20, ZJJ - 20, 30);
      raft.setAttribute('transform', `translate(${f(rp.x)} ${f(G - 21 + Math.sin(t * 1.3) * 0.6)}) rotate(${f(Math.sin(t * 1.1) * 0.8)})`);
      raft.setAttribute('opacity', f(rp.alpha));
      bamboo.forEach(({ x, h, node, leaves }, i) => {
        const sw = Math.sin(t * 0.9 + i * 0.7) * 2.5 + wind * 4;
        node.setAttribute('d', `M${x} ${G} Q${f(x + sw * 0.3)} ${G - h / 2} ${f(x + sw)} ${G - h} ${[0.3, 0.5, 0.7].map(u => `M${f(x + sw * u * u - 1.5)} ${f(G - h * u)} l3 0`).join(' ')}`);
        leaves.setAttribute('d', [0.6, 0.75, 0.9].map((u, k) => { const px = x + sw * u * u, py = G - h * u; return `M${f(px)} ${f(py)} q${k % 2 ? 6 : -6} 1 ${k % 2 ? 11 : -11} 5 M${f(px)} ${f(py)} q${k % 2 ? -5 : 5} 2 ${k % 2 ? -9 : 9} 7`; }).join(' '));
      });

      // 5. Zhangjiajie mist and eagle
      mist.forEach((node, i) => {
        const y = G - 70 + i * 16, x = ZJJ - 60 + (((t * (5 + i * 2) + i * 140) % 520) + 520) % 520;
        node.setAttribute('d', `M${f(x)} ${y} q10 -9 22 -3 q8 -9 22 -4 q14 -6 22 2 q12 0 14 7 L${f(x - 4)} ${y + 2} Z`);
      });
      const ea = t * 0.35, ex = ZJJ + 200 + Math.cos(ea) * 70, ey = G - 170 + Math.sin(ea) * 18, flap = Math.sin(t * 3) * 1.6;
      eagle.setAttribute('d', `M${f(ex - 9)} ${f(ey - 2 + flap)} Q${f(ex - 4)} ${f(ey - 4)} ${f(ex)} ${f(ey)} Q${f(ex + 4)} ${f(ey - 4)} ${f(ex + 9)} ${f(ey - 2 + flap)}`);
    },
  };
};
