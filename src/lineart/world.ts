// The world strip: scenes laid end to end, scrolling under a traveller who walks
// in place. The scroll speed is the traveller's gait speed, so his planted foot
// never slides. Each scene is placed at the copy (offset + k·length) nearest the
// view and hidden with display:none when off screen, so only what is visible is
// updated, filtered and painted. (Cloning the whole strip with <use> cost ~60 ms a
// frame: every attribute change was mirrored into each clone.)
import { el, inkDefs, place, f } from './lib/ink.ts';
import { H, G, S, type Scene, type SceneFactory } from './scene.ts';
import { createTraveler, travelerGait } from './traveler.ts';
import { depart } from './scenes/depart.ts';
import { france } from './scenes/france.ts';
import { espagne } from './scenes/espagne.ts';
import { italie } from './scenes/italie.ts';
import { japon } from './scenes/japon.ts';
import { chine } from './scenes/chine.ts';
import { hongkong } from './scenes/hongkong.ts';
import { vietnam } from './scenes/vietnam.ts';
import { bresil } from './scenes/bresil.ts';

/** Order of the tour. Add a country by writing a scene factory and listing it here. */
export const tour: SceneFactory[] = [depart, france, espagne, italie, japon, chine, hongkong, vietnam, bresil];

export const SPEED = travelerGait.speed * S;

export interface World {
  resize(width: number, height: number): void;
  step(dt: number): void;
  /** Jump to the calm still frame used for reduced motion. */
  still(): void;
  destroy(): void;
}

export function createWorld(svg: SVGSVGElement, idPrefix: string, scenes: SceneFactory[] = tour): World {
  svg.style.color = 'var(--line-art-ink)';
  const { filter } = inkDefs(svg, `${idPrefix}-ink`);
  const mover = el('g', { class: 'line-art-world' }, svg);
  const placed: Array<{ scene: Scene; offset: number; holder: SVGGElement; x: number; shown: boolean }> = [];
  let length = 0;
  for (const factory of scenes) {
    const holder = el('g', { filter, transform: `translate(${length} 0)` }, mover);
    const scene = factory(holder);
    placed.push({ scene, offset: length, holder, x: length, shown: true });
    length += scene.width;
  }
  /** Scenery may overhang its own width (a plane climbing out, a canopy): keep a margin. */
  const MARGIN = 140;
  const traveler = createTraveler(el('g', { class: 'line-art-hero', filter }, svg));
  let viewW = 600, heroX = 460, t = 0;

  const wind = (time: number) => 0.3 + 0.25 * Math.sin(time * 0.21) + 0.15 * Math.sin(time * 0.67);

  const step = (dt: number) => {
    t += dt;
    const scroll = (t * SPEED) % length;
    mover.setAttribute('transform', `translate(${f(-scroll)} 0)`);
    const ctx = { t, dt, wind: wind(t) };
    for (const p of placed) {
      // the copy of this scene nearest the view: screen x in [-width - MARGIN, length - width - MARGIN)
      let screen = (((p.offset - scroll) % length) + length) % length;
      if (screen > length - p.scene.width - MARGIN) screen -= length;
      const visible = screen < viewW + MARGIN && screen + p.scene.width > -MARGIN;
      if (visible !== p.shown) { p.holder.style.display = visible ? '' : 'none'; p.shown = visible; }
      if (!visible) continue;
      const x = screen + scroll;
      if (x !== p.x) { p.holder.setAttribute('transform', `translate(${f(x)} 0)`); p.x = x; }
      p.scene.update(ctx);
    }
    traveler.draw(t, dt);
  };

  return {
    resize(width, height) {
      viewW = Math.max(240, (H * width) / Math.max(1, height));
      svg.setAttribute('viewBox', `0 0 ${f(viewW)} ${H}`);
      heroX = Math.min(viewW - 70, Math.max(viewW * 0.72, 150));
      place(traveler.g, heroX, G, 1, S);
    },
    step,
    still() {
      // settle springs, then stop with the boulangerie beside the traveller
      const france = placed.find(p => p.scene.id === 'france');
      const target = ((france ? france.offset + 330 : 0) - heroX + length) % length;
      // only the last two seconds are simulated: enough for springs to settle
      const until = target / SPEED + length / SPEED;
      t = until - 2;
      for (let i = 0; i < 60; i++) step(2 / 60);
    },
    destroy() { while (svg.firstChild) svg.removeChild(svg.firstChild); },
  };
}
