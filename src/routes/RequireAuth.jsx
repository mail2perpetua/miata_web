import { useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components';
import { ROLE_HOME, useAuth } from '@/features/auth/AuthContext';
import { setWebsiteStyles } from '@/website/theme/themeAssets';

/**
 * Marks the dashboards: the portal styles (scoped to `.lms`) apply and the website theme stylesheets are
 * switched off, so neither design leaks into the other.
 */
export function PortalScope() {
  useLayoutEffect(() => {
    setWebsiteStyles(false);
    document.documentElement.classList.add('lms');
    return () => document.documentElement.classList.remove('lms');
  }, []);
  return <Outlet />;
}

/**
 * Route guard. This only controls what the UI shows — every API call is authorised again on the server.
 * Signed-out visitors go to the login page of the portal they asked for.
 */
export function RequireAuth({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to={`/login/${role}`} replace state={{ from: location.pathname + location.search }} />;
  }
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

/** Sends signed-in users from the login/register pages to their dashboard. */
export function GuestOnly() {
  const { status, user } = useAuth();
  if (status === 'loading') return null; // the website preloader covers the first check
  if (status === 'authenticated') return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
