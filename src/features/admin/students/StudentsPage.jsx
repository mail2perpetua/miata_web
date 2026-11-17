import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Tabs,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { formatDate } from '@/utils/format';
import { actionsColumn } from '../shared/columns';
import { EditPersonModal } from '../shared/EditPersonModal';
import { PersonFormModal } from '../shared/PersonFormModal';
import { RowActionsMenu } from '../shared/RowActionsMenu';
import { useDeleteAction } from '../shared/useDeleteAction';
import { ApplicationsTab } from './applications/ApplicationsTab';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending (not enrolled)' },
  { value: 'completed', label: 'Course completed' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Students: the student list, and Online Applications (the website's Apply Now form). Approving an application adds the
 * applicant to the student list. The tab is in the URL (?tab=applications); switching tabs clears the other tab's filters.
 */
export default function StudentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'applications' ? 'applications' : 'students';
  const counts = useFetch('/admin/applications/counts');
  const [creating, setCreating] = useCreateDialog();
  const pending = counts.data?.pending;

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={
          tab === 'applications'
            ? 'Applications sent with the website’s Apply Now form. Approve an application to add the applicant to the student list.'
            : 'Manage students, their batches, enrolments, progress and referral source.'
        }
        actions={
          tab === 'students' && (
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Add Student
            </Button>
          )
        }
      />
      <Tabs
        label="Students sections"
        value={tab}
        onChange={(next) => setParams(next === 'applications' ? { tab: 'applications' } : {}, { replace: true })}
        tabs={[
          { value: 'students', label: 'Students' },
          { value: 'applications', label: 'Online Applications', count: pending || undefined },
        ]}
      />
      {tab === 'applications' ? (
        <ApplicationsTab onChange={counts.reload} />
      ) : (
        <StudentList creating={creating} setCreating={setCreating} />
      )}
    </>
  );
}

function StudentList({ creating, setCreating }) {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/students', apiQuery);
  const courses = useFetch('/admin/lookups/courses');
  const agents = useFetch('/admin/lookups/agents');
  const batches = useFetch('/admin/lookups/batches');
  const [editingId, setEditingId] = useState(null);
  const { remove, deleting } = useDeleteAction();

  const confirmDelete = (s) =>
    remove({
      path: `/admin/students/${s.id}`,
      title: `Delete ${s.fullName}?`,
      message: `${s.fullName} (${s.studentCode}) and their account are deleted permanently, with any enrolments that have no payments. Students with payments, submissions or completed courses cannot be deleted — deactivate them instead.`,
      success: 'Student deleted',
      onDone: state.reload,
    });

  return (
    <>
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
              actionsColumn((s) => (
                <RowActionsMenu
                  label={s.fullName}
                  onView={() => navigate(`/admin/students/${s.id}`)}
                  onEdit={() => setEditingId(s.id)}
                  onDelete={() => confirmDelete(s)}
                  deleting={deleting(`/admin/students/${s.id}`)}
                />
              )),
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
      {editingId && (
        <EditPersonModal role="student" personId={editingId} onClose={() => setEditingId(null)} onSaved={() => state.reload()} />
      )}
    </>
  );
}
