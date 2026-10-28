import { Link } from 'react-router-dom';
import { SERVICES } from '../content/highlights';
import { SectionTitle } from './SectionTitle';

/** "Why Choose MIATA" cards. `showReadMore` adds the Read More links (home page). */
export function WhyChooseSection({ showReadMore = false }) {
  return (
    <section className="service-two" style={{ backgroundImage: 'url(/assets/images/shapes/service-bg-2.jpg)' }}>
      <div className="container">
        <SectionTitle title="Why Choose MIATA" centered className="wow fadeInUp" data-wow-delay="100ms" />
        <div className="row">
          {SERVICES.map((service, i) => (
            <div key={service.title} className="col-xl-3 col-md-6 wow fadeInUp" data-wow-delay={`${(i + 2) * 100}ms`}>
              <div className="service-two__item text-center">
                <div className="service-two__wrapper">
                  <svg viewBox="0 0 303 117" fill="#F6F6F6" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="151" cy="-129" r="246"></circle>
                  </svg>
                  <div className="service-two__icon">
                    <span className={service.icon}></span>
                  </div>
                  <h3 className="service-two__title">
                    <Link to={service.link}>{service.title}</Link>
                  </h3>
                  <p className="service-two__text">{service.text}</p>
                  {showReadMore && (
                    <Link className="service-two__rm" to={service.link}>
                      Read More
                      <span className="icon-caret-right"></span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
