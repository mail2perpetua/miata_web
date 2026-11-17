import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_MENU } from '../content/site';
import { ThemeButton } from '../sections/SectionTitle';

/** The main navigation list; reused by the header, the sticky header and the mobile menu. */
export function MenuList() {
  const { pathname } = useLocation();
  return (
    <ul className="main-menu__list">
      {MAIN_MENU.map((item) => (
        <li key={item.to} className={pathname === item.to ? 'current' : undefined}>
          <Link to={item.to}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function MenuBar({ onOpenMobileNav }) {
  return (
    <div className="container">
      <div className="main-menu__logo">
        <Link to="/">
          <img src="/assets/images/logo-two.png" width="100" height="100" alt="MIATA" />
        </Link>
      </div>
      <div className="main-menu__nav">
        <MenuList />
      </div>
      {/* Desktop: login, Apply Now. Below 1200px: login, menu (☰); Apply Now moves into the mobile menu. */}
      <div className="main-menu__right">
        <Link to="/login" className="main-menu__login" aria-label="Login">
          <i className="icon-account-1"></i>
        </Link>
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
