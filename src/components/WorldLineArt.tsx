import { useEffect, useId, useRef } from 'react';
import { createWorld } from '../lineart/world';
import './WorldLineArt.css';

/**
 * Decorative line-art tour of the world behind the home intro. Same contract as
 * TopographicArt: `animated` is the user's play/pause choice, `forceMotion` lets an
 * explicit play override prefers-reduced-motion. Pauses when off screen or hidden.
 */
export default function WorldLineArt({ animated = true, forceMotion = false }: { animated?: boolean; forceMotion?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const prefix = 'wla' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const wants = useRef({ animated, forceMotion });
  const sync = useRef<() => void>(() => {});

  useEffect(() => {
    const element = host.current, svg = svgRef.current;
    if (!element || !svg) return;
    const world = createWorld(svg, prefix);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, frame = 0, last = 0, hasMoved = false;

    const shouldPlay = () => visible && !document.hidden && wants.current.animated && (!reduced.matches || wants.current.forceMotion);
    const tick = (now: number) => {
      world.step(Math.min(0.05, (now - last) / 1000));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      const play = shouldPlay();
      element.dataset.play = String(visible && !document.hidden);
      if (play && !frame) { hasMoved = true; last = performance.now(); frame = requestAnimationFrame(tick); }
      if (!play && frame) { cancelAnimationFrame(frame); frame = 0; }
    };
    sync.current = update;

    const resize = new ResizeObserver(([entry]) => {
      world.resize(entry.contentRect.width, entry.contentRect.height);
      if (!hasMoved) world.still(); else if (!frame) world.step(0);
    });
    resize.observe(element);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
      world.destroy();
    };
  }, [prefix]);

  useEffect(() => { wants.current = { animated, forceMotion }; sync.current(); }, [animated, forceMotion]);

  return <div ref={host} className="world-line-art" data-animated={animated} data-user-motion={forceMotion} aria-hidden="true">
    <svg ref={svgRef} preserveAspectRatio="xMaxYMax meet" focusable="false"/>
  </div>;
}
