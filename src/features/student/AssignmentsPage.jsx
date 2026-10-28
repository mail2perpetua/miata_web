import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AsyncContent, Card, DataTable, EmptyState, FilterSelect, PageHeader, StatusBadge, Tabs } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatDateTime } from '@/utils/format';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To submit' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'rework', label: 'Rework' },
  { value: 'completed', label: 'Completed' },
];

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const { query, update } = useListQuery();
  const status = query.status && query.status !== 'all' ? query.status : undefined;
  const state = useFetch('/student/assignments', { status, courseId: query.courseId });
  const courses = useFetch('/student/courses');

  return (
    <>
      <PageHeader title="Assignments" subtitle="Assignments from your courses. Open one to read the brief and submit your work." />
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
              onRowClick={(a) => navigate(`/student/assignments/${a.id}`)}
              columns={[
                {
                  key: 'title',
                  header: 'Title',
                  render: (a) => (
                    <span>
                      <strong style={{ color: 'var(--ink)' }}>{a.title}</strong>{' '}
                      {a.batchId && <span className="badge badge--purple">{a.forSelectedStudents ? 'For you' : 'Batch work'}</span>}
                      <span className="cell-person__sub" style={{ display: 'block' }}>
                        {a.courseTitle}
                        {a.moduleTitle ? ` · ${a.moduleTitle}` : ''}
                      </span>
                    </span>
                  ),
                },
                {
                  key: 'due',
                  header: 'Due Date',
                  render: (a) => (
                    <span className="nowrap">
                      {a.dueAt ? formatDateTime(a.dueAt) : '—'} {a.isOverdue && <span className="badge badge--red">Overdue</span>}
                    </span>
                  ),
                },
                { key: 'attempt', header: 'Attempt', align: 'right', render: (a) => a.attemptNo ?? '—' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => <StatusBadge status={a.status} label={a.status === 'pending' ? 'Not submitted' : undefined} />,
                },
              ]}
              empty={
                <EmptyState icon={ClipboardList} title="No assignments here" message="Assignments appear when your course has them." />
              }
            />
          )}
        </AsyncContent>
      </Card>
    </>
  );
}
