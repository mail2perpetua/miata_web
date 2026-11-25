import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Handshake,
  Info,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  Presentation,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import * as v from '@/utils/validation';
import { ROLE_HOME, useAuth } from './AuthContext';
import { useLoginModal } from './loginModalContext';
import { isLoginRole, ROLE_INFO } from './roles';
import './loginModal.css';

// Students first: most people signing in are students.
const PORTALS = [
  { role: 'student', icon: GraduationCap },
  { role: 'professor', icon: Presentation },
  { role: 'agent', icon: Handshake },
  { role: 'admin', icon: ShieldCheck },
];
const PORTAL_ICON = Object.fromEntries(PORTALS.map(({ role, icon }) => [role, icon]));

// The student self-registration link is hidden for now (students apply through /apply); flip to true to show it.
// The /register flow itself stays in place.
const SHOW_STUDENT_REGISTER = false;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

/** The website's login dialog; rendered by the website layout while a login is requested (useLoginModal). */
export function LoginModal() {
  const { request, closeLogin } = useLoginModal();
  if (!request) return null;
  return <LoginDialog key={request.id} request={request} onClose={closeLogin} />;
}

/**
 * /login and /login/:role — bookmarks, the dashboards' sign-out and session redirects, and the password reset
 * page: opens the dialog (with that portal, prefilled email, message and return address) over the home page.
 */
export function LoginRoute() {
  const { role } = useParams();
  const { state } = useLocation();
  const { openLogin } = useLoginModal();
  const navigate = useNavigate();
  useEffect(() => {
    openLogin({ role, from: state?.from, email: state?.email, message: state?.message });
    navigate('/', { replace: true });
  }, [role, state, openLogin, navigate]);
  return null;
}

/** A "Login" link that opens the dialog on the current page (a new tab or window still opens /login). */
export function LoginLink({ role, onClick, children, ...props }) {
  const { openLogin } = useLoginModal();
  return (
    <a
      href={role ? `/login/${role}` : '/login'}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openLogin({ role });
      }}
    >
      {children}
    </a>
  );
}

/** Focus inside the dialog, Tab kept inside it, Escape to close, page scroll locked, focus restored on close. */
function useDialogBehaviour(dialogRef, onEscape) {
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    // On touch screens focus the dialog itself, so the on-screen keyboard does not cover it straight away.
    const field = window.matchMedia('(pointer: coarse)').matches ? null : dialog.querySelector('[data-autofocus]');
    (field || dialog).focus({ preventScroll: true });

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add('login-modal-open');
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('login-modal-open');
      document.body.style.paddingRight = '';
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [dialogRef]);
}

function LoginDialog({ request, onClose }) {
  const [role, setRole] = useState(isLoginRole(request.role) ? request.role : 'student');
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState(request.email ?? ''); // carried between the sign-in and reset views
  const [switchedView, setSwitchedView] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();

  const requestClose = useCallback(() => setClosing(true), []); // onClose runs when the closing animation ends
  useDialogBehaviour(dialogRef, requestClose);

  const info = ROLE_INFO[role];
  const PortalIcon = PORTAL_ICON[role];

  return createPortal(
    <div
      className={`login-modal${closing ? ' is-closing' : ''}`}
      onMouseDown={(event) => event.target === event.currentTarget && requestClose()}
    >
      <div
        className="login-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        onAnimationEnd={(event) => closing && event.target === event.currentTarget && onClose()}
      >
        <button type="button" className="login-modal__close" onClick={requestClose} aria-label="Close login">
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <aside className="login-modal__aside">
          <div className="login-modal__brand">
            <img src="/assets/images/loader.png" width="52" height="52" alt="" />
            <span>
              <strong>MIATA</strong>
              <span>Medical Imaging Training Academy</span>
            </span>
          </div>
          <div className="login-modal__portal">
            <span className="login-modal__portal-icon">
              <PortalIcon size={26} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p className="login-modal__portal-title">{info.label} Portal</p>
            <p className="login-modal__portal-text">{info.summary}</p>
            <ul className="login-modal__features">
              {info.features.map((feature) => (
                <li key={feature}>
                  <CircleCheck size={17} strokeWidth={2} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <p className="login-modal__slogan">Bridging the Gap Between Medical Knowledge and Practical Sonography.</p>
        </aside>

        <div className="login-modal__main">
          {view === 'login' ? (
            <LoginView
              titleId={titleId}
              request={request}
              role={role}
              onRoleChange={setRole}
              initialEmail={email}
              autoFocus={switchedView}
              onForgot={(typedEmail) => {
                setEmail(typedEmail);
                setSwitchedView(true);
                setView('forgot');
              }}
              onDone={onClose}
            />
          ) : (
            <ForgotView
              titleId={titleId}
              initialEmail={email}
              onBack={(typedEmail) => {
                setEmail(typedEmail);
                setSwitchedView(true);
                setView('login');
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Mobile-only brand line above the form (the side panel is hidden on small screens). */
function CompactBrand() {
  return (
    <div className="login-modal__compact-brand" aria-hidden="true">
      <img src="/assets/images/loader.png" width="40" height="40" alt="" />
      <span>MIATA Portal</span>
    </div>
  );
}

function LoginView({ titleId, request, role, onRoleChange, initialEmail, autoFocus, onForgot, onDone }) {
  const { login, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const [wrongPortal, setWrongPortal] = useState(null);
  const form = useForm({ email: initialEmail, password: '', remember: false });
  const radioName = useId();
  const info = ROLE_INFO[role];
  const flash = notice || request.message;

  const changeRole = (next) => {
    setWrongPortal(null);
    onRoleChange(next);
  };

  const onSubmit = form.submit(
    async (values) => {
      setWrongPortal(null);
      let result;
      try {
        result = await login({ email: values.email.trim(), password: values.password, remember: values.remember, role });
      } catch (err) {
        if (err.code !== 'ROLE_MISMATCH') throw err;
        setWrongPortal({ message: err.message, role: err.details?.role });
        return;
      }
      clearNotice();
      onDone();
      if (result.passwordResetRequired) {
        navigate('/reset-password', { state: { token: result.resetToken, reason: result.reason, email: result.email, role } });
        return;
      }
      const home = ROLE_HOME[role];
      navigate(request.from && request.from.startsWith(home) ? request.from : home);
    },
    (values) => ({ email: v.email(values.email), password: v.required(values.password, 'Password') }),
  );

  return (
    <>
      <CompactBrand />
      <h2 className="login-modal__title" id={titleId}>
        Welcome back
      </h2>
      <p className="login-modal__subtitle">Choose your portal and sign in to continue.</p>

      <form className="login-modal__form" onSubmit={onSubmit} noValidate>
        <fieldset className="login-modal__roles">
          <legend className="visually-hidden">Portal</legend>
          {PORTALS.map(({ role: portal, icon: Icon }) => (
            <label key={portal} className={`login-modal__role${portal === role ? ' is-active' : ''}`}>
              <input type="radio" name={radioName} value={portal} checked={portal === role} onChange={() => changeRole(portal)} />
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{ROLE_INFO[portal].label}</span>
            </label>
          ))}
        </fieldset>

        {flash && (
          <p className="login-modal__alert login-modal__alert--info" role="status">
            <Info size={18} strokeWidth={2} aria-hidden="true" />
            <span>{flash}</span>
          </p>
        )}
        {form.formError && (
          <p className="login-modal__alert login-modal__alert--error" role="alert">
            <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
            <span>{form.formError}</span>
          </p>
        )}
        {wrongPortal && (
          <div className="login-modal__alert login-modal__alert--error" role="alert">
            <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
            <span>
              {wrongPortal.message}{' '}
              {ROLE_INFO[wrongPortal.role] && (
                <button type="button" className="login-modal__link" onClick={() => changeRole(wrongPortal.role)}>
                  Switch to the {ROLE_INFO[wrongPortal.role].label} portal
                </button>
              )}
            </span>
          </div>
        )}

        <ModalField
          label="Email address"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={form.values.email}
          onChange={form.set('email')}
          error={form.errors.email}
          data-autofocus=""
          autoFocus={autoFocus}
        />
        <ModalField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.values.password}
          onChange={form.set('password')}
          error={form.errors.password}
        />

        <div className="login-modal__row">
          <label className="login-modal__check">
            <input type="checkbox" checked={form.values.remember} onChange={form.set('remember')} />
            <span>Remember me</span>
          </label>
          <button type="button" className="login-modal__link" onClick={() => onForgot(form.values.email.trim())}>
            Forgot password?
          </button>
        </div>

        <button type="submit" className="login-modal__submit" disabled={form.submitting} aria-busy={form.submitting || undefined}>
          {form.submitting ? (
            <>
              <LoaderCircle className="login-modal__spinner" size={19} strokeWidth={2.2} aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in to {info.label} Portal
              <ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="login-modal__footnote">
        {role === 'student' && SHOW_STUDENT_REGISTER ? (
          <>
            New student?{' '}
            <Link to="/register" onClick={onDone}>
              Create an account
            </Link>
          </>
        ) : role === 'student' ? (
          <>
            Not a student yet?{' '}
            <Link to="/apply" onClick={onDone}>
              Apply now
            </Link>
          </>
        ) : (
          <>
            Trouble signing in?{' '}
            <Link to="/contact" onClick={onDone}>
              Contact MIATA
            </Link>
          </>
        )}
      </p>
    </>
  );
}

function ForgotView({ titleId, initialEmail, onBack }) {
  const [sent, setSent] = useState(null);
  const form = useForm({ email: initialEmail });
  const sentRef = useRef(null);

  // The form (and its focused button) is replaced by the confirmation: keep keyboard focus inside the dialog.
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const onSubmit = form.submit(
    async (values) => {
      const res = await api.post('/auth/forgot-password', { email: values.email.trim() });
      setSent(res.data.message);
    },
    (values) => ({ email: v.email(values.email) }),
  );

  return (
    <>
      <CompactBrand />
      <button type="button" className="login-modal__back" onClick={() => onBack(form.values.email.trim())}>
        <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" />
        Back to sign in
      </button>
      <span className="login-modal__title-icon">
        <KeyRound size={24} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <h2 className="login-modal__title" id={titleId}>
        Reset your password
      </h2>
      <p className="login-modal__subtitle">
        Enter your account email and we will send you a secure, single-use reset link (valid for 30 minutes).
      </p>

      {sent ? (
        <p className="login-modal__alert login-modal__alert--success" role="status" tabIndex={-1} ref={sentRef}>
          <CircleCheck size={18} strokeWidth={2} aria-hidden="true" />
          <span>{sent}</span>
        </p>
      ) : (
        <form className="login-modal__form" onSubmit={onSubmit} noValidate>
          {form.formError && (
            <p className="login-modal__alert login-modal__alert--error" role="alert">
              <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
              <span>{form.formError}</span>
            </p>
          )}
          <ModalField
            label="Email address"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.values.email}
            onChange={form.set('email')}
            error={form.errors.email}
            autoFocus
          />
          <button type="submit" className="login-modal__submit" disabled={form.submitting} aria-busy={form.submitting || undefined}>
            {form.submitting ? (
              <>
                <LoaderCircle className="login-modal__spinner" size={19} strokeWidth={2.2} aria-hidden="true" />
                Sending…
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

/** Labelled input with a leading icon, an inline error and (for passwords) a show / hide button. */
function ModalField({ label, icon: Icon, type, error, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={`login-modal__field${error ? ' has-error' : ''}`}>
      <label className="login-modal__label" htmlFor={id}>
        {label}
      </label>
      <div className="login-modal__control">
        <Icon className="login-modal__control-icon" size={18} strokeWidth={2} aria-hidden="true" />
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="login-modal__reveal"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-controls={id}
          >
            {visible ? <EyeOff size={18} strokeWidth={2} aria-hidden="true" /> : <Eye size={18} strokeWidth={2} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p className="login-modal__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
