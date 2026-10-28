import { Link } from 'react-router-dom';
import { GRADUATES } from '../content/highlights';

/** "Our Graduates. Global Impact." cards. */
export function GraduatesSection() {
  return (
    <section className="course-one" style={{ backgroundImage: 'url(/assets/images/shapes/course-bg-1.png)' }}>
      <div className="container">
        <div className="section-title text-center">
          <h2 className="section-title__title">Our Graduates. Global Impact.</h2>
        </div>
        <div className="row">
          {GRADUATES.map((graduate, i) => (
            <div key={graduate.name} className="col-xl-4 col-lg-6 wow fadeInUp" data-wow-delay={`${(i + 1) * 100}ms`}>
              <div className="course-one__item">
                <div className="course-one__thumb">
                  <img src="/assets/images/logo-two.png" className="milo" alt="MIATA" />
                </div>
                <div className="course-one__content">
                  <div className="course-one__time">{graduate.role}</div>
                  <h3 className="course-one__title" style={{ margin: '0 0 10px' }}>
                    <Link to="/about">{graduate.name}</Link>
                  </h3>
                  <p className="course-one__author__designation" style={{ margin: '0 0 8px' }}>
                    {graduate.credentials}
                  </p>
                  <div className="course-one__ratings">
                    <span className="icon-Location"></span>
                    <div className="course-one__ratings__reviews">{graduate.location}</div>
                  </div>
                  <div className="course-one__bottom">
                    <div className="course-one__author" style={{ padding: '0 0 0 0px' }}>
                      <h5 className="course-one__author__name txt2">{graduate.quote}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
