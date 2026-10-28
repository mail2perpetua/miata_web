import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useThemePlugins } from '../theme/useThemePlugins';

/**
 * Wraps the sections of one website page: sets the title and runs the theme behaviour (carousels,
 * reveal, counters, parallax) for this page only. `display: contents` keeps the sections laid out
 * exactly as direct children of .page-wrapper, as in the original HTML.
 */
export function WebsitePage({ title, children }) {
  useDocumentTitle(title, { site: true });
  const ref = useThemePlugins();
  return (
    <div className="website-page" ref={ref}>
      {children}
    </div>
  );
}
