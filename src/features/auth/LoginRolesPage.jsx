import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '@/website/layout/PageHeader';
import { WebsitePage } from '@/website/layout/WebsitePage';
import { SectionTitle } from '@/website/sections/SectionTitle';
import { AuthNotice } from './AuthForm';
import { useAuth } from './AuthContext';
import { LOGIN_ROLES, ROLE_INFO } from './roles';

/** /login — choose the Admin, Student, Professor or Agent login. */
export default function LoginRolesPage() {
  const { notice } = useAuth();
  const location = useLocation();
  const message = notice || location.state?.message;
  // Keep where the visitor was heading (and any message) when they pick a portal.
  const forward = location.state ? { from: location.state.from, email: location.state.email } : undefined;

  return (
    <WebsitePage title="Login">
      <PageHeader title="Login" variant="two" />
      <section className="login-page login-roles">
        <div className="container">
          {message && <AuthNotice>{message}</AuthNotice>}
          <SectionTitle tagline="Choose your portal" title="Login to MIATA" centered />
          <div className="row login-roles__list">
            {LOGIN_ROLES.map((role, i) => {
              const info = ROLE_INFO[role];
              return (
                <div key={role} className="col-xl-3 col-md-6 wow fadeInUp" data-wow-delay={`${(i + 1) * 100}ms`}>
                  <div className="service-two__item text-center login-roles__card">
                    <div className="service-two__wrapper">
                      <svg viewBox="0 0 303 117" fill="#F6F6F6" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="151" cy="-129" r="246"></circle>
                      </svg>
                      <div className="service-two__icon">
                        <span className={info.icon} aria-hidden="true"></span>
                      </div>
                      <h3 className="service-two__title">
                        <Link to={`/login/${role}`} state={forward}>
                          {info.label}
                        </Link>
                      </h3>
                      <p className="service-two__text">{info.summary}</p>
                      <Link className="service-two__rm" to={`/login/${role}`} state={forward} aria-label={`${info.label} login`}>
                        Login
                        <span className="icon-caret-right"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="login-roles__register">
            New student? <Link to="/register">Create your student account</Link>
          </p>
        </div>
      </section>
    </WebsitePage>
  );
}
