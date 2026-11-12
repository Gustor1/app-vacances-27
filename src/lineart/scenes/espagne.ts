// Scene — Spain: the Sagrada Família (with its cranes, still being built) over
// Barcelona, then a whitewashed Andalusian street: rejas, flower pots, an orange
// tree, a patio arch of azulejos, a guitarist and a flamenco dancer.
import { el, f, PAPER } from '../lib/ink.ts';
import { ease } from '../lib/motion.ts';
import { createPedestrian, pedestrianGait } from '../pedestrian.ts';
import { line, solidShape, ink, detail, rect, farLayer, loop } from '../kit.ts';
import { G, S, SCENE_PEN, ground, type SceneFactory } from '../scene.ts';

const WIDTH = 820;

/** One Gaudí spire: a tapering honeycombed tower ending in a bulbous pinnacle. */
function spire(parent: Element, x: number, base: number, h: number, w: number) {
  const top = base - h;
  solidShape(parent, `M${x - w / 2} ${base} Q${x - w / 2 + 1} ${top + h * 0.35} ${x - 2} ${top + 10} L${x + 2} ${top + 10} Q${x + w / 2 - 1} ${top + h * 0.35} ${x + w / 2} ${base} Z`, SCENE_PEN * 0.8);
  solidShape(parent, `M${x} ${top - 3} a3.4 4.4 0 1 0 0.1 0 Z M${x - 2} ${top + 10} L${x + 2} ${top + 10} L${x + 1} ${top + 4} L${x - 1} ${top + 4} Z`, SCENE_PEN * 0.7);
  detail(parent, Array.from({ length: Math.floor(h / 12) }, (_, i) => `M${x - 1} ${base - 14 - i * 11} l0 -5 M${x + 1.6} ${base - 18 - i * 11} l0 -4`).join(' '));
}

export const espagne: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: Sagrada Família, cranes beside it
  const far = farLayer(g, 0.48);
  const sx = 150;
  line(far, `M${sx + 70} ${G} L${sx + 70} ${G - 196} M${sx + 40} ${G - 190} L${sx + 120} ${G - 190} M${sx + 70} ${G - 196} L${sx + 48} ${G - 190} M${sx + 70} ${G - 196} L${sx + 104} ${G - 190} M${sx + 112} ${G - 190} l0 26`, SCENE_PEN * 0.7);
  detail(far, Array.from({ length: 16 }, (_, i) => `M${sx + 68} ${G - 8 - i * 12} l4 -6 M${sx + 72} ${G - 8 - i * 12} l-4 -6`).join(' '));
  [[-58, 130, 16], [-34, 168, 18], [-12, 196, 20], [12, 190, 20], [36, 160, 18], [58, 124, 16]].forEach(([dx, h, w]) => spire(far, sx + dx, G - 56, h, w));
  solidShape(far, `M${sx - 72} ${G} L${sx - 72} ${G - 60} L${sx + 72} ${G - 60} L${sx + 72} ${G} Z`, SCENE_PEN * 0.8);
  detail(far, `M${sx - 30} ${G} L${sx - 30} ${G - 34} Q${sx} ${G - 62} ${sx + 30} ${G - 34} L${sx + 30} ${G} M${sx - 18} ${G} L${sx - 18} ${G - 30} Q${sx} ${G - 48} ${sx + 18} ${G - 30} L${sx + 18} ${G} ${[-58, -46, 46, 58].map(d => `M${sx + d} ${G - 10} l0 -36`).join(' ')}`);

  ground(g, WIDTH, 22);

  // --- Andalusian street: three whitewashed houses with tiled roofs
  const houses: Array<[number, number, number]> = [[330, 120, 118], [450, 150, 96], [600, 130, 128]];
  houses.forEach(([x, w, h], i) => {
    solidShape(g, rect(x, G - h, w, h));
    solidShape(g, `M${x - 6} ${G - h} L${x + w + 6} ${G - h} L${x + w - 4} ${G - h - 12} L${x + 4} ${G - h - 12} Z`);
    detail(g, Array.from({ length: Math.floor((w + 12) / 6) }, (_, k) => `M${x - 4 + k * 6} ${G - h - 1} q1.6 -6 3 -10`).join(' ') + ` M${x - 6} ${G - h + 0.5} L${x + w + 6} ${G - h + 0.5}`);
    // window with a wrought-iron reja and a flower pot on the sill
    const wx = x + 18, wy = G - h + 22;
    solidShape(g, rect(wx, wy, 26, 30));
    detail(g, `${[5, 10, 15, 20].map(d => `M${wx + d + 0.5} ${wy} L${wx + d + 0.5} ${wy + 30}`).join(' ')} M${wx} ${wy + 10} L${wx + 26} ${wy + 10} M${wx + 3} ${wy - 2} q10 -8 20 0`, SCENE_PEN * 0.6);
    solidShape(g, `M${wx + 4} ${wy + 30} L${wx + 22} ${wy + 30} L${wx + 20} ${wy + 37} L${wx + 6} ${wy + 37} Z`, SCENE_PEN * 0.7);
    detail(g, `M${wx + 8} ${wy + 30} q-2 -6 -5 -7 M${wx + 13} ${wy + 30} q0 -7 2 -9 M${wx + 18} ${wy + 30} q3 -5 6 -6`);
    ink(g, `M${wx + 2} ${wy + 23} a2 2 0 1 0 0.1 0Z M${wx + 15} ${wy + 20} a2 2 0 1 0 0.1 0Z M${wx + 24} ${wy + 23} a2 2 0 1 0 0.1 0Z`);
    // wall pots hanging on the façade (the patios of Córdoba)
    [0, 1, 2].forEach(k => {
      const px = x + w - 36 + k * 11, py = G - h + 30 + (k % 2) * 14;
      solidShape(g, `M${px} ${py} L${px + 7} ${py} L${px + 6} ${py + 6} L${px + 1} ${py + 6} Z`, SCENE_PEN * 0.6);
      detail(g, `M${px + 2} ${py} q-1 -4 -3 -4 M${px + 5} ${py} q2 -4 4 -4`);
    });
    if (i === 1) {
      // patio arch lined with azulejos
      const ax = x + 70;
      solidShape(g, `M${ax} ${G} L${ax} ${G - 46} Q${ax + 22} ${G - 74} ${ax + 44} ${G - 46} L${ax + 44} ${G} Z`);
      detail(g, `M${ax + 5} ${G} L${ax + 5} ${G - 44} Q${ax + 22} ${G - 66} ${ax + 39} ${G - 44} L${ax + 39} ${G}`);
      detail(g, Array.from({ length: 6 }, (_, r) => Array.from({ length: 2 }, (_, c) => `M${ax + 1 + c * 39} ${G - 4 - r * 7} l2 -3 l2 3 l-2 3 Z`).join(' ')).join(' '));
    } else {
      solidShape(g, `M${x + w - 46} ${G} L${x + w - 46} ${G - 50} Q${x + w - 32} ${G - 60} ${x + w - 18} ${G - 50} L${x + w - 18} ${G} Z`);
      detail(g, `M${x + w - 32} ${G - 55} L${x + w - 32} ${G} M${x + w - 36} ${G - 26} l0 4 M${x + w - 28} ${G - 26} l0 4`);
    }
  });
  // bell tower of the village church behind the middle house
  solidShape(g, `M${515} ${G - 96} L${515} ${G - 150} L${541} ${G - 150} L${541} ${G - 96} Z`);
  solidShape(g, `M${512} ${G - 150} L${544} ${G - 150} L${528} ${G - 170} Z`);
  detail(g, `M${521} ${G - 112} L${521} ${G - 128} Q${528} ${G - 136} ${535} ${G - 128} L${535} ${G - 112} M${528} ${G - 170} l0 -8 M${525} ${G - 175} l6 0`);

  // orange tree in a round planter
  const ox = 310;
  solidShape(g, `M${ox - 12} ${G} L${ox - 10} ${G - 12} L${ox + 10} ${G - 12} L${ox + 12} ${G} Z`);
  line(g, `M${ox} ${G - 12} Q${ox - 1} ${G - 34} ${ox + 1} ${G - 46}`);
  const canopy = el('g', {}, g);
  const crown = solidShape(canopy, '');
  const fruit = ink(canopy, '');

  // guitarist on a chair and the flamenco dancer
  const gx = 430;
  line(g, `M${gx - 4} ${G} L${gx - 4} ${G - 13} L${gx + 6} ${G - 13} L${gx + 6} ${G} M${gx - 4} ${G - 13} L${gx - 6} ${G - 30}`);
  solidShape(g, `M${gx - 4} ${G - 46} Q${gx + 1} ${G - 49} ${gx + 6} ${G - 46} L${gx + 7} ${G - 15} L${gx - 5} ${G - 14} Z`);
  line(g, `M${gx + 3} ${G - 15} L${gx + 13} ${G - 14} L${gx + 14} ${G - 1}`, SCENE_PEN * 1.6);
  el('ellipse', { cx: gx + 1.6, cy: G - 51.6, rx: 2.4, ry: 3, fill: PAPER, stroke: 'currentColor', 'stroke-width': SCENE_PEN }, g);
  ink(g, `M${gx - 1} ${G - 52} q1.6 -4.6 5 -2 q-2 0 -3.4 1.6 Z`);
  solidShape(g, `M${gx + 4} ${G - 20} a6 5 0 1 0 0.1 0 Z M${gx + 9} ${G - 23} L${gx + 24} ${G - 33} L${gx + 25} ${G - 31} L${gx + 10} ${G - 21} Z`, SCENE_PEN * 0.8);
  const strum = line(g, '', SCENE_PEN * 1.5);
  const dancer = el('g', {}, g);
  const dress = solidShape(dancer, '');
  const flounce = detail(dancer, '');
  const arms = line(dancer, '', SCENE_PEN * 1.5);
  const dHead = el('ellipse', { rx: 2.4, ry: 3, fill: PAPER, stroke: 'currentColor', 'stroke-width': SCENE_PEN }, dancer);
  const bun = ink(dancer, '');

  const passer = createPedestrian(g, { hat: 'none' });
  const walkSpeed = pedestrianGait.speed * S;

  return {
    id: 'espagne',
    width: WIDTH,
    update({ t, dt, wind }) {
      const b = Math.sin(t * 0.8) * 1.4 + wind * 1.6;
      crown.setAttribute('d', `M${ox - 2} ${G - 44} Q${f(ox - 26 + b * 0.4)} ${G - 46} ${f(ox - 22 + b * 0.7)} ${G - 66} Q${f(ox - 16 + b)} ${G - 84} ${f(ox + 2 + b)} ${G - 82} Q${f(ox + 22 + b * 0.8)} ${G - 80} ${f(ox + 22 + b * 0.5)} ${G - 60} Q${f(ox + 24 + b * 0.3)} ${G - 46} ${ox + 2} ${G - 44} Z`);
      fruit.setAttribute('d', [[-12, -58], [-2, -70], [10, -62], [4, -52], [14, -74], [-14, -72]].map(([dx, dy]) => `M${f(ox + dx + b * 0.7)} ${G + dy} a1.8 1.8 0 1 0 0.1 0Z`).join(' '));

      const s = Math.sin(t * 11) * 2.4;
      strum.setAttribute('d', `M${gx + 3} ${G - 42} Q${gx + 10} ${G - 36} ${f(gx + 9 + s * 0.3)} ${f(G - 26 + s)}`);

      // the dancer turns: skirt swings out, arms rise and fall
      const dx = 470, turn = Math.sin(t * 1.6), lift = ease((Math.sin(t * 0.8) + 1) / 2);
      const hem = 14 + 6 * Math.abs(turn);
      dress.setAttribute('d', `M${dx - 3} ${G - 44} Q${dx + 1} ${G - 46} ${dx + 5} ${G - 44} L${dx + 5} ${G - 26} Q${f(dx + hem * 0.6 + turn * 6)} ${G - 14} ${f(dx + hem + turn * 4)} ${G - 2} L${f(dx - hem + turn * 4)} ${G - 2} Q${f(dx - hem * 0.6 + turn * 6)} ${G - 14} ${dx - 3} ${G - 26} Z`);
      flounce.setAttribute('d', [0, 1, 2].map(k => { const y = G - 4 - k * 7, w = hem * (1 - k * 0.22); return `M${f(dx + 1 - w + turn * (4 + k))} ${y} ` + Array.from({ length: 5 }, () => `q${f(w / 5)} 2.6 ${f((2 * w) / 5)} 0`).join(' '); }).join(' '));
      arms.setAttribute('d', `M${dx - 2} ${G - 42} Q${f(dx - 10)} ${f(G - 44 - 10 * lift)} ${f(dx - 6 + turn * 2)} ${f(G - 54 - 8 * lift)} M${dx + 4} ${G - 42} Q${f(dx + 12)} ${f(G - 40 - 6 * lift)} ${f(dx + 10 - turn * 2)} ${f(G - 48 - 12 * lift)}`);
      dHead.setAttribute('cx', f(dx + 1.2 + turn * 0.6)); dHead.setAttribute('cy', String(G - 49));
      bun.setAttribute('d', `M${f(dx - 2 + turn * 0.6)} ${G - 50} a2 2 0 1 0 0.1 0 Z M${f(dx + 1 + turn * 0.6)} ${G - 53} l2 -1.6 l1 1.4 Z`);

      const p = loop(WIDTH - 40, -walkSpeed, t, -20, WIDTH + 20);
      passer.g.setAttribute('transform', `translate(${f(p.x)} ${G}) scale(${f(-S)} ${f(S)}) translate(-40 -120)`);
      passer.g.setAttribute('opacity', f(p.alpha));
      passer.draw(dt);
    },
  };
};
