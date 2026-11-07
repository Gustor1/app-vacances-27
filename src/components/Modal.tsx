import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLocale } from '../i18n';
import { useSheetMotion } from '../hooks/useSheetMotion';

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  // Capture the trigger before an autoFocus field takes focus during the portal commit.
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const origin = useRef(previousFocus.current?.closest('.bonus-card, .memory-fan-print, .memory-album-print, .notebook-document-open, .journey-card, .overview-day')?.getBoundingClientRect());
  const { dismiss, grabberProps } = useSheetMotion(ref, onClose, origin.current);
  const closeRef = useRef(dismiss); closeRef.current = dismiss;
  useEffect(() => {
    const previous = previousFocus.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const focusables = Array.from(ref.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]') || []).filter(el => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) dismiss(); }}><div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}><div className="sheet-grabber" aria-hidden="true" {...grabberProps}/><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-btn" onClick={dismiss} aria-label={t("Fermer")}><X size={20}/></button></div><div className="modal-content">{children}</div></div></div>, document.body);
}

