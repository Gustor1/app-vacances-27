import { useEffect, useRef, type CSSProperties } from 'react';

/** Authored contour geometry; decorative terrain, never a geographic map. */
const contours = Array.from({ length: 14 }, (_, index) => {
  const radius = 30 + index * 17;
  return Array.from({ length: 81 }, (_, point) => {
    const angle = point / 80 * Math.PI * 2;
    const ripple = 1 + .12 * Math.sin(angle * 3 + index * .13) + .065 * Math.cos(angle * 5);
    const x = 360 + Math.cos(angle) * radius * ripple * 1.43;
    const y = 180 + Math.sin(angle) * radius * ripple * .64;
    return `${point ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + 'Z';
});

export default function TopographicArt({ relief = false, animated = true, forceMotion = false }: { relief?: boolean; animated?: boolean; forceMotion?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => { element.dataset.play = String(!document.hidden && visible); };
    let visible = false;
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <div ref={ref} className={`topographic-art ${relief ? 'topographic-relief' : ''}`} data-animated={animated} data-user-motion={forceMotion} aria-hidden="true">
    <svg viewBox="0 0 720 360" preserveAspectRatio="xMidYMid slice" focusable="false">
      <g>{[...contours].reverse().map((path, index) => <path key={index} d={path} style={{ '--contour-index': index } as CSSProperties} className={index % 4 === 0 ? 'contour-major' : undefined}/>)}</g>
    </svg>
  </div>;
}
