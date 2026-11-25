import { HIGHLIGHTS, HOME_SECTIONS } from '../content/academy';

/** Key facts card overlapping the bottom of the hero, followed by links to each section of the home page. */
export function HomeHighlights() {
  return (
    <section className="home-highlights" aria-label="MIATA at a glance">
      <div className="container">
        <div className="home-highlights__card wow fadeInUp" data-wow-delay="100ms">
          {HIGHLIGHTS.map(({ icon: Icon, value, text }) => (
            <div className="home-highlights__item" key={value}>
              <span className="home-icon">
                <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <p className="home-highlights__value">{value}</p>
                <p className="home-highlights__text">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <nav className="home-jumpnav wow fadeInUp" data-wow-delay="200ms" aria-label="On this page">
          {HOME_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
