// Scene 0 — departure: control tower, terminal, windsock, and a plane taking off.
import { el, pen, shape, blot, f } from '../lib/ink.ts';
import { ease } from '../lib/motion.ts';
import { G, SCENE_PEN, DETAIL_PEN, ground, type SceneFactory } from '../scene.ts';

const WIDTH = 600;
const TAKEOFF = 19; // seconds per take-off cycle
const FAR = G - 34; // far runway, behind the buildings
const PLANE_SCALE = 0.8;

export const depart: SceneFactory = parent => {
  const g = el('g', {}, parent);

  // far clouds, thin and sparse
  const clouds = pen(g, DETAIL_PEN);

  // far apron in diluted ink: the plane rolls out from behind the terminal and lifts off,
  // small because it is far away (a near airliner would dwarf the whole card)
  const far = el('g', { opacity: 0.55 }, g);
  pen(far, DETAIL_PEN * 1.4).setAttribute('d', `M0 ${FAR} L${WIDTH - 90} ${FAR}`);
  // the plane: side elevation, nose toward +x, drawn around (0,0) = main gear
  const plane = el('g', {}, far);
  shape(plane, SCENE_PEN).setAttribute('d', 'M-70 -14 L-84 -36 L-74 -36 L-56 -16 Z');
  shape(plane, SCENE_PEN).setAttribute('d', 'M-78 -10 Q-80 -17 -70 -18 L30 -18 Q48 -18 54 -10 Q50 -4 34 -3 L-60 -3 Q-74 -4 -78 -10 Z');
  pen(plane, DETAIL_PEN).setAttribute('d', `${Array.from({ length: 14 }, (_, i) => `M${-48 + i * 5.4} -12.4 l1.6 0`).join(' ')} M40 -15 l6 1.6`);
  shape(plane, SCENE_PEN).setAttribute('d', 'M-14 -7 L18 -7 L6 6 L-2 6 Z');
  shape(plane, SCENE_PEN).setAttribute('d', 'M-6 1 L12 1 Q15 3 12 5 L-6 5 Q-8 3 -6 1 Z');
  const gear = pen(plane, SCENE_PEN);
  const wheels = blot(plane);

  // runway: ground line, edge line and centre dashes
  ground(g, WIDTH, 0);
  pen(g, DETAIL_PEN * 1.6).setAttribute('d', Array.from({ length: 15 }, (_, i) => `M${i * 40 + 8} ${G + 5} l16 0`).join(' '));

  // control tower
  shape(g, SCENE_PEN).setAttribute('d', `M96 ${G} L100 ${G - 140} L114 ${G - 140} L118 ${G} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M101 ${G - 30} L113 ${G - 30} M100.6 ${G - 70} L113.4 ${G - 70} M100.2 ${G - 110} L113.8 ${G - 110} M107 ${G - 14} l0 14`);
  shape(g, SCENE_PEN).setAttribute('d', `M88 ${G - 140} L126 ${G - 140} L132 ${G - 166} L82 ${G - 166} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', [92, 99, 107, 115, 122].map(x => `M${x} ${G - 143} L${x + (x - 107) * 0.18} ${G - 163}`).join(' '));
  shape(g, SCENE_PEN).setAttribute('d', `M80 ${G - 166} L134 ${G - 166} Q132 ${G - 171} 127 ${G - 172} L87 ${G - 172} Q82 ${G - 171} 80 ${G - 166} Z`);
  pen(g, SCENE_PEN).setAttribute('d', `M107 ${G - 172} L107 ${G - 186}`);
  const radar = pen(g, SCENE_PEN);

  // terminal: long glass hall under an overhanging roof
  shape(g, SCENE_PEN).setAttribute('d', `M160 ${G} L160 ${G - 58} L360 ${G - 58} L360 ${G} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M150 ${G - 58} L370 ${G - 58} Q368 ${G - 64} 362 ${G - 65} L158 ${G - 65} Q152 ${G - 64} 150 ${G - 58} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', [...Array.from({ length: 17 }, (_, i) => `M${170 + i * 11.4} ${G - 52} L${170 + i * 11.4} ${G - 4}`), `M166 ${G - 34} L354 ${G - 34}`].join(' '));
  shape(g, SCENE_PEN * 0.8).setAttribute('d', `M248 ${G} L248 ${G - 30} L272 ${G - 30} L272 ${G} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M260 ${G - 30} L260 ${G}`);
  // a departures board drawn as a pictogram: plane rising over three lines
  shape(g, SCENE_PEN * 0.7).setAttribute('d', `M300 ${G - 52} L344 ${G - 52} L344 ${G - 38} L300 ${G - 38} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M304 ${G - 42} l8 -6 M306 ${G - 47} l5 1 M318 ${G - 47} l22 0 M318 ${G - 43} l18 0`);

  // windsock
  pen(g, SCENE_PEN).setAttribute('d', `M410 ${G} L410 ${G - 70}`);
  const sock = shape(g, SCENE_PEN * 0.8);
  const sockBands = pen(g, DETAIL_PEN);

  // baggage cart with suitcases
  shape(g, SCENE_PEN).setAttribute('d', `M462 ${G - 8} L540 ${G - 8} L540 ${G - 12} L462 ${G - 12} Z`);
  pen(g, SCENE_PEN).setAttribute('d', `M462 ${G - 10} l-12 -4`);
  [472, 528].forEach(x => el('circle', { cx: x, cy: G - 3.6, r: 3.6, fill: 'currentColor' }, g));
  shape(g, SCENE_PEN).setAttribute('d', `M468 ${G - 12} L468 ${G - 32} Q468 ${G - 34} 470 ${G - 34} L492 ${G - 34} Q494 ${G - 34} 494 ${G - 32} L494 ${G - 12} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M498 ${G - 12} L498 ${G - 26} L534 ${G - 26} L534 ${G - 12} Z`);
  shape(g, SCENE_PEN).setAttribute('d', `M504 ${G - 26} L504 ${G - 40} L526 ${G - 40} L526 ${G - 26} Z`);
  pen(g, DETAIL_PEN).setAttribute('d', `M476 ${G - 34} q5 -5 10 0 M511 ${G - 40} q4 -4 8 0 M481 ${G - 12} l0 -22 M516 ${G - 12} l0 -14`);


  return {
    id: 'depart',
    width: WIDTH,
    update({ t, wind }) {
      clouds.setAttribute('d', [[60, 54], [250, 34], [430, 66]].map(([x, y], i) => {
        const cx = ((x + t * (2 + i)) % (WIDTH + 80)) - 40;
        return `M${f(cx)} ${y} q6 -8 14 -3 q6 -9 16 -2 q8 -2 9 5 M${f(cx + 8)} ${y + 4} l22 0`;
      }).join(' '));
      const k = Math.cos(t * 1.8);
      radar.setAttribute('d', `M${f(107 - 7 * k)} ${G - 186} Q107 ${G - 191} ${f(107 + 7 * k)} ${G - 186}`);

      // windsock fills and flaps with the breeze
      const lift = 0.55 + 0.25 * wind, flap = Math.sin(t * 6.3) * 1.6;
      const tip = [410 + 30 * lift + 10, G - 64 + 30 * (1 - lift) + flap];
      sock.setAttribute('d', `M410 ${G - 70} L${f(tip[0])} ${f(tip[1] - 2.5)} L${f(tip[0])} ${f(tip[1] + 2.5)} L410 ${G - 58} Z`);
      sockBands.setAttribute('d', [0.33, 0.66].map(u => { const x = 410 + (tip[0] - 410) * u, yt = G - 70 + (tip[1] - 2.5 - (G - 70)) * u, yb = G - 58 + (tip[1] + 2.5 - (G - 58)) * u; return `M${f(x)} ${f(yt)} L${f(x)} ${f(yb)}`; }).join(' '));

      // take-off: roll, rotate, climb out of the top of the card
      const u = (t % TAKEOFF) / TAKEOFF;
      const roll = ease(Math.min(1, u / 0.85));
      const x = 120 + 760 * roll * roll;
      const climb = Math.max(0, x - 430);
      const y = FAR - 5 * PLANE_SCALE - Math.pow(climb, 1.35) * 0.16;
      const pitch = -Math.min(14, climb * 0.09);
      plane.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(pitch)}) scale(${PLANE_SCALE})`);
      plane.setAttribute('opacity', f(Math.min(1, u / 0.06) * (1 - Math.max(0, (u - 0.8) / 0.12))));
      const gearDown = climb < 60 ? 1 : Math.max(0, 1 - (climb - 60) / 30);
      // main gear under the wing, nose gear forward; wheels touch y = 5 (the runway)
      const wy = -3 + 5.4 * gearDown;
      gear.setAttribute('d', gearDown > 0 ? `M2 4 L2 ${f(wy)} M42 -4 L42 ${f(wy)}` : '');
      wheels.setAttribute('d', gearDown > 0.05 ? `M-0.6 ${f(wy)} a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 M39.6 ${f(wy)} a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0` : '');
    },
  };
};
