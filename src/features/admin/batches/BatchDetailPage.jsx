import { useState } from 'react';
import {
  ChartColumn,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Pencil,
  Power,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AsyncContent,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  PersonCell,
  StatCard,
  StatusBadge,
  Tabs,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange, formatDate } from '@/utils/format';
import { AssignmentsTab, SubmissionsTab } from '../assignments/AssignmentsPage';
import { BatchFormModal } from './BatchFormModal';
import { BatchMaterialsTab } from './BatchMaterialsTab';
import { BatchStudentsTab } from './BatchStudentsTab';

/** Batch professors teach every course of the batch, to this batch's students only. */
function BatchProfessorsTab({ batch, onChange }) {
  const professors = useFetch('/admin/lookups/professors');
  const [selected, setSelected] = useState('');
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const available = (professors.data ?? []).filter((p) => p.isActive && !batch.professors.some((x) => x.id === p.id));

  const assign = () =>
    run(() => api.post(`/admin/batches/${batch.id}/professors`, { professorId: Number(selected) }), {
      success: 'Professor assigned to batch',
      key: 'assign',
      onDone: () => {
        setSelected('');
        onChange();
      },
    });

  const unassign = async (p) => {
    const ok = await confirm({
      title: `Remove ${p.fullName} from ${batch.name}?`,
      message: 'They will no longer see this batch’s students or review its submissions.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok)
      await run(() => api.delete(`/admin/batches/${batch.id}/professors/${p.id}`), { success: 'Professor removed', onDone: onChange });
  };

  return (
    <Card
      title="Batch professors"
      subtitle="They see this batch’s students, assign work to the whole batch or selected students, and review its submissions in every course of the batch."
      flush
    >
      <div className="toolbar">
        <select
          className="select select--inline"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Professor to assign"
        >
          <option value="">Select a professor…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} ({p.code})
            </option>
          ))}
        </select>
        <Button icon={UserPlus} size="sm" disabled={!selected} loading={busy === 'assign'} onClick={assign}>
          Assign professor
        </Button>
      </div>
      <DataTable
        rows={batch.professors}
        columns={[
          {
            key: 'name',
            header: 'Professor',
            render: (p) => (
              <Link to={`/admin/professors/${p.id}`}>
                <PersonCell name={p.fullName} sub={`${p.employeeCode} · ${p.email}`} />
              </Link>
            ),
          },
          { key: 'specialization', header: 'Specialization', render: (p) => p.specialization || '—' },
          { key: 'assignedAt', header: 'Assigned', render: (p) => formatDate(p.assignedAt) },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} /> },
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            render: (p) => (
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => unassign(p)} aria-label={`Remove ${p.fullName}`} />
            ),
          },
        ]}
        empty={
          <EmptyState icon={Stethoscope} title="No professors assigned" message="Assign a professor to teach and review this batch." />
        }
      />
    </Card>
  );
}

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'students';
  const state = useFetch(`/admin/batches/${batchId}`);
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();
  const { run, busy } = useApiAction();

  const toggleStatus = async (batch) => {
    const activating = !batch.isActive;
    const ok = await confirm({
      title: activating ? 'Activate batch?' : 'Deactivate batch?',
      message: activating
        ? 'The batch can take new students, courses and batch assignments again.'
        : 'Students keep their courses and history, but the batch takes no new students or batch assignments.',
      confirmLabel: activating ? 'Activate' : 'Deactivate',
      danger: !activating,
    });
    if (ok) {
      await run(() => api.patch(`/admin/batches/${batch.id}/status`, { isActive: activating }), {
        success: activating ? 'Batch activated' : 'Batch deactivated',
        onDone: state.reload,
        key: 'status',
      });
    }
  };

  const remove = async (batch) => {
    const ok = await confirm({
      title: `Delete ${batch.name}?`,
      message: 'Only empty batches can be deleted. Batches with students or assignments are deactivated instead.',
      confirmLabel: 'Delete batch',
      danger: true,
    });
    if (ok)
      await run(() => api.delete(`/admin/batches/${batch.id}`), { success: 'Batch deleted', onDone: () => navigate('/admin/batches') });
  };

  return (
    <AsyncContent state={state}>
      {(batch) => (
        <>
          <PageHeader
            back={{ to: '/admin/batches', label: 'All batches' }}
            title={batch.name}
            subtitle={
              <>
                {batch.code} · {dateRange(batch.startDate, batch.endDate)} <StatusBadge status={batch.isActive ? 'active' : 'inactive'} />
              </>
            }
            actions={
              <>
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant={batch.isActive ? 'secondary' : 'primary'}
                  icon={Power}
                  loading={busy === 'status'}
                  onClick={() => toggleStatus(batch)}
                >
                  {batch.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                {batch.studentCount === 0 && batch.batchAssignmentCount === 0 && (
                  <Button variant="ghost" icon={Trash2} onClick={() => remove(batch)}>
                    Delete
                  </Button>
                )}
              </>
            }
          />
          {batch.description && (
            <p className="muted" style={{ marginTop: -10, marginBottom: 20, maxWidth: 900 }}>
              {batch.description}
            </p>
          )}

          <div className="dash-grid dash-grid--stats6" style={{ marginBottom: 'var(--gutter)' }}>
            <StatCard icon={Users} tone="blue" label="Students" value={batch.studentCount} />
            <StatCard icon={GraduationCap} tone="amber" label="Courses" value={batch.courseCount} />
            <StatCard icon={Stethoscope} tone="purple" label="Professors" value={batch.professorCount} />
            <StatCard icon={ClipboardList} tone="orange" label="Batch assignments" value={batch.batchAssignmentCount} />
            <StatCard
              icon={MessageSquare}
              tone="rose"
              label="Awaiting review"
              value={batch.pendingReviews}
              to={`/admin/batches/${batch.id}?tab=submissions&status=pending`}
            />
            <StatCard
              icon={ChartColumn}
              tone="green"
              label="Average progress"
              value={`${batch.progress.averagePercent}%`}
              hint={`${batch.progress.completed} of ${batch.progress.enrolments} course enrolments completed`}
            />
          </div>

          <Tabs
            value={tab}
            onChange={(value) => setParams({ tab: value }, { replace: true })}
            tabs={[
              { value: 'students', label: 'Students', count: batch.studentCount },
              { value: 'materials', label: 'Courses & Materials', count: batch.courseCount },
              { value: 'professors', label: 'Professors', count: batch.professorCount },
              { value: 'assignments', label: 'Assignments' },
              { value: 'submissions', label: 'Submission tracking' },
            ]}
          />
          {tab === 'students' && <BatchStudentsTab batch={batch} onChange={state.reload} />}
          {tab === 'materials' && <BatchMaterialsTab batch={batch} onChange={state.reload} />}
          {tab === 'professors' && <BatchProfessorsTab batch={batch} onChange={state.reload} />}
          {tab === 'assignments' && <AssignmentsTab courses={batch.courses} batchId={batch.id} />}
          {tab === 'submissions' && <SubmissionsTab courses={batch.courses} batchId={batch.id} />}

          <BatchFormModal open={editing} batch={batch} onClose={() => setEditing(false)} onSaved={state.reload} />
        </>
      )}
    </AsyncContent>
  );
}
