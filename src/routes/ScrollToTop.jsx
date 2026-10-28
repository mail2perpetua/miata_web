import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Opens every new page at the top, as a full page load of the original site did. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // the theme enables smooth scrolling
  }, [pathname]);
  return null;
}
