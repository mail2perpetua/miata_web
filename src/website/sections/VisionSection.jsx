import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACADEMY_SLOGAN, VISION } from '../content/academy';
import { ThemeButton } from './SectionTitle';

/** Our Vision, over a photo, with the Apply Now and Contact Us buttons. */
export function VisionSection() {
  return (
    <section id="vision" className="home-vision">
      <div className="container">
        <div className="home-vision__inner wow fadeInUp" data-wow-delay="100ms">
          <span className="home-vision__icon">
            <Eye size={30} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <h2 className="home-vision__tagline">Our Vision</h2>
          <p className="home-vision__statement">{VISION.statement}</p>
          <p className="home-vision__text">{VISION.text}</p>
          <p className="home-vision__slogan">{ACADEMY_SLOGAN}</p>
          <div className="home-vision__btns">
            <ThemeButton as={Link} to="/apply" secondary>
              Apply Now
            </ThemeButton>
            <ThemeButton as={Link} to="/contact" className="eduact-btn--light">
              Contact Us
            </ThemeButton>
          </div>
        </div>
      </div>
    </section>
  );
}
