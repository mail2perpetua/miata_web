import { Link } from 'react-router-dom';
import { SectionTitle, ThemeButton } from './SectionTitle';

const TILT = { glare: false, maxGlare: 0, maxTilt: 2, speed: 700, scale: 1 };
const SHAPES = [
  { n: 1, delay: '300ms' },
  { n: 2, delay: '400ms' },
  { n: 3, delay: '400ms' },
  { n: 4, delay: '400ms' },
];

/** About MIATA: image collage, introduction and "Flexible Classes" box. `showMore` adds the View More button (home page). */
export function AboutSection({ showMore = false }) {
  return (
    <section className="about-two">
      <div className="container">
        <div className="row">
          <div className="col-xl-6">
            <div className="about-two__thumb wow fadeInLeft" data-wow-delay="100ms">
              <div className="about-two__thumb__one eduact-tilt" data-tilt-options={JSON.stringify(TILT)}>
                <img src="/assets/images/resources/about-2-22.jpg" alt="MIATA students" />
              </div>
              <div className="about-two__thumb__two">
                <img src="/assets/images/resources/about-2-11.jpg" alt="Ultrasound practice" />
                <div className="about-two__thumb__two-icon">
                  <span className="icon-business"></span>
                </div>
              </div>
              <div className="about-two__fact">
                <div className="about-two__fact__icon">
                  <span className="icon-trophy"></span>
                </div>
                <div className="about-two__fact__content">
                  <div className="about-two__fact__count">
                    +
                    <span className="count-box">
                      <span className="count-text" data-stop="230" data-speed="1500"></span>
                    </span>
                  </div>
                  <h3 className="about-two__fact__title">Awesome Awards</h3>
                </div>
              </div>
              {SHAPES.map(({ n, delay }) => (
                <div key={n} className={`about-two__thumb__shape${n} wow zoomIn`} data-wow-delay={delay}>
                  <img src={`/assets/images/shapes/about-2-shape-${n}.png`} alt="" />
                </div>
              ))}
            </div>
          </div>
          <div className="col-xl-6 wow fadeInRight" data-wow-delay="100ms">
            <div className="about-two__content">
              <SectionTitle tagline="About Us" title="Medical Imaging Accredited Training Academy (MIATA)" />
              <p className="about-two__content__text">
                Medical Imaging Accredited Training Academy (MIATA) is a globally aligned training institution committed to developing
                highly skilled diagnostic ultrasound professionals. Our programs are designed to bridge clinical skill gaps, enhance
                diagnostic autonomy, and open doors to international career opportunities.
              </p>
              <div className="about-two__box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 295 125">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M86 0.0805664H58C25.9675 0.0805664 0 26.048 0 58.0806V79.5806C0 104.157 19.9233 124.081 44.5 124.081H46.5C69.9721 124.081 89 105.053 89 81.5806C89 58.1085 108.028 39.0806 131.5 39.0806H268C282.912 39.0806 295 26.9923 295 12.0806C295 5.45315 289.627 0.0805664 283 0.0805664H89H86Z"
                  ></path>
                </svg>
                <div className="about-two__box__icon">
                  <span className="icon-Presentation"></span>
                </div>
                <h4 className="about-two__box__title">Flexible Classes</h4>
                <p className="about-two__box__text">
                  MIATA combines academic excellence, hands-on training, and global credentialing pathways to prepare healthcare
                  professionals for modern imaging practice worldwide.
                </p>
              </div>
              {showMore && (
                <ThemeButton as={Link} to="/about">
                  View More
                </ThemeButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
