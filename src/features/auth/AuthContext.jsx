import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onSessionEnded, refreshSession, setAccessToken } from '@/services/api';

const AuthContext = createContext(null);

export const ROLE_HOME = { admin: '/admin', agent: '/agent', professor: '/professor', student: '/student' };

const SESSION_MESSAGES = {
  SESSION_REVOKED: 'Your session has ended. Please sign in again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  ACCOUNT_DISABLED: 'Your account has been deactivated. Please contact MIATA for help.',
  PASSWORD_RESET_REQUIRED: 'You need to set a new password. Sign in to continue.',
  course_completed:
    'Congratulations on completing your course! For your security you have been signed out. Sign in again to set a new password.',
};

const HEARTBEAT_MS = 60_000;

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, notice: null });

  const endSession = useCallback((code) => {
    setAccessToken(null);
    setState({ status: 'anonymous', user: null, notice: SESSION_MESSAGES[code] ?? SESSION_MESSAGES.SESSION_EXPIRED });
  }, []);

  const startSession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setState({ status: 'authenticated', user: session.user, notice: null });
  }, []);

  // Restore the session from the httpOnly refresh cookie on page load.
  useEffect(() => {
    onSessionEnded(endSession);
    let cancelled = false;
    refreshSession()
      .then((session) => !cancelled && startSession(session))
      .catch(() => !cancelled && setState({ status: 'anonymous', user: null, notice: null }));
    return () => {
      cancelled = true;
    };
  }, [endSession, startSession]);

  // Heartbeat: a session ended elsewhere (course completion, deactivation, password change)
  // logs this tab out within a minute instead of at the next click.
  useEffect(() => {
    if (state.status !== 'authenticated') return undefined;
    const beat = () => document.visibilityState === 'visible' && api.get('/auth/session').catch(() => {});
    const id = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [state.status]);

  /**
   * Signs in through the login page of `role`; the API refuses an account of another role (ROLE_MISMATCH).
   * Resolves with { passwordResetRequired, resetToken, reason } instead of a session when a reset is owed.
   */
  const login = useCallback(
    async ({ email, password, remember, role }) => {
      const { data } = await api.post('/auth/login', { email, password, remember, role });
      if (!data.passwordResetRequired) startSession(data);
      return data;
    },
    [startSession],
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      startSession(data);
      return data;
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The local session is cleared regardless.
    }
    setAccessToken(null);
    setState({ status: 'anonymous', user: null, notice: null });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      endSession,
      startSession,
      updateUser: (user) => setState((s) => ({ ...s, user })),
      clearNotice: () => setState((s) => ({ ...s, notice: null })),
    }),
    [state, login, register, logout, endSession, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
