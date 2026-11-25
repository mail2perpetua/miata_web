import { CircleCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import { FACULTY } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** International training: MIATA's trainers and what the training framework emphasises. */
export function FacultySection() {
  return (
    <section id="faculty" className="home-section home-faculty">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5 wow fadeInLeft" data-wow-delay="100ms">
            <div className="home-media home-media--portrait">
              <img
                className="home-media__img"
                src="/assets/images/course/banner-2-13.jpg"
                alt="MIATA faculty teaching medical imaging analysis"
              />
              <div className="home-media__badge home-media__badge--end">
                <span className="home-icon">
                  <GraduationCap size={22} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div>
                  <span className="home-media__badge-label">Trainer registration or credentials in</span>
                  <strong className="home-media__badge-value">Australia & the United Kingdom</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 wow fadeInRight" data-wow-delay="100ms">
            <SectionTitle tagline="International Training" title="MIATA Trainers and Professional Faculty" />
            <p className="home-lead">{FACULTY.intro[0]}</p>
            <p className="home-text">{FACULTY.intro[1]}</p>
            <p className="home-text">{FACULTY.intro[2]}</p>
            <h3 className="home-subheading">{FACULTY.emphasisIntro}</h3>
            <ul className="home-checklist">
              {FACULTY.emphasis.map((item) => (
                <li key={item}>
                  <CircleCheck size={20} strokeWidth={2} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="home-callout wow fadeInUp" data-wow-delay="100ms">
          <span className="home-icon home-icon--light">
            <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <p>{FACULTY.responsibility}</p>
        </div>
      </div>
    </section>
  );
}
