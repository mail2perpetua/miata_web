import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { ContactFormSection, ContactInfoSection, MapSection } from '../sections/ContactSections';

export default function ContactPage() {
  return (
    <WebsitePage title="Contact Us">
      <PageHeader title="Contact Us" banner={PAGE_BANNERS.contact} />
      <ContactFormSection />
      <ContactInfoSection />
      <MapSection />
    </WebsitePage>
  );
}
