import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import * as v from '@/utils/validation';
import { PageHeader } from '@/website/layout/PageHeader';
import { WebsitePage } from '@/website/layout/WebsitePage';
import { FormMessage } from '@/website/sections/FormMessage';
import { AuthArea, AuthCheckbox, AuthField, AuthNotice, AuthSubmit } from './AuthForm';
import { ROLE_HOME, useAuth } from './AuthContext';
import { isLoginRole, ROLE_INFO } from './roles';

// The student Register column is hidden for now; flip to true to show it again.
// The /register flow itself stays in place.
const SHOW_STUDENT_REGISTER = false;

/** /login/:role — the original login page, signing in to one portal. */
export default function RoleLoginPage() {
  const { role } = useParams();
  if (!isLoginRole(role)) return <Navigate to="/login" replace />;
  return <RoleLogin key={role} role={role} />;
}

function RoleLogin({ role }) {
  const info = ROLE_INFO[role];
  const { login, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [wrongPortal, setWrongPortal] = useState(null);
  const form = useForm({ email: location.state?.email ?? '', password: '', remember: false });

  const onSubmit = form.submit(
    async (values) => {
      setWrongPortal(null);
      let result;
      try {
        result = await login({ email: values.email.trim(), password: values.password, remember: values.remember, role });
      } catch (err) {
        if (err.code !== 'ROLE_MISMATCH') throw err;
        setWrongPortal({ message: err.message, role: err.details.role });
        return;
      }
      clearNotice();
      if (result.passwordResetRequired) {
        navigate('/reset-password', { state: { token: result.resetToken, reason: result.reason, email: result.email, role } });
        return;
      }
      const home = ROLE_HOME[role];
      const from = location.state?.from;
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    },
    (values) => ({ email: v.email(values.email), password: v.required(values.password, 'Password') }),
  );

  const flash = location.state?.message;
  return (
    <WebsitePage title={`${info.label} Login`}>
      <PageHeader title={`${info.label} Login`} variant="two" />
      <AuthArea
        notice={
          <AuthNotice>
            {notice || flash || (
              <>
                You are signing in to the <span>{info.label}</span> portal. Not {role === 'admin' ? 'an' : 'a'} {info.label.toLowerCase()}?{' '}
                <Link to="/login">Choose another login</Link>
              </>
            )}
          </AuthNotice>
        }
      >
        <div className="col-lg-6 wow fadeInUp animated" data-wow-delay="300ms">
          <div className="login-page__wrap">
            <h3 className="login-page__wrap__title">Login</h3>
            <form className="login-page__form" onSubmit={onSubmit} noValidate>
              {form.formError && <FormMessage error>{form.formError}</FormMessage>}
              {wrongPortal && (
                <FormMessage error>
                  {wrongPortal.message}{' '}
                  {ROLE_INFO[wrongPortal.role] && (
                    <Link to={`/login/${wrongPortal.role}`} state={{ email: form.values.email }}>
                      Go to the {ROLE_INFO[wrongPortal.role].label} login
                    </Link>
                  )}
                </FormMessage>
              )}
              <AuthField
                type="email"
                placeholder="Email address *"
                autoComplete="username"
                value={form.values.email}
                onChange={form.set('email')}
                error={form.errors.email}
              />
              <AuthField
                type="password"
                placeholder="Password *"
                autoComplete="current-password"
                value={form.values.password}
                onChange={form.set('password')}
                error={form.errors.password}
              />
              <AuthCheckbox
                checked={form.values.remember}
                onChange={form.set('remember')}
                aside={
                  <div className="login-page__forgot-password">
                    <Link to="/forgot-password">Forgot Password?</Link>
                  </div>
                }
              >
                Remember Me?
              </AuthCheckbox>
              <AuthSubmit busy={form.submitting}>Login</AuthSubmit>
            </form>
          </div>
        </div>
        <div className="col-lg-6 wow fadeInUp animated" data-wow-delay="400ms">
          <div className="login-page__wrap login-page__wrap--right">
            {role === 'student' && SHOW_STUDENT_REGISTER ? <RegisterBox /> : <PortalInfo info={info} />}
          </div>
        </div>
      </AuthArea>
    </WebsitePage>
  );
}

/** The original page's Register column: it continues on the full registration form. */
function RegisterBox() {
  const navigate = useNavigate();
  const form = useForm({ email: '', password: '', accept: false });
  const onSubmit = form.submit(
    (values) => navigate('/register', { state: { email: values.email.trim(), password: values.password } }),
    (values) => ({
      email: values.email.trim() ? v.email(values.email) : null,
      accept: values.accept ? null : 'Please accept the privacy policy to continue',
    }),
  );
  return (
    <>
      <h3 className="login-page__wrap__title">Register</h3>
      <form className="login-page__form" onSubmit={onSubmit} noValidate>
        <AuthField
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={form.values.email}
          onChange={form.set('email')}
          error={form.errors.email}
        />
        <AuthField
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={form.values.password}
          onChange={form.set('password')}
          error={form.errors.password}
        />
        <AuthCheckbox checked={form.values.accept} onChange={form.set('accept')} error={form.errors.accept}>
          I Accept Company Privacy Policy
        </AuthCheckbox>
        <AuthSubmit>Register</AuthSubmit>
      </form>
    </>
  );
}

/** What the selected portal offers (shown beside the form for staff and agent logins). */
function PortalInfo({ info }) {
  return (
    <div className="login-portal">
      <h3 className="login-page__wrap__title">
        <span className={`login-portal__icon ${info.icon}`} aria-hidden="true"></span> {info.label} Portal
      </h3>
      <p className="login-portal__text">{info.summary}</p>
      <ul className="login-portal__list">
        {info.features.map((feature) => (
          <li key={feature}>
            <span className="fa fa-check-circle" aria-hidden="true"></span>
            {feature}
          </li>
        ))}
      </ul>
      <p className="login-portal__help">
        Accounts for this portal are created by the MIATA administration. Forgotten your password?{' '}
        <Link to="/forgot-password">Reset it here</Link>.
      </p>
    </div>
  );
}
