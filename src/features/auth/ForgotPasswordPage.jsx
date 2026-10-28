import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import * as v from '@/utils/validation';
import { PageHeader } from '@/website/layout/PageHeader';
import { WebsitePage } from '@/website/layout/WebsitePage';
import { FormMessage } from '@/website/sections/FormMessage';
import { AuthArea, AuthField, AuthSubmit } from './AuthForm';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(null);
  const form = useForm({ email: '' });

  const onSubmit = form.submit(
    async (values) => {
      const res = await api.post('/auth/forgot-password', { email: values.email.trim() });
      setSent(res.data.message);
    },
    (values) => ({ email: v.email(values.email) }),
  );

  return (
    <WebsitePage title="Forgot Password">
      <PageHeader title="Forgot Password" variant="two" />
      <AuthArea single>
        <div className="login-page__wrap">
          <h3 className="login-page__wrap__title">Reset your password</h3>
          <p className="login-page__lead">
            Enter your account email and we will send you a secure, single-use reset link (valid for 30 minutes).
          </p>
          {sent ? (
            <FormMessage>{sent}</FormMessage>
          ) : (
            <form className="login-page__form" onSubmit={onSubmit} noValidate>
              {form.formError && <FormMessage error>{form.formError}</FormMessage>}
              <AuthField
                type="email"
                placeholder="Email address *"
                autoComplete="email"
                value={form.values.email}
                onChange={form.set('email')}
                error={form.errors.email}
              />
              <AuthSubmit busy={form.submitting}>Send Reset Link</AuthSubmit>
            </form>
          )}
          <p className="login-page__switch">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </AuthArea>
    </WebsitePage>
  );
}
