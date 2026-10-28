import { useEffect, useRef, useState } from 'react';

/**
 * Click-to-open popover that closes on outside click or Escape.
 * `trigger({ open, toggle })` renders the button; `children({ close })` renders the panel.
 */
export function Dropdown({ trigger, children, align = 'right', panelClassName = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={rootRef}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`dropdown__panel ${align === 'left' ? 'dropdown__panel--left' : ''} ${panelClassName}`}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}
