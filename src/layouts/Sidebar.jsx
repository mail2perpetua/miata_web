import { useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Link, matchPath, NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION } from '@/routes/navigation';
import { ROLE_HOME } from '@/features/auth/AuthContext';

// The MIATA crest from the website's assets (public/assets).
const logo = '/assets/images/loader.png';

const inGroup = (item, pathname) => item.children.some((child) => matchPath({ path: child.to, end: false }, pathname));

/**
 * A menu group (e.g. Agent): the heading opens and closes its sub-items like a dropdown. It is open while one of its pages
 * is shown; a click on the heading overrides that until the user moves to another page.
 */
function NavGroup({ item, id, open, onToggle, onNavigate, onExpand, active, collapsed }) {
  return (
    <div>
      <button
        type="button"
        className={`nav-item nav-item--group ${active ? 'has-active' : ''} ${open ? 'is-open' : ''}`}
        aria-expanded={open && !collapsed}
        aria-controls={id}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : undefined}
        onClick={collapsed ? onExpand : onToggle}
      >
        <item.icon aria-hidden="true" />
        <span className="nav-item__label">{item.label}</span>
        <ChevronDown className="nav-item__chevron" aria-hidden="true" />
      </button>
      <div id={id} className={`nav-group__panel ${open ? 'is-open' : ''}`} inert={!open || collapsed}>
        <div className="nav-sub">
          {item.children.map((child) => (
            <NavLink key={child.to} to={child.to} className="nav-item" onClick={onNavigate}>
              {child.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user, collapsed = false, onExpand, onNavigate, onLogout }) {
  const items = NAVIGATION[user.role];
  const { pathname } = useLocation();
  // Groups the user opened or closed on this page; forgotten as soon as the page changes.
  const [toggled, setToggled] = useState({ pathname, open: {} });
  const overrides = toggled.pathname === pathname ? toggled.open : {};
  const isOpen = (item) => overrides[item.to] ?? inGroup(item, pathname);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">
      <Link to={ROLE_HOME[user.role]} className="sidebar__brand" onClick={onNavigate} title={collapsed ? 'MIATA home' : undefined}>
        <img src={logo} alt="" />
        <span className="sidebar__wordmark">MIATA</span>
      </Link>

      <nav className="sidebar__nav">
        {items.map((item, index) =>
          item.children ? (
            <NavGroup
              key={item.to}
              item={item}
              id={`nav-group-${index}`}
              open={isOpen(item)}
              active={inGroup(item, pathname)}
              collapsed={collapsed}
              onExpand={onExpand}
              onToggle={() => setToggled({ pathname, open: { ...overrides, [item.to]: !isOpen(item) } })}
              onNavigate={onNavigate}
            />
          ) : (
            <div key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className="nav-item"
                onClick={onNavigate}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
              >
                <item.icon aria-hidden="true" />
                <span className="nav-item__label">{item.label}</span>
              </NavLink>
            </div>
          ),
        )}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="nav-item"
          onClick={onLogout}
          aria-label={collapsed ? 'Logout' : undefined}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut aria-hidden="true" />
          <span className="nav-item__label">Logout</span>
        </button>
      </div>
      <img src={logo} alt="" className="sidebar__watermark" />
    </aside>
  );
}
