import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { AboutSection } from '../sections/AboutSection';
import { CareerHero } from '../sections/CareerHero';
import { FactsSection } from '../sections/FactsSection';
import { GraduatesSection } from '../sections/GraduatesSection';
import { LocationsSection } from '../sections/LocationsSection';
import { WhyChooseSection } from '../sections/WhyChooseSection';

export default function AboutPage() {
  return (
    <WebsitePage title="About Us">
      <PageHeader title="About Us" banner={PAGE_BANNERS.about} />
      <AboutSection />
      <WhyChooseSection />
      <GraduatesSection />
      <CareerHero />
      <LocationsSection />
      <FactsSection />
    </WebsitePage>
  );
}
