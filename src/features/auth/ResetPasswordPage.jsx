import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import * as v from '@/utils/validation';
import { PageHeader } from '@/website/layout/PageHeader';
import { WebsitePage } from '@/website/layout/WebsitePage';
import { FormMessage } from '@/website/sections/FormMessage';
import { ThemeButton } from '@/website/sections/SectionTitle';
import { AuthArea, AuthField, AuthSubmit } from './AuthForm';
import { isLoginRole } from './roles';

const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';
const INTRO = {
  course_completed: {
    title: 'Congratulations on completing your course!',
    text: 'For your security, choose a new password to continue. Your completion record and profile remain available.',
  },
  account_created: {
    title: 'Welcome to MIATA',
    text: 'Your account was created with a temporary password. Choose your own password to continue.',
  },
  admin_request: { title: 'Choose a new password', text: 'An administrator has asked you to set a new password.' },
};
// The link in the welcome / set-password e-mail.
const SETUP_INTRO = {
  title: 'Welcome to MIATA',
  text: 'Choose a password for your account. You will sign in with your e-mail address and this password.',
};

/**
 * Handles both the emailed link (?token=…) and the mandatory reset after sign-in
 * (token passed in navigation state, never in the URL).
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const token = location.state?.token || params.get('token');
  const role = location.state?.role;
  const [check, setCheck] = useState(
    token ? { status: 'checking' } : { status: 'invalid', message: 'This password reset link is missing or incomplete.' },
  );
  const form = useForm({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (!token) return;
    api
      .post('/auth/reset-password/verify', { token })
      .then((res) => setCheck({ status: 'valid', ...res.data }))
      .catch((err) => setCheck({ status: 'invalid', message: err.message }));
  }, [token]);

  const onSubmit = form.submit(
    async (values) => {
      const res = await api.post('/auth/reset-password', { token, password: values.password });
      navigate(isLoginRole(role) ? `/login/${role}` : '/login', {
        replace: true,
        state: { email: res.data.email, message: res.data.message },
      });
    },
    (values) => ({ password: v.password(values.password), confirmPassword: v.matches(values.confirmPassword, values.password) }),
  );

  const reason = location.state?.reason || check.reason;
  const intro = (check.purpose === 'setup' ? SETUP_INTRO : INTRO[reason]) ?? {
    title: 'Set a new password',
    text: check.email ? `Choose a new password for ${check.email}.` : '',
  };

  return (
    <WebsitePage title="Set a New Password">
      <PageHeader title="Reset Password" variant="two" />
      <AuthArea single>
        <div className="login-page__wrap">
          {check.status === 'checking' && <p className="login-page__lead">Checking your reset link…</p>}

          {check.status === 'invalid' && (
            <>
              <h3 className="login-page__wrap__title">Link expired</h3>
              <p className="login-page__lead">{check.message}</p>
              <ThemeButton as={Link} to="/forgot-password" secondary>
                Request a New Link
              </ThemeButton>
              <p className="login-page__switch">
                <Link to="/login">Back to login</Link>
              </p>
            </>
          )}

          {check.status === 'valid' && (
            <>
              <h3 className="login-page__wrap__title">{intro.title}</h3>
              <p className="login-page__lead">{intro.text}</p>
              <form className="login-page__form" onSubmit={onSubmit} noValidate>
                {reason === 'course_completed' && <FormMessage>Your course completion has been recorded.</FormMessage>}
                {form.formError && <FormMessage error>{form.formError}</FormMessage>}
                <input type="email" autoComplete="username" value={check.email} readOnly hidden />
                <AuthField
                  type="password"
                  placeholder="New password *"
                  autoComplete="new-password"
                  value={form.values.password}
                  onChange={form.set('password')}
                  error={form.errors.password}
                  hint={PASSWORD_HINT}
                />
                <AuthField
                  type="password"
                  placeholder="Confirm new password *"
                  autoComplete="new-password"
                  value={form.values.confirmPassword}
                  onChange={form.set('confirmPassword')}
                  error={form.errors.confirmPassword}
                />
                <AuthSubmit busy={form.submitting}>Save New Password</AuthSubmit>
              </form>
            </>
          )}
        </div>
      </AuthArea>
    </WebsitePage>
  );
}
