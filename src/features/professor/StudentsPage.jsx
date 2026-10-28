import { Users } from 'lucide-react';
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  PersonCell,
  ProgressBar,
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatDate } from '@/utils/format';

export default function StudentsPage() {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'last_activity' });
  const state = useFetch('/professor/students', apiQuery);
  const courses = useFetch('/professor/courses');
  const batches = useFetch('/professor/batches');

  return (
    <>
      <PageHeader
        title="Students List"
        subtitle="Students of your batches, and students of your courses and modules who are not in a batch."
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search by name or student ID" />
          <FilterSelect
            label="Course"
            allLabel="All my courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
          {batches.data?.length > 0 && (
            <FilterSelect
              label="Batch"
              allLabel="All my batches"
              value={query.batchId}
              onChange={(batchId) => update({ batchId })}
              options={batches.data.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
          <FilterSelect
            label="Enrolment status"
            allLabel="All statuses"
            value={query.status}
            onChange={(status) => update({ status })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : (
          <DataTable
            rows={state.data}
            loading={state.loading}
            rowKey="enrolmentId"
            sort={query.sort}
            order={query.order}
            onSort={setSort}
            columns={[
              {
                key: 'name',
                header: 'Student Name',
                sortKey: 'full_name',
                render: (s) => <PersonCell name={s.fullName} sub={s.studentCode} />,
              },
              {
                key: 'batch',
                header: 'Batch',
                sortKey: 'batch',
                render: (s) =>
                  s.batchName ? <span className="badge badge--purple">{s.batchName}</span> : <span className="muted">No batch</span>,
              },
              { key: 'course', header: 'Course', render: (s) => s.courseTitle },
              {
                key: 'progress',
                header: 'Progress',
                render: (s) => (
                  <div className="row" style={{ minWidth: 150 }}>
                    <ProgressBar value={s.progress.percent} />
                    <span className="num">{s.progress.percent}%</span>
                  </div>
                ),
              },
              { key: 'enrolledAt', header: 'Enrolled', sortKey: 'enrolled_at', render: (s) => formatDate(s.enrolledAt) },
              {
                key: 'last',
                header: 'Last Activity',
                sortKey: 'last_activity',
                render: (s) => <span className="nowrap">{formatDate(s.lastActivity)}</span>,
              },
              { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.isActive ? s.status : 'inactive'} /> },
            ]}
            empty={<EmptyState icon={Users} title="No students found" />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="students" />
      </Card>
    </>
  );
}
