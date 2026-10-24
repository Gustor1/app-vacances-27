import { useEffect, useRef, useState } from 'react';
import { useMascotPreferences } from '../MascotPreferences';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { paletteTokens } from '../palettes';
import type { Sprite } from '../mascots/sprites';
import './FloatingMascot.css';

type Action = { label: string; run: () => void };
const POSITION_KEY = 'detours-mascot-position-v1';
const clamp = (n: number) => Math.max(0, Math.min(1, n));

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
    const view = window.visualViewport;
    const width = view?.width || innerWidth, height = view?.height || innerHeight;
    const left = view?.offsetLeft || 0, top = view?.offsetTop || 0;
    if (!root.current) return;
    const x = left + 12 + position.current.x * Math.max(0, width - 120);
    const y = top + 12 + position.current.y * Math.max(0, height - 120);
    root.current.style.left = `${x}px`; root.current.style.top = `${y}px`;
    if (menu.current) {
      const w = Math.min(260, width - 24), h = menu.current.offsetHeight;
      menu.current.style.width = `${w}px`;
      menu.current.style.maxHeight = `${height - 24}px`;
      menu.current.style.left = `${Math.max(left + 12, Math.min(x + 48 - w / 2, left + width - w - 12))}px`;
      menu.current.style.top = `${Math.max(top + 12, Math.min(y - h - 4, top + height - h - 12))}px`;
    }
  };
  const save = () => { try { storage.setItem(POSITION_KEY, JSON.stringify(position.current)); } catch { /* Drag remains available this session. */ } };
  const move = (x: number, y: number) => {
    const view = window.visualViewport;
    position.current = { x: clamp((x - (view?.offsetLeft || 0) - 12) / Math.max(1, (view?.width || innerWidth) - 120)), y: clamp((y - (view?.offsetTop || 0) - 12) / Math.max(1, (view?.height || innerHeight) - 120)) };
    render();
  };
  useEffect(() => {
    try { const p = JSON.parse(storage.getItem(POSITION_KEY) || 'null'); if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) position.current = { x: clamp(p.x), y: clamp(p.y) }; } catch { /* Default position. */ }
    render();
    window.addEventListener('resize', render); window.visualViewport?.addEventListener('resize', render); window.visualViewport?.addEventListener('scroll', render);
    return () => { window.removeEventListener('resize', render); window.visualViewport?.removeEventListener('resize', render); window.visualViewport?.removeEventListener('scroll', render); };
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
  useEffect(() => {
    render();
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    menu.current?.querySelector('button')?.focus();
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const cancel = () => { if (gesture.current) { position.current = gesture.current.previous; gesture.current = null; render(); } };
  const preferences = () => window.dispatchEvent(new Event('detours-open-preferences'));
  return <div ref={root} className="floating-mascot" data-character={character}>
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
  </div>;
}
