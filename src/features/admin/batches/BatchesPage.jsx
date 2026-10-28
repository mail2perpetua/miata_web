import { useState } from 'react';
import { Layers, Pencil, Plus } from 'lucide-react';
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
  ProgressBar,
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { dateRange } from '@/utils/format';
import { BatchFormModal } from './BatchFormModal';

export default function BatchesPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'start_date' });
  const state = useFetch('/admin/batches', apiQuery);
  const courses = useFetch('/admin/lookups/courses');
  const professors = useFetch('/admin/lookups/professors');
  const [creating, setCreating] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const filtered = query.search || query.status || query.courseId || query.professorId;

  return (
    <>
      <PageHeader
        title="Batches"
        subtitle="Group students into batches, give each batch its courses and professors, and track its progress."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add Batch
          </Button>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search by batch name or code" />
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
          <FilterSelect
            label="Professor"
            allLabel="All professors"
            value={query.professorId}
            onChange={(professorId) => update({ professorId })}
            options={(professors.data ?? []).map((p) => ({ value: p.id, label: p.fullName }))}
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
            onRowClick={(b) => navigate(`/admin/batches/${b.id}`)}
            columns={[
              {
                key: 'name',
                header: 'Batch',
                sortKey: 'name',
                render: (b) => (
                  <span>
                    <Link to={`/admin/batches/${b.id}`} className="cell-person__name" onClick={(e) => e.stopPropagation()}>
                      {b.name}
                    </Link>
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {b.code}
                    </span>
                  </span>
                ),
              },
              {
                key: 'courses',
                header: 'Courses',
                render: (b) => (b.courses.length ? b.courses.map((c) => c.title).join(', ') : <span className="muted">No courses</span>),
              },
              {
                key: 'professors',
                header: 'Professors',
                render: (b) =>
                  b.professors.length ? b.professors.map((p) => p.fullName).join(', ') : <span className="muted">Not assigned</span>,
              },
              {
                key: 'students',
                header: 'Students',
                align: 'right',
                sortKey: 'students',
                render: (b) => <span className="num">{b.studentCount}</span>,
              },
              {
                key: 'schedule',
                header: 'Schedule',
                sortKey: 'start_date',
                render: (b) => <span className="nowrap">{dateRange(b.startDate, b.endDate)}</span>,
              },
              {
                key: 'progress',
                header: 'Avg. progress',
                render: (b) => (
                  <div className="row" style={{ minWidth: 130 }}>
                    <ProgressBar value={b.progress.averagePercent} label={`${b.name} average progress`} />
                    <span className="num">{b.progress.averagePercent}%</span>
                  </div>
                ),
              },
              {
                key: 'pending',
                header: 'To review',
                align: 'right',
                render: (b) => <span className="num">{b.pendingReviews}</span>,
              },
              { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.isActive ? 'active' : 'inactive'} /> },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (b) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    aria-label={`Edit ${b.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(b);
                    }}
                  />
                ),
              },
            ]}
            empty={
              <EmptyState
                icon={Layers}
                title={filtered ? 'No matching batches' : 'No batches yet'}
                message={
                  filtered ? 'Try a different search or filter.' : 'Create a batch, add its courses and professors, then add students.'
                }
              />
            }
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="batches" />
      </Card>

      <BatchFormModal open={creating} onClose={() => setCreating(false)} onSaved={(b) => navigate(`/admin/batches/${b.id}`)} />
      <BatchFormModal open={Boolean(editing)} batch={editing} onClose={() => setEditing(null)} onSaved={() => state.reload()} />
    </>
  );
}
