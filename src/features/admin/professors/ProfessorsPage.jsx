import { Plus, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { PersonFormModal } from '../shared/PersonFormModal';

export default function ProfessorsPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/professors', apiQuery);
  const courses = useFetch('/admin/lookups/courses');
  const [creating, setCreating] = useCreateDialog();

  return (
    <>
      <PageHeader
        title="Professors"
        subtitle="Manage professors, their course and module assignments and review workload."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add Professor
          </Button>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput
            value={query.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, email, department or specialization"
          />
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={query.status}
            onChange={(status) => update({ status })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
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
            onRowClick={(p) => navigate(`/admin/professors/${p.id}`)}
            columns={[
              {
                key: 'name',
                header: 'Professor',
                sortKey: 'full_name',
                render: (p) => <PersonCell name={p.fullName} sub={`${p.employeeCode} · ${p.email}`} />,
              },
              { key: 'specialization', header: 'Specialization', render: (p) => p.specialization || p.department || '—' },
              {
                key: 'courses',
                header: 'Assigned courses',
                render: (p) => p.courseTitles || (p.moduleCount ? `${p.moduleCount} module(s)` : <span className="muted">None</span>),
              },
              { key: 'studentCount', header: 'Students', align: 'right', render: (p) => <span className="num">{p.studentCount}</span> },
              {
                key: 'pendingReviews',
                header: 'Pending reviews',
                align: 'right',
                sortKey: 'pending_reviews',
                render: (p) => <span className="num">{p.pendingReviews}</span>,
              },
              { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} /> },
            ]}
            empty={<EmptyState icon={Stethoscope} title="No professors found" />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="professors" />
      </Card>
      <PersonFormModal
        open={creating}
        role="professor"
        onClose={() => setCreating(false)}
        onSaved={(p) => navigate(`/admin/professors/${p.id}`)}
      />
    </>
  );
}
