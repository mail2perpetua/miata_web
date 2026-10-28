import { useState } from 'react';
import { Pause, Play, Trash2, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  FilterSelect,
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

function EnrolModal({ course, onClose, onDone }) {
  const [selected, setSelected] = useState([]);
  const { run, busy } = useApiAction();
  const submit = () =>
    run(() => api.post(`/admin/courses/${course.id}/enrolments`, { studentIds: selected.map((s) => s.id) }), {
      success: `${selected.length} student(s) enrolled`,
      onDone: () => {
        onDone();
        onClose();
      },
    });
  return (
    <Modal
      open
      title={`Enrol students in ${course.title}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selected.length} loading={Boolean(busy)}>
            Enrol {selected.length || ''} student{selected.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      {!course.isActive && <Alert tone="warning">This course is inactive. Activate it before enrolling students.</Alert>}
      <PeoplePicker role="student" selected={selected} onChange={setSelected} />
    </Modal>
  );
}

export function CourseStudentsTab({ course, onChange }) {
  const [query, setQuery] = useState({ page: 1, pageSize: 10, order: 'desc' });
  const state = useFetch(`/admin/courses/${course.id}/students`, query);
  const [enrolling, setEnrolling] = useState(false);
  const confirm = useConfirm();
  const { run } = useApiAction();
  const refresh = () => {
    state.reload();
    onChange();
  };

  const setStatus = (row, status) =>
    run(() => api.patch(`/admin/enrolments/${row.enrolmentId}`, { status }), {
      success: status === 'suspended' ? 'Enrolment suspended' : 'Enrolment reactivated',
      onDone: refresh,
    });

  const remove = async (row) => {
    const ok = await confirm({
      title: `Remove ${row.fullName}?`,
      message: 'The student loses access to this course. Their submissions are kept.',
      confirmLabel: 'Remove from course',
      danger: true,
    });
    if (ok)
      await run(() => api.delete(`/admin/enrolments/${row.enrolmentId}`), { success: 'Student removed from course', onDone: refresh });
  };

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput
          value={query.search}
          onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
          placeholder="Search enrolled students"
        />
        <FilterSelect
          label="Enrolment status"
          allLabel="All statuses"
          value={query.status}
          onChange={(status) => setQuery((q) => ({ ...q, status, page: 1 }))}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <div className="spacer" />
        <Button icon={UserPlus} size="sm" onClick={() => setEnrolling(true)}>
          Enrol students
        </Button>
      </div>
      <DataTable
        rows={state.data}
        loading={state.loading}
        rowKey="enrolmentId"
        sort={query.sort}
        order={query.order}
        onSort={(sort) => setQuery((q) => ({ ...q, sort, order: q.sort === sort && q.order === 'desc' ? 'asc' : 'desc' }))}
        columns={[
          {
            key: 'student',
            header: 'Student',
            sortKey: 'full_name',
            render: (r) => (
              <Link to={`/admin/students/${r.studentId}`}>
                <PersonCell name={r.fullName} sub={`${r.studentCode} · ${r.email}`} />
              </Link>
            ),
          },
          { key: 'enrolledAt', header: 'Enrolled', sortKey: 'enrolled_at', render: (r) => formatDate(r.enrolledAt) },
          {
            key: 'progress',
            header: 'Progress',
            render: (r) => (
              <div className="row" style={{ minWidth: 160 }}>
                <ProgressBar value={r.progress.percent} label={`${r.fullName} progress`} />
                <span className="num" style={{ fontWeight: 600 }}>
                  {r.progress.percent}%
                </span>
              </div>
            ),
          },
          { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            render: (r) =>
              r.status === 'completed' ? (
                <span className="muted nowrap">Completed {formatDate(r.completedAt)}</span>
              ) : (
                <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                  {r.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Pause}
                      onClick={() => setStatus(r, 'suspended')}
                      aria-label="Suspend enrolment"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Play}
                      onClick={() => setStatus(r, 'active')}
                      aria-label="Reactivate enrolment"
                    />
                  )}
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(r)} aria-label="Remove from course" />
                </span>
              ),
          },
        ]}
        empty={<EmptyState icon={Users} title="No students enrolled" message="Use “Enrol students” to add students to this course." />}
      />
      <Pagination meta={state.meta} onPage={(page) => setQuery((q) => ({ ...q, page }))} noun="students" />
      {enrolling && <EnrolModal course={course} onClose={() => setEnrolling(false)} onDone={refresh} />}
    </Card>
  );
}
