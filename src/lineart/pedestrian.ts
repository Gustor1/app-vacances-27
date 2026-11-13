// A reusable passer-by in figure space (feet y = 120, facing +x). Scenes give each
// country its own hat and prop; the body, gait and swinging arms are shared.
import { el, pen, shape, blot, limb, shoe, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { spring } from './lib/motion.ts';

export type Hat = 'beret' | 'none' | 'bun' | 'conical';
export type Prop = 'baguette' | 'palanche' | 'none';

export const pedestrianGait = gait({ kind: 'walk', period: 1.05 });

export function createPedestrian(parent: Element, look: { hat?: Hat; prop?: Prop } = {}) {
  const g = el('g', {}, parent);
  const farArm = limb(g, 3.4);
  const legs = [limb(g, 4), limb(g, 4)];
  const shoes = [blot(g), blot(g)];
  const coat = shape(g);
  const belt = pen(g, PEN * 0.6);
  const head = el('ellipse', { rx: 3.5, ry: 4.5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hat = blot(g);
  const cone = look.hat === 'conical' ? shape(g, PEN * 0.9) : null;
  const coneRib = cone ? pen(g, PEN * 0.45) : null;
  // shoulder pole with two baskets: drawn behind the near arm, swinging with `pole`
  const yoke = look.prop === 'palanche' ? pen(g, PEN * 1.1) : null;
  const baskets = yoke ? [shape(g, PEN * 0.8), shape(g, PEN * 0.8)] : [];
  const cords = yoke ? pen(g, PEN * 0.5) : null;
  const baguette = look.prop === 'baguette' ? shape(g, PEN * 0.8) : null;
  const scores = baguette ? pen(g, PEN * 0.5) : null;
  const nearArm = limb(g, 3.4);
  const swing = [spring(60, 9), spring(60, 9)];
  let phase = Math.random();

  return {
    g,
    /** `pole`: swing angle (radians) of the baskets, from a pendulum owned by the scene. */
    draw(dt: number, pole = 0) {
      phase += dt / pedestrianGait.period;
      const p = pedestrianGait.pose(phase);
      const b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      g.insertBefore(legs[p.front].g, coat); g.insertBefore(shoes[p.front], coat);

      const kF = p.feet[p.front].knee, aF = p.feet[p.front].ankle;
      const sh: Vec = [41, 41 + b];
      const fx = Math.max(kF[0] + 2.2, 46.2);
      coat.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.6)} ${f(70 + b)} Q${f(fx)} ${f(80 + b * 0.5)} ${f(Math.max(fx, aF[0] - 5))} ${f(88)} L${f(31.4)} ${f(89)} L${f(33.4)} ${f(70 + b)}Z`);
      belt.setAttribute('d', `M${f(34)} ${f(63 + b)} Q${f(40)} ${f(64.4 + b)} ${f(fx - 1)} ${f(63 + b)}`);

      const hc: Vec = [42.4, 31.6 + b];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      const x = hc[0], y = hc[1];
      if (look.hat === 'beret') hat.setAttribute('d', `M${f(x - 5.2)} ${f(y - 2)} Q${f(x - 4.6)} ${f(y - 7.4)} ${f(x + 1)} ${f(y - 6.6)} Q${f(x + 5.6)} ${f(y - 6)} ${f(x + 4.4)} ${f(y - 2.4)} Q${f(x)} ${f(y - 3.6)} ${f(x - 5.2)} ${f(y - 2)}Z M${f(x)} ${f(y - 6.8)} l0.4 -1.6 l0.8 0.2Z`);
      else if (look.hat === 'bun') hat.setAttribute('d', `M${f(x - 3.8)} ${f(y - 1)} Q${f(x - 4)} ${f(y - 5.6)} ${f(x + 0.4)} ${f(y - 5.2)} Q${f(x + 3.8)} ${f(y - 4.6)} ${f(x + 3.4)} ${f(y - 2)} Q${f(x)} ${f(y - 3)} ${f(x - 3.8)} ${f(y - 1)}Z M${f(x - 5.6)} ${f(y - 4.4)} a2.2 2.2 0 1 0 0.1 0Z`);
      else hat.setAttribute('d', '');
      if (cone && coneRib) {
        cone.setAttribute('d', `M${f(x - 11)} ${f(y - 1.4)} L${f(x)} ${f(y - 11)} L${f(x + 11)} ${f(y - 1.4)} Q${f(x)} ${f(y + 0.6)} ${f(x - 11)} ${f(y - 1.4)}Z`);
        coneRib.setAttribute('d', `M${f(x)} ${f(y - 11)} L${f(x - 4)} ${f(y - 0.6)} M${f(x)} ${f(y - 11)} L${f(x + 4)} ${f(y - 0.6)}`);
      }

      const legSwing = (p.feet[0].ankle[0] - 40) / (pedestrianGait.stride / 2);
      const farA = swing[0].step(-legSwing * 16, dt) * Math.PI / 180;
      const shF: Vec = [sh[0] - 1, sh[1] + 2], shN: Vec = [sh[0] + 1.4, sh[1] + 2.4];
      const elbF: Vec = [shF[0] + 17 * Math.sin(farA), shF[1] + 17 * Math.cos(farA)];
      farArm.draw([shF, elbF, [elbF[0] + 16 * Math.sin(farA + 0.25), elbF[1] + 16 * Math.cos(farA + 0.25)]], [0.2, 0.5]);
      if (yoke && cords) {
        // the near hand steadies the pole in front of the shoulder
        const a: Vec = [sh[0] - 30, sh[1] - 1 + b * 0.2], z: Vec = [sh[0] + 30, sh[1] - 1 + b * 0.2];
        yoke.setAttribute('d', `M${f(a[0])} ${f(a[1] + 1.4)} Q${f(sh[0])} ${f(sh[1] - 3 + b * 1.4)} ${f(z[0])} ${f(z[1] + 1.4)}`);
        const hangPt = (end: Vec, side: number): Vec => [end[0] + Math.sin(pole * side) * 18, end[1] + Math.cos(pole) * 18];
        const ends = [hangPt(a, 1), hangPt(z, 1)];
        baskets.forEach((n, i) => { const [bx, by] = ends[i]; n.setAttribute('d', `M${f(bx - 7)} ${f(by)} L${f(bx + 7)} ${f(by)} L${f(bx + 5)} ${f(by + 8)} L${f(bx - 5)} ${f(by + 8)}Z`); });
        cords.setAttribute('d', [a, z].map((e, i) => `M${f(e[0])} ${f(e[1] + 1)} L${f(ends[i][0] - 6)} ${f(ends[i][1])} M${f(e[0])} ${f(e[1] + 1)} L${f(ends[i][0] + 6)} ${f(ends[i][1])}`).join(' '));
        const hand: Vec = [sh[0] + 10, sh[1] - 1];
        nearArm.draw([shN, [shN[0] + 10, shN[1] + 10], hand], [0.2, 0.4]);
      } else if (baguette && scores) {
        // baguette tucked under the near arm: the arm stays bent and barely swings
        const nearA = swing[1].step(legSwing * 3, dt) * Math.PI / 180;
        const elb: Vec = [shN[0] + 1 + 15 * Math.sin(nearA), shN[1] + 16];
        const hand: Vec = [elb[0] + 12, elb[1] - 2];
        nearArm.draw([shN, elb, hand], [0.2, 0.4]);
        const a: Vec = [shN[0] - 12, shN[1] + 11], z: Vec = [hand[0] + 7, hand[1] + 0.4];
        baguette.setAttribute('d', `M${f(a[0])} ${f(a[1] - 1.6)} Q${f((a[0] + z[0]) / 2)} ${f((a[1] + z[1]) / 2 - 3)} ${f(z[0])} ${f(z[1] - 1.6)} Q${f(z[0] + 2)} ${f(z[1])} ${f(z[0])} ${f(z[1] + 1.6)} Q${f((a[0] + z[0]) / 2)} ${f((a[1] + z[1]) / 2 + 0.6)} ${f(a[0])} ${f(a[1] + 1.6)} Q${f(a[0] - 2)} ${f(a[1])} ${f(a[0])} ${f(a[1] - 1.6)}Z`);
        const dx = (z[0] - a[0]) / 5, dy = (z[1] - a[1]) / 5;
        scores.setAttribute('d', [1, 2, 3, 4].map(i => `M${f(a[0] + dx * i - 1.4)} ${f(a[1] + dy * i - 2.4)} l2.6 1.4`).join(' '));
      } else {
        const nearA = swing[1].step(legSwing * 14, dt) * Math.PI / 180;
        const elb: Vec = [shN[0] + 17 * Math.sin(nearA), shN[1] + 17 * Math.cos(nearA)];
        nearArm.draw([shN, elb, [elb[0] + 16 * Math.sin(nearA + 0.1), elb[1] + 16 * Math.cos(nearA + 0.1)]], [0.2, 0.4]);
      }
    },
  };
}
