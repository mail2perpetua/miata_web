import { useState } from 'react';
import { FileText, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';
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
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { formatDateTime } from '@/utils/format';
import { AssignedTo } from '@/features/shared/AssignedTo';
import { AssignmentFormModal } from './AssignmentFormModal';
import { useDeleteAssignment } from './useDeleteAssignment';

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'due_at', order: 'asc' });
  const state = useFetch('/professor/assignments', apiQuery);
  const courses = useFetch('/professor/courses');
  const batches = useFetch('/professor/batches');
  const [creating, setCreating] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const remove = useDeleteAssignment();

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Create and assign work for your courses, modules and batches — a whole batch or selected students — then track and review submissions."
      />
      {courses.data?.length > 0 && (
        <div className="row row--wrap" style={{ marginBottom: 16 }}>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Teaching:
          </span>
          {courses.data.map((c) => (
            <span key={c.id} className="chip">
              {c.title}
              {!c.wholeCourse && c.modules.length > 0 && ` — ${c.modules.map((m) => m.title).join(', ')}`}
              {!c.wholeCourse && !c.modules.length && c.batches.length > 0 && ` — ${c.batches.map((b) => b.name).join(', ')}`}
            </span>
          ))}
        </div>
      )}
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search assignments" />
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
            label="Visibility"
            allLabel="Published & drafts"
            value={query.published}
            onChange={(published) => update({ published })}
            options={[
              { value: 'true', label: 'Published' },
              { value: 'false', label: 'Drafts' },
            ]}
          />
          <div className="spacer" />
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)} disabled={courses.data?.length === 0}>
            Add Assignment
          </Button>
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
            onRowClick={(a) => navigate(`/professor/assignments/${a.id}`)}
            columns={[
              {
                key: 'title',
                header: 'Assignment Title',
                sortKey: 'title',
                render: (a) => (
                  <span>
                    <strong style={{ color: 'var(--ink)' }}>{a.title}</strong>{' '}
                    {a.attachmentName && (
                      <Paperclip size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-label="Has attachment" />
                    )}
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {a.courseTitle}
                      {a.moduleTitle ? ` · ${a.moduleTitle}` : ''}
                    </span>
                    <AssignedTo assignment={a} inline />
                  </span>
                ),
              },
              {
                key: 'due',
                header: 'Due Date',
                sortKey: 'due_at',
                render: (a) => <span className="nowrap">{a.dueAt ? formatDateTime(a.dueAt) : '—'}</span>,
              },
              {
                key: 'submitted',
                header: 'Submitted',
                align: 'right',
                render: (a) => (
                  <span className="num">
                    {a.submittedCount}/{a.studentCount}
                  </span>
                ),
              },
              {
                key: 'pending',
                header: 'To review',
                align: 'right',
                sortKey: 'pending',
                render: (a) => <strong className="num">{a.pendingCount}</strong>,
              },
              { key: 'rework', header: 'Rework', align: 'right', render: (a) => <span className="num">{a.reworkCount}</span> },
              { key: 'completed', header: 'Completed', align: 'right', render: (a) => <span className="num">{a.completedCount}</span> },
              {
                key: 'status',
                header: 'Status',
                render: (a) =>
                  !a.isPublished ? (
                    <StatusBadge status="draft" />
                  ) : a.pendingCount > 0 ? (
                    <StatusBadge status="pending" label="Pending review" />
                  ) : (
                    <StatusBadge status="active" label="Up to date" />
                  ),
              },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (a) =>
                  !a.canManage ? (
                    <span className="muted nowrap" title="Course-wide work managed by the course professors; you review it for your batch">
                      Review only
                    </span>
                  ) : (
                    <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(a);
                        }}
                        aria-label="Edit assignment"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(a, state.reload);
                        }}
                        aria-label="Delete assignment"
                      />
                    </span>
                  ),
              },
            ]}
            empty={
              <EmptyState
                icon={FileText}
                title="No assignments yet"
                message="Create an assignment for one of your courses, modules or batches. Published work is assigned to the chosen students straight away."
              />
            }
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="assignments" />
      </Card>
      <AssignmentFormModal
        open={creating}
        defaultCourseId={query.courseId}
        defaultBatchId={query.batchId}
        onClose={() => setCreating(false)}
        onSaved={state.reload}
      />
      <AssignmentFormModal open={Boolean(editing)} assignment={editing} onClose={() => setEditing(null)} onSaved={state.reload} />
    </>
  );
}
