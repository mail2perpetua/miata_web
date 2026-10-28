import { Link } from 'react-router-dom';
import { CONTACT } from '../content/site';
import { ThemeButton } from './SectionTitle';

// The original pages kept these elements' revealed state inline (visibility / animation); kept as-is.
const shown = (delay, animationName, extra) => ({ visibility: 'visible', animationDelay: delay, animationName, ...extra });

const DECORATIONS = [
  { className: 'hero-banner__cap', animation: 'slideInDown', delay: '800ms', image: 'banner-cap.png' },
  { className: 'hero-banner__star', animation: 'slideInDown', delay: '850ms', image: 'banner-star.png' },
  { className: 'hero-banner__map', animation: 'slideInDown', delay: '900ms', image: 'banner-map.png' },
];
const DECORATIONS_AFTER_VIDEO = [
  { className: 'hero-banner__book', animation: 'slideInUp', delay: '1000ms', image: 'banner-book.png' },
  { className: 'hero-banner__star2', animation: 'slideInUp', delay: '1050ms', image: 'banner-star2.png' },
];

function Decoration({ className, animation, delay, image }) {
  return (
    <div className={`${className} wow ${animation} animated`} data-wow-delay={delay} style={shown(delay, animation)}>
      <img src={`/assets/images/shapes/${image}`} alt="" />
    </div>
  );
}

/** "Start Your International Ultrasound Career Today" banner with the intro video. */
export function CareerHero() {
  return (
    <section className="hero-banner" style={{ backgroundImage: 'url(/assets/images/shapes/banner-bg-1.png)' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <div className="hero-banner__content">
              <div className="hero-banner__bg-shape1 wow zoomIn animated" data-wow-delay="300ms" style={shown('300ms', 'zoomIn')}>
                <div className="hero-banner__bg-round">
                  <div className="hero-banner__bg-round-border"></div>
                </div>
              </div>
              <h2
                className="hero-banner__title wow fadeInUp animated"
                data-wow-delay="400ms"
                style={shown('400ms', 'fadeInUp', { fontSize: '50px' })}
              >
                Start Your <br /> International Ultrasound Career Today
              </h2>
              <p className="hero-banner__text wow fadeInUp animated" data-wow-delay="500ms" style={shown('500ms', 'fadeInUp')}>
                Join hundreds of medical professionals who have transformed their careers with MIATA&apos;s globally recognized training
                program. <img src="/assets/images/shapes/banner-1-shape-1.png" alt="" />
              </p>
              <div className="hero-banner__btn wow fadeInUp animated" data-wow-delay="600ms" style={shown('600ms', 'fadeInUp')}>
                <ThemeButton as={Link} to="/contact" secondary>
                  Apply Now
                </ThemeButton>{' '}
                <ThemeButton href={`tel:${CONTACT.phone}`}>Call Now</ThemeButton>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-banner__thumb wow fadeInUp animated" data-wow-delay="700ms" style={shown('700ms', 'fadeInUp')}>
              <img src="/assets/images/resources/b1.jpg" alt="Ultrasound training at MIATA" />
              {DECORATIONS.map((d) => (
                <Decoration key={d.className} {...d} />
              ))}
              <div
                className="hero-banner__video wow zoomIn animated"
                data-wow-delay="950ms"
                style={{
                  backgroundImage: 'url("/assets/images/resources/banner-video.png")',
                  ...shown('950ms', 'zoomIn', { left: '0px', top: 'auto', bottom: '20px', right: 'auto' }),
                }}
              >
                <a href="/assets/images/backgrounds/intro1.mp4" className="video-popup" aria-label="Play the MIATA introduction video">
                  <span className="icon-play"></span>
                </a>
              </div>
              {DECORATIONS_AFTER_VIDEO.map((d) => (
                <Decoration key={d.className} {...d} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-banner__border wow fadeInUp animated" data-wow-delay="1100ms" style={shown('1100ms', 'zoomBig')}></div>
    </section>
  );
}
