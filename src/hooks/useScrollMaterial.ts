import { useEffect } from 'react';

/** Keep floating chrome legible over scrolling content without rerendering the app. */
export function useScrollMaterial() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > 16 ? 'true' : 'false';
      if (root.dataset.scrolled !== next) root.dataset.scrolled = next;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pageshow', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pageshow', onScroll);
      delete root.dataset.scrolled;
    };
  }, []);
}
