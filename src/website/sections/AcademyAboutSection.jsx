import { MapPin, Target } from 'lucide-react';
import { ABOUT, ACADEMY_NAME } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** About Us: who MIATA is, the graduate backgrounds it trains, and its objective. */
export function AcademyAboutSection() {
  return (
    <section id="about" className="home-section home-about">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6 wow fadeInLeft" data-wow-delay="100ms">
            <div className="home-media">
              <img className="home-media__img" src="/assets/images/course/banner-2-12.jpg" alt="MIATA medical imaging education" />
              <div className="home-media__badge">
                <span className="home-icon home-icon--orange">
                  <MapPin size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <span className="home-media__badge-label">Operating from</span>
                  <strong className="home-media__badge-value">Melbourne, Australia</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 wow fadeInRight" data-wow-delay="100ms">
            <SectionTitle tagline="About Us" title={`MIATA – ${ACADEMY_NAME}`} />
            <p className="home-lead">{ABOUT.intro[0]}</p>
            <p className="home-text">{ABOUT.intro[1]}</p>
            <h3 className="home-subheading">{ABOUT.backgroundsIntro}</h3>
            <ul className="home-chips">
              {ABOUT.backgrounds.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="home-objective wow fadeInUp" data-wow-delay="100ms">
          <span className="home-icon home-icon--light">
            <Target size={28} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <h3 className="home-objective__title">Our Objective</h3>
            <p className="home-objective__text">{ABOUT.objective}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
