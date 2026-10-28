import { WebsitePage } from '../layout/WebsitePage';
import { AboutSection } from '../sections/AboutSection';
import { CareerHero } from '../sections/CareerHero';
import { FactsSection } from '../sections/FactsSection';
import { GraduatesSection } from '../sections/GraduatesSection';
import { LocationsSection } from '../sections/LocationsSection';
import { ProgramPhasesSection } from '../sections/ProgramPhasesSection';
import { TestimonialsSection } from '../sections/TestimonialsSection';
import { WelcomeHero } from '../sections/WelcomeHero';
import { WhyChooseSection } from '../sections/WhyChooseSection';

export default function HomePage() {
  return (
    <WebsitePage>
      <WelcomeHero />
      <AboutSection showMore />
      <WhyChooseSection showReadMore />
      <ProgramPhasesSection showMore />
      <CareerHero />
      <LocationsSection />
      <GraduatesSection />
      <FactsSection />
      <TestimonialsSection />
    </WebsitePage>
  );
}
