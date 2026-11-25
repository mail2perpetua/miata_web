import { createContext, useContext } from 'react';

export const LoginModalContext = createContext(null);

/**
 * The website's login dialog: `{ request, openLogin, closeLogin }`.
 * `openLogin({ role, email, from, message })` opens it — `role` preselects a portal, `email` prefills the form,
 * `from` is where to go after signing in and `message` is shown above the form. See LoginModalProvider.
 */
export const useLoginModal = () => useContext(LoginModalContext);
