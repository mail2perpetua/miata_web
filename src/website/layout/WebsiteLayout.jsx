import { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { loadChatLauncher, setWebsiteStyles } from '../theme/themeAssets';
import { useThemePlugins } from '../theme/useThemePlugins';
import { CustomCursor } from './CustomCursor';
import { FloatingContact } from './FloatingContact';
import { MobileNav } from './MobileNav';
import { Preloader } from './Preloader';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import '../theme/website.css';

/** Turns the theme stylesheets on before any page content runs its own layout effects. */
function WebsiteStyles() {
  useLayoutEffect(() => setWebsiteStyles(true), []);
  return null;
}

// The original login page had no sticky header; the other sign-in pages follow its design.
const WITHOUT_STICKY_HEADER = /^\/(login|register|forgot-password|reset-password)(\/|$)/;

/** Shell of every public page: the original header, mobile menu, footer and site-wide extras. */
export function WebsiteLayout() {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setNavOpen(false);
  }
  // Header and footer behaviour (scroll reveal); each page handles its own content.
  const shellRef = useThemePlugins('.website-page');

  useEffect(() => {
    document.body.classList.toggle('locked', navOpen);
    return () => document.body.classList.remove('locked');
  }, [navOpen]);

  useEffect(loadChatLauncher, []);

  return (
    <>
      <WebsiteStyles />
      <CustomCursor />
      <Preloader />
      <div
        className="page-wrapper"
        ref={shellRef}
        onClick={(event) => {
          // Placeholder links (javascript:void(0) in the original pages) do nothing; this also covers carousel clones.
          if (event.target.closest('a[data-noop]')) event.preventDefault();
        }}
      >
        <SiteHeader sticky={!WITHOUT_STICKY_HEADER.test(pathname)} onOpenMobileNav={() => setNavOpen(true)} />
        <Outlet />
        <SiteFooter />
      </div>
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <FloatingContact />
    </>
  );
}
