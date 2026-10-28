import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import * as v from '@/utils/validation';
import { PageHeader } from '@/website/layout/PageHeader';
import { WebsitePage } from '@/website/layout/WebsitePage';
import { FormMessage } from '@/website/sections/FormMessage';
import { AuthArea, AuthCheckbox, AuthField, AuthSubmit } from './AuthForm';
import { useAuth } from './AuthContext';

const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';

/**
 * Student self-registration. Pre-filled from an agent referral link (?ref=CODE), ?email=, or the
 * Register box on the student login page (email and password passed in navigation state, never the URL).
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const refFromLink = (params.get('ref') || '').toUpperCase();
  const [referral, setReferral] = useState(null);
  const form = useForm({
    fullName: '',
    email: location.state?.email || params.get('email') || '',
    phone: '',
    password: location.state?.password || '',
    confirmPassword: '',
    referralCode: refFromLink,
    acceptTerms: false,
  });

  const code = form.values.referralCode.trim().toUpperCase();
  useEffect(() => {
    if (!/^[A-Z0-9]{6,16}$/.test(code)) return undefined;
    let cancelled = false;
    api
      .get(`/auth/referral/${code}`)
      .then((res) => !cancelled && setReferral({ code, ...res.data }))
      .catch(() => !cancelled && setReferral({ code, valid: false }));
    return () => {
      cancelled = true;
    };
  }, [code]);
  const referralInfo = referral?.code === code ? referral : null;

  const onSubmit = form.submit(
    async (values) => {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        password: values.password,
        referralCode: values.referralCode.trim() || undefined,
        acceptTerms: values.acceptTerms,
      });
      navigate('/student', { replace: true });
    },
    (values) => ({
      fullName: v.required(values.fullName, 'Full name'),
      email: v.email(values.email),
      phone: v.phone(values.phone),
      password: v.password(values.password),
      confirmPassword: v.matches(values.confirmPassword, values.password),
      referralCode: referralInfo && !referralInfo.valid ? 'This referral code is not valid' : null,
      acceptTerms: values.acceptTerms ? null : 'Please accept the privacy policy to continue',
    }),
  );

  return (
    <WebsitePage title="Student Registration">
      <PageHeader title="Register" variant="two" />
      <AuthArea>
        <div className="col-lg-6 wow fadeInUp animated" data-wow-delay="300ms">
          <div className="login-page__wrap">
            <h3 className="login-page__wrap__title">Register</h3>
            <form className="login-page__form" onSubmit={onSubmit} noValidate>
              {form.formError && <FormMessage error>{form.formError}</FormMessage>}
              <AuthField
                placeholder="Full name *"
                autoComplete="name"
                value={form.values.fullName}
                onChange={form.set('fullName')}
                error={form.errors.fullName}
              />
              <AuthField
                type="email"
                placeholder="Email address *"
                autoComplete="email"
                value={form.values.email}
                onChange={form.set('email')}
                error={form.errors.email}
              />
              <AuthField
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                value={form.values.phone}
                onChange={form.set('phone')}
                error={form.errors.phone}
              />
              <AuthField
                type="password"
                placeholder="Password *"
                autoComplete="new-password"
                value={form.values.password}
                onChange={form.set('password')}
                error={form.errors.password}
                hint={PASSWORD_HINT}
              />
              <AuthField
                type="password"
                placeholder="Confirm password *"
                autoComplete="new-password"
                value={form.values.confirmPassword}
                onChange={form.set('confirmPassword')}
                error={form.errors.confirmPassword}
              />
              <AuthField
                placeholder="Referral code (optional)"
                value={form.values.referralCode}
                onChange={form.set('referralCode')}
                error={form.errors.referralCode}
                readOnly={Boolean(refFromLink)}
              />
              <AuthCheckbox checked={form.values.acceptTerms} onChange={form.set('acceptTerms')} error={form.errors.acceptTerms}>
                I Accept Company Privacy Policy
              </AuthCheckbox>
              <AuthSubmit busy={form.submitting}>Create Account</AuthSubmit>
            </form>
          </div>
        </div>
        <div className="col-lg-6 wow fadeInUp animated" data-wow-delay="400ms">
          <div className="login-page__wrap login-page__wrap--right">
            <div className="login-portal">
              <h3 className="login-page__wrap__title">
                <span className="login-portal__icon fas fa-user-graduate" aria-hidden="true"></span> Student Portal
              </h3>
              {referralInfo?.valid && (
                <FormMessage>
                  Referred by {referralInfo.agentName}
                  {referralInfo.organization ? ` (${referralInfo.organization})` : ''}
                </FormMessage>
              )}
              <p className="login-portal__text">
                Create your account to access your MIATA courses, lecture videos and assignments once you are enrolled.
              </p>
              <ul className="login-portal__list">
                <li>
                  <span className="fa fa-check-circle" aria-hidden="true"></span>Online theory modules and lecture videos
                </li>
                <li>
                  <span className="fa fa-check-circle" aria-hidden="true"></span>Assignments with professor feedback
                </li>
                <li>
                  <span className="fa fa-check-circle" aria-hidden="true"></span>Progress tracking and course completion
                </li>
              </ul>
              <p className="login-portal__help">
                Already registered? <Link to="/login/student">Login here</Link>.
              </p>
            </div>
          </div>
        </div>
      </AuthArea>
    </WebsitePage>
  );
}
