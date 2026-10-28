import { useEffect, useRef } from 'react';

/** The theme's two-ring cursor that follows the mouse and grows over links. */
export function CustomCursor() {
  const outer = useRef(null);
  const inner = useRef(null);

  useEffect(() => {
    document.body.classList.add('custom-cursor');
    const move = (e) => {
      outer.current.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
      inner.current.style.left = `${e.clientX}px`;
      inner.current.style.top = `${e.clientY}px`;
    };
    const down = () => {
      outer.current.classList.add('click');
      inner.current.classList.add('custom-cursor__innerhover');
    };
    const up = () => {
      outer.current.classList.remove('click');
      inner.current.classList.remove('custom-cursor__innerhover');
    };
    const over = (e) => outer.current.classList.toggle('custom-cursor__hover', Boolean(e.target.closest?.('a')));
    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    document.addEventListener('mouseover', over);
    return () => {
      document.body.classList.remove('custom-cursor');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('mouseover', over);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor__cursor" ref={outer}></div>
      <div className="custom-cursor__cursor-two" ref={inner}></div>
    </>
  );
}
