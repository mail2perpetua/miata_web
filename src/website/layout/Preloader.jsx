import { useEffect, useState } from 'react';

const FADE_MS = 400; // jQuery fadeOut() default, as in the original theme

/** Full-screen MIATA loader shown until the first page load finishes. */
export function Preloader() {
  const [phase, setPhase] = useState(() => (document.readyState === 'complete' ? 'done' : 'visible'));

  useEffect(() => {
    if (phase === 'visible') {
      const fade = () => setPhase('fading');
      window.addEventListener('load', fade);
      return () => window.removeEventListener('load', fade);
    }
    if (phase === 'fading') {
      const timer = setTimeout(() => setPhase('done'), FADE_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div className="preloader" style={phase === 'fading' ? { opacity: 0, transition: `opacity ${FADE_MS}ms` } : undefined}>
      <div className="preloader__image" style={{ backgroundImage: 'url(/assets/images/loader.png)' }}></div>
    </div>
  );
}
