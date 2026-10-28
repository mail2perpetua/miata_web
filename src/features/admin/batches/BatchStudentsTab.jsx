import { useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  PersonCell,
  ProgressBar,
  SearchInput,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDate } from '@/utils/format';
import { PeoplePicker } from '../shared/PeoplePicker';

function AddStudentsModal({ batch, onClose, onDone }) {
  const [selected, setSelected] = useState([]);
  const { run, busy } = useApiAction();
  const submit = () =>
    run(() => api.post(`/admin/batches/${batch.id}/students`, { studentIds: selected.map((s) => s.id) }), {
      success: `${selected.length} student(s) added to ${batch.name}`,
      onDone: () => {
        onDone();
        onClose();
      },
    });
  return (
    <Modal
      open
      title={`Add students to ${batch.name}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selected.length || !batch.isActive} loading={Boolean(busy)}>
            Add {selected.length || ''} student{selected.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        {batch.isActive ? (
          <Alert tone="info">
            Students are enrolled in the batch’s courses automatically. A student already in another batch is moved to this one; their
            enrolments, submissions and progress are kept.
          </Alert>
        ) : (
          <Alert tone="warning">This batch is inactive. Activate it before adding students.</Alert>
        )}
        <PeoplePicker role="student" selected={selected} onChange={setSelected} />
      </div>
    </Modal>
  );
}

/** The batch's students with their progress in each batch course and their assignment tracking. */
export function BatchStudentsTab({ batch, onChange }) {
  const [query, setQuery] = useState({ page: 1, pageSize: 10, order: 'asc', sort: 'full_name' });
  const state = useFetch(`/admin/batches/${batch.id}/students`, query);
  const [adding, setAdding] = useState(false);
  const confirm = useConfirm();
  const { run } = useApiAction();
  const courseTitle = Object.fromEntries(batch.courses.map((c) => [c.id, c.title]));
  const refresh = () => {
    state.reload();
    onChange();
  };

  const remove = async (s) => {
    const ok = await confirm({
      title: `Remove ${s.fullName} from ${batch.name}?`,
      message:
        'Their course enrolments, submissions and progress are kept. Batch-only material and assignments are no longer shown to them.',
      confirmLabel: 'Remove from batch',
      danger: true,
    });
    if (ok)
      await run(() => api.delete(`/admin/batches/${batch.id}/students/${s.id}`), {
        success: 'Student removed from batch',
        onDone: refresh,
      });
  };

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput
          value={query.search}
          onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
          placeholder="Search students in this batch"
        />
        <div className="spacer" />
        <Button icon={UserPlus} size="sm" onClick={() => setAdding(true)}>
          Add students
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
          onSort={(sort) => setQuery((q) => ({ ...q, sort, order: q.sort === sort && q.order === 'desc' ? 'asc' : 'desc' }))}
          columns={[
            {
              key: 'student',
              header: 'Student',
              sortKey: 'full_name',
              render: (s) => (
                <Link to={`/admin/students/${s.id}`}>
                  <PersonCell name={s.fullName} sub={`${s.studentCode} · ${s.email}`} />
                </Link>
              ),
            },
            {
              key: 'progress',
              header: 'Course progress',
              render: (s) =>
                s.courses.length ? (
                  <div style={{ minWidth: 190 }}>
                    {s.courses.map((c) => (
                      <div key={c.courseId} className="row" style={{ gap: 8 }}>
                        <span className="muted nowrap" style={{ fontSize: 'var(--fs-xs)', minWidth: 90 }} title={courseTitle[c.courseId]}>
                          {courseTitle[c.courseId]}
                        </span>
                        <ProgressBar value={c.progress.percent} tone={c.status === 'completed' ? 'green' : undefined} />
                        <span className="num" style={{ fontSize: 'var(--fs-xs)' }}>
                          {c.progress.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="muted">Not enrolled in the batch’s courses</span>
                ),
            },
            {
              key: 'assignments',
              header: 'Assignments',
              render: (s) => (
                <span>
                  <strong className="num">
                    {s.assignmentsCompleted}/{s.assignmentsTotal}
                  </strong>{' '}
                  <span className="muted">completed</span>
                  <span className="cell-person__sub" style={{ display: 'block' }}>
                    {s.assignmentsPendingReview} to review · {s.assignmentsRework} rework · {s.assignmentsOverdue} overdue
                  </span>
                </span>
              ),
            },
            {
              key: 'addedAt',
              header: 'In batch since',
              sortKey: 'added_at',
              render: (s) => <span className="nowrap">{formatDate(s.addedAt)}</span>,
            },
            { key: 'status', header: 'Account', render: (s) => <StatusBadge status={s.isActive ? 'active' : 'inactive'} /> },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (s) => (
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(s)} aria-label={`Remove ${s.fullName} from batch`} />
              ),
            },
          ]}
          empty={<EmptyState icon={Users} title="No students in this batch" message="Use “Add students” to build the batch." />}
        />
      )}
      <Pagination meta={state.meta} onPage={(page) => setQuery((q) => ({ ...q, page }))} noun="students" />
      {adding && <AddStudentsModal batch={batch} onClose={() => setAdding(false)} onDone={refresh} />}
    </Card>
  );
}
