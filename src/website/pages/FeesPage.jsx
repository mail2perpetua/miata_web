import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { FeesSection } from '../sections/FeesSection';

export default function FeesPage() {
  return (
    <WebsitePage title="Fees & Scholarships">
      <PageHeader title="Fees & Scholarships" banner={PAGE_BANNERS.fees} />
      <FeesSection />
    </WebsitePage>
  );
}
