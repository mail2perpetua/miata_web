import { Suspense, useCallback, useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageLoader, useConfirm } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { NotificationBell } from './NotificationBell';
import { Sidebar } from './Sidebar';
import { AdminSearch, AgentSearch } from './TopbarSearch';
import { UserMenu } from './UserMenu';

/** Shared shell for all four dashboards; the role sets the navigation and accent colour. */
export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const [navState, setNavState] = useState({ pathname: location.pathname, open: false });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 1024px)').matches);
  const navOpen = navState.pathname === location.pathname && navState.open;
  const setNavOpen = useCallback((open) => setNavState({ pathname: location.pathname, open }), [location.pathname]);
  const toggleNavOpen = useCallback(
    () => setNavState((state) => ({ pathname: location.pathname, open: state.pathname !== location.pathname || !state.open })),
    [location.pathname],
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [navOpen, setNavOpen]);

  // Portalled UI (modals, toasts) lives outside .app, so the role accent is also set on <html>.
  useEffect(() => {
    document.documentElement.dataset.role = user.role;
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, [user.role]);

  const handleLogout = async () => {
    if (await confirm({ title: 'Log out?', message: 'You will need to sign in again to access the portal.', confirmLabel: 'Log out' })) {
      await logout();
      navigate(`/login/${user.role}`, { replace: true });
    }
  };

  return (
    <div className={`app ${navOpen ? 'app--nav-open' : ''} ${sidebarCollapsed ? 'app--sidebar-collapsed' : ''}`} data-role={user.role}>
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed && !isCompact}
        onExpand={() => setSidebarCollapsed(false)}
        onNavigate={() => setNavOpen(false)}
        onLogout={handleLogout}
      />
      <div className="sidebar-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className="app__main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => (isCompact ? toggleNavOpen() : setSidebarCollapsed((collapsed) => !collapsed))}
            aria-label={
              isCompact
                ? navOpen
                  ? 'Close navigation'
                  : 'Open navigation'
                : sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
            }
            aria-expanded={isCompact ? navOpen : !sidebarCollapsed}
          >
            {isCompact || !sidebarCollapsed ? <PanelLeftClose /> : <PanelLeftOpen />}
          </button>
          {user.role === 'admin' && <AdminSearch />}
          {user.role === 'agent' && <AgentSearch />}
          <div className="spacer" />
          <NotificationBell />
          <span className="topbar__divider" aria-hidden="true" />
          <UserMenu user={user} onLogout={handleLogout} />
        </header>
        <main className="app__content" id="main">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
