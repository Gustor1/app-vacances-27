// The backpacker who walks through every scene. Figure space (lib/ink.ts):
// ~95 units tall, feet on y = 120, facing +x, hip above x = 40.
import { el, pen, shape, blot, limb, shoe, joint, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { spring, ease, clamp } from './lib/motion.ts';

/** A brisk walk: the world scrolls at exactly `speed × scale` so the planted foot stays put. */
export const travelerGait = gait({ kind: 'walk', period: 0.9 });

const lerp = (a: Vec, b: Vec, t: number): Vec => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const READ = 6.5, WALK = 7.5, BLEND = 0.9, CYCLE = READ + WALK;

/** 0 = map folded in one hand, 1 = map open in both hands. Starts reading. */
function readingAmount(t: number): number {
  const u = ((t % CYCLE) + CYCLE) % CYCLE;
  if (u < READ) return u < BLEND ? ease(u / BLEND) : 1;
  return u - READ < BLEND ? 1 - ease((u - READ) / BLEND) : 0;
}

export function createTraveler(parent: Element) {
  const g = el('g', { class: 'line-art-traveler' }, parent);
  const pack = el('g', {}, g);
  const mat = shape(pack), packBody = shape(pack), packLines = pen(pack, PEN * 0.6);
  const farArm = limb(g, 3.6);
  const legs = [limb(g, 4.2), limb(g, 4.2)];
  const shoes = [blot(g), blot(g)];
  const jacket = shape(g);
  const strap = pen(g, PEN * 0.8);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const cap = blot(g);
  const map = shape(g, PEN * 0.8);
  const mapLines = pen(g, PEN * 0.5);
  const nearArm = limb(g, 3.6);

  const swing = [spring(60, 9), spring(60, 9)];
  const packBounce = spring(90, 8);
  let phase = 0;

  return {
    g,
    draw(t: number, dt: number) {
      phase += dt / travelerGait.period;
      const p = travelerGait.pose(phase);
      const b = p.bob;
      const r = readingAmount(t);

      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      g.insertBefore(legs[p.front].g, jacket); g.insertBefore(shoes[p.front], jacket);

      // backpack rides on the back, lagging the bob through a spring
      const pb = b + packBounce.step(b, dt) * 0.35 - b * 0.35;
      packBody.setAttribute('d', `M${f(35)} ${f(42 + pb)} Q${f(24)} ${f(41 + pb)} ${f(23.4)} ${f(50 + pb)} L${f(23)} ${f(70 + pb)} Q${f(23.4)} ${f(75 + pb)} ${f(30)} ${f(75 + pb)} L${f(36)} ${f(74 + pb)}Z`);
      mat.setAttribute('d', `M${f(22.6)} ${f(38 + pb)} Q${f(22)} ${f(42.6 + pb)} ${f(25)} ${f(42.6 + pb)} L${f(36)} ${f(42.6 + pb)} Q${f(38)} ${f(40.3 + pb)} ${f(36)} ${f(38 + pb)}Z`);
      packLines.setAttribute('d', `M${f(24)} ${f(58 + pb)} Q${f(29)} ${f(56.6 + pb)} ${f(35)} ${f(58 + pb)} M${f(26)} ${f(62 + pb)} L${f(26)} ${f(71 + pb)} M${f(25)} ${f(40.3 + pb)} L${f(35.6)} ${f(40.3 + pb)}`);

      // short jacket, hem opening with the forward knee
      const kF = p.feet[p.front].knee;
      const sh: Vec = [41, 41 + b];
      const fx = Math.max(kF[0] + 1.2, 46);
      jacket.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.4)} ${f(66 + b)} Q${f(fx + 0.4)} ${f(74 + b)} ${f(fx - 1)} ${f(79 + b)} L${f(33.4)} ${f(80 + b)} L${f(34.2)} ${f(64 + b)}Z`);
      strap.setAttribute('d', `M${f(sh[0] - 2.6)} ${f(sh[1] + 0.6)} Q${f(sh[0] - 0.6)} ${f(56 + b)} ${f(36.4)} ${f(70 + b)}`);

      // head dips toward the map while reading
      const hc: Vec = [42.6 + r * 0.8, 31.6 + b + r * 0.9];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      cap.setAttribute('d', `M${f(hc[0] - 3.9)} ${f(hc[1] - 1.4)} Q${f(hc[0] - 4)} ${f(hc[1] - 5.8)} ${f(hc[0])} ${f(hc[1] - 5.6)} Q${f(hc[0] + 3.6)} ${f(hc[1] - 5.4)} ${f(hc[0] + 3.8)} ${f(hc[1] - 2.2)} L${f(hc[0] + 8)} ${f(hc[1] - 1.6)} Q${f(hc[0] + 7)} ${f(hc[1] - 0.6)} ${f(hc[0] + 3.4)} ${f(hc[1] - 0.8)} L${f(hc[0] - 3.9)} ${f(hc[1] - 1.4)}Z`);

      // arms: swinging opposite the legs, or both hands holding the open map
      const legSwing = (p.feet[0].ankle[0] - 40) / (travelerGait.stride / 2);
      const farA = swing[0].step(-legSwing * 15 * (1 - r), dt) * Math.PI / 180;
      const nearA = swing[1].step(legSwing * 12 * (1 - r), dt) * Math.PI / 180;
      const shF: Vec = [sh[0] - 1, sh[1] + 2], shN: Vec = [sh[0] + 1.6, sh[1] + 2.4];
      const swingHand = (s: Vec, a: number): Vec => [s[0] + 17 * Math.sin(a) + 16 * Math.sin(a + 0.15), s[1] + 17 * Math.cos(a) + 16 * Math.cos(a + 0.15)];
      const mapL: Vec = [48.6, 56 + b], mapR: Vec = [60, 54.6 + b];
      const handF = lerp(swingHand(shF, farA), mapL, r);
      const handN = lerp(swingHand(shN, nearA), mapR, r);
      farArm.draw([shF, joint(shF, handF, 17, 16, -1), handF], [0.2, 0.5]);
      nearArm.draw([shN, joint(shN, handN, 17, 16, -1), handN], [0.2, 0.4]);

      // the map unfolds from a small packet in the near hand to a sheet held at chest height
      const w = 3 + 9 * r, h = 4.6 + 7.4 * r, tilt = -0.12 * r;
      const ox = handN[0] - w * (1 - r * 0.02), oy = handN[1] - h * 0.55;
      const P = (x: number, y: number): string => `${f(ox + x * Math.cos(tilt) - y * Math.sin(tilt))} ${f(oy + x * Math.sin(tilt) + y * Math.cos(tilt))}`;
      map.setAttribute('d', `M${P(0, 0)} L${P(w, 0)} L${P(w + 0.4, h)} L${P(0.4, h)}Z`);
      const folds = r > 0.3 ? `M${P(w / 3, 0)} L${P(w / 3 + 0.2, h)} M${P((2 * w) / 3, 0)} L${P((2 * w) / 3 + 0.2, h)} M${P(1.4, h * 0.7)} Q${P(w * 0.4, h * 0.2)} ${P(w - 1.4, h * 0.45)}` : '';
      mapLines.setAttribute('d', folds);
      mapLines.setAttribute('opacity', f(clamp((r - 0.3) / 0.4, 0, 1)));
    },
  };
}
