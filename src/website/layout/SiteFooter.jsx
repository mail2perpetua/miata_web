import { ArrowUp, Building2, GraduationCap, Info, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LoginLink } from '@/features/auth/LoginModal';
import { ACADEMY_NAME, ACADEMY_SLOGAN, HERO, NETWORK_COUNTRIES } from '../content/academy';
import { BROCHURE_URL, CONTACT, FOOTER_LINKS, SOCIAL_LINKS } from '../content/site';
import { ThemeButton } from '../sections/SectionTitle';
import '../theme/footer.css';

const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`;

const CONTACT_ITEMS = [
  { icon: MapPin, label: 'Address', value: CONTACT.address },
  { icon: Phone, label: 'Mobile', value: CONTACT.phoneSpaced, href: `tel:${CONTACT.phone}` },
  { icon: Building2, label: 'Office', value: CONTACT.officePhoneSpaced, href: `tel:${CONTACT.officeTel}` },
  { icon: Mail, label: 'General enquiries', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: GraduationCap, label: 'Admissions', value: CONTACT.admissionsEmail, href: `mailto:${CONTACT.admissionsEmail}` },
];

/** Call to action at the top of the footer (left out on the Apply page, which is the form itself). */
function FooterCta() {
  return (
    <div className="site-footer__cta">
      <div>
        <p className="site-footer__eyebrow">Learn Today, Lead Tomorrow</p>
        <h2 className="site-footer__cta-title">Advance your diagnostic imaging career with practical ultrasound training</h2>
        <p className="site-footer__cta-text">
          A one-year blended program: structured online theory, supervised scanning and hands-on training across{' '}
          {NETWORK_COUNTRIES.slice(0, -1).join(', ')} and {NETWORK_COUNTRIES.at(-1)}.
        </p>
      </div>
      <div className="site-footer__cta-actions">
        <ThemeButton as={Link} to="/apply" secondary>
          Apply Now
        </ThemeButton>
        <ThemeButton href={BROCHURE_URL} className="eduact-btn--light">
          Download Brochure
        </ThemeButton>
      </div>
    </div>
  );
}

/** Site footer: call to action, brand and training network, link columns, contact details, notice and legal bar. */
export function SiteFooter() {
  const { pathname } = useLocation();
  return (
    <footer className="site-footer">
      <div className="site-footer__shape site-footer__shape--top" aria-hidden="true"></div>
      <div className="site-footer__shape site-footer__shape--bottom" aria-hidden="true"></div>

      <div className="container site-footer__main">
        {pathname !== '/apply' && <FooterCta />}

        <div className="site-footer__grid">
          <div className="site-footer__brand wow fadeInUp" data-wow-delay="100ms">
            <Link to="/" className="site-footer__logo">
              <img src="/assets/images/loader.png" width="64" height="64" alt="" />
              <span>
                <strong>MIATA</strong>
                <span>{ACADEMY_NAME}</span>
              </span>
            </Link>
            <p className="site-footer__about">{HERO.text}</p>
            <p className="site-footer__slogan">{ACADEMY_SLOGAN}</p>
            <p className="site-footer__label">Training network</p>
            <ul className="site-footer__countries">
              {NETWORK_COUNTRIES.map((country) => (
                <li key={country}>
                  <Link to="/#network">
                    <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                    {country}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="site-footer__social">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <i className={social.icon} aria-hidden="true"></i>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_LINKS.map((column, i) => (
            <nav
              key={column.key}
              className={`site-footer__col site-footer__col--${column.key} wow fadeInUp`}
              data-wow-delay={`${(i + 2) * 100}ms`}
              aria-labelledby={`footer-${column.key}`}
            >
              <h2 className="site-footer__title" id={`footer-${column.key}`}>
                {column.title}
              </h2>
              <ul className="site-footer__links">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="site-footer__col site-footer__col--contact wow fadeInUp" data-wow-delay="500ms">
            <h2 className="site-footer__title">Get in Touch</h2>
            <ul className="site-footer__contact">
              {CONTACT_ITEMS.map(({ icon: Icon, label, value, href }) => (
                <li key={label}>
                  <span className="site-footer__contact-icon">
                    <Icon size={17} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="site-footer__contact-label">{label}</span>
                    {href ? <a href={href}>{value}</a> : <span className="site-footer__contact-value">{value}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <a className="site-footer__whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <p className="site-footer__notice">
          <Info size={18} strokeWidth={2} aria-hidden="true" />
          <span>
            MIATA is an independent professional ultrasound training academy. Its Professional Certificates of Course Completion are issued
            independently and do not constitute professional registration, accreditation or eligibility to practise.{' '}
            <Link to="/#disclaimer">Read the Important Disclaimer</Link>
          </span>
        </p>
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} MIATA – {ACADEMY_NAME}. All rights reserved.
          </p>
          <ul className="site-footer__legal">
            <li>
              <Link to="/#disclaimer">Disclaimer</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <LoginLink aria-haspopup="dialog">Portal Login</LoginLink>
            </li>
          </ul>
          <button type="button" className="site-footer__top" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>
            Back to top
            <ArrowUp size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
