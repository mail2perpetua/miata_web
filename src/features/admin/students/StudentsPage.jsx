import { Plus, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  PersonCell,
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { formatDate } from '@/utils/format';
import { PersonFormModal } from '../shared/PersonFormModal';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending (not enrolled)' },
  { value: 'completed', label: 'Course completed' },
  { value: 'inactive', label: 'Inactive' },
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/students', apiQuery);
  const courses = useFetch('/admin/lookups/courses');
  const agents = useFetch('/admin/lookups/agents');
  const batches = useFetch('/admin/lookups/batches');
  const [creating, setCreating] = useCreateDialog();

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Manage students, their batches, enrolments, progress and referral source."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add Student
          </Button>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput
            value={query.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, email, phone or student ID"
          />
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={query.status}
            onChange={(status) => update({ status })}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
            options={[{ value: 'none', label: 'Not in a batch' }, ...(batches.data ?? []).map((b) => ({ value: b.id, label: b.name }))]}
          />
          <FilterSelect
            label="Agent"
            allLabel="All agents"
            value={query.agentId}
            onChange={(agentId) => update({ agentId })}
            options={(agents.data ?? []).map((a) => ({ value: a.id, label: a.fullName }))}
          />
        </div>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : (
          <DataTable
            rows={state.data}
            loading={state.loading}
            sort={query.sort}
            order={query.order}
            onSort={setSort}
            onRowClick={(s) => navigate(`/admin/students/${s.id}`)}
            columns={[
              {
                key: 'name',
                header: 'Student',
                sortKey: 'full_name',
                render: (s) => <PersonCell name={s.fullName} sub={`${s.studentCode} · ${s.email}`} />,
              },
              { key: 'phone', header: 'Phone', render: (s) => s.phone || '—' },
              {
                key: 'batch',
                header: 'Batch',
                sortKey: 'batch',
                render: (s) =>
                  s.batchId ? (
                    <Link to={`/admin/batches/${s.batchId}`} onClick={(e) => e.stopPropagation()} className="nowrap">
                      {s.batchName}
                    </Link>
                  ) : (
                    <span className="muted">No batch</span>
                  ),
              },
              { key: 'courses', header: 'Courses', render: (s) => s.courseTitles || <span className="muted">Not enrolled</span> },
              {
                key: 'agent',
                header: 'Referred by',
                render: (s) =>
                  s.agentName ? (
                    <Link to={`/admin/agents/${s.agentId}`} onClick={(e) => e.stopPropagation()}>
                      {s.agentName}
                    </Link>
                  ) : (
                    <span className="muted">Direct</span>
                  ),
              },
              {
                key: 'createdAt',
                header: 'Registered',
                sortKey: 'created_at',
                render: (s) => <span className="nowrap">{formatDate(s.createdAt)}</span>,
              },
              { key: 'status', header: 'Status', sortKey: 'status', render: (s) => <StatusBadge status={s.status} /> },
            ]}
            empty={<EmptyState icon={Users} title="No students found" message="Adjust the filters, or add a student." />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="students" />
      </Card>
      <PersonFormModal
        open={creating}
        role="student"
        onClose={() => setCreating(false)}
        onSaved={(s) => navigate(`/admin/students/${s.id}`)}
      />
    </>
  );
}
