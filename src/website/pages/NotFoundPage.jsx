import { Link } from 'react-router-dom';
import { PAGE_BANNERS } from '../content/site';
import { PageHeader } from '../layout/PageHeader';
import { WebsitePage } from '../layout/WebsitePage';
import { ThemeButton } from '../sections/SectionTitle';

export default function NotFoundPage() {
  return (
    <WebsitePage title="Page not found">
      <PageHeader title="Page Not Found" banner={PAGE_BANNERS.notFound} />
      <section className="site-message">
        <div className="container text-center">
          <h3 className="site-message__title">Sorry, we couldn&apos;t find that page.</h3>
          <p className="site-message__text">The page may have moved. Use the menu above or go back to the home page.</p>
          <ThemeButton as={Link} to="/">
            Back to Home
          </ThemeButton>
        </div>
      </section>
    </WebsitePage>
  );
}
