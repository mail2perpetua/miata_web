import { useState } from 'react';
import { Download, GraduationCap, Pencil, Plus } from 'lucide-react';
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
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { durationLabel } from '@/utils/format';
import { CourseFormModal } from './CourseFormModal';
import { ImportTimetableModal } from './ImportTimetableModal';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/courses', apiQuery);
  const [creating, setCreating] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Add, edit and manage MIATA programs, their modules and duration."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => setImporting(true)}>
              Import Timetable
            </Button>
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Add Course
            </Button>
          </>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search by title, code or category" />
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
            onRowClick={(c) => navigate(`/admin/courses/${c.id}`)}
            columns={[
              {
                key: 'title',
                header: 'Course',
                sortKey: 'title',
                render: (c) => (
                  <span>
                    <Link to={`/admin/courses/${c.id}`} className="cell-person__name" onClick={(e) => e.stopPropagation()}>
                      {c.title}
                    </Link>
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {c.code}
                      {c.category ? ` · ${c.category}` : ''}
                    </span>
                  </span>
                ),
              },
              {
                key: 'duration',
                header: 'Duration',
                render: (c) => (
                  <span>
                    {durationLabel(c.durationValue, c.durationUnit)}
                    {c.academicYear && (
                      <span className="cell-person__sub" style={{ display: 'block' }}>
                        {c.academicYear}
                      </span>
                    )}
                  </span>
                ),
              },
              { key: 'moduleCount', header: 'Modules', align: 'right', render: (c) => <span className="num">{c.moduleCount}</span> },
              {
                key: 'studentCount',
                header: 'Students',
                align: 'right',
                sortKey: 'students',
                render: (c) => <span className="num">{c.studentCount}</span>,
              },
              {
                key: 'professorCount',
                header: 'Professors',
                align: 'right',
                render: (c) => <span className="num">{c.professorCount}</span>,
              },
              { key: 'videoCount', header: 'Videos', align: 'right', render: (c) => <span className="num">{c.videoCount}</span> },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (c) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    aria-label={`Edit ${c.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                    }}
                  />
                ),
              },
            ]}
            empty={
              <EmptyState
                icon={GraduationCap}
                title={query.search || query.status ? 'No matching courses' : 'No courses yet'}
                message={
                  query.search || query.status
                    ? 'Try a different search or filter.'
                    : 'Create your first course to start enrolling students.'
                }
              />
            }
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="courses" />
      </Card>

      <CourseFormModal open={creating} onClose={() => setCreating(false)} onSaved={(c) => navigate(`/admin/courses/${c.id}`)} />
      <CourseFormModal open={Boolean(editing)} course={editing} onClose={() => setEditing(null)} onSaved={() => state.reload()} />
      <ImportTimetableModal
        open={importing}
        onClose={() => setImporting(false)}
        onImported={(c) => navigate(`/admin/courses/${c.id}?tab=timetable`)}
      />
    </>
  );
}
