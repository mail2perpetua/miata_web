import { ClipboardPen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, ViewAll } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { timeAgo } from '@/utils/format';
import { LogbookStatus } from '@/features/shared/worksheets/LogbookViews';
import { scanHoursLabel } from '@/features/shared/worksheets/worksheets';

const QUERY = { status: 'pending', page: 1, pageSize: 5, sort: 'submitted_at', order: 'asc' };

/** Dashboard section: students' practical worksheet logbooks awaiting the professor's review, oldest first. */
export function WorksheetReviewsCard() {
  const state = useFetch('/professor/worksheet-submissions', QUERY);
  // The rest of the dashboard does not depend on this section; while it loads (or if it fails) it is simply left out.
  if (!state.data) return null;
  const total = state.meta?.total ?? state.data.length;
  return (
    <Card
      title="Practical Worksheets"
      icon={ClipboardPen}
      subtitle={total ? `${total} logbook${total === 1 ? '' : 's'} awaiting your review` : undefined}
      action={<ViewAll to="/professor/worksheets?tab=logbooks" />}
      flush
    >
      {state.data.length ? (
        <ul className="list">
          {state.data.map((s) => (
            <li key={s.id} className="list__item">
              <div className="list__main">
                <Link to={`/professor/worksheets/submissions/${s.id}`} className="list__title">
                  {s.studentName} — {s.worksheetTitle}
                </Link>
                <div className="list__sub">
                  {s.entryCount} {s.entryCount === 1 ? 'entry' : 'entries'} · {scanHoursLabel(s.totalScans, s.totalHours)} · submitted{' '}
                  {timeAgo(s.submittedAt)}
                </div>
              </div>
              <LogbookStatus status={s.status} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ClipboardPen}
          title="No logbooks awaiting review"
          message={
            <>
              Students’ submitted logbooks appear here. <Link to="/professor/worksheets?new=1">Create a practical worksheet</Link>
            </>
          }
        />
      )}
    </Card>
  );
}
