import { useLayoutEffect, useRef } from 'react';

type Bounds = { x: number; y: number; width: number; height: number };
const axes = ['x', 'y', 'width', 'height'] as const;

/** The front opens a liquid bridge; the trailing edge follows and closes it. */
export default function GlassSelection({ selection }: { selection: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const measure = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const group = element?.parentElement;
    if (!element || !group) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let front: Bounds = { x: 0, y: 0, width: 0, height: 0 };
    let rear = { ...front };
    let frontVelocity = { ...front };
    let rearVelocity = { ...front };
    let target = { ...front };
    let rearTarget = { ...front };
    let travelDistance = 0;
    let released = true;
    let horizontal = true;
    let space = { width: 0, height: 0 };
    const corner = parseFloat(getComputedStyle(element).getPropertyValue('--glass-radius')) || 999;
    let initialized = false;
    let frame = 0;
    let previousTime = 0;

    const paint = () => {
      let left = Math.min(front.x, rear.x), top = Math.min(front.y, rear.y);
      let right = Math.max(front.x + front.width, rear.x + rear.width);
      let bottom = Math.max(front.y + front.height, rear.y + rear.height);
      const opening = Math.min(2, Math.hypot(front.x - rear.x, front.y - rear.y) * .03);
      if (horizontal) {
        const swell = Math.max(0, Math.min(opening, top, space.height - bottom));
        top -= swell; bottom += swell;
      } else {
        const swell = Math.max(0, Math.min(opening, left, space.width - right));
        left -= swell; right += swell;
      }
      const scaleX = (right - left) / target.width, scaleY = (bottom - top) / target.height;
      element.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${scaleX}, ${scaleY})`;
      // Compensate the scale so both ends stay round while the middle stretches.
      const radius = Math.min(corner, (right - left) / 2, (bottom - top) / 2);
      element.style.borderRadius = `${radius / scaleX}px / ${radius / scaleY}px`;
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const settle = () => {
      stop();
      front = { ...target }; rear = { ...target }; rearTarget = { ...target };
      frontVelocity = { x: 0, y: 0, width: 0, height: 0 };
      rearVelocity = { ...frontVelocity };
      released = true;
      paint();
      element.dataset.phase = 'rest';
      element.style.removeProperty('will-change');
    };
    const advance = (position: Bounds, velocity: Bounds, goal: Bounds, omega: number, dt: number) => {
      const decay = Math.exp(-omega * dt);
      for (const axis of axes) {
        const delta = position[axis] - goal[axis];
        const coefficient = velocity[axis] + omega * delta;
        position[axis] = goal[axis] + (delta + coefficient * dt) * decay;
        velocity[axis] = (velocity[axis] - omega * coefficient * dt) * decay;
      }
      for (const axis of ['x', 'y'] as const) {
        const limit = Math.max(0, axis === 'x' ? space.width - position.width : space.height - position.height);
        const bounded = Math.max(0, Math.min(position[axis], limit));
        if (bounded !== position[axis]) { position[axis] = bounded; velocity[axis] = 0; }
      }
    };
    const tick = (time: number) => {
      frame = 0;
      // A callback can share a frame timestamp older than the retarget event.
      const dt = Math.max(0, Math.min((time - previousTime) / 1000, .064));
      previousTime = time;
      advance(front, frontVelocity, target, 32, dt);
      if (!released && Math.hypot(target.x - front.x, target.y - front.y) <= travelDistance * .32) {
        released = true;
        rearTarget = { ...target };
        element.dataset.phase = 'closing';
      }
      advance(rear, rearVelocity, rearTarget, 23, dt);
      paint();
      if (released && axes.every(axis => Math.abs(front[axis] - target[axis]) < .1 && Math.abs(rear[axis] - target[axis]) < .1 && Math.abs(frontVelocity[axis]) < 1 && Math.abs(rearVelocity[axis]) < 1)) settle();
      else frame = requestAnimationFrame(tick);
    };
    const update = (animate = true) => {
      const selected = group.querySelector<HTMLElement>(':scope > button[aria-current="page"], :scope > button[aria-selected="true"]');
      if (!selected || !selected.offsetWidth || !group.offsetWidth) {
        if (initialized) settle(); else stop();
        element.style.opacity = '0';
        delete group.dataset.glassReady;
        return;
      }
      // Touch can keep :active's press scale during click. Measure the stable
      // layout box so the bubble does not shrink or snap when the finger lifts.
      const next = { x: selected.offsetLeft, y: selected.offsetTop, width: selected.offsetWidth, height: selected.offsetHeight };
      element.style.opacity = '1';
      group.dataset.glassReady = 'true';
      if (initialized && axes.every(axis => Math.abs(next[axis] - target[axis]) < .05)) return;
      space = { width: group.clientWidth, height: group.clientHeight };
      target = next;
      element.style.width = `${target.width}px`;
      element.style.height = `${target.height}px`;
      if (!initialized || reduced.matches || !animate) { initialized = true; settle(); return; }
      travelDistance = Math.hypot(target.x - front.x, target.y - front.y);
      horizontal = Math.abs(target.x - front.x) >= Math.abs(target.y - front.y);
      released = travelDistance < .5;
      rearTarget = released ? { ...target } : { ...rear, width: target.width, height: target.height };
      element.dataset.phase = released ? 'closing' : 'opening';
      paint();
      if (!frame) {
        element.style.willChange = 'transform';
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const onMotionChange = () => { if (reduced.matches && initialized) settle(); };
    const observer = new ResizeObserver(() => update(false));
    observer.observe(group);
    group.querySelectorAll('button').forEach(button => observer.observe(button));
    reduced.addEventListener('change', onMotionChange);
    measure.current = update;
    update();
    return () => {
      stop();
      observer.disconnect();
      reduced.removeEventListener('change', onMotionChange);
      measure.current = null;
      delete group.dataset.glassReady;
    };
  }, []);

  useLayoutEffect(() => { measure.current?.(); }, [selection]);
  return <span ref={ref} className="glass-selection" aria-hidden="true"/>;
}
