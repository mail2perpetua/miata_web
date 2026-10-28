import { Link } from 'react-router-dom';
import { FEE_PLANS } from '../content/programme';
import { ThemeButton } from './SectionTitle';

/** Programme fee and scholarship cards. */
export function FeesSection() {
  return (
    <section className="pricing-one" style={{ backgroundImage: 'url(/assets/images/shapes/pricing-bg.jpg)' }}>
      <div className="container">
        <div className="section-title text-center">
          <h2 className="section-title__title">Fees &amp; Scholarships</h2>
          <h5 className="section-title__tagline">
            Transparent, structured pricing with scholarship opportunities for deserving candidates.
          </h5>
        </div>
        <div className="pricing-one__main-tab-box tabs-box">
          <div className="tabs-content">
            <div className="tab active-tab" id="monthly">
              <div className="row">
                {FEE_PLANS.map((plan, i) => (
                  <div key={plan.name} className="col-lg-6 col-md-6 fadeInUp animated d-flex" data-wow-delay={`${(i + 2) * 100}ms`}>
                    <div
                      className={`pricing-one__item${plan.featured ? ' active' : ''} w-100`}
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      <svg viewBox="0 0 416 173" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="207.5" cy="-81.5" r="254.5"></circle>
                      </svg>
                      <div className="pricing-one__item__name">{plan.name}</div>
                      <h3 className="pricing-one__item__price">{plan.price}</h3>
                      <h5 className="pricing-one__item__list-title" style={{ textAlign: 'left' }}>
                        {plan.summary}
                      </h5>
                      <ul className="pricing-one__item__list" style={{ textAlign: 'left' }}>
                        {plan.features.map((feature) => (
                          <li key={feature}>
                            <span className="fa fa-check-circle"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.featured ? (
                        <>
                          <div className="pricing-one__item__border" style={{ marginTop: 'auto' }}></div>
                          <ThemeButton as={Link} to="/contact" arrow={false}>
                            Apply for Scholarship
                          </ThemeButton>
                        </>
                      ) : (
                        <>
                          <div className="pricing-one__item__border" style={{ marginTop: 'auto', borderColor: 'transparent' }}></div>
                          {/* Invisible button keeps both cards the same height, as in the original page. */}
                          <ThemeButton
                            arrow={false}
                            aria-hidden="true"
                            tabIndex={-1}
                            style={{ visibility: 'hidden', pointerEvents: 'none' }}
                          >
                            Spacer
                          </ThemeButton>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
