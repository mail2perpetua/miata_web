import { ClipboardList, Download, Eye, Paperclip } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
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
import { useListQuery } from '@/hooks/useListQuery';
import { download } from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/format';
import { AssignedTo } from '@/features/shared/AssignedTo';

const SUBMISSION_STATUSES = [
  { value: 'pending', label: 'Awaiting review' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'rework', label: 'Rework required' },
  { value: 'completed', label: 'Completed' },
];

/**
 * Read-only overview: professors create, edit and publish assignments for the courses, modules and batches they teach.
 * With `batchId` (batch page) it lists that batch's work, with counts for its students only.
 */
export function AssignmentsTab({ courses, batches = [], batchId }) {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/assignments', batchId ? { ...apiQuery, batchId } : apiQuery);
  const submissionsOf = (a) =>
    batchId ? `/admin/batches/${batchId}?tab=submissions&assignmentId=${a.id}` : `/admin/assignments?tab=submissions&assignmentId=${a.id}`;

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search assignments or courses" />
        <FilterSelect
          label="Course"
          allLabel="All courses"
          value={query.courseId}
          onChange={(courseId) => update({ courseId })}
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
        />
        {!batchId && (
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(value) => update({ batchId: value })}
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
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
          onRowClick={(a) => navigate(submissionsOf(a))}
          columns={[
            {
              key: 'title',
              header: 'Assignment',
              sortKey: 'title',
              render: (a) => (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{a.title}</strong>{' '}
                  {a.attachmentName && <Paperclip size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-label="Has attachment" />}
                  <span className="cell-person__sub" style={{ display: 'block' }}>
                    {a.courseTitle}
                    {a.moduleTitle ? ` · ${a.moduleTitle}` : ''}
                  </span>
                  <AssignedTo assignment={a} inline />
                </span>
              ),
            },
            {
              key: 'dueAt',
              header: 'Due',
              sortKey: 'due_at',
              render: (a) => <span className="nowrap">{a.dueAt ? formatDateTime(a.dueAt) : '—'}</span>,
            },
            { key: 'createdBy', header: 'Created by', render: (a) => <span className="nowrap">{a.createdByName || '—'}</span> },
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
            { key: 'pending', header: 'Pending', align: 'right', render: (a) => <span className="num">{a.pendingCount}</span> },
            { key: 'rework', header: 'Rework', align: 'right', render: (a) => <span className="num">{a.reworkCount}</span> },
            { key: 'completed', header: 'Completed', align: 'right', render: (a) => <span className="num">{a.completedCount}</span> },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.isPublished ? 'published' : 'draft'} /> },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (a) => (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  to={submissionsOf(a)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View submissions"
                />
              ),
            },
          ]}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No assignments"
              message="Assignments appear here once professors create them for their courses or modules."
            />
          }
        />
      )}
      <Pagination meta={state.meta} onPage={setPage} noun="assignments" />
    </Card>
  );
}

/** Submission tracking; with `batchId` (batch page) only that batch's students. */
export function SubmissionsTab({ courses, batches = [], batchId }) {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'submitted_at', latestOnly: 'true' });
  const state = useFetch('/admin/submissions', batchId ? { ...apiQuery, batchId } : apiQuery);
  const professors = useFetch('/admin/lookups/professors');

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search student, ID or assignment" />
        <FilterSelect
          label="Course"
          allLabel="All courses"
          value={query.courseId}
          onChange={(courseId) => update({ courseId })}
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
        />
        <FilterSelect
          label="Professor"
          allLabel="All professors"
          value={query.professorId}
          onChange={(professorId) => update({ professorId })}
          options={(professors.data ?? []).map((p) => ({ value: p.id, label: p.fullName }))}
        />
        {!batchId && (
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(value) => update({ batchId: value })}
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
          />
        )}
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={query.status}
          onChange={(status) => update({ status })}
          options={SUBMISSION_STATUSES}
        />
        <Checkbox
          label="Latest attempt only"
          checked={query.latestOnly === 'true'}
          onChange={(e) => update({ latestOnly: e.target.checked ? 'true' : 'false' })}
        />
        {query.assignmentId && (
          <span className="chip">
            Assignment #{query.assignmentId}
            <button type="button" onClick={() => update({ assignmentId: undefined })} aria-label="Clear assignment filter">
              ×
            </button>
          </span>
        )}
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
          onRowClick={(s) => navigate(`/admin/submissions/${s.id}`)}
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
                  </span>
                </span>
              ),
            },
            { key: 'attempt', header: 'Attempt', align: 'right', render: (s) => s.attemptNo },
            {
              key: 'submittedAt',
              header: 'Submitted',
              sortKey: 'submitted_at',
              render: (s) => <span className="nowrap">{formatDateTime(s.submittedAt)}</span>,
            },
            {
              key: 'due',
              header: 'Due',
              sortKey: 'due_at',
              render: (s) => <span className="nowrap">{s.dueAt ? formatDate(s.dueAt) : '—'}</span>,
            },
            { key: 'reviewer', header: 'Reviewed by', render: (s) => s.reviewerName || '—' },
            { key: 'status', header: 'Status', sortKey: 'status', render: (s) => <StatusBadge status={s.status} /> },
            {
              key: 'file',
              header: <span className="sr-only">File</span>,
              align: 'right',
              render: (s) => (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  aria-label={`Download ${s.fileName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    download(`/admin/submissions/${s.id}/file`);
                  }}
                />
              ),
            },
          ]}
          empty={<EmptyState icon={ClipboardList} title="No submissions match" />}
        />
      )}
      <Pagination meta={state.meta} onPage={setPage} noun="submissions" />
    </Card>
  );
}

export default function AssignmentsPage() {
  const { query, update } = useListQuery();
  const courses = useFetch('/admin/lookups/courses');
  const batches = useFetch('/admin/lookups/batches');
  const tab = query.tab === 'submissions' ? 'submissions' : 'assignments';

  return (
    <>
      <PageHeader title="Assignments" subtitle="Monitor assignments and track submissions, reviews, rework and completion." />
      <Tabs
        value={tab}
        onChange={(value) =>
          update({
            tab: value === 'assignments' ? undefined : value,
            status: undefined,
            assignmentId: undefined,
            batchId: undefined,
            sort: undefined,
            search: undefined,
          })
        }
        tabs={[
          { value: 'assignments', label: 'Assignments' },
          { value: 'submissions', label: 'Submission tracking' },
        ]}
      />
      {tab === 'assignments' ? (
        <AssignmentsTab courses={courses.data ?? []} batches={batches.data ?? []} />
      ) : (
        <SubmissionsTab courses={courses.data ?? []} batches={batches.data ?? []} />
      )}
      <p className="muted" style={{ marginTop: 12, fontSize: 'var(--fs-sm)' }}>
        Assignments are created, assigned and reviewed by the professors teaching each course, module or batch; this view is read-only.{' '}
        <Link to="/admin/courses">Manage course professors</Link> or <Link to="/admin/batches">batch professors</Link>.
      </p>
    </>
  );
}
