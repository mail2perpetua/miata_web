import { useState } from 'react';
import { ClipboardList, ClipboardPen, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Tabs,
} from '@/components';
import { AssignedTo } from '@/features/shared/AssignedTo';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { formatDate, formatDateTime } from '@/utils/format';
import { LogbookStatus } from './LogbookViews';
import { WorksheetFormModal } from './WorksheetFormModal';
import { useDeleteWorksheet } from './useDeleteWorksheet';
import { scanHoursLabel } from './worksheets';

const LOGBOOK_FILTERS = [
  { value: 'pending', label: 'Awaiting review' },
  { value: 'rework', label: 'Rework required' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'In progress (not submitted)' },
  { value: 'handed_in', label: 'All submitted' },
];

/** The worksheets a manager sees, with how many logbooks are handed in, waiting, in rework and completed. */
function WorksheetsTab({ base, courses, batches }) {
  const navigate = useNavigate();
  const isAdmin = base === '/admin';
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'due_at', order: 'asc' });
  const state = useFetch(`${base}/worksheets`, apiQuery);
  const [creating, setCreating] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const remove = useDeleteWorksheet(base);

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search worksheets or courses" />
        <FilterSelect
          label="Course"
          allLabel={isAdmin ? 'All courses' : 'All my courses'}
          value={query.courseId}
          onChange={(courseId) => update({ courseId })}
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
        />
        {batches.length > 0 && (
          <FilterSelect
            label="Batch"
            allLabel={isAdmin ? 'All batches' : 'All my batches'}
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
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
        <div className="spacer" />
        <Button icon={Plus} size="sm" onClick={() => setCreating(true)} disabled={courses.length === 0}>
          Add Worksheet
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
          onRowClick={(w) => navigate(`${base}/worksheets/${w.id}`)}
          columns={[
            {
              key: 'title',
              header: 'Worksheet',
              sortKey: 'title',
              render: (w) => (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{w.title}</strong>{' '}
                  {w.templateName && <Paperclip size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-label="Has a template" />}
                  <span className="cell-person__sub" style={{ display: 'block' }}>
                    {w.courseTitle}
                    {w.moduleTitle ? ` · ${w.moduleTitle}` : ''}
                  </span>
                  <AssignedTo assignment={w} inline />
                </span>
              ),
            },
            {
              key: 'due',
              header: 'Due Date',
              sortKey: 'due_at',
              render: (w) => <span className="nowrap">{w.dueAt ? formatDateTime(w.dueAt) : '—'}</span>,
            },
            ...(isAdmin
              ? [{ key: 'createdBy', header: 'Created by', render: (w) => <span className="nowrap">{w.createdByName || '—'}</span> }]
              : []),
            {
              key: 'submitted',
              header: 'Submitted',
              align: 'right',
              render: (w) => (
                <span className="num">
                  {w.submittedCount}/{w.studentCount}
                </span>
              ),
            },
            {
              key: 'pending',
              header: 'To review',
              align: 'right',
              sortKey: 'pending',
              render: (w) => <strong className="num">{w.pendingCount}</strong>,
            },
            { key: 'rework', header: 'Rework', align: 'right', render: (w) => <span className="num">{w.reworkCount}</span> },
            { key: 'completed', header: 'Completed', align: 'right', render: (w) => <span className="num">{w.completedCount}</span> },
            {
              key: 'status',
              header: 'Status',
              render: (w) =>
                !w.isPublished ? (
                  <StatusBadge status="draft" />
                ) : w.pendingCount > 0 ? (
                  <StatusBadge status="pending" label="Pending review" />
                ) : (
                  <StatusBadge status="active" label="Up to date" />
                ),
            },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (w) =>
                !w.canManage ? (
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
                        setEditing(w);
                      }}
                      aria-label="Edit worksheet"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(w, state.reload);
                      }}
                      aria-label="Delete worksheet"
                    />
                  </span>
                ),
            },
          ]}
          empty={
            <EmptyState
              icon={ClipboardPen}
              title="No practical worksheets yet"
              message="Add a clinical logbook or practical worksheet for a course, module or batch. Published worksheets are assigned to the chosen students straight away."
            />
          }
        />
      )}
      <Pagination meta={state.meta} onPage={setPage} noun="worksheets" />
      <WorksheetFormModal
        base={base}
        open={creating}
        defaultCourseId={query.courseId}
        defaultBatchId={query.batchId}
        onClose={() => setCreating(false)}
        onSaved={state.reload}
      />
      <WorksheetFormModal base={base} open={Boolean(editing)} worksheet={editing} onClose={() => setEditing(null)} onSaved={state.reload} />
    </Card>
  );
}

/** Students' logbooks the manager may review; awaiting review by default. Rows open the logbook. */
export function LogbooksTable({ base, query, onSort, onPage, emptyTitle = 'Nothing to review' }) {
  const navigate = useNavigate();
  const state = useFetch(`${base}/worksheet-submissions`, query);
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  return (
    <>
      <DataTable
        rows={state.data}
        loading={state.loading}
        sort={query.sort}
        order={query.order}
        onSort={onSort}
        onRowClick={(s) => navigate(`${base}/worksheets/submissions/${s.id}`)}
        columns={[
          {
            key: 'student',
            header: 'Student',
            sortKey: 'student',
            render: (s) => <PersonCell name={s.studentName} sub={s.batchName ? `${s.studentCode} · ${s.batchName}` : s.studentCode} />,
          },
          {
            key: 'worksheet',
            header: 'Worksheet',
            sortKey: 'worksheet',
            render: (s) => (
              <span>
                <strong style={{ color: 'var(--ink)' }}>{s.worksheetTitle}</strong>
                <span className="cell-person__sub" style={{ display: 'block' }}>
                  {s.courseTitle}
                  {s.moduleTitle ? ` · ${s.moduleTitle}` : ''}
                </span>
              </span>
            ),
          },
          {
            key: 'log',
            header: 'Scan log',
            render: (s) => (
              <span className="nowrap">
                {s.entryCount} {s.entryCount === 1 ? 'entry' : 'entries'}
                <span className="cell-person__sub" style={{ display: 'block' }}>
                  {scanHoursLabel(s.totalScans, s.totalHours)}
                </span>
              </span>
            ),
          },
          {
            key: 'submittedAt',
            header: 'Submitted',
            sortKey: 'submitted_at',
            render: (s) =>
              s.submittedAt ? (
                <span className="nowrap">
                  {formatDateTime(s.submittedAt)}
                  {s.dueAt && new Date(s.submittedAt) > new Date(s.dueAt) && (
                    <span className="badge badge--red" style={{ marginLeft: 6 }}>
                      Late
                    </span>
                  )}
                </span>
              ) : (
                <span className="muted">Not yet</span>
              ),
          },
          {
            key: 'due',
            header: 'Due',
            sortKey: 'due_at',
            render: (s) => <span className="nowrap">{s.dueAt ? formatDate(s.dueAt) : '—'}</span>,
          },
          ...(base === '/admin' ? [{ key: 'reviewer', header: 'Reviewed by', render: (s) => s.reviewerName || '—' }] : []),
          { key: 'status', header: 'Status', sortKey: 'status', render: (s) => <LogbookStatus status={s.status} /> },
        ]}
        empty={<EmptyState icon={ClipboardList} title={emptyTitle} />}
      />
      <Pagination meta={state.meta} onPage={onPage} noun="logbooks" />
    </>
  );
}

function LogbooksTab({ base, courses, batches }) {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'submitted_at', order: 'asc', status: 'pending' });
  // "All submitted" is the API's default (no status): every handed-in logbook, drafts excluded.
  const status = apiQuery.status === 'handed_in' ? undefined : apiQuery.status;

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search student, ID or worksheet" />
        <FilterSelect
          label="Status"
          allLabel="Everything (including in progress)"
          value={query.status === 'all' ? '' : query.status}
          onChange={(value) => update({ status: value ?? 'all' })}
          options={LOGBOOK_FILTERS}
        />
        <FilterSelect
          label="Course"
          allLabel="All courses"
          value={query.courseId}
          onChange={(courseId) => update({ courseId })}
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
        />
        {batches.length > 0 && (
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
          />
        )}
        {query.worksheetId && (
          <span className="chip">
            Worksheet #{query.worksheetId}
            <button type="button" onClick={() => update({ worksheetId: undefined })} aria-label="Clear worksheet filter">
              ×
            </button>
          </span>
        )}
      </div>
      <LogbooksTable
        base={base}
        query={{ ...apiQuery, status }}
        onSort={setSort}
        onPage={setPage}
        emptyTitle={query.status === 'pending' ? 'All caught up — no logbooks awaiting review' : 'No logbooks match'}
      />
    </Card>
  );
}

/**
 * Practical worksheets for professors and admins (`base` = '/professor' or '/admin'): create and manage worksheets
 * (clinical training logbooks), and review the logbooks students submit.
 */
export default function WorksheetsManagerPage({ base }) {
  const { query, update } = useListQuery();
  const courses = useFetch(`${base}/worksheet-options/courses`);
  const batches = useFetch(base === '/admin' ? '/admin/lookups/batches' : '/professor/batches');
  const tab = query.tab === 'logbooks' ? 'logbooks' : 'worksheets';
  const props = { base, courses: courses.data ?? [], batches: batches.data ?? [] };

  return (
    <>
      <PageHeader
        title="Practical Worksheets"
        subtitle={
          base === '/admin'
            ? 'Create clinical training logbooks and practical worksheets for any course, module or batch, and track and review the students’ logbooks.'
            : 'Set clinical training logbooks and practical worksheets for your courses, modules and batches, then verify entries and sign logbooks off.'
        }
      />
      <Tabs
        value={tab}
        onChange={(value) =>
          update({
            tab: value === 'worksheets' ? undefined : value,
            status: undefined,
            worksheetId: undefined,
            sort: undefined,
            order: undefined,
            search: undefined,
            page: undefined,
          })
        }
        tabs={[
          { value: 'worksheets', label: 'Worksheets' },
          { value: 'logbooks', label: 'Student logbooks' },
        ]}
      />
      {tab === 'worksheets' ? <WorksheetsTab {...props} /> : <LogbooksTab {...props} />}
    </>
  );
}
