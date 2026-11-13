// Scene — Japan: Mount Fuji far away, a vermilion torii, cherry trees shedding
// petals on the wind, and a row of wooden machiya with a ramen noren and lanterns.
import { el, f } from '../lib/ink.ts';
import { pendulum, seeded } from '../lib/motion.ts';
import { createPedestrian, pedestrianGait } from '../pedestrian.ts';
import { line, solidShape, ink, detail, rect, farLayer, label, loop } from '../kit.ts';
import { G, S, SCENE_PEN, ground, type SceneFactory } from '../scene.ts';

const WIDTH = 820;

export const japon: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: Fuji with its snow cap
  const far = farLayer(g, 0.45);
  const fx = 230;
  solidShape(far, `M${fx - 190} ${G} Q${fx - 90} ${G - 70} ${fx - 26} ${G - 150} L${fx + 26} ${G - 150} Q${fx + 90} ${G - 70} ${fx + 190} ${G} Z`, SCENE_PEN * 0.8);
  detail(far, `M${fx - 40} ${G - 132} l8 8 l6 -10 l8 12 l7 -9 l8 11 l7 -10 l8 8 l6 -6`);

  ground(g, WIDTH, 0);
  detail(g, Array.from({ length: Math.floor(WIDTH / 16) }, (_, i) => `M${i * 16 + 4} ${G + 4} q4 -2 8 0`).join(' '));

  // --- torii
  const tx = 120;
  solidShape(g, `M${tx - 3} ${G} L${tx - 1} ${G - 92} L${tx + 5} ${G - 92} L${tx + 7} ${G} Z M${tx + 63} ${G} L${tx + 65} ${G - 92} L${tx + 71} ${G - 92} L${tx + 73} ${G} Z`);
  solidShape(g, `M${tx - 14} ${G - 100} Q${tx + 35} ${G - 94} ${tx + 84} ${G - 100} L${tx + 88} ${G - 108} Q${tx + 35} ${G - 101} ${tx - 18} ${G - 108} Z`);
  solidShape(g, rect(tx - 8, G - 84, 86, 6));
  solidShape(g, rect(tx + 30, G - 98, 10, 14), SCENE_PEN * 0.7);
  label(g, tx + 35, G - 94, '稲', 4.6, 'brush', true);
  detail(g, `M${tx - 6} ${G} l0 -4 l18 0 l0 4 M${tx + 58} ${G} l0 -4 l18 0 l0 4`);

  // stone lantern (tōrō)
  const lx = 220;
  solidShape(g, `M${lx - 8} ${G} L${lx - 6} ${G - 4} L${lx + 6} ${G - 4} L${lx + 8} ${G} Z M${lx - 3} ${G - 4} L${lx - 3} ${G - 22} L${lx + 3} ${G - 22} L${lx + 3} ${G - 4} Z M${lx - 7} ${G - 22} L${lx + 7} ${G - 22} L${lx + 6} ${G - 32} L${lx - 6} ${G - 32} Z M${lx - 11} ${G - 32} Q${lx} ${G - 34} ${lx + 11} ${G - 32} L${lx} ${G - 42} Z`, SCENE_PEN * 0.8);
  detail(g, rect(lx - 3, G - 30, 6, 6));

  // --- cherry trees; their canopies are drawn as clustered blossom clouds
  const trees = [[275, 96], [345, 80]].map(([x, h]) => {
    line(g, `M${x - 3} ${G} Q${x - 4} ${G - h * 0.5} ${x + 2} ${G - h + 22} M${x + 3} ${G} Q${x + 2} ${G - h * 0.5} ${x + 6} ${G - h + 24} M${x} ${G - h * 0.6} q-10 -6 -16 -16 M${x + 3} ${G - h * 0.7} q12 -6 16 -14`);
    return { x, h, crown: solidShape(g, ''), dots: detail(g, '') };
  });

  // --- machiya: wooden houses with koshi lattice, tiled eaves, a ramen shop
  const houses: Array<[number, number, number]> = [[420, 120, 96], [544, 130, 110], [678, 120, 92]];
  houses.forEach(([x, w, h], i) => {
    solidShape(g, rect(x, G - h, w, h));
    // upper eave and lower pent roof, with tile channels
    solidShape(g, `M${x - 10} ${G - h} L${x + w + 10} ${G - h} L${x + w + 4} ${G - h - 10} L${x - 4} ${G - h - 10} Z`);
    solidShape(g, `M${x - 8} ${G - 54} L${x + w + 8} ${G - 54} L${x + w + 2} ${G - 62} L${x - 2} ${G - 62} Z`);
    detail(g, Array.from({ length: Math.floor((w + 16) / 5) }, (_, k) => `M${x - 6 + k * 5} ${G - h - 1} l1 -8 M${x - 5 + k * 5} ${G - 55} l1 -6`).join(' '));
    // upper floor: mushiko slits; ground floor: koshi lattice with a rhythm of every fourth full slat
    detail(g, Array.from({ length: Math.floor((w - 20) / 6) }, (_, k) => `M${x + 12 + k * 6} ${G - h + 14} l0 22`).join(' ') + ` ${rect(x + 10, G - h + 12, w - 20, 26)}`);
    const lattice = Array.from({ length: Math.floor((w - 50) / 3.2) }, (_, k) => `M${x + 8 + k * 3.2} ${G - (k % 4 === 0 ? 50 : 46)} L${x + 8 + k * 3.2} ${G - 6}`).join(' ');
    detail(g, lattice + ` M${x + 6} ${G - 46} L${x + w - 44} ${G - 46}`);
    if (i === 1) {
      // noren curtain over the door, and the shop name
      solidShape(g, rect(x + w - 40, G - 50, 32, 50), SCENE_PEN * 0.8);
      solidShape(g, rect(x + 14, G - h + 2, 10, 34), SCENE_PEN * 0.7);
      label(g, x + 19, G - h + 9, 'ラーメン', 6, 'cjk', true);
    } else {
      solidShape(g, rect(x + w - 40, G - 48, 30, 48), SCENE_PEN * 0.8);
      detail(g, `M${x + w - 25} ${G - 48} l0 48 ${Array.from({ length: 6 }, (_, k) => `M${x + w - 40} ${G - 40 + k * 7} l30 0`).join(' ')}`);
    }
  });
  const noren = solidShape(g, '', SCENE_PEN * 0.8);
  const nx = 544 + 130 - 40;
  label(g, nx + 16, G - 38, 'らーめん', 5.4, 'cjk');
  const lanterns = [[450, G - 52], [nx + 34, G - 52]].map(([x, y]) => ({ x, y, p: pendulum(8, 1.2), node: el('g', {}, g) }));
  lanterns.forEach(l => {
    solidShape(l.node, `M-5 2 Q-7 9 -5 16 L5 16 Q7 9 5 2 Z`, SCENE_PEN * 0.8);
    detail(l.node, 'M-6 6 L6 6 M-6.4 10 L6.4 10 M-5.6 13 L5.6 13 M-3 2 L3 2 M-3 16 L3 16 M0 -2 L0 2');
  });

  // petals: seeded so the drift looks the same on every load
  const rnd = seeded(23);
  const petals = Array.from({ length: 16 }, () => ({ x: rnd(220, 420), y: rnd(G - 110, G - 20), s: rnd(0.6, 1.2), ph: rnd(0, 6.28) }));
  const petalNode = ink(g, '');

  const walker = createPedestrian(g, { hat: 'bun' });
  const walkSpeed = pedestrianGait.speed * S;

  return {
    id: 'japon',
    width: WIDTH,
    update({ t, dt, wind }) {
      trees.forEach(({ x, h, crown, dots }, i) => {
        const b = Math.sin(t * 0.8 + i) * 1.2 + wind * 1.4, top = G - h;
        crown.setAttribute('d', `M${f(x - 30 + b * 0.5)} ${top + 34} Q${f(x - 44 + b * 0.6)} ${top + 18} ${f(x - 26 + b)} ${top + 8} Q${f(x - 18 + b)} ${top - 6} ${f(x + 2 + b)} ${top} Q${f(x + 22 + b)} ${top - 8} ${f(x + 32 + b)} ${top + 10} Q${f(x + 48 + b * 0.6)} ${top + 22} ${f(x + 32 + b * 0.5)} ${top + 34} Q${f(x)} ${top + 40} ${f(x - 30 + b * 0.5)} ${top + 34} Z`);
        dots.setAttribute('d', [[-20, 18], [-8, 8], [8, 6], [20, 18], [-2, 24], [12, 28], [-16, 30], [26, 26]].map(([dx, dy]) => `M${f(x + dx + b * 0.8)} ${top + dy} q1.4 -1.6 2.8 0 q-1.4 1.6 -2.8 0`).join(' '));
      });
      petalNode.setAttribute('d', petals.map(p => {
        const fall = (t * 9 * p.s + p.y - (G - 110)) % 110;
        const x = ((p.x - 220 + t * (6 + wind * 10) * p.s + Math.sin(t * 1.4 + p.ph) * 5) % 260 + 260) % 260 + 220;
        const y = G - 110 + fall, a = Math.sin(t * 2 + p.ph) * 1.4;
        return `M${f(x)} ${f(y)} q${f(1.4 + a * 0.2)} ${f(-1.2)} ${f(2.6)} ${f(a * 0.3)} q${f(-1.2)} ${f(1.2)} ${f(-2.6)} ${f(-a * 0.3)}`;
      }).join(' '));
      const sway = Math.sin(t * 1.5) * 1 + wind * 2;
      noren.setAttribute('d', `M${nx} ${G - 50} L${nx + 32} ${G - 50} L${f(nx + 32 + sway)} ${G - 30} L${f(nx + 17 + sway)} ${G - 30} L${nx + 16} ${G - 42} L${f(nx + 15 + sway)} ${G - 30} L${f(nx + sway)} ${G - 30} Z`);
      lanterns.forEach(l => { const a = l.p.step(wind * 0.5 + Math.sin(t * 0.9) * 0.15, dt); l.node.setAttribute('transform', `translate(${l.x} ${l.y}) rotate(${f(a * 57.3)})`); });

      const p = loop(40, walkSpeed, t, -20, WIDTH + 20);
      walker.g.setAttribute('transform', `translate(${f(p.x)} ${G}) scale(${f(S)} ${f(S)}) translate(-40 -120)`);
      walker.g.setAttribute('opacity', f(p.alpha));
      walker.draw(dt);
    },
  };
};
