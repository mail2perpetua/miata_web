import { Info, ShieldCheck } from 'lucide-react';
import { ORGANISATIONS, STANDARDS } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** International training: ARDMS, HCPC, SoR and ASMIRT — how MIATA refers to each, and what each organisation does. */
export function StandardsSection() {
  return (
    <section id="standards" className="home-section home-section--soft home-standards">
      <div className="container">
        <div className="home-section__head home-section__head--wide wow fadeInUp" data-wow-delay="100ms">
          <SectionTitle tagline="International Training" title="International Training Standards and Professional Guidelines" centered />
          <p className="home-lead">
            {STANDARDS.intro[0]} {STANDARDS.intro[1]}
          </p>
          <p className="home-text">{STANDARDS.rolesIntro}</p>
        </div>
        <div className="home-orgs">
          {ORGANISATIONS.map((org, i) => (
            <article key={org.acronym} className="home-org wow fadeInUp" data-wow-delay={`${(i % 2) * 100 + 100}ms`}>
              <header className="home-org__head">
                <span className="home-org__acronym">{org.acronym}</span>
                <div>
                  <h3 className="home-org__name">{org.name}</h3>
                  <span className="home-org__scope">{org.scope}</span>
                </div>
              </header>
              <div className="home-org__body">
                <h4 className="home-org__label">How MIATA refers to it</h4>
                <p>{org.reference}</p>
                <h4 className="home-org__label">About {org.acronym}</h4>
                <p>{org.role}</p>
              </div>
              <p className="home-org__note">
                <Info size={18} strokeWidth={2} aria-hidden="true" />
                <span>
                  <strong>Please note:</strong> {org.note}
                </span>
              </p>
            </article>
          ))}
        </div>
        <div className="home-governance wow fadeInUp" data-wow-delay="100ms">
          <span className="home-icon">
            <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <h3 className="home-governance__title">{STANDARDS.governance.title}</h3>
            <p className="home-governance__text">{STANDARDS.governance.text}</p>
          </div>
        </div>
        <p className="home-standards__consistency">{STANDARDS.consistency}</p>
        <p className="home-notice">
          <Info size={20} strokeWidth={2} aria-hidden="true" />
          <span>{STANDARDS.notice}</span>
        </p>
      </div>
    </section>
  );
}
