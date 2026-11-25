import { APPROACH } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** About Us, continued: the training methodology and how the programs are delivered. */
export function TrainingApproachSection() {
  const { delivery } = APPROACH;
  return (
    <section id="approach" className="home-section home-section--soft home-approach">
      <div className="container">
        <div className="home-section__head wow fadeInUp" data-wow-delay="100ms">
          <SectionTitle tagline="About Us" title="Our Training Approach" centered />
          <p className="home-lead">{APPROACH.intro}</p>
        </div>
        <h3 className="home-kicker">{APPROACH.methodsIntro}</h3>
        <ul className="home-methods">
          {APPROACH.methods.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="home-method wow fadeInUp" data-wow-delay={`${(i % 3) * 100 + 100}ms`}>
              <div className="home-method__top">
                <span className="home-icon">
                  <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="home-method__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h4 className="home-method__title">{title}</h4>
              <p className="home-method__text">{text}</p>
            </li>
          ))}
        </ul>
        <div className="home-delivery wow fadeInUp" data-wow-delay="100ms">
          <h3 className="home-delivery__title">How our programs are delivered</h3>
          <ol className="home-delivery__steps">
            {delivery.steps.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span className="home-delivery__icon">
                  <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ol>
          <p className="home-delivery__text">{delivery.text}</p>
        </div>
      </div>
    </section>
  );
}
