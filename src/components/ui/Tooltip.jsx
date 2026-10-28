import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SHOW_DELAY = 250;
const GAP = 8;
const MARGIN = 8;

/**
 * A short hint shown above a control on hover (after a moment) and on keyboard focus. The bubble is rendered in
 * <body> and kept inside the window, so cards and tables never clip it. Works on disabled buttons too (say why it
 * is disabled). `children` is a single element; screen readers get the label as its description.
 */
export function Tooltip({ label, children }) {
  const id = useId();
  const anchorRef = useRef(null);
  const bubbleRef = useRef(null);
  const timer = useRef(null);
  const [open, setOpen] = useState(false);

  const show = (delay) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Place the bubble above the control (below when there is no room), centred but inside the window.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const bubble = bubbleRef.current;
    const anchor = anchorRef.current.getBoundingClientRect();
    const { width, height } = bubble.getBoundingClientRect();
    const above = anchor.top - height - GAP;
    bubble.style.top = `${above >= MARGIN ? above : anchor.bottom + GAP}px`;
    bubble.style.left = `${Math.min(Math.max(anchor.left + anchor.width / 2 - width / 2, MARGIN), window.innerWidth - width - MARGIN)}px`;
    bubble.style.visibility = 'visible';
    // The bubble is fixed to the window: hide it rather than leave it behind when the page moves.
    const close = () => {
      clearTimeout(timer.current);
      setOpen(false);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!label) return children;
  return (
    <span
      ref={anchorRef}
      className="tooltip-anchor"
      onMouseEnter={() => show(SHOW_DELAY)}
      onMouseLeave={hide}
      onFocus={(e) => e.target.matches(':focus-visible') && show(0)}
      onBlur={hide}
      onClickCapture={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span id={id} className="sr-only">
        {label}
      </span>
      {open &&
        createPortal(
          <span ref={bubbleRef} className="tooltip" aria-hidden="true">
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
