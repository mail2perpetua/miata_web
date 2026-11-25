import { ClipboardPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AsyncContent, Card, DataTable, EmptyState, FilterSelect, PageHeader, Tabs } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatDateTime } from '@/utils/format';
import { LogbookStatus } from '@/features/shared/worksheets/LogbookViews';
import { scanHoursLabel } from '@/features/shared/worksheets/worksheets';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'draft', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'rework', label: 'Rework' },
  { value: 'completed', label: 'Completed' },
];

/** The student's practical worksheets (clinical training logbooks), those that need work first. */
export default function WorksheetsPage() {
  const navigate = useNavigate();
  const { query, update } = useListQuery();
  const status = query.status && query.status !== 'all' ? query.status : undefined;
  const state = useFetch('/student/worksheets', { status, courseId: query.courseId });
  const courses = useFetch('/student/courses');

  return (
    <>
      <PageHeader
        title="Practical Worksheets"
        subtitle="Your clinical training logbooks. Record each scan session, then submit the logbook for your supervisor to verify and sign off."
      />
      <Tabs value={query.status ?? 'all'} onChange={(value) => update({ status: value === 'all' ? undefined : value })} tabs={TABS} />
      <Card flush>
        <div className="toolbar">
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.courseId, label: c.title }))}
          />
        </div>
        <AsyncContent state={state}>
          {(rows) => (
            <DataTable
              rows={rows}
              loading={state.loading}
              onRowClick={(w) => navigate(`/student/worksheets/${w.id}`)}
              columns={[
                {
                  key: 'title',
                  header: 'Worksheet',
                  render: (w) => (
                    <span>
                      <strong style={{ color: 'var(--ink)' }}>{w.title}</strong>{' '}
                      {w.batchId && <span className="badge badge--purple">{w.forSelectedStudents ? 'For you' : 'Batch work'}</span>}
                      <span className="cell-person__sub" style={{ display: 'block' }}>
                        {w.courseTitle}
                        {w.moduleTitle ? ` · ${w.moduleTitle}` : ''}
                      </span>
                    </span>
                  ),
                },
                {
                  key: 'due',
                  header: 'Due Date',
                  render: (w) => (
                    <span className="nowrap">
                      {w.dueAt ? formatDateTime(w.dueAt) : '—'} {w.isOverdue && <span className="badge badge--red">Overdue</span>}
                    </span>
                  ),
                },
                {
                  key: 'log',
                  header: 'Scan log',
                  render: (w) => (
                    <span className="nowrap">
                      {w.entryCount} {w.entryCount === 1 ? 'entry' : 'entries'}
                      <span className="cell-person__sub" style={{ display: 'block' }}>
                        {scanHoursLabel(w.totalScans, w.totalHours)}
                      </span>
                    </span>
                  ),
                },
                { key: 'status', header: 'Status', render: (w) => <LogbookStatus status={w.status} /> },
              ]}
              empty={
                <EmptyState
                  icon={ClipboardPen}
                  title="No practical worksheets here"
                  message="Clinical logbooks and practical worksheets your professors set for your course appear here."
                />
              }
            />
          )}
        </AsyncContent>
      </Card>
    </>
  );
}
