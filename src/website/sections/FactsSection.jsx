import { FACTS } from '../content/highlights';

/** Outcome counters (they count up when scrolled into view). */
export function FactsSection() {
  return (
    <section className="fact-one" style={{ backgroundImage: 'url(/assets/images/shapes/fact-bg-1.png)' }}>
      <div className="container">
        <div className="row">
          {FACTS.map((fact, i) => (
            <div key={fact.title} className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay={`${(i + 1) * 100}ms`}>
              <div className="fact-one__item text-center">
                <svg viewBox="0 0 303 181" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="1.5"
                    y="2.00049"
                    width="300"
                    height="177"
                    rx="7"
                    stroke="#4F5DE4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="20 20"
                  ></rect>
                </svg>
                <div className="fact-one__count">
                  <span className="count-box">
                    <span className="count-text" data-stop={fact.value} data-speed="1500"></span>
                  </span>
                  {fact.suffix}
                </div>
                <h3 className="fact-one__title">{fact.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
