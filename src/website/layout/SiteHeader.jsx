import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginLink } from '@/features/auth/LoginModal';
import { ThemeButton } from '../sections/SectionTitle';
import { DesktopMenu } from './MainMenu';

function MenuBar({ onOpenMobileNav }) {
  return (
    <div className="container">
      <div className="main-menu__logo">
        <Link to="/">
          <img src="/assets/images/logo-two.png" width="100" height="100" alt="MIATA" />
        </Link>
      </div>
      <div className="main-menu__nav">
        <DesktopMenu />
      </div>
      {/* Desktop: login, Apply Now. Below 1200px: login, menu (☰); Apply Now moves into the mobile menu. */}
      <div className="main-menu__right">
        <LoginLink className="main-menu__login" aria-label="Login" aria-haspopup="dialog">
          <i className="icon-account-1"></i>
        </LoginLink>
        <a
          href="#"
          className="main-menu__toggler mobile-nav__toggler"
          aria-label="Open menu"
          onClick={(event) => {
            event.preventDefault();
            onOpenMobileNav();
          }}
        >
          <i className="fa fa-bars"></i>
        </a>
        <ThemeButton as={Link} to="/apply" secondary className="main-menu__apply">
          Apply Now
        </ThemeButton>
      </div>
    </div>
  );
}

function useScrolledPast(offset) {
  const [past, setPast] = useState(() => window.scrollY > offset);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > offset);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return past;
}

/** Header plus the copy that slides in once the page is scrolled past 130px. */
export function SiteHeader({ sticky = true, onOpenMobileNav }) {
  const fixed = useScrolledPast(130);
  return (
    <>
      <header className="main-header-two">
        <nav className="main-menu">
          <MenuBar onOpenMobileNav={onOpenMobileNav} />
        </nav>
      </header>
      {sticky && (
        <div className={`stricky-header stricked-menu main-menu main-header-two${fixed ? ' stricky-fixed' : ''}`}>
          <div className="sticky-header__content">
            <MenuBar onOpenMobileNav={onOpenMobileNav} />
          </div>
        </div>
      )}
    </>
  );
}
