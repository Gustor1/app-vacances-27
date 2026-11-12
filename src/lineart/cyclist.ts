// A rider on a city bike, in figure space (ground y = 120, facing +x). The wheels
// turn by exactly distance / radius and the cranks follow at a gear ratio, so the
// bike rolls instead of sliding. Used for students on campus and Asian streets.
import { el, pen, shape, blot, limb, joint, f, PEN, PAPER, type Vec } from './lib/ink.ts';

const R = 13, BACK: Vec = [20, 107], FRONT: Vec = [64, 107], CRANK: Vec = [40, 107], SEAT: Vec = [35, 76], BAR: Vec = [59, 71];

export function createCyclist(parent: Element, look: { hat?: 'conical' | 'none'; basket?: boolean; bag?: boolean } = {}) {
  const g = el('g', {}, parent);
  const farLeg = limb(g, 4);
  const wheels = [pen(g, PEN), pen(g, PEN)];
  const spokes = pen(g, PEN * 0.45);
  pen(g, PEN).setAttribute('d', `M${BACK[0]} ${BACK[1]} L${CRANK[0]} ${CRANK[1]} L${SEAT[0] + 1} ${SEAT[1] + 4} M${CRANK[0]} ${CRANK[1]} L${BAR[0] - 3} ${BAR[1] + 8} L${SEAT[0] + 1} ${SEAT[1] + 6} M${BACK[0]} ${BACK[1]} L${SEAT[0] + 1} ${SEAT[1] + 4} M${FRONT[0]} ${FRONT[1]} L${BAR[0] - 1} ${BAR[1] + 2} L${BAR[0] + 2} ${BAR[1] - 1}`);
  blot(g).setAttribute('d', `M${SEAT[0] - 5} ${SEAT[1] + 1} Q${SEAT[0]} ${SEAT[1] - 2} ${SEAT[0] + 5} ${SEAT[1] + 1} L${SEAT[0] - 4} ${SEAT[1] + 2.6}Z`);
  if (look.basket) shape(g, PEN * 0.8).setAttribute('d', `M${BAR[0] + 1} ${BAR[1] + 4} L${BAR[0] + 12} ${BAR[1] + 4} L${BAR[0] + 10} ${BAR[1] + 13} L${BAR[0] + 2} ${BAR[1] + 13}Z`);
  const crank = pen(g, PEN * 1.2);
  const body = shape(g);
  const bag = look.bag ? shape(g, PEN * 0.9) : null;
  const head = el('ellipse', { rx: 3.5, ry: 4.4, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hat = look.hat === 'conical' ? shape(g, PEN * 0.9) : blot(g);
  const arm = limb(g, 3.4);
  const nearLeg = limb(g, 4);
  let angle = 0;

  return {
    g,
    /** distance travelled this frame, in figure units */
    draw(distance: number, t: number) {
      angle += distance / R;
      const c = angle / 2.4;
      const pedal = (a: number): Vec => [CRANK[0] + 7 * Math.cos(a), CRANK[1] + 7 * Math.sin(a)];
      const p1 = pedal(c), p2 = pedal(c + Math.PI);
      wheels.forEach((w, i) => { const [x, y] = i ? FRONT : BACK; w.setAttribute('d', `M${x - R} ${y} a${R} ${R} 0 1 0 ${2 * R} 0 a${R} ${R} 0 1 0 ${-2 * R} 0`); });
      spokes.setAttribute('d', [BACK, FRONT].map(([x, y]) => [0, 1, 2].map(k => { const a = angle + (k * Math.PI) / 3; return `M${f(x - R * Math.cos(a))} ${f(y - R * Math.sin(a))} L${f(x + R * Math.cos(a))} ${f(y + R * Math.sin(a))}`; }).join(' ')).join(' '));
      crank.setAttribute('d', `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])}`);
      const bob = Math.sin(t * 2.2) * 0.4;
      const hip: Vec = [SEAT[0] + 1, SEAT[1] - 2 + bob];
      farLeg.draw([hip, joint(hip, p2, 23, 22, 1), p2], [0.3, 0.8]);
      nearLeg.draw([hip, joint(hip, p1, 23, 22, 1), p1], [0.3, 0.8]);
      const sh: Vec = [47, 46 + bob];
      body.setAttribute('d', `M${f(hip[0] - 5)} ${f(hip[1] + 2)} L${f(sh[0] - 6)} ${f(sh[1] + 2)} Q${f(sh[0])} ${f(sh[1] - 3)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(hip[0] + 7)} ${f(hip[1] + 1)} Z`);
      if (bag) bag.setAttribute('d', `M${f(sh[0] - 7)} ${f(sh[1] + 2)} Q${f(sh[0] - 16)} ${f(sh[1] + 4)} ${f(sh[0] - 14)} ${f(sh[1] + 16)} L${f(hip[0] - 3)} ${f(hip[1] - 4)} Z`);
      const hc: Vec = [sh[0] + 4, sh[1] - 9];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      if (look.hat === 'conical') hat.setAttribute('d', `M${f(hc[0] - 9)} ${f(hc[1] - 1)} L${f(hc[0])} ${f(hc[1] - 10)} L${f(hc[0] + 9)} ${f(hc[1] - 1)} Z`);
      else hat.setAttribute('d', `M${f(hc[0] - 3.8)} ${f(hc[1] - 0.6)} Q${f(hc[0] - 4)} ${f(hc[1] - 5.4)} ${f(hc[0] + 0.4)} ${f(hc[1] - 5)} Q${f(hc[0] + 3.8)} ${f(hc[1] - 4.6)} ${f(hc[0] + 3.4)} ${f(hc[1] - 1.6)} Q${f(hc[0])} ${f(hc[1] - 2.6)} ${f(hc[0] - 3.8)} ${f(hc[1] - 0.6)}Z`);
      arm.draw([[sh[0] + 1, sh[1] + 2], joint([sh[0] + 1, sh[1] + 2], BAR, 15, 15, -1), BAR], [0.2, 0.4]);
    },
  };
}
