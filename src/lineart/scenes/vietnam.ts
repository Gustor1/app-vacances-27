// Scene — Vietnam: Ha Long Bay's limestone islets and a sailing junk, rice terraces
// on the hills, then a Hanoi street: narrow tube houses with balconies, a phở stall
// on tiny stools, scooters passing, and a vendor with a shoulder pole.
import { el, f, place } from '../lib/ink.ts';
import { pendulum, seeded } from '../lib/motion.ts';
import { createCyclist } from '../cyclist.ts';
import { createPedestrian, pedestrianGait } from '../pedestrian.ts';
import { line, solidShape, detail, rect, farLayer, label, ripples, loop, stillFigure } from '../kit.ts';
import { G, S, SCENE_PEN, DETAIL_PEN, type SceneFactory } from '../scene.ts';

const WIDTH = 840;
const BAY_END = 330;

export const vietnam: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // --- far: rice terraces on the hills behind the bay
  const hills = farLayer(g, 0.35);
  solidShape(hills, `M0 ${G - 44} Q90 ${G - 120} 190 ${G - 110} Q270 ${G - 100} ${BAY_END + 40} ${G - 44} Z`, SCENE_PEN * 0.7);
  detail(hills, Array.from({ length: 8 }, (_, k) => `M${30 + k * 6} ${G - 50 - k * 7} Q${150} ${G - 64 - k * 7} ${300 - k * 10} ${G - 52 - k * 6}`).join(' '));
  // islets of Ha Long, undercut at the waterline
  const islets = farLayer(g, 0.6);
  const r = seeded(17);
  [[20, 34, 70], [70, 22, 50], [120, 40, 92], [190, 26, 60], [240, 34, 78], [292, 20, 44]].forEach(([x, w, h]) => {
    solidShape(islets, `M${x + 3} ${G - 44} Q${x - 2} ${G - 50} ${x + 2} ${G - 44 - h * 0.6} Q${x + w * 0.3} ${G - 44 - h} ${x + w * 0.6} ${G - 44 - h + 4} Q${x + w + 2} ${G - 44 - h * 0.5} ${x + w - 3} ${G - 50} Q${x + w} ${G - 44} ${x + w - 4} ${G - 44} Z`, SCENE_PEN * 0.8);
    detail(islets, `M${x + w * 0.4} ${G - 44 - h * 0.8} q${f(r(-4, 4))} 10 ${f(r(-2, 2))} 22 M${x + w * 0.7} ${G - 44 - h * 0.6} q-3 8 0 14`);
  });
  const bay = detail(g, '');
  const junk = el('g', {}, g);
  solidShape(junk, 'M-20 0 L18 0 Q24 -3 26 -8 L-26 -6 Q-24 -1 -20 0 Z', SCENE_PEN * 0.8);
  solidShape(junk, 'M-6 -6 Q-18 -24 -16 -40 L-4 -40 L-4 -6 Z M6 -7 Q-2 -20 0 -32 L10 -32 L10 -7 Z', SCENE_PEN * 0.7);
  detail(junk, 'M-4 -14 l-12 -2 M-4 -22 l-13 -2 M-4 -30 l-13 -2 M10 -15 l-9 -2 M10 -23 l-9 -2');
  line(g, `M0 ${G - 16} L${BAY_END} ${G - 16}`, SCENE_PEN * 0.8);
  detail(g, Array.from({ length: 12 }, (_, i) => `M${8 + i * 28} ${G - 18} L${8 + i * 28} ${G}`).join(' '), SCENE_PEN * 0.8);

  // --- Hanoi tube houses: tall and narrow, balconies, plants, power lines
  const houses: Array<[number, number, number]> = [[BAY_END + 20, 62, 150], [BAY_END + 82, 54, 170], [BAY_END + 136, 66, 140], [BAY_END + 202, 58, 176], [BAY_END + 260, 64, 156], [BAY_END + 324, 60, 138], [BAY_END + 384, 70, 164], [BAY_END + 454, 56, 146]];
  houses.forEach(([x, w, h]) => {
    solidShape(g, rect(x, G - h, w, h));
    solidShape(g, rect(x - 2, G - h - 5, w + 4, 5), SCENE_PEN * 0.8);
    for (let y = G - h + 14; y < G - 52; y += 38) {
      solidShape(g, rect(x + 10, y, w - 20, 22), SCENE_PEN * 0.8);
      detail(g, `M${x + w / 2} ${y} l0 22 M${x + 6} ${y + 26} L${x + w - 6} ${y + 26} ${Array.from({ length: Math.floor((w - 12) / 5) }, (_, k) => `M${x + 8 + k * 5} ${y + 26} l0 6`).join(' ')} M${x + 6} ${y + 32} L${x + w - 6} ${y + 32}`);
      detail(g, `M${x + 10} ${y + 26} q-2 -6 -5 -7 M${x + 13} ${y + 26} q0 -6 2 -8`);
    }
    solidShape(g, rect(x + 6, G - 40, w - 12, 40), SCENE_PEN * 0.8);
    detail(g, Array.from({ length: 8 }, (_, k) => `M${x + 6} ${G - 36 + k * 4.4} L${x + w - 6} ${G - 36 + k * 4.4}`).join(' '), DETAIL_PEN * 0.6);
  });
  detail(g, `M${BAY_END} ${G - 120} Q${BAY_END + 120} ${G - 108} ${BAY_END + 260} ${G - 122} Q${BAY_END + 380} ${G - 110} ${WIDTH} ${G - 124} M${BAY_END} ${G - 116} Q${BAY_END + 140} ${G - 102} ${WIDTH} ${G - 118}`, DETAIL_PEN * 1.2);
  // the phở stall: a sign, a pot steaming, low stools, a customer
  const px = BAY_END + 150;
  solidShape(g, rect(px - 10, G - 64, 52, 14), SCENE_PEN * 0.8);
  label(g, px + 16, G - 53.4, 'PHỞ', 9, 'sans');
  solidShape(g, rect(px, G - 22, 30, 22), SCENE_PEN * 0.8);
  solidShape(g, `M${px + 4} ${G - 22} L${px + 4} ${G - 34} Q${px + 15} ${G - 38} ${px + 26} ${G - 34} L${px + 26} ${G - 22} Z`, SCENE_PEN * 0.8);
  const steam = detail(g, '');
  [px + 48, px + 76].forEach(x => solidShape(g, `M${x - 5} ${G} L${x - 4} ${G - 8} L${x + 4} ${G - 8} L${x + 5} ${G} Z`, SCENE_PEN * 0.7));
  stillFigure(g, px + 44, G + 5, { sit: 1 });

  const scooters = [
    { c: createCyclist(g, { hat: 'conical', basket: true }), speed: 38, start: BAY_END + 60, dir: 1 as const },
    { c: createCyclist(g, {}), speed: 56, start: WIDTH - 40, dir: -1 as const },
  ];
  const vendor = createPedestrian(g, { hat: 'conical', prop: 'palanche' });
  const pole = pendulum(9, 1.5);

  line(g, `M0 ${G} L${WIDTH} ${G} M0 ${G + 10} L${WIDTH} ${G + 10}`);
  detail(g, Array.from({ length: Math.floor((WIDTH - BAY_END) / 26) }, (_, i) => `M${BAY_END + i * 26 + 9} ${G} l0 10`).join(' '));
  const walkSpeed = pedestrianGait.speed * S;

  return {
    id: 'vietnam',
    width: WIDTH,
    update({ t, dt, wind }) {
      bay.setAttribute('d', ripples(0, BAY_END, G - 38, 4, 5.5, t, 4, 6));
      const jp = loop(60, 6, t, 10, BAY_END - 20, 34);
      junk.setAttribute('transform', `translate(${f(jp.x)} ${f(G - 24 + Math.sin(t * 1.2) * 0.6)}) scale(0.75)`);
      junk.setAttribute('opacity', f(jp.alpha * 0.85));
      steam.setAttribute('d', [0, 1].map(k => { const u = (t * 0.45 + k / 2) % 1; return u > 0.9 ? '' : `M${f(px + 11 + k * 8 + Math.sin(t * 2 + k) * 2)} ${f(G - 40 - u * 22)} q3 -4 0 -8 q-3 -4 0 -8`; }).join(' '));
      scooters.forEach(({ c, speed, start, dir }) => {
        const p = loop(start, dir * speed, t, BAY_END - 20, WIDTH + 20, 40);
        place(c.g, p.x, G, dir, S); c.g.setAttribute('opacity', f(p.alpha));
        c.draw((speed * dt) / S, t);
      });
      const vp = loop(WIDTH - 60, -walkSpeed, t, BAY_END, WIDTH + 20, 40);
      place(vendor.g, vp.x, G, -1, S); vendor.g.setAttribute('opacity', f(vp.alpha));
      vendor.draw(dt, pole.step(Math.sin(t * 2 * Math.PI / pedestrianGait.period) * 0.8 + wind * 0.2, dt));
    },
  };
};
