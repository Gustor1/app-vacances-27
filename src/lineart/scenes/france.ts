// Scene 1 — France: the Eiffel Tower far away, a boulangerie, a café terrace,
// a plane tree, pigeons, and a passer-by with a baguette.
import { el, pen, shape, blot, place, f, PAPER } from '../lib/ink.ts';
import { ease } from '../lib/motion.ts';
import { createPedestrian, pedestrianGait } from '../pedestrian.ts';
import { G, S, SCENE_PEN, DETAIL_PEN, ground, type SceneFactory } from '../scene.ts';

const WIDTH = 780;

function text(parent: Element, x: number, y: number, label: string, size: number) {
  const node = el('text', { x, y, 'text-anchor': 'middle', 'font-size': size, 'letter-spacing': size * 0.16, fill: 'currentColor', 'font-family': 'Georgia, "Times New Roman", serif' }, parent);
  node.textContent = label;
}

/** French window with a wrought-iron balcony rail. */
function frenchWindow(parent: Element, x: number, top: number, w = 22, h = 32) {
  shape(parent, SCENE_PEN).setAttribute('d', `M${x} ${top + h} L${x} ${top + 4} Q${x + w / 2} ${top - 2} ${x + w} ${top + 4} L${x + w} ${top + h} Z`);
  pen(parent, DETAIL_PEN).setAttribute('d', `M${x + w / 2} ${top + 1} L${x + w / 2} ${top + h} M${x} ${top + h * 0.45} L${x + w} ${top + h * 0.45}`);
  const rail = top + h - 8;
  pen(parent, SCENE_PEN * 0.8).setAttribute('d', `M${x - 3} ${rail} L${x + w + 3} ${rail} M${x - 3} ${top + h + 1} L${x + w + 3} ${top + h + 1} ${Array.from({ length: 5 }, (_, i) => `M${x + 1 + i * (w / 4)} ${rail} q2.4 4.5 0 9`).join(' ')}`);
}

export const france: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: the Eiffel Tower in diluted ink
  const far = el('g', { opacity: 0.5 }, g);
  const ex = 120, top = G - 204;
  shape(far, SCENE_PEN * 0.8).setAttribute('d', `M${ex - 54} ${G} Q${ex - 22} ${G - 70} ${ex - 4} ${top} L${ex + 4} ${top} Q${ex + 22} ${G - 70} ${ex + 54} ${G} L${ex + 34} ${G} Q${ex} ${G - 52} ${ex - 34} ${G} Z`);
  pen(far, DETAIL_PEN).setAttribute('d', [
    `M${ex - 40} ${G - 30} L${ex - 22} ${G - 62} M${ex + 40} ${G - 30} L${ex + 22} ${G - 62}`,
    `M${ex - 27} ${G - 62} L${ex + 27} ${G - 62} M${ex - 25} ${G - 67} L${ex + 25} ${G - 67}`,
    `M${ex - 20} ${G - 67} L${ex + 11} ${G - 120} M${ex + 20} ${G - 67} L${ex - 11} ${G - 120}`,
    `M${ex - 13} ${G - 120} L${ex + 13} ${G - 120} M${ex - 12} ${G - 124} L${ex + 12} ${G - 124}`,
    `M${ex - 10} ${G - 124} L${ex + 5} ${G - 170} M${ex + 10} ${G - 124} L${ex - 5} ${G - 170}`,
    `M${ex - 6} ${G - 172} L${ex + 6} ${G - 172} M${ex} ${top} L${ex} ${top - 14}`,
  ].join(' '));

  ground(g, WIDTH);

  // --- boulangerie: two storeys under a zinc mansard roof
  const bx = 220, bw = 190;
  shape(g, SCENE_PEN).setAttribute('d', `M${bx + 150} ${G - 160} L${bx + 150} ${G - 176} L${bx + 164} ${G - 176} L${bx + 164} ${G - 160} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M${bx - 6} ${G - 132} L${bx + bw + 6} ${G - 132} L${bx + bw - 8} ${G - 162} L${bx + 8} ${G - 162} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', Array.from({ length: 14 }, (_, i) => `M${bx + 12 + i * 12.6} ${G - 161} L${bx + 4 + i * 13.4} ${G - 133}`).join(' '));
  [bx + 44, bx + 124].forEach(x => {
    shape(g, SCENE_PEN).setAttribute('d', `M${x} ${G - 133} L${x} ${G - 150} Q${x + 11} ${G - 160} ${x + 22} ${G - 150} L${x + 22} ${G - 133} Z`);
    pen(g, DETAIL_PEN).setAttribute('d', `M${x + 11} ${G - 154} L${x + 11} ${G - 133} M${x + 2} ${G - 143} L${x + 20} ${G - 143}`);
  });
  shape(g, SCENE_PEN).setAttribute('d', `M${bx} ${G} L${bx} ${G - 132} L${bx + bw} ${G - 132} L${bx + bw} ${G} Z`);
  pen(g, SCENE_PEN).setAttribute('d', `M${bx - 4} ${G - 128} L${bx + bw + 4} ${G - 128} M${bx} ${G - 90} L${bx + bw} ${G - 90}`);
  [bx + 20, bx + 84, bx + 148].forEach(x => frenchWindow(g, x, G - 124));
  // shopfront: painted sign, striped scalloped awning, window of loaves, glazed door
  shape(g, SCENE_PEN).setAttribute('d', `M${bx + 8} ${G - 86} L${bx + bw - 8} ${G - 86} L${bx + bw - 8} ${G - 72} L${bx + 8} ${G - 72} Z`);
  text(g, bx + bw / 2, G - 75.6, 'BOULANGERIE', 9.6);
  shape(g, SCENE_PEN).setAttribute('d', `M${bx + 12} ${G - 4} L${bx + 12} ${G - 50} L${bx + 92} ${G - 50} L${bx + 92} ${G - 4} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', [
    ...[0, 1, 2, 3].map(i => `M${bx + 18 + i * 9} ${G - 10} L${bx + 34 + i * 9} ${G - 40}`),
    ...[0, 1, 2].map(i => `M${bx + 58 + i * 11} ${G - 14} q4 -6 9 0`),
    `M${bx + 56} ${G - 28} L${bx + 88} ${G - 28}`, ...[0, 1, 2].map(i => `M${bx + 60 + i * 10} ${G - 30} q3 -5 7 0`),
  ].join(' '));
  shape(g, SCENE_PEN).setAttribute('d', `M${bx + 104} ${G} L${bx + 104} ${G - 62} L${bx + 132} ${G - 62} L${bx + 132} ${G} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M${bx + 108} ${G - 30} L${bx + 108} ${G - 58} L${bx + 128} ${G - 58} L${bx + 128} ${G - 30} Z M${bx + 126} ${G - 26} l0 4`);
  shape(g, SCENE_PEN).setAttribute('d', `M${bx + 144} ${G - 4} L${bx + 144} ${G - 50} L${bx + bw - 12} ${G - 50} L${bx + bw - 12} ${G - 4} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M${bx + 148} ${G - 22} L${bx + bw - 16} ${G - 22} ${[0, 1, 2].map(i => `M${bx + 152 + i * 9} ${G - 24} q3.4 -6 7 0`).join(' ')} M${bx + 150} ${G - 38} l24 -4 M${bx + 152} ${G - 34} l22 -4`);

  // the awning is drawn last so it overlaps the top of the door and windows
  const awning = shape(g, SCENE_PEN);
  const awningStripes = pen(g, DETAIL_PEN);

  // --- café: façade, awning, bistro tables, a seated customer
  const cx = 470, cw = 230;
  shape(g, SCENE_PEN).setAttribute('d', `M${cx} ${G} L${cx} ${G - 120} L${cx + cw} ${G - 120} L${cx + cw} ${G} Z`);
  pen(g, SCENE_PEN).setAttribute('d', `M${cx - 4} ${G - 116} L${cx + cw + 4} ${G - 116}`);
  [cx + 26, cx + 92, cx + 158].forEach(x => frenchWindow(g, x, G - 110, 22, 28));
  shape(g, SCENE_PEN).setAttribute('d', `M${cx + 12} ${G} L${cx + 12} ${G - 58} L${cx + 120} ${G - 58} L${cx + 120} ${G} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M${cx + 48} ${G - 58} L${cx + 48} ${G} M${cx + 84} ${G - 58} L${cx + 84} ${G} M${cx + 12} ${G - 40} L${cx + 120} ${G - 40}`);
  shape(g, SCENE_PEN).setAttribute('d', `M${cx + 140} ${G} L${cx + 140} ${G - 58} L${cx + 166} ${G - 58} L${cx + 166} ${G} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M${cx + 4} ${G - 76} L${cx + 210} ${G - 76} L${cx + 220} ${G - 62} L${cx - 6} ${G - 62} Z`);
  shape(g, SCENE_PEN * 0.8).setAttribute('d', `M${cx - 6} ${G - 62} L${cx + 220} ${G - 62} L${cx + 220} ${G - 56} L${cx - 6} ${G - 56} Z`);
  text(g, cx + 107, G - 66.2, 'CAFÉ', 8.6);
  const table = (x: number) => {
    pen(g, SCENE_PEN).setAttribute('d', `M${x - 9} ${G - 22} L${x + 9} ${G - 22} M${x} ${G - 22} L${x} ${G - 1} M${x - 6} ${G} L${x + 6} ${G}`);
    pen(g, SCENE_PEN * 0.9).setAttribute('d', `M${x + 20} ${G} L${x + 18} ${G - 13} L${x + 26} ${G - 13} L${x + 27} ${G} M${x + 25} ${G - 13} Q${x + 28} ${G - 24} ${x + 25} ${G - 30}`);
  };
  table(cx + 56); table(cx + 150);
  pen(g, DETAIL_PEN * 1.4).setAttribute('d', `M${cx + 146} ${G - 25} l0 -3 l5 0 l0 3 M${cx + 151} ${G - 27} q2 0 1.5 1.6`);

  // the seated customer: built from the same parts as a walker, posed sitting
  const sitter = el('g', {}, g);
  const sx = cx + 56 - 22;
  shape(sitter, SCENE_PEN).setAttribute('d', `M${sx - 4} ${G - 13} L${sx + 9} ${G - 13} L${sx + 10} ${G} M${sx - 2} ${G - 13} L${sx - 2} ${G}`);
  shape(sitter, SCENE_PEN).setAttribute('d', `M${sx - 4} ${G - 46} Q${sx + 1} ${G - 49} ${sx + 6} ${G - 46} L${sx + 8} ${G - 16} L${sx - 6} ${G - 15} Z`);
  pen(sitter, SCENE_PEN * 1.6).setAttribute('d', `M${sx + 4} ${G - 16} L${sx + 14} ${G - 15} L${sx + 15} ${G - 1}`);
  blot(sitter).setAttribute('d', `M${sx + 13} ${G - 1.4} l5 0 l0 1.4 l-5 0Z`);
  el('ellipse', { cx: sx + 1.6, cy: G - 51.6, rx: 2.4, ry: 3, fill: PAPER, stroke: 'currentColor', 'stroke-width': SCENE_PEN }, sitter);
  blot(sitter).setAttribute('d', `M${sx - 1} ${G - 53} q1.6 -3.6 5 -1.6 q-2 -0.4 -3.4 1.4 q-0.6 2 -1.6 1Z`);
  const sipArm = pen(sitter, SCENE_PEN * 1.6);
  const cup = pen(sitter, SCENE_PEN * 0.9);

  // plane tree between the two buildings, canopy swaying in the wind
  const tx = 436;
  shape(g, SCENE_PEN).setAttribute('d', `M${tx - 4} ${G} Q${tx - 2} ${G - 50} ${tx - 3} ${G - 96} L${tx + 3} ${G - 96} Q${tx + 2} ${G - 50} ${tx + 5} ${G} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M${tx - 1} ${G - 30} q2 -4 0 -9 M${tx + 1} ${G - 66} q-2 -4 0 -8`);
  const canopy = shape(g, SCENE_PEN);
  const leaves = pen(g, DETAIL_PEN);

  // street lamp
  const lx = 740;
  pen(g, SCENE_PEN).setAttribute('d', `M${lx} ${G} L${lx} ${G - 92} M${lx - 6} ${G} L${lx + 6} ${G} M${lx - 4} ${G - 4} L${lx + 4} ${G - 4}`);
  shape(g, SCENE_PEN).setAttribute('d', `M${lx - 7} ${G - 92} L${lx + 7} ${G - 92} L${lx + 5} ${G - 106} L${lx - 5} ${G - 106} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M${lx - 8} ${G - 106} L${lx + 8} ${G - 106} L${lx} ${G - 113} Z`);

  // pigeons pecking on the pavement
  const pigeons = [418, 450].map(x => ({ x, body: shape(g, SCENE_PEN * 0.8), head: blot(g), legs: pen(g, DETAIL_PEN) }));

  // the passer-by with a baguette, walking against the traveller
  const passer = createPedestrian(g, { hat: 'beret', prop: 'baguette' });
  let px = WIDTH - 40;

  return {
    id: 'france',
    width: WIDTH,
    update({ t, dt, wind }) {
      // awning valance ripples gently
      const sway = Math.sin(t * 1.7) * 0.6 * (0.6 + wind);
      const scallops = Array.from({ length: 13 }, (_, i) => { const x0 = bx + bw + 2 - i * 14.6; return `Q${f(x0 - 7.3)} ${f(G - 44 + sway * (i % 2 ? 1 : -1))} ${f(x0 - 14.6)} ${G - 50}`; }).join(' ');
      awning.setAttribute('d', `M${bx + 6} ${G - 68} L${bx + bw - 6} ${G - 68} L${bx + bw + 2} ${G - 50} ${scallops} Z`);
      awningStripes.setAttribute('d', Array.from({ length: 13 }, (_, i) => `M${f(bx + 10 + i * 14.4)} ${G - 67} L${f(bx + 2 + i * 14.6 + 7.3)} ${f(G - 50)}`).join(' '));

      const bend = Math.sin(t * 0.9) * 2 + wind * 3;
      canopy.setAttribute('d', `M${tx - 4} ${G - 90} Q${f(tx - 40 + bend * 0.3)} ${G - 92} ${f(tx - 34 + bend * 0.6)} ${G - 118} Q${f(tx - 36 + bend)} ${G - 146} ${f(tx - 6 + bend)} ${G - 148} Q${f(tx + 22 + bend)} ${G - 156} ${f(tx + 34 + bend * 0.7)} ${G - 128} Q${f(tx + 46 + bend * 0.4)} ${G - 100} ${tx + 4} ${G - 92} Z`);
      leaves.setAttribute('d', `M${f(tx - 20 + bend * 0.7)} ${G - 126} q5 -3 9 0 M${f(tx + 8 + bend * 0.8)} ${G - 138} q5 -3 9 0 M${f(tx + 14 + bend * 0.6)} ${G - 112} q5 -3 9 0 M${f(tx - 10 + bend * 0.5)} ${G - 104} q4 -3 8 0`);

      // the customer lifts the cup every few seconds
      const c = (t % 7) / 7;
      const lift = c < 0.15 ? ease(c / 0.15) : c < 0.4 ? 1 : c < 0.55 ? 1 - ease((c - 0.4) / 0.15) : 0;
      const hand = [sx + 13 - lift * 4, G - 23 - lift * 20];
      sipArm.setAttribute('d', `M${sx + 3} ${G - 42} Q${f(sx + 12 - lift * 2)} ${f(G - 32 - lift * 8)} ${f(hand[0])} ${f(hand[1])}`);
      cup.setAttribute('d', `M${f(hand[0] - 1)} ${f(hand[1] - 3)} l0 3.6 l4.4 0 l0 -3.6 M${f(hand[0] + 3.4)} ${f(hand[1] - 2)} q2 0 1.4 1.6`);

      pigeons.forEach((p, i) => {
        const pk = Math.max(0, Math.sin(t * 2.4 + i * 2.1)) ** 6;
        const x = p.x + Math.sin(t * 0.3 + i) * 6;
        p.body.setAttribute('d', `M${f(x - 6)} ${G - 6} Q${f(x - 2)} ${G - 11} ${f(x + 4)} ${G - 8} Q${f(x + 6)} ${G - 4} ${f(x)} ${G - 3} Q${f(x - 4)} ${G - 3} ${f(x - 8)} ${G - 4} Z`);
        p.head.setAttribute('d', `M${f(x + 4 + pk * 3)} ${f(G - 9.6 + pk * 6)} a1.5 1.5 0 1 0 0.1 0 Z`);
        p.legs.setAttribute('d', `M${f(x - 1)} ${G - 3} l0 3 M${f(x + 1.4)} ${G - 3} l0 3`);
      });

      // planted feet: the passer-by moves exactly gait speed × scale, facing -x
      px -= pedestrianGait.speed * S * dt;
      if (px < -20) px = WIDTH + 20;
      place(passer.g, px, G, -1, S);
      passer.g.setAttribute('opacity', f(Math.min(1, (px + 20) / 60, (WIDTH + 20 - px) / 60)));
      passer.draw(dt);
    },
  };
};
