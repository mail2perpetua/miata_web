import { WebsitePage } from '../layout/WebsitePage';
import { AcademyAboutSection } from '../sections/AcademyAboutSection';
import { CertificationSection } from '../sections/CertificationSection';
import { DisclaimerSection } from '../sections/DisclaimerSection';
import { FacultySection } from '../sections/FacultySection';
import { HomeHighlights } from '../sections/HomeHighlights';
import { StandardsSection } from '../sections/StandardsSection';
import { TrainingApproachSection } from '../sections/TrainingApproachSection';
import { TrainingNetworkSection } from '../sections/TrainingNetworkSection';
import { TrainingPartnersSection } from '../sections/TrainingPartnersSection';
import { VisionSection } from '../sections/VisionSection';
import { WelcomeHero } from '../sections/WelcomeHero';
import '../theme/home.css';

/**
 * Home page, in three parts: About Us (who MIATA is, its training approach), International Training (network,
 * partners, hospitals and locations, faculty, standards), then certification, vision and — separately — the disclaimer.
 */
export default function HomePage() {
  return (
    <WebsitePage>
      <WelcomeHero />
      <HomeHighlights />

      {/* About Us */}
      <AcademyAboutSection />
      <TrainingApproachSection />

      {/* International training, hospitals and locations */}
      <TrainingNetworkSection />
      <TrainingPartnersSection />
      <FacultySection />
      <StandardsSection />

      <CertificationSection />
      <VisionSection />
      <DisclaimerSection />
    </WebsitePage>
  );
}
