import { CircleCheck, Handshake, MapPin } from 'lucide-react';
import { COORDINATION, TRAINING_PARTNERS } from '../content/academy';
import { SectionTitle } from './SectionTitle';

function CheckList({ title, items }) {
  return (
    <div className="home-split__col">
      <h3 className="home-split__title">{title}</h3>
      <ul className="home-split__list">
        {items.map((item) => (
          <li key={item}>
            <CircleCheck size={18} strokeWidth={2} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** International training: who delivers the training (MIATA) and the table of partner institutions. */
export function TrainingPartnersSection() {
  return (
    <section id="partners" className="home-section home-section--navy home-partners">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5 wow fadeInLeft" data-wow-delay="100ms">
            <SectionTitle tagline="International Training" title="Delivered & Coordinated by MIATA" />
            <p className="home-partners__statement">{COORDINATION.statement}</p>
            <p className="home-partners__text">{COORDINATION.text}</p>
            <div className="home-split">
              <CheckList title="Partner institutions provide access to" items={COORDINATION.partnersProvide} />
              <CheckList title="MIATA retains responsibility for" items={COORDINATION.miataRetains} />
            </div>
          </div>
          <div className="col-lg-7 wow fadeInRight" data-wow-delay="100ms">
            <div className="home-table-card">
              <h3 className="home-table-card__title" id="training-partners-title">
                <span className="home-icon home-icon--orange">
                  <Handshake size={22} strokeWidth={1.9} aria-hidden="true" />
                </span>
                International Training Partners
              </h3>
              <table className="home-table" aria-labelledby="training-partners-title">
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Institution / Organisation</th>
                    <th scope="col">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {TRAINING_PARTNERS.map((partner, i) => (
                    <tr key={partner.name}>
                      <td className="home-table__num">{i + 1}</td>
                      <td className="home-table__name">{partner.name}</td>
                      <td>
                        <span className="home-pill">
                          <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                          {partner.country}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
