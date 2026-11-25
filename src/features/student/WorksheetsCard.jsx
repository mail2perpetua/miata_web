import { ClipboardPen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, ViewAll } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/utils/format';
import { LogbookStatus } from '@/features/shared/worksheets/LogbookViews';
import { scanHoursLabel } from '@/features/shared/worksheets/worksheets';

/** Dashboard section: the student's practical worksheets, those that need work first. */
export function WorksheetsCard() {
  const state = useFetch('/student/worksheets', { limit: 5 });
  // The rest of the dashboard does not depend on this section; while it loads (or if it fails) it is simply left out.
  if (!state.data) return null;
  return (
    <Card title="Practical Worksheets" icon={ClipboardPen} action={<ViewAll to="/student/worksheets" />} flush>
      {state.data.length ? (
        <ul className="list">
          {state.data.map((w) => (
            <li key={w.id} className="list__item">
              <div className="list__main">
                <Link to={`/student/worksheets/${w.id}`} className="list__title" title={w.title}>
                  {w.title}
                </Link>
                <div className="list__sub">
                  {w.courseTitle} · {scanHoursLabel(w.totalScans, w.totalHours)}
                  {w.dueAt && ` · Due ${formatDate(w.dueAt)}`}
                  {w.isOverdue && <strong style={{ color: 'var(--red-600)' }}> · Overdue</strong>}
                </div>
              </div>
              <LogbookStatus status={w.status} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ClipboardPen} title="No practical worksheets" message="Clinical logbooks your professors set appear here." />
      )}
    </Card>
  );
}
