import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

type SheetController = {
  dismiss: () => void;
  start: (event: ReactPointerEvent<HTMLDivElement>) => void;
  move: (event: ReactPointerEvent<HTMLDivElement>) => void;
  end: (event: ReactPointerEvent<HTMLDivElement>, cancelled?: boolean) => void;
};

/** A critically damped spring keeps its current position and velocity on retarget. */
export function useSheetMotion(ref: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  const controller = useRef<SheetController | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const backdrop = element.parentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 760px)');
    let position = reduced.matches ? 0 : mobile.matches ? 90 : 18;
    let velocity = 0;
    let target = 0;
    let frame = 0;
    let previousTime = 0;
    let closing = false;
    let opening = true;
    let disposed = false;
    let gesture: { id: number; origin: number; initial: number; committed: boolean; samples: { y: number; time: number }[] } | null = null;

    const paint = () => {
      element.style.transform = reduced.matches ? 'none' : `translate3d(0, ${position}px, 0)`;
      const distance = mobile.matches ? element.offsetHeight + 32 : 24;
      const opacity = closing ? Math.max(0, 1 - position / distance) : opening ? Math.max(0, 1 - position / (mobile.matches ? 180 : 36)) : 1;
      element.style.opacity = String(opacity);
      backdrop?.style.setProperty('--scrim-opacity', String(Math.max(0, 1 - Math.max(0, position) / (element.offsetHeight + 32))));
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const settle = () => {
      position = target;
      velocity = 0;
      opening = false;
      paint();
      element.style.removeProperty('will-change');
      if (closing && !disposed) close.current();
    };
    const tick = (time: number) => {
      frame = 0;
      const dt = Math.min((time - previousTime) / 1000, .064);
      previousTime = time;
      // Analytical solution avoids unstable numerical integration on a slow frame.
      const omega = 28;
      const delta = position - target;
      const coefficient = velocity + omega * delta;
      const decay = Math.exp(-omega * dt);
      position = target + (delta + coefficient * dt) * decay;
      velocity = (velocity - omega * coefficient * dt) * decay;
      paint();
      if (Math.abs(position - target) < .3 && Math.abs(velocity) < 5) settle();
      else frame = requestAnimationFrame(tick);
    };
    const spring = (next: number) => {
      target = next;
      if (reduced.matches) { stop(); settle(); return; }
      if (!frame) { element.style.willChange = 'transform, opacity'; previousTime = performance.now(); frame = requestAnimationFrame(tick); }
    };
    const dismiss = () => {
      closing = true;
      opening = false;
      spring(mobile.matches ? element.offsetHeight + 32 : 24);
    };
    const release = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const samples = gesture.samples;
      const first = samples[0], last = samples[samples.length - 1];
      velocity = !cancelled && gesture.committed && event.timeStamp - last.time < 100 && last.time > first.time
        ? (last.y - first.y) / (last.time - first.time) * 1000 : 0;
      const committed = gesture.committed;
      gesture = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      // Apple's exponential momentum projection, using a snappy sheet deceleration.
      const projected = position + (velocity / 1000) * .995 / (1 - .995);
      if (!cancelled && committed && projected > Math.min(180, element.offsetHeight * .3)) dismiss();
      else { closing = false; opening = false; spring(0); }
    };
    controller.current = {
      dismiss,
      start: event => {
        if (!mobile.matches || reduced.matches || !event.isPrimary || event.button !== 0) return;
        stop();
        closing = false;
        opening = false;
        target = 0;
        element.style.willChange = 'transform, opacity';
        gesture = { id: event.pointerId, origin: event.clientY, initial: position, committed: false, samples: [{ y: event.clientY, time: event.timeStamp }] };
        event.currentTarget.setPointerCapture(event.pointerId);
        paint();
      },
      move: event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        const delta = event.clientY - gesture.origin;
        if (!gesture.committed && Math.abs(delta) < 10) return;
        gesture.committed = true;
        const next = gesture.initial + delta;
        // Soft resistance above the resting position, direct tracking below it.
        position = next < 0 ? (next * 200 * .55) / (200 + .55 * Math.abs(next)) : next;
        gesture.samples.push({ y: event.clientY, time: event.timeStamp });
        gesture.samples = gesture.samples.filter(sample => event.timeStamp - sample.time <= 100);
        paint();
      },
      end: release,
    };
    const reduceMotion = () => {
      if (reduced.matches) { gesture = null; stop(); settle(); }
    };
    reduced.addEventListener('change', reduceMotion);
    paint();
    spring(0);
    return () => {
      disposed = true;
      stop();
      controller.current = null;
      reduced.removeEventListener('change', reduceMotion);
      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
      element.style.removeProperty('will-change');
      backdrop?.style.removeProperty('--scrim-opacity');
    };
  }, [ref]);

  return {
    dismiss: () => controller.current ? controller.current.dismiss() : close.current(),
    grabberProps: {
      onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => controller.current?.start(event),
      onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => controller.current?.move(event),
      onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => controller.current?.end(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => controller.current?.end(event, true),
      onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => controller.current?.end(event, true),
    },
  };
}
