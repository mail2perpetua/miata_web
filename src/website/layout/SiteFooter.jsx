import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, FOOTER_PROGRAMS, MAIN_MENU } from '../content/site';

const SOCIAL = [
  { href: 'https://www.facebook.com/', icon: 'fab fa-facebook-f', label: 'Facebook' },
  { href: 'https://www.linkedin.com/', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
  { href: 'https://twitter.com/', icon: 'fab fa-twitter', label: 'Twitter' },
  { href: 'https://www.youtube.com/', icon: 'fab fa-youtube', label: 'YouTube' },
];

export function SiteFooter() {
  return (
    <>
      <footer className="main-footer-two">
        <div className="main-footer-two__bg" style={{ backgroundImage: 'url(/assets/images/shapes/footer-bg-2.png)' }}></div>
        <div className="container">
          <div className="row">
            <div className="col-xl-4 col-md-5 wow fadeInUp" data-wow-delay="100ms">
              <div className="main-footer-two__about">
                <h3 className="main-footer-two__title">MIATA - Medical Imaging Accredited Training Academy</h3>
                <ul className="main-footer-two__info-list">
                  <li>
                    <span className="icon-Location"></span>
                    {CONTACT.address}
                  </li>
                  <li>
                    <span className="icon-Telephone"></span>
                    <a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a>
                  </li>
                  <li>
                    <span className="icon-Email"></span>
                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  </li>
                </ul>
                <div className="main-footer-two__social">
                  {SOCIAL.map((s, i) => (
                    <Fragment key={s.href}>
                      {i > 0 && ' '}
                      <a href={s.href} aria-label={s.label}>
                        <i className={s.icon}></i>
                      </a>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-4 wow fadeInUp" data-wow-delay="200ms">
              <div className="main-footer-two__navmenu main-footer-two__widget01">
                <h3 className="main-footer-two__title">Quick Links</h3>
                <ul>
                  {MAIN_MENU.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-xl-2 col-md-3 wow fadeInUp" data-wow-delay="300ms">
              <div className="main-footer-two__navmenu main-footer-two__widget02">
                <h3 className="main-footer-two__title">Programs</h3>
                <ul>
                  {FOOTER_PROGRAMS.map((program) => (
                    <li key={program}>
                      <Link to="/courses">{program}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-md-12 wow fadeInUp" data-wow-delay="400ms">
              <div className="main-footer-two__gallery">
                <h3 className="main-footer-two__title">
                  Learn Today <br /> Lead Tomorrow
                </h3>
                <div className="main-footer-two__galleries">
                  <p className="copyright__text">
                    Advance Your Diagnostic Imaging Career with Global Accreditation
                    <br /> One-Year Blended Ultrasound Program with International Clinical Training and ARDMS Pathway.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <section className="copyright text-center">
        <div className="container wow fadeInUp" data-wow-delay="400ms">
          <p className="copyright__text">Copyright {new Date().getFullYear()} All Rights Reserved By MIATA.</p>
        </div>
      </section>
    </>
  );
}
