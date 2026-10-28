import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BROCHURE_URL } from '../content/site';
import { ThemeButton } from './SectionTitle';

const CAROUSEL = { items: 1, margin: 0, smartSpeed: 700, loop: true, autoplay: true, autoplayTimeout: 3000, nav: false, dots: false };
const SLIDES = [
  '/assets/images/resources/banner-2-15.jpg',
  '/assets/images/resources/banner-2-11.jpg',
  '/assets/images/resources/banner1.jpg',
];
const SLIDE_STYLE = { aspectRatio: '1500/1000', objectFit: 'cover', width: '100%', height: 'auto' };
const BUTTON_STYLE = { padding: '12px 24px', fontSize: '15px' };
const SHAPES = [
  { n: 2, delay: '250ms' },
  { n: 3, delay: '300ms' },
  { n: 4, delay: '350ms' },
  { n: 5, delay: '500ms' },
  { n: 6, delay: '500ms' },
];

// The large dotted background shape (≈650 KB of SVG paths) is a static file, inlined once fetched so the
// theme's `.hero-banner-two__bg-shape1 svg` styles apply to it unchanged.
const BG_SHAPE_URL = '/assets/images/shapes/banner-2-bg-shape.svg';
let bgShapeMarkup = null;

function useInlineSvg(url) {
  const [markup, setMarkup] = useState(bgShapeMarkup);
  useEffect(() => {
    if (bgShapeMarkup) return undefined;
    let cancelled = false;
    fetch(url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))))
      .then((svg) => {
        bgShapeMarkup = svg;
        if (!cancelled) setMarkup(svg);
      })
      .catch(() => {}); // purely decorative
    return () => {
      cancelled = true;
    };
  }, [url]);
  return markup;
}

/** Home page banner: welcome text, buttons and the image carousel. */
export function WelcomeHero() {
  const bgShape = useInlineSvg(BG_SHAPE_URL);
  return (
    <section className="hero-banner-two" style={{ backgroundImage: 'url(/assets/images/shapes/banner-bg-2.png)' }}>
      <div className="hero-banner-two__shape1 wow fadeInUp" data-wow-delay="200ms">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 133" fill="none">
          <path
            d="M94.4935 0.712799C95.597 1.45597 95.8869 2.96459 95.1423 4.09967C90.8319 10.6323 83.2497 10.1374 76.5614 9.69399C69.4714 9.22757 64.9825 9.21985 62.4529 13.0422C59.9198 16.8622 61.6846 20.9956 64.8949 27.3403C67.917 33.3156 71.3413 40.0873 67.0426 46.6025C62.722 53.1283 55.1468 52.6229 48.4642 52.1783C41.3675 51.7073 36.8752 51.6973 34.3351 55.5277C31.8031 59.3535 33.5668 63.4812 36.7805 69.8282C39.7969 75.8047 43.2246 82.5786 38.9259 89.0939C34.6089 95.6069 27.0313 95.105 20.3488 94.6604C13.252 94.1894 8.75971 94.1794 6.22663 97.9994C3.69678 101.837 5.4639 105.967 8.6811 112.316C11.7055 118.288 15.1322 125.056 10.8175 131.566C10.0648 132.705 8.54716 133.027 7.42646 132.287C6.27552 131.578 6.01023 130.025 6.76637 128.888C9.29946 125.068 7.53341 120.943 4.32412 114.605C1.29863 108.627 -2.12912 101.853 2.17894 95.3238C6.49598 88.8108 14.0678 89.3138 20.7527 89.7549C27.8494 90.2259 32.3417 90.2359 34.8748 86.4159C37.3953 82.5925 35.6282 78.4625 32.4202 72.1144C29.3981 66.139 25.9727 59.3616 30.284 52.8498C34.6057 46.3298 42.1798 46.8294 48.8624 47.274C55.9591 47.745 60.4514 47.755 62.9915 43.9246C65.512 40.1012 63.7449 35.9711 60.5369 29.623C57.5148 23.6477 54.0894 16.8703 58.403 10.355C62.7154 3.84893 70.2803 4.34734 76.956 4.78734C84.0575 5.25141 88.5532 5.26373 91.0854 1.42291C91.8381 0.28317 93.3523 -0.0406519 94.473 0.698994C94.4833 0.705897 94.4901 0.710498 94.4935 0.712799Z"
            fill="#F57005"
          />
        </svg>
      </div>
      {SHAPES.map(({ n, delay }) => (
        <div key={n} className={`hero-banner-two__shape${n} wow fadeInUp`} data-wow-delay={delay}>
          <img src={`/assets/images/shapes/banner-2-shape-${n}.png`} alt="" />
        </div>
      ))}
      <div
        className="hero-banner-two__bg-shape1 wow fadeInUp"
        data-wow-delay="500ms"
        dangerouslySetInnerHTML={bgShape ? { __html: bgShape } : undefined}
      ></div>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 d-flex align-items-center">
            <div className="hero-banner-two__content">
              <h2 className="hero-banner-two__title wow fadeInUp" data-wow-delay="400ms">
                Welcome To <br /> MIATA
              </h2>
              <p className="hero-banner-two__text wow fadeInUp" data-wow-delay="500ms" style={{ textTransform: 'uppercase' }}>
                <b>Medical Imaging Accredited Training Academy</b>
              </p>
              <div
                className="hero-banner-two__btn wow fadeInUp"
                data-wow-delay="600ms"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}
              >
                <ThemeButton as={Link} to="/contact" secondary style={BUTTON_STYLE}>
                  Apply Now
                </ThemeButton>{' '}
                <ThemeButton href={BROCHURE_URL} style={BUTTON_STYLE}>
                  Download Brochure
                </ThemeButton>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="eduact-stretch-element-inside-column wow slideInRight" data-wow-delay="300ms">
              <div className="hero-banner-two__stretch-image">
                <div className="eduact-owl__carousel owl-theme owl-carousel" data-owl-options={JSON.stringify(CAROUSEL)}>
                  {SLIDES.map((src) => (
                    <div className="item" key={src}>
                      <img src={src} alt="MIATA ultrasound training" style={SLIDE_STYLE} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
