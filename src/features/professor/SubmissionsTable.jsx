import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTable, EmptyState, ErrorState, Pagination, PersonCell, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatDateTime } from '@/utils/format';

/** Submissions in the professor's scope for a given filter; rows open the review page. */
export function SubmissionsTable({ query, onSort, onPage, emptyTitle = 'Nothing to review' }) {
  const navigate = useNavigate();
  const state = useFetch('/professor/submissions', query);
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  return (
    <>
      <DataTable
        rows={state.data}
        loading={state.loading}
        sort={query.sort}
        order={query.order}
        onSort={onSort}
        onRowClick={(s) => navigate(`/professor/reviews/${s.id}`)}
        columns={[
          {
            key: 'student',
            header: 'Student',
            sortKey: 'student',
            render: (s) => <PersonCell name={s.studentName} sub={s.batchName ? `${s.studentCode} · ${s.batchName}` : s.studentCode} />,
          },
          {
            key: 'assignment',
            header: 'Assignment',
            sortKey: 'assignment',
            render: (s) => (
              <span>
                <strong style={{ color: 'var(--ink)' }}>{s.assignmentTitle}</strong>
                <span className="cell-person__sub" style={{ display: 'block' }}>
                  {s.courseTitle}
                  {s.moduleTitle ? ` · ${s.moduleTitle}` : ''}
                </span>
              </span>
            ),
          },
          { key: 'attempt', header: 'Attempt', align: 'right', render: (s) => s.attemptNo },
          {
            key: 'submittedAt',
            header: 'Submitted',
            sortKey: 'submitted_at',
            render: (s) => (
              <span className="nowrap">
                {formatDateTime(s.submittedAt)}
                {s.dueAt && new Date(s.submittedAt) > new Date(s.dueAt) && (
                  <span className="badge badge--red" style={{ marginLeft: 6 }}>
                    Late
                  </span>
                )}
              </span>
            ),
          },
          {
            key: 'due',
            header: 'Due',
            sortKey: 'due_at',
            render: (s) => <span className="nowrap">{s.dueAt ? formatDate(s.dueAt) : '—'}</span>,
          },
          { key: 'status', header: 'Status', sortKey: 'status', render: (s) => <StatusBadge status={s.status} /> },
        ]}
        empty={<EmptyState icon={ClipboardList} title={emptyTitle} />}
      />
      <Pagination meta={state.meta} onPage={onPage} noun="submissions" />
    </>
  );
}
