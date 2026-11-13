// Shared contract for one country/scene of the world strip.
import { pen, f } from './lib/ink.ts';

/** Scene height in viewBox units and the shared ground line. */
export const H = 260;
export const G = 236;
/** Figure scale: people ≈ 57 units tall, a doorway ≈ 66. */
export const S = 0.6;
/** One pen for architecture and figures alike (PEN × S, see references/style.md). */
export const SCENE_PEN = 0.85;
export const DETAIL_PEN = 0.45;

export interface SceneContext { t: number; dt: number; wind: number }

export interface Scene {
  id: string;
  width: number;
  /** Called only while some part of the scene is on screen. */
  update(ctx: SceneContext): void;
}

export type SceneFactory = (parent: SVGGElement) => Scene;

/** Ground line and paving every scene shares, so scenes join without a seam. */
export function ground(parent: Element, width: number, paving = 28): void {
  pen(parent, SCENE_PEN).setAttribute('d', `M0 ${G} L${width} ${G} M0 ${G + 10} L${width} ${G + 10}`);
  if (paving) pen(parent, DETAIL_PEN).setAttribute('d', Array.from({ length: Math.floor(width / paving) }, (_, i) => `M${f(i * paving + 9)} ${G} l0 10`).join(' '));
}
