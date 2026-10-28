import { CURRICULUM } from '../content/programme';
import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { CareerHero } from '../sections/CareerHero';
import { CurriculumSection } from '../sections/CurriculumSection';
import { FactsSection } from '../sections/FactsSection';
import { ProgramPhasesSection } from '../sections/ProgramPhasesSection';

export default function CoursesPage() {
  return (
    <WebsitePage title="Courses">
      <PageHeader title="Courses" banner={PAGE_BANNERS.courses} />
      <ProgramPhasesSection />
      {CURRICULUM.map((phase) => (
        <CurriculumSection key={phase.tagline} phase={phase} />
      ))}
      <CareerHero />
      <FactsSection />
    </WebsitePage>
  );
}
