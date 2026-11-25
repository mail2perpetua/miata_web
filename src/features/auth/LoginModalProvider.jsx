import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_HOME, useAuth } from './AuthContext';
import { LoginModalContext } from './loginModalContext';

/**
 * Keeps the login dialog's request across page changes (e.g. a dashboard redirecting a signed-out visitor to
 * /login/admin). The dialog itself is rendered by the website layout (LoginModal). A signed-in user who asks to
 * log in is taken to their dashboard instead.
 */
export function LoginModalProvider({ children }) {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);

  // Signed in (through the dialog or a restored session): close any open request.
  const [seenStatus, setSeenStatus] = useState(status);
  if (seenStatus !== status) {
    setSeenStatus(status);
    if (status === 'authenticated') setRequest(null);
  }

  const openLogin = useCallback(
    (options = {}) => {
      if (status === 'authenticated') {
        navigate(ROLE_HOME[user.role]);
        return;
      }
      // A new id remounts the dialog, so every opening starts with a fresh form.
      setRequest((previous) => ({ ...options, id: (previous?.id ?? 0) + 1 }));
    },
    [status, user, navigate],
  );
  const closeLogin = useCallback(() => setRequest(null), []);

  const value = useMemo(() => ({ request, openLogin, closeLogin }), [request, openLogin, closeLogin]);
  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>;
}
