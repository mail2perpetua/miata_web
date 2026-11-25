import { Info, Landmark, Scale, UserCheck } from 'lucide-react';
import { DISCLAIMER } from '../content/academy';

function DisclaimerBlock({ icon: Icon, title, children }) {
  return (
    <article className="home-disclaimer__block">
      <h3 className="home-disclaimer__block-title">
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
        {title}
      </h3>
      {children}
    </article>
  );
}

/** Important Disclaimer: kept apart from the rest of the page, in a plainer style, and shown in full. */
export function DisclaimerSection() {
  return (
    <section id="disclaimer" className="home-section home-disclaimer" aria-labelledby="disclaimer-title">
      <div className="container">
        <header className="home-disclaimer__head">
          <span className="home-disclaimer__icon">
            <Scale size={30} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="home-disclaimer__eyebrow">Please read carefully</p>
            <h2 className="home-disclaimer__title" id="disclaimer-title">
              {DISCLAIMER.title}
            </h2>
            <p className="home-disclaimer__subtitle">{DISCLAIMER.subtitle}</p>
          </div>
        </header>

        <p className="home-disclaimer__lead">{DISCLAIMER.lead}</p>

        <div className="home-disclaimer__grid">
          {DISCLAIMER.blocks.map((block) => (
            <DisclaimerBlock key={block.title} icon={block.icon} title={block.title}>
              {block.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </DisclaimerBlock>
          ))}
        </div>

        <h3 className="home-disclaimer__subhead">Country and credential requirements</h3>
        <div className="home-disclaimer__jurisdictions">
          {DISCLAIMER.jurisdictions.map((item) => (
            <article key={item.label} className="home-disclaimer__jurisdiction">
              <span className="home-tag">{item.body}</span>
              <h4>{item.label}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="home-disclaimer__grid">
          <DisclaimerBlock icon={UserCheck} title={DISCLAIMER.responsibilitiesTitle}>
            <ul className="home-disclaimer__list">
              {DISCLAIMER.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DisclaimerBlock>
          <DisclaimerBlock icon={Landmark} title={DISCLAIMER.decisions.title}>
            {DISCLAIMER.decisions.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </DisclaimerBlock>
        </div>

        <p className="home-disclaimer__advice">
          <Info size={20} strokeWidth={2} aria-hidden="true" />
          <span>{DISCLAIMER.advice}</span>
        </p>

        <p className="home-disclaimer__closing">
          <strong>{DISCLAIMER.closing[0]}</strong> {DISCLAIMER.closing[1]}
        </p>
      </div>
    </section>
  );
}
