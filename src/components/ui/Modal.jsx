import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Dialog with focus management: focuses the first field, closes on Escape / backdrop, restores focus. */
export function Modal({ open, title, onClose, size = 'md', footer, children, dismissible = true }) {
  const titleId = useId();
  const panelRef = useRef(null);
  // Parents usually pass an inline onClose; keep the latest without re-running the focus effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('input:not([type=hidden]), select, textarea, button:not(.modal__close)');
    (first || panel)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current();
      if (e.key === 'Tab' && panel) {
        const focusable = [
          ...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]'),
        ];
        if (!focusable.length) return;
        const [firstEl, lastEl] = [focusable[0], focusable[focusable.length - 1]];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose()}>
      <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} tabIndex={-1}>
        <header className="modal__header">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          {dismissible && (
            <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Close dialog">
              <X />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
