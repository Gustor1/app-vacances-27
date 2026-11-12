// Scene — Italy: the Colosseum with its broken upper ring, umbrella pines, then a
// Roman lane: ochre houses with shutters, laundry across the street, a gelateria,
// a parked Vespa and a nasone fountain running.
import { el, f } from '../lib/ink.ts';
import { pendulum } from '../lib/motion.ts';
import { line, solidShape, ink, detail, rect, farLayer, label } from '../kit.ts';
import { G, SCENE_PEN, DETAIL_PEN, ground, type SceneFactory } from '../scene.ts';

const WIDTH = 800;

function umbrellaPine(parent: Element, x: number, h: number) {
  line(parent, `M${x - 2} ${G} Q${x - 4} ${G - h * 0.6} ${x + 4} ${G - h + 8} M${x + 2} ${G} Q${x} ${G - h * 0.6} ${x + 7} ${G - h + 8}`);
  return solidShape(parent, '');
}

export const italie: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: the Colosseum, three arcades and the attic, broken down on the right
  const far = farLayer(g, 0.5);
  const cx = 70, cw = 210, top = G - 118;
  solidShape(far, `M${cx} ${G} L${cx} ${top} Q${cx + 60} ${top - 6} ${cx + 120} ${top - 4} L${cx + 140} ${top + 14} L${cx + 165} ${top + 30} L${cx + 185} ${top + 56} L${cx + cw} ${top + 62} L${cx + cw} ${G} Z`, SCENE_PEN * 0.8);
  const tiers = [[G - 6, 26, 15], [G - 40, 26, 15], [G - 74, 22, 15]];
  detail(far, tiers.map(([base, h, n], k) => Array.from({ length: n }, (_, i) => {
    const x = cx + 6 + i * 13.6, limit = k === 0 ? cw : k === 1 ? 182 : 160;
    return x + 10 > cx + limit ? '' : `M${x} ${base} L${x} ${base - h + 6} Q${x + 5} ${base - h} ${x + 10} ${base - h + 6} L${x + 10} ${base}`;
  }).join(' ')).join(' ') + ` M${cx} ${G - 36} L${cx + cw} ${G - 36} M${cx} ${G - 70} L${cx + 186} ${G - 70} M${cx} ${G - 102} L${cx + 150} ${G - 102}` + Array.from({ length: 10 }, (_, i) => ` M${cx + 8 + i * 14} ${top + 8} l4 0 l0 4 l-4 0 Z`).join(''));

  const pines = [umbrellaPine(g, 300, 112), umbrellaPine(g, 352, 92)];
  ground(g, WIDTH, 0);
  // sampietrini: rows of small cobbles
  detail(g, Array.from({ length: Math.floor(WIDTH / 9) }, (_, i) => `M${i * 9 + (i % 2) * 3} ${G + 2} l5 0 M${i * 9 + 4} ${G + 6} l5 0`).join(' '));

  // --- Roman houses: ochre plaster, green shutters (persiane), a cornice
  const houses: Array<[number, number, number]> = [[400, 130, 150], [530, 110, 128], [640, 150, 162]];
  houses.forEach(([x, w, h]) => {
    solidShape(g, rect(x, G - h, w, h));
    solidShape(g, rect(x - 4, G - h - 6, w + 8, 6));
    detail(g, `M${x - 2} ${G - h + 3} L${x + w + 2} ${G - h + 3} M${x} ${G - 64} L${x + w} ${G - 64}`);
    const cols = Math.floor((w - 16) / 34);
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
      const wx = x + 14 + c * 34, wy = G - h + 18 + r * 40;
      if (wy > G - 80) continue;
      solidShape(g, rect(wx, wy, 14, 24), SCENE_PEN * 0.8);
      solidShape(g, rect(wx - 7, wy, 7, 24), SCENE_PEN * 0.7);
      solidShape(g, rect(wx + 14, wy, 7, 24), SCENE_PEN * 0.7);
      detail(g, [0, 1, 2, 3, 4, 5].map(k => `M${wx - 6} ${wy + 3 + k * 3.6} l5 0 M${wx + 15} ${wy + 3 + k * 3.6} l5 0`).join(' ') + ` M${wx + 7} ${wy} l0 24`);
      detail(g, `M${wx - 2} ${wy + 28} L${wx + 16} ${wy + 28}`, SCENE_PEN * 0.8);
    }
  });
  // gelateria in the middle house
  const gx = 540;
  solidShape(g, rect(gx, G - 56, 90, 56));
  solidShape(g, rect(gx + 4, G - 54, 82, 12), SCENE_PEN * 0.8);
  label(g, gx + 45, G - 45, 'GELATERIA', 7.6, 'serif');
  solidShape(g, rect(gx + 8, G - 38, 40, 34), SCENE_PEN * 0.8);
  detail(g, [0, 1, 2, 3].map(k => `M${gx + 12 + k * 9} ${G - 16} q3.4 -6 7 0 M${gx + 15.4 + k * 9} ${G - 16} l0 6`).join(' '));
  solidShape(g, rect(gx + 56, G - 40, 26, 40), SCENE_PEN * 0.8);
  // a street-side cone sign
  solidShape(g, `M${gx + 96} ${G} L${gx + 96} ${G - 30} M${gx + 90} ${G - 30} L${gx + 102} ${G - 30} L${gx + 96} ${G - 14} Z`, SCENE_PEN * 0.8);
  solidShape(g, `M${gx + 96} ${G - 38} a6 6 0 1 0 0.1 0 Z`, SCENE_PEN * 0.8);

  // laundry line between the first and second house, shirts swinging on pegs
  const lineY = G - 104;
  line(g, `M${470} ${lineY} Q${500} ${lineY + 6} ${530} ${lineY}`, DETAIL_PEN * 1.4);
  const clothes = [480, 494, 508, 520].map((x, i) => ({ x, p: pendulum(9, 1.4, 0), node: solidShape(g, '', SCENE_PEN * 0.7), kind: i % 2 }));

  // Vespa parked in front of the third house
  const vx = 680;
  // rear body over the engine, saddle, floorboard, curved leg shield, front mudguard
  solidShape(g, `M${vx - 2} ${G - 9} Q${vx - 5} ${G - 26} ${vx + 10} ${G - 28} L${vx + 20} ${G - 27} Q${vx + 25} ${G - 18} ${vx + 21} ${G - 9} Z`);
  ink(g, `M${vx + 1} ${G - 28} Q${vx + 10} ${G - 34} ${vx + 21} ${G - 30} L${vx + 21} ${G - 27.6} L${vx + 1} ${G - 27}Z`);
  line(g, `M${vx + 21} ${G - 10} L${vx + 34} ${G - 10}`);
  solidShape(g, `M${vx + 32} ${G - 10} Q${vx + 38} ${G - 24} ${vx + 39} ${G - 42} L${vx + 43} ${G - 42} Q${vx + 43} ${G - 22} ${vx + 38} ${G - 10} Z`);
  line(g, `M${vx + 35} ${G - 44} L${vx + 49} ${G - 44} M${vx + 42} ${G - 9} Q${vx + 42} ${G - 14} ${vx + 47} ${G - 13}`);
  solidShape(g, `M${vx + 44} ${G - 40} a2.4 2.4 0 1 0 4.8 0 a2.4 2.4 0 1 0 -4.8 0 Z`, SCENE_PEN * 0.7);
  [vx + 6, vx + 42].forEach(x => { el('circle', { cx: x, cy: G - 5, r: 5, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': SCENE_PEN }, g); ink(g, `M${x - 1.6} ${G - 5} a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0`); });

  // nasone: the cast-iron drinking fountain, water running
  const nx = 380;
  solidShape(g, `M${nx - 5} ${G} L${nx - 4} ${G - 38} Q${nx} ${G - 42} ${nx + 4} ${G - 38} L${nx + 5} ${G} Z`);
  line(g, `M${nx + 3} ${G - 28} Q${nx + 9} ${G - 29} ${nx + 9} ${G - 25}`);
  const water = line(g, '', DETAIL_PEN);

  return {
    id: 'italie',
    width: WIDTH,
    update({ t, dt, wind }) {
      const b = Math.sin(t * 0.7) * 1.6 + wind * 2.4;
      pines.forEach((node, i) => {
        const x = i ? 352 : 300, h = i ? 92 : 112, top = G - h;
        node.setAttribute('d', `M${f(x - 34 + b * 0.5)} ${top + 12} Q${f(x - 30 + b)} ${top - 4} ${f(x + 4 + b)} ${top - 4} Q${f(x + 38 + b)} ${top - 2} ${f(x + 44 + b * 0.6)} ${top + 12} Q${f(x + 30 + b * 0.4)} ${top + 18} ${f(x + 5)} ${top + 14} Q${f(x - 20 + b * 0.4)} ${top + 18} ${f(x - 34 + b * 0.5)} ${top + 12} Z`);
      });
      clothes.forEach((c, i) => {
        const a = c.p.step(wind * 0.6 + Math.sin(t * 1.3 + i) * 0.25, dt);
        const y = lineY + 4 - Math.abs(c.x - 500) * 0.06;
        const dx = Math.sin(a) * 6;
        c.node.setAttribute('d', c.kind
          ? `M${c.x - 5} ${f(y)} L${c.x + 5} ${f(y)} L${f(c.x + 8 + dx * 0.4)} ${f(y + 4)} L${f(c.x + 5 + dx)} ${f(y + 15)} L${f(c.x - 5 + dx)} ${f(y + 15)} L${f(c.x - 8 + dx * 0.4)} ${f(y + 4)} Z`
          : `M${c.x - 4} ${f(y)} L${c.x + 4} ${f(y)} L${f(c.x + 4 + dx)} ${f(y + 13)} L${f(c.x + 1 + dx)} ${f(y + 13)} L${f(c.x + dx * 0.6)} ${f(y + 6)} L${f(c.x - 1 + dx)} ${f(y + 13)} L${f(c.x - 4 + dx)} ${f(y + 13)} Z`);
      });
      const j = Math.sin(t * 9) * 0.3;
      water.setAttribute('d', `M${nx + 9} ${G - 25} Q${f(nx + 10 + j)} ${G - 14} ${f(nx + 11 + j)} ${G - 1} M${f(nx + 8 + j)} ${G - 1} q3 -2 6 0`);
    },
  };
};
