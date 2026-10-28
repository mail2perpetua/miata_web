import { LOCATIONS } from '../content/highlights';

const NAV_TEXT = ['<span class="icon-arrow-left"></span>', '<span class="icon-arrow"></span>'];
const CAROUSEL = {
  items: 3,
  margin: 30,
  smartSpeed: 700,
  loop: true,
  autoplay: true,
  nav: false,
  dots: true,
  navText: NAV_TEXT,
  responsive: { 0: { items: 1, margin: 0 }, 700: { items: 2 }, 1200: { items: 3 }, 1400: { margin: 36 } },
};
const CITY_STYLE = { marginBottom: '5px' };
const BULLET_STYLE = { color: '#25a9a0', marginRight: '10px', fontSize: '12px' };

/** "12+ Locations" world map followed by the carousel of clinical training countries. */
export function LocationsSection() {
  return (
    <>
      <section className="blog-details" style={{ padding: '60px 0 0 0' }}>
        <div className="container">
          <div className="section-title text-center">
            <h2 className="section-title__title">12+ Locations</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-10 col-lg-7">
              <div className="blog-details__content">
                <div className="blog-details__img">
                  <img src="/assets/images/blog/world-map.jpg" alt="Map of MIATA training locations" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-page blog-page--flush">
        <div className="container">
          <div
            className="blog-page__carousel eduact-owl__carousel eduact-owl__dots owl-theme owl-carousel"
            data-owl-options={JSON.stringify(CAROUSEL)}
          >
            {LOCATIONS.map((location) => (
              <div className="item" key={location.country}>
                <div className="blog-two__item">
                  <div className="blog-two__content">
                    <div className="blog-two__top-meta">
                      <div className="blog-two__cats">
                        <a href="#" data-noop="">
                          {location.code}
                        </a>
                      </div>
                      <div className="blog-two__date">{location.summary}</div>
                    </div>
                    <h3 className="blog-two__title">
                      <a href="#" data-noop="">
                        {location.country}
                      </a>
                    </h3>
                    <div className="blog-two__meta">
                      <div className="blog-two__meta__author" style={{ fontSize: '15px', color: '#666', width: '100%' }}>
                        {location.cities.map((city, i) => (
                          <div key={city} style={i < location.cities.length - 1 ? CITY_STYLE : undefined}>
                            <span style={BULLET_STYLE}>●</span>
                            {city}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
