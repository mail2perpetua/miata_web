import { Building2, Globe, Hospital, UserCheck } from 'lucide-react';
import { NETWORK, TRAINING_COUNTRIES } from '../content/academy';
import { SectionTitle } from './SectionTitle';

/** International training: the four countries with their institutions, hospitals and clinical facilities. */
export function TrainingNetworkSection() {
  return (
    <section id="network" className="home-section home-network">
      <div className="container">
        <div className="home-section__head wow fadeInUp" data-wow-delay="100ms">
          <SectionTitle tagline="International Training" title="International Practical Training Network" centered />
          <p className="home-lead">{NETWORK.intro[0]}</p>
          <p className="home-text">{NETWORK.intro[1]}</p>
        </div>
        <div className="home-countries">
          {TRAINING_COUNTRIES.map((country, i) => (
            <article key={country.code} className="home-country wow fadeInUp" data-wow-delay={`${i * 100 + 100}ms`}>
              <header className="home-country__head">
                <span className="home-country__code" aria-hidden="true">
                  {country.code}
                </span>
                <h3 className="home-country__name">{country.country}</h3>
              </header>
              <ul className="home-country__list">
                {country.places.map((place) => {
                  const Icon = place.hospital ? Hospital : Building2;
                  return (
                    <li key={place.name}>
                      <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                      <span>{place.name}</span>
                    </li>
                  );
                })}
              </ul>
              {country.note && (
                <p className="home-country__note">
                  <UserCheck size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span>{country.note}</span>
                </p>
              )}
            </article>
          ))}
        </div>
        <div className="home-network__notes">
          <div className="home-note wow fadeInUp" data-wow-delay="100ms">
            <span className="home-icon">
              <Hospital size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p>{NETWORK.hospitalsNote}</p>
          </div>
          <div className="home-note home-note--accent wow fadeInUp" data-wow-delay="200ms">
            <span className="home-icon home-icon--orange">
              <Globe size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p>{NETWORK.summary}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
