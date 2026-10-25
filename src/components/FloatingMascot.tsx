import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMascotPreferences } from '../MascotPreferences';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { paletteTokens } from '../palettes';
import type { Sprite } from '../mascots/sprites';
import './FloatingMascot.css';

type Action = { label: string; run: () => void };
const POSITION_KEY = 'detours-mascot-position-v1';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const bound = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Visible viewport, safe-area insets and the application's persistent navigation. */
function availableArea(element: HTMLElement) {
  const view = window.visualViewport;
  const safe = getComputedStyle(element.querySelector('.mascot-safe-area')!);
  const inset = (value: string) => parseFloat(value) || 0;
  const left = (view?.offsetLeft || 0) + inset(safe.paddingLeft) + 12;
  const top = (view?.offsetTop || 0) + inset(safe.paddingTop) + 12;
  const right = (view?.offsetLeft || 0) + (view?.width || innerWidth) - inset(safe.paddingRight) - 12;
  const bottom = (view?.offsetTop || 0) + (view?.height || innerHeight) - inset(safe.paddingBottom) - 12;
  let usableLeft = left, usableTop = top, usableBottom = bottom;
  for (const bar of document.querySelectorAll<HTMLElement>('.topbar, .journeys-topbar, .mobile-bottom-nav, .sidebar')) {
    const style = getComputedStyle(bar), rect = bar.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0 || rect.right <= left || rect.left >= right || rect.bottom <= top || rect.top >= bottom) continue;
    if (bar.matches('.sidebar')) usableLeft = Math.max(usableLeft, rect.right + 12);
    else if (bar.matches('.mobile-bottom-nav')) usableBottom = Math.min(usableBottom, rect.top - 12);
    else usableTop = Math.max(usableTop, rect.bottom + 12);
  }
  // A keyboard/zoom can leave less room than the navigation occupies. Keep the
  // companion in the visible viewport, above navigation, rather than lose it.
  if (right - usableLeft < 96) usableLeft = left;
  if (usableBottom - usableTop < 96) { usableTop = top; usableBottom = bottom; }
  return { left: usableLeft, top: usableTop, right: Math.max(usableLeft + 1, right), bottom: Math.max(usableTop + 1, usableBottom) };
}

export default function FloatingMascot(props: { actions: Action[] }) {
  const { enabled } = useMascotPreferences();
  return enabled ? <Companion {...props}/> : null;
}

function Companion({ actions }: { actions: Action[] }) {
  const { character, animated } = useMascotPreferences();
  const { storage } = useCloud();
  const { t, palettes, resolvedTheme } = useLocale();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), mount = useRef<HTMLSpanElement>(null), menu = useRef<HTMLDivElement>(null);
  const sprite = useRef<Sprite | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const position = useRef({ x: 1, y: .82 });
  const gesture = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean; previous: { x: number; y: number } } | null>(null);
  const suppressClick = useRef(false);
  const accent = paletteTokens(palettes[resolvedTheme], resolvedTheme)['--action'];
  const render = () => {
    if (!root.current) return;
    const area = availableArea(root.current);
    const width = area.right - area.left, height = area.bottom - area.top;
    const size = Math.min(96, width, height);
    root.current.style.width = `${size}px`; root.current.style.height = `${size}px`;
    const x = area.left + clamp(position.current.x) * Math.max(0, width - size);
    const y = area.top + clamp(position.current.y) * Math.max(0, height - size);
    root.current.style.left = `${x}px`; root.current.style.top = `${y}px`;
    if (menu.current) {
      // Apply constraints BEFORE measuring: wrapping and scrollbars affect height.
      menu.current.style.width = `${Math.min(260, width)}px`;
      menu.current.style.maxHeight = `${height}px`;
      const { width: w, height: h } = menu.current.getBoundingClientRect();
      const choices = [
        { side: 'above', x: x + size / 2 - w / 2, y: y - h - 8, fits: y - h - 8 >= area.top },
        { side: 'below', x: x + size / 2 - w / 2, y: y + size + 8, fits: y + size + 8 + h <= area.bottom },
        { side: 'right', x: x + size + 8, y: y + size / 2 - h / 2, fits: x + size + 8 + w <= area.right },
        { side: 'left', x: x - w - 8, y: y + size / 2 - h / 2, fits: x - w - 8 >= area.left },
      ];
      const choice = choices.find(candidate => candidate.fits) || choices[0];
      menu.current.dataset.placement = choice.side;
      menu.current.style.left = `${bound(choice.x, area.left, area.right - w)}px`;
      menu.current.style.top = `${bound(choice.y, area.top, area.bottom - h)}px`;
    }
  };
  const save = () => { try { storage.setItem(POSITION_KEY, JSON.stringify(position.current)); } catch { /* Drag remains available this session. */ } };
  const move = (x: number, y: number) => {
    if (!root.current) return;
    const area = availableArea(root.current), size = root.current.offsetWidth;
    position.current = { x: clamp((x - area.left) / Math.max(1, area.right - area.left - size)), y: clamp((y - area.top) / Math.max(1, area.bottom - area.top - size)) };
    render();
  };
  useLayoutEffect(() => {
    try { const p = JSON.parse(storage.getItem(POSITION_KEY) || 'null'); if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) position.current = { x: clamp(p.x), y: clamp(p.y) }; } catch { /* Default position. */ }
    render();
    const observer = new ResizeObserver(render);
    document.querySelectorAll('.topbar, .journeys-topbar, .mobile-bottom-nav, .sidebar').forEach(bar => observer.observe(bar));
    window.addEventListener('resize', render); window.addEventListener('scroll', render, true); window.visualViewport?.addEventListener('resize', render); window.visualViewport?.addEventListener('scroll', render);
    return () => { observer.disconnect(); window.removeEventListener('resize', render); window.removeEventListener('scroll', render, true); window.visualViewport?.removeEventListener('resize', render); window.visualViewport?.removeEventListener('scroll', render); };
  }, [storage]);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => sprite.current?.setAnimated(animated && !media.matches);
    void import('../mascots/sprites.js').then(({ createSprite }) => {
      if (cancelled || !mount.current) return;
      sprite.current = createSprite(mount.current, { character, accent, animated: animated && !media.matches });
    }).catch(() => setFailed(true));
    const check = new MutationObserver(() => { if (mount.current?.dataset.ready === 'error') setFailed(true); });
    if (mount.current) check.observe(mount.current, { attributes: true, attributeFilter: ['data-ready'] });
    media.addEventListener('change', motion);
    return () => { cancelled = true; sprite.current?.destroy(); sprite.current = null; check.disconnect(); media.removeEventListener('change', motion); };
  }, [character, accent, animated]);
  useLayoutEffect(() => {
    render();
    if (!open) return;
    const observer = new ResizeObserver(render);
    if (menu.current) observer.observe(menu.current);
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    menu.current?.querySelector('button')?.focus({ preventScroll: true });
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const cancel = () => { if (gesture.current) { position.current = gesture.current.previous; gesture.current = null; render(); } };
  const preferences = () => window.dispatchEvent(new Event('detours-open-preferences'));
  return createPortal(<div ref={root} className="floating-mascot" data-character={character}>
    <span className="mascot-safe-area" aria-hidden="true"/>
    <button ref={trigger} className="pet-button" type="button" aria-label={t('Ouvrir les raccourcis de la mascotte')} aria-expanded={open} aria-controls="mascot-shortcuts"
      onPointerDown={e => { if (!e.isPrimary || e.button !== 0) return; const r = root.current!.getBoundingClientRect(); gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false, previous: { ...position.current } }; suppressClick.current = false; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { const g = gesture.current; if (!g || g.id !== e.pointerId) return; const dx = e.clientX - g.x, dy = e.clientY - g.y; if (!g.moved && Math.hypot(dx, dy) < 7) return; g.moved = true; suppressClick.current = true; setOpen(false); move(g.left + dx, g.top + dy); }}
      onPointerUp={e => { const g = gesture.current; if (!g || g.id !== e.pointerId) return; gesture.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (g.moved) { save(); sprite.current?.play('greet'); } }}
      onPointerCancel={cancel} onLostPointerCapture={cancel}
      onKeyDown={e => { const directions: Record<string, number[]> = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }; if (e.shiftKey && directions[e.key]) { e.preventDefault(); const r = root.current!.getBoundingClientRect(), [dx, dy] = directions[e.key]; move(r.left + dx, r.top + dy); save(); setOpen(false); } }}
      onClick={e => { if (suppressClick.current && e.detail !== 0) { suppressClick.current = false; return; } sprite.current?.play(open ? 'idle' : 'greet'); setOpen(!open); }}>
      <span ref={mount} className="mascot-sprite"/>{failed && <span className="mascot-fallback" aria-hidden="true">✦</span>}
    </button>
    {open && <div ref={menu} id="mascot-shortcuts" className="mascot-shortcuts" role="group" aria-label={t('Raccourcis')}>
      <strong>{character === 'pico' ? 'Pico' : character === 'mochi' ? 'Mochi' : 'Bivouac'}</strong>
      {actions.map(action => <button key={action.label} type="button" onClick={() => { setOpen(false); sprite.current?.play('map'); action.run(); }}>{t(action.label)}</button>)}
      <button type="button" onClick={() => { setOpen(false); preferences(); }}>{t('Préférences')}</button>
      <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }}>{t('Fermer')}</button>
    </div>}
  </div>, document.body);
}
