import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_MENU } from '../content/site';

// A "/#section" link points into a page, so it is never marked as the page the visitor is on.
const isCurrentPage = (to, pathname) => !to.includes('#') && to === pathname;

/** A heading is current when the visitor is on its own page or on any page in its submenu. */
const isCurrentHeading = (item, pathname) =>
  isCurrentPage(item.to, pathname) || Boolean(item.children?.some((child) => isCurrentPage(child.to, pathname)));

const classes = (...names) => names.filter(Boolean).join(' ') || undefined;

/** Header menu (1200px and wider): the theme's hover dropdowns, which also open for keyboard focus (website.css). */
export function DesktopMenu() {
  const { pathname } = useLocation();
  return (
    <ul className="main-menu__list">
      {MAIN_MENU.map((item) => (
        <li key={item.label} className={classes(item.children && 'dropdown', isCurrentHeading(item, pathname) && 'current')}>
          <Link to={item.to}>{item.label}</Link>
          {item.children && (
            <ul>
              {item.children.map((child) => (
                <li key={child.label} className={classes(isCurrentPage(child.to, pathname) && 'current')}>
                  <Link to={child.to}>{child.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Mobile menu: the heading opens its page; the arrow button beside it shows or hides the submenu (one at a time).
 * `onNavigate` closes the menu — needed for "/#section" links, which do not change the page.
 */
export function MobileMenu({ onNavigate }) {
  const { pathname } = useLocation();
  const [openLabel, setOpenLabel] = useState(null);
  const idPrefix = useId();

  return (
    <ul className="main-menu__list">
      {MAIN_MENU.map((item, index) => {
        const open = openLabel === item.label;
        const submenuId = `${idPrefix}-submenu-${index}`;
        return (
          <li key={item.label} className={classes(isCurrentHeading(item, pathname) && 'current')}>
            <div className="mobile-nav__item">
              <Link to={item.to} onClick={onNavigate}>
                {item.label}
              </Link>
              {item.children && (
                <button
                  type="button"
                  className={classes(open && 'expanded')}
                  aria-expanded={open}
                  aria-controls={submenuId}
                  aria-label={`${item.label} menu`}
                  onClick={() => setOpenLabel(open ? null : item.label)}
                >
                  <i className="fa fa-angle-down" aria-hidden="true"></i>
                </button>
              )}
            </div>
            {item.children && (
              <ul id={submenuId} className={classes('mobile-nav__submenu', open && 'is-open')}>
                {item.children.map((child) => (
                  <li key={child.label} className={classes(isCurrentPage(child.to, pathname) && 'current')}>
                    <Link to={child.to} onClick={onNavigate}>
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
