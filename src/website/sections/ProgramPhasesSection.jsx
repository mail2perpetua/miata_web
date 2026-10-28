import { Link } from 'react-router-dom';
import { PROGRAM_PHASES } from '../content/programme';
import { SectionTitle, ThemeButton } from './SectionTitle';

const NAV_TEXT = ['<span class="icon-arrow-left"></span>', '<span class="icon-arrow"></span>'];
const CAROUSEL = {
  items: 3,
  margin: 30,
  smartSpeed: 700,
  loop: true,
  autoplay: true,
  dots: false,
  nav: true,
  navText: NAV_TEXT,
  responsive: { 0: { items: 1 }, 768: { items: 2 }, 1200: { items: 3 }, 1400: { margin: 36, items: 3 } },
};
// Each phase appears twice, as in the original page, so the three-up carousel always has slides to loop through.
const SLIDES = [...PROGRAM_PHASES, ...PROGRAM_PHASES];

/** "Comprehensive Academic Curriculum" carousel of the three programme phases. */
export function ProgramPhasesSection({ showMore = false }) {
  return (
    <section className="course-two">
      <div className="course-two__shape-top wow fadeInRight" data-wow-delay="300ms">
        <img src="/assets/images/shapes/course-shape-1.png" alt="" />
      </div>
      <div className="container wow fadeInUp" data-wow-delay="200ms">
        <SectionTitle tagline="COURSE DETAILS" title="Comprehensive Academic Curriculum" />
        <div
          className="course-two__slider eduact-owl__carousel owl-with-shadow owl-theme owl-carousel"
          data-owl-options={JSON.stringify(CAROUSEL)}
        >
          {SLIDES.map((phase, i) => (
            <div className="item" key={i}>
              <div className="course-two__item">
                <div className="course-two__thumb">
                  <img src={phase.image} alt={phase.title} />{' '}
                  <a className="course-two__like" href="#" data-noop="" aria-label="Like">
                    <span className="icon-like"></span>
                  </a>{' '}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 353 177">
                    <path d="M37 0C16.5655 0 0 16.5655 0 37V93.4816C0 103.547 4.00259 113.295 11.7361 119.737C54.2735 155.171 112.403 177 176.496 177C240.589 177 298.718 155.171 341.261 119.737C348.996 113.295 353 103.546 353 93.4795V37C353 16.5655 336.435 0 316 0H37Z"></path>
                  </svg>
                </div>
                <div className="course-two__content">
                  <div className="course-two__time">{phase.duration}</div>
                  <div className="course-two__ratings">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="icon-star"></span>
                    ))}
                    <div className="course-two__ratings__reviews">{phase.reviews}</div>
                  </div>
                  <h3 className="course-two__title">
                    <Link to="/courses">{phase.title}</Link>
                  </h3>
                  <div className="course-two__bottom">
                    <div className="course-two__author">
                      <h5 className="course-two__author__name">{phase.mode}</h5>
                      <p className="course-two__author__designation">{phase.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showMore && (
          <div className="text-center" style={{ marginTop: '40px' }}>
            <ThemeButton as={Link} to="/courses">
              View More
            </ThemeButton>
          </div>
        )}
      </div>
      <div className="course-two__shape-bottom wow fadeInLeft" data-wow-delay="400ms">
        <img src="/assets/images/shapes/course-shape-2.png" alt="" />
      </div>
    </section>
  );
}
