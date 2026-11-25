import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Opens every new page at the top, as a full page load of the original site did. A link with a #section
 * (menu items such as "/#partners" or "/courses#theory") opens at that section instead, and a #section link
 * on the current page scrolls there smoothly. Other changes on the same page (e.g. ?page=2) leave the scroll alone.
 */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const last = useRef(null);
  const settleTimer = useRef(0);

  useLayoutEffect(() => {
    const previous = last.current;
    if (previous?.key === key) return; // React's development-mode second run of the same navigation
    last.current = { pathname, hash, key };
    clearTimeout(settleTimer.current);

    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!previous || previous.pathname !== pathname) {
      if (!target) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // the theme enables smooth scrolling
        return;
      }
      target.scrollIntoView({ behavior: 'instant' });
      // Once more after the new page's carousels and images have taken their space.
      settleTimer.current = setTimeout(() => target.isConnected && target.scrollIntoView({ behavior: 'instant' }), 400);
    } else if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else if (previous.hash && !hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); // e.g. "Home" while viewing /#about
    }
  }, [pathname, hash, key]);

  return null;
}
