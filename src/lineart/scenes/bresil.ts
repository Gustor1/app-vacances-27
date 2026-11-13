// Scene — Brazil: Sugarloaf with its cable car, Christ the Redeemer on Corcovado,
// palms, and the Copacabana promenade with its wave mosaic, a coconut kiosk and a
// kid juggling a football.
import { el, f } from '../lib/ink.ts';
import { line, solidShape, ink, detail, rect, farLayer, ripples } from '../kit.ts';
import { G, SCENE_PEN, DETAIL_PEN, type SceneFactory } from '../scene.ts';

const WIDTH = 820;

export const bresil: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: Corcovado with the statue, Sugarloaf and the cable
  const far = farLayer(g, 0.5);
  solidShape(far, `M0 ${G - 44} Q60 ${G - 110} 110 ${G - 170} Q130 ${G - 180} 150 ${G - 160} Q200 ${G - 100} 260 ${G - 44} Z`, SCENE_PEN * 0.7);
  const cx = 128;
  solidShape(far, `M${cx - 2} ${G - 177} L${cx - 3} ${G - 200} L${cx - 14} ${G - 202} L${cx - 14} ${G - 205} L${cx + 14} ${G - 205} L${cx + 14} ${G - 202} L${cx + 3} ${G - 200} L${cx + 2} ${G - 177} Z`, SCENE_PEN * 0.6);
  solidShape(far, `M${cx - 2} ${G - 208} a2 2.4 0 1 0 4 0 a2 2.4 0 1 0 -4 0 Z`, SCENE_PEN * 0.5);
  solidShape(far, `M300 ${G - 44} Q300 ${G - 120} 350 ${G - 150} Q400 ${G - 160} 410 ${G - 100} Q414 ${G - 64} 430 ${G - 44} Z`, SCENE_PEN * 0.8);
  solidShape(far, `M230 ${G - 44} Q240 ${G - 84} 270 ${G - 90} Q296 ${G - 84} 300 ${G - 44} Z`, SCENE_PEN * 0.8);
  detail(far, `M270 ${G - 90} L352 ${G - 150} M270 ${G - 88} L352 ${G - 148}`);
  const car = el('g', {}, far);
  solidShape(car, rect(-5, 0, 10, 7), SCENE_PEN * 0.6);
  detail(car, 'M0 0 L0 -4 M-3 3 l6 0');
  line(far, `M0 ${G - 44} L460 ${G - 44}`, DETAIL_PEN * 1.4);
  const sea = detail(g, '');
  // the beach before the promenade
  detail(g, Array.from({ length: 30 }, (_, i) => `M${10 + i * 15} ${G - 20 + (i % 3)} l2 0`).join(' '));

  // palms
  const palms = [470, 560, 700].map((x, i) => {
    const h = 110 + (i % 2) * 18;
    line(g, `M${x - 2} ${G} Q${x - 8} ${G - h / 2} ${x + 4} ${G - h} M${x + 3} ${G} Q${x - 3} ${G - h / 2} ${x + 8} ${G - h}`);
    detail(g, Array.from({ length: Math.floor(h / 9) }, (_, k) => `M${f(x - 5 + Math.sin(k) * 0.6 - (k / (h / 9)) * -6)} ${G - 6 - k * 9} l6 -1.6`).join(' '));
    return { x: x + 6, y: G - h, node: line(g, '', SCENE_PEN * 0.8), nuts: ink(g, '') };
  });
  // coconut kiosk
  const kx = 600;
  // counter, four posts, a thatched roof; coconuts lined up on the counter
  line(g, `M${kx + 2} ${G - 24} L${kx + 2} ${G - 50} M${kx + 48} ${G - 24} L${kx + 48} ${G - 50}`);
  solidShape(g, rect(kx, G - 24, 50, 24));
  solidShape(g, `M${kx - 8} ${G - 50} L${kx + 58} ${G - 50} L${kx + 25} ${G - 72} Z`);
  detail(g, `M${kx - 4} ${G - 52} L${kx + 54} ${G - 52} ${Array.from({ length: 8 }, (_, k) => `M${kx - 6 + k * 8} ${G - 51} l${f(k < 4 ? 5 : -5)} -16`).join(' ')} M${kx + 4} ${G - 16} L${kx + 46} ${G - 16}`);
  [[kx + 10, G - 28], [kx + 22, G - 29], [kx + 34, G - 28]].forEach(([x, y]) => solidShape(g, `M${x - 4} ${y} a4 4.4 0 1 0 8 0 a4 4.4 0 1 0 -8 0 Z`, SCENE_PEN * 0.7));
  // surfboard against the kiosk
  solidShape(g, `M${kx + 58} ${G} Q${kx + 52} ${G - 30} ${kx + 60} ${G - 60} Q${kx + 70} ${G - 30} ${kx + 64} ${G} Z`, SCENE_PEN * 0.8);
  detail(g, `M${kx + 61} ${G - 4} L${kx + 61} ${G - 54}`);

  // the kid with the football
  const kid = el('g', {}, g);
  const kx2 = 520;
  const kidBody = solidShape(kid, '');
  const kidLegs = line(kid, '', SCENE_PEN * 1.5);
  const kidHead = el('ellipse', { rx: 2.6, ry: 3.2, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': SCENE_PEN }, kid);
  const kidArms = line(kid, '', SCENE_PEN * 1.3);
  const ball = el('g', {}, kid);
  solidShape(ball, 'M-3.4 0 a3.4 3.4 0 1 0 6.8 0 a3.4 3.4 0 1 0 -6.8 0 Z', SCENE_PEN * 0.8);
  ink(ball, 'M-1 -1.4 l2 0 l0.8 1.6 l-1.8 1.2 l-1.8 -1.2 Z');

  // the promenade: Copacabana's wave mosaic
  line(g, `M0 ${G} L${WIDTH} ${G} M0 ${G + 10} L${WIDTH} ${G + 10}`);
  detail(g, `M0 ${G + 5} ${Array.from({ length: Math.ceil(WIDTH / 24) }, () => 'q6 -4 12 0 q6 4 12 0').join(' ')} M0 ${G + 2} ${Array.from({ length: Math.ceil(WIDTH / 24) }, () => 'q6 -2 12 0 q6 2 12 0').join(' ')}`, DETAIL_PEN * 1.2);

  return {
    id: 'bresil',
    width: WIDTH,
    update({ t, wind }) {
      sea.setAttribute('d', ripples(0, 460, G - 38, 4, 5, t, 7, 3) + ` M0 ${G - 18} ${Array.from({ length: 23 }, (_, i) => `q10 ${f(-2 - Math.sin(t * 1.4 + i) * 1.2)} 20 0`).join(' ')}`);
      const u = (Math.sin(t * 0.15) + 1) / 2;
      car.setAttribute('transform', `translate(${f(270 + 82 * u)} ${f(G - 87 - 60 * u)})`);
      palms.forEach(({ x, y, node, nuts }, i) => {
        const b = Math.sin(t * 1.1 + i) * 2 + wind * 3;
        node.setAttribute('d', [[-1, -0.2], [-1, 0.5], [1, -0.2], [1, 0.5], [0.3, -1]].map(([dx, dy]) => {
          const ex = x + dx * 30 + b * 1.4, ey = y + 4 + dy * 16 + Math.abs(dx) * 10;
          return `M${x} ${y} Q${f(x + dx * 14 + b)} ${f(y - 12 + dy * 6)} ${f(ex)} ${f(ey)} ${Array.from({ length: 5 }, (_, k) => { const s = (k + 1) / 6, px = x + (ex - x) * s, py = y - 6 * Math.sin(Math.PI * s) + (ey - y) * s; return `M${f(px)} ${f(py)} l${f(dx * 2)} 5`; }).join(' ')}`;
        }).join(' '));
        nuts.setAttribute('d', `M${f(x - 3)} ${y + 3} a2.2 2.2 0 1 0 0.1 0 Z M${f(x + 2)} ${y + 4} a2.2 2.2 0 1 0 0.1 0 Z`);
      });
      // keepy-uppy: the ball rises and falls in a parabola, the kicking foot meets it
      const period = 0.9, k = (t % period) / period, hop = 4 * k * (1 - k);
      const foot = k < 0.12 || k > 0.88 ? 1 : 0;
      const ky = G, hipY = ky - 24;
      kidBody.setAttribute('d', `M${kx2 - 4} ${hipY - 18} Q${kx2} ${hipY - 21} ${kx2 + 4} ${hipY - 18} L${kx2 + 5} ${hipY} L${kx2 - 5} ${hipY} Z`);
      kidLegs.setAttribute('d', `M${kx2 - 2} ${hipY} L${kx2 - 3} ${ky - 1} M${kx2 + 2} ${hipY} L${f(kx2 + 6 + foot * 4)} ${f(ky - 8 - foot * 6)}`);
      kidHead.setAttribute('cx', String(kx2 + 0.6)); kidHead.setAttribute('cy', String(hipY - 23));
      kidArms.setAttribute('d', `M${kx2 - 3} ${hipY - 16} l-7 ${f(8 - hop * 4)} M${kx2 + 3} ${hipY - 16} l7 ${f(8 - hop * 4)}`);
      ball.setAttribute('transform', `translate(${kx2 + 10} ${f(ky - 16 - hop * 30)}) rotate(${f(t * 300)})`);
    },
  };
};
