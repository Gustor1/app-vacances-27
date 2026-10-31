import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, X } from 'lucide-react';
import { useLocale } from '../i18n';
import type { City } from '../types';

export function StoryRail({ cities, onNavigate }: { cities: City[]; onNavigate: (city: string, day: string) => void }) {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  if (!cities.length) return null;
  const scroll = (direction: number) => { const rail = ref.current; rail?.scrollBy({ left: direction * rail.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
  return <section className="travel-stories" aria-labelledby={id}>
    <div className="travel-section-heading"><h2 id={id}>{t('Les étapes à découvrir')}</h2>{cities.length > 1 && <div className="inline-actions"><button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label={t('Étapes précédentes')}><ArrowLeft size={18}/></button><button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label={t('Étapes suivantes')}><ArrowRight size={18}/></button></div>}</div>
    <div ref={ref} className="travel-story-rail">{cities.map(city => <button type="button" className="travel-story" key={city.id} disabled={!city.days.length} onClick={() => onNavigate(city.id, city.days[0].id)} aria-label={t('Ouvrir les journées de {city}', { city: city.name })}>
      <img src={city.image} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.onerror = null; if (!event.currentTarget.src.endsWith('/travel-landscape.svg')) event.currentTarget.src = '/travel-landscape.svg'; }}/><span className="story-glass" aria-hidden="true"/>
      <span className="travel-story-copy"><strong>{city.name}</strong><span>{t('{count} journées', { count: city.days.length })}<ArrowRight size={17}/></span></span>
    </button>)}</div>
  </section>;
}

/** Native popover supplies top-layer positioning, Escape and outside-click dismissal. */
export function PeekCard({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  const { t } = useLocale();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const place = () => {
      if (!element.matches(':popover-open')) return;
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(330, window.innerWidth - 32);
      element.style.width = `${width}px`;
      element.style.left = `${Math.max(16, Math.min(window.innerWidth - width - 16, rect.left))}px`;
      element.style.top = `${Math.max(16, Math.min(window.innerHeight - element.offsetHeight - 16, rect.bottom + 10))}px`;
    };
    element.addEventListener('toggle', place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { element.removeEventListener('toggle', place); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, []);
  return <><button type="button" ref={trigger} className="icon-btn travel-peek-trigger" popoverTarget={id} aria-label={t('Aperçu de {name}', { name: title })}><Eye size={17}/></button><div ref={panel} id={id} popover="auto" className="travel-peek"><div className="travel-peek-heading"><strong>{title}</strong><button type="button" className="icon-btn" popoverTarget={id} popoverTargetAction="hide" aria-label={t('Fermer')}><X size={16}/></button></div>{children}</div></>;
}

export function ImportStepper({ step }: { step: number }) {
  const { t } = useLocale();
  return <ol className="travel-stepper" aria-label={t('Étapes de création du carnet')}>{['Ton programme', 'Vérifier le programme', 'Créer le carnet'].map((label, index) => <li key={label} data-state={index < step ? 'done' : index === step ? 'current' : 'next'} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={16}/> : index + 1}</span><strong>{t(label)}</strong></li>)}</ol>;
}

export function ScrollProgressNav({ items }: { items: { id: string; title: string }[] }) {
  const { t } = useLocale();
  const [active, setActive] = useState('');
  useEffect(() => {
    const update = () => {
      const current = items.filter(item => (document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) <= 160).at(-1);
      setActive(current?.id || items[0]?.id || '');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [items]);
  if (items.length < 2) return null;
  return <nav className="travel-progress-nav" aria-label={t('Aller à une étape du voyage')}>{items.map(item => <button type="button" key={item.id} aria-current={active === item.id ? 'location' : undefined} onClick={() => {
    const target = document.getElementById(item.id);
    target?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }}><span aria-hidden="true"/>{item.title}</button>)}</nav>;
}

export function ActionToast({ message, action, onClose, duration = 3500 }: { message: string; action?: { label: string; run: () => void }; onClose: () => void; duration?: number }) {
  const { t } = useLocale();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const close = useRef(onClose); close.current = onClose;
  const paused = hovered || focused;
  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const next = remaining - (performance.now() - start);
      if (next <= 0) { clearInterval(timer); close.current(); }
      else setRemaining(next);
    }, 100);
    return () => clearInterval(timer);
  }, [paused, remaining]);
  return <div className="toast travel-toast" role="status" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <CheckCircle2 size={18}/><span>{message}</span>{action && <button type="button" className="travel-toast-undo" onClick={action.run}>{action.label}</button>}<button type="button" onClick={onClose} aria-label={t('Fermer la notification')}><X size={15}/></button><span className="travel-toast-time" aria-hidden="true" style={{ transform: `scaleX(${remaining / duration})` }}/>
  </div>;
}
