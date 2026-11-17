import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { ApplicationForm } from '../sections/ApplicationForm';

/** Apply Now: the student registration form. Applications appear under Admin → Students → Online Applications. */
export default function ApplyPage() {
  return (
    <WebsitePage title="Apply Now">
      <PageHeader title="Apply Now" banner={PAGE_BANNERS.courses} />
      <ApplicationForm />
    </WebsitePage>
  );
}
