import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT } from '../content/site';
import { MenuList } from './SiteHeader';

const SOCIAL = [
  { href: 'https://twitter.com/', icon: 'fab fa-twitter', label: 'Twitter' },
  { href: 'https://www.facebook.com/', icon: 'fab fa-facebook', label: 'Facebook' },
  { href: 'https://www.pinterest.com/', icon: 'fab fa-pinterest-p', label: 'Pinterest' },
  { href: 'https://www.instagram.com/', icon: 'fab fa-instagram', label: 'Instagram' },
];

export function MobileNav({ open, onClose }) {
  return (
    <div className={`mobile-nav__wrapper${open ? ' expanded' : ''}`}>
      <div className="mobile-nav__overlay mobile-nav__toggler" onClick={onClose}></div>
      <div className="mobile-nav__content">
        <span className="mobile-nav__close mobile-nav__toggler" role="button" tabIndex={0} aria-label="Close menu" onClick={onClose}>
          <i className="fa fa-times"></i>
        </span>
        <div className="logo-box">
          <Link to="/" aria-label="logo image">
            <img src="/assets/images/loader.png" style={{ height: '100%', width: '100%' }} alt="MIATA" />
          </Link>
        </div>
        <div className="mobile-nav__container">
          <MenuList />
        </div>
        <ul className="mobile-nav__contact list-unstyled">
          <li>
            <i className="fas fa-envelope"></i> <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
          <li>
            <i className="fa fa-phone-alt"></i> <a href={`tel:${CONTACT.phone}`}>{CONTACT.phoneSpaced}</a>
          </li>
        </ul>
        <div className="mobile-nav__social">
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
  );
}
