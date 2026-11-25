import { Award, CircleCheck, FileCheck } from 'lucide-react';
import { CERTIFICATION } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** The Professional Certificate of Course Completion and the pathways graduates are encouraged to follow. */
export function CertificationSection() {
  const { certificate } = CERTIFICATION;
  return (
    <section id="certification" className="home-section home-certification">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-5">
            <div className="home-certification__intro wow fadeInLeft" data-wow-delay="100ms">
              <SectionTitle tagline="Certification" title="Professional Training and Certification" />
              <p className="home-lead">{CERTIFICATION.intro[0]}</p>
              <p className="home-text">{CERTIFICATION.intro[1]}</p>
              <div className="home-certificate">
                <span className="home-certificate__icon">
                  <Award size={34} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="home-certificate__eyebrow">Issued by MIATA</span>
                <h3 className="home-certificate__title">{certificate.title}</h3>
                <p className="home-certificate__label">Awarded upon successful completion of:</p>
                <ul className="home-certificate__list">
                  {certificate.awardedFor.map((item) => (
                    <li key={item}>
                      <CircleCheck size={18} strokeWidth={2} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="home-text">{CERTIFICATION.intro[2]}</p>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="home-pathways wow fadeInRight" data-wow-delay="100ms">
              <h3 className="home-pathways__title">Pathways After MIATA Training</h3>
              <p className="home-pathways__intro">{CERTIFICATION.pathwaysIntro}</p>
              <ol className="home-timeline">
                {CERTIFICATION.pathways.map((step, i) => (
                  <li key={step.title} className="home-timeline__item">
                    <span className="home-timeline__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="home-timeline__body">
                      <h4 className="home-timeline__title">
                        {step.title}
                        {step.tag && <span className="home-tag">{step.tag}</span>}
                      </h4>
                      <p className="home-timeline__text">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="home-pathways__support">
                <FileCheck size={22} strokeWidth={1.8} aria-hidden="true" />
                <span>{CERTIFICATION.support}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
