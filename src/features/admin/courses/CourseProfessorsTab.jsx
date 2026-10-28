import { useState } from 'react';
import { Stethoscope, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, PersonCell, StatusBadge, useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';
import { formatDate } from '@/utils/format';

export function CourseProfessorsTab({ course, professors, onChange }) {
  const [selected, setSelected] = useState('');
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const available = professors.filter((p) => p.isActive && !course.professors.some((x) => x.id === p.id));

  const assign = () =>
    run(() => api.post(`/admin/courses/${course.id}/professors`, { professorId: Number(selected) }), {
      success: 'Professor assigned to course',
      key: 'assign',
      onDone: () => {
        setSelected('');
        onChange();
      },
    });

  const unassign = async (p) => {
    if (
      await confirm({
        title: `Remove ${p.fullName} from this course?`,
        message: 'They will no longer see its students or review its assignments.',
        confirmLabel: 'Remove',
        danger: true,
      })
    ) {
      await run(() => api.delete(`/admin/courses/${course.id}/professors/${p.id}`), { success: 'Professor removed', onDone: onChange });
    }
  };

  return (
    <Card
      title="Course professors"
      subtitle="Course professors see every student and review every assignment of this course. Module-only professors are managed on the Modules tab."
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
        rows={course.professors}
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
          <EmptyState
            icon={Stethoscope}
            title="No professors assigned"
            message="Assign a professor so submissions for this course can be reviewed."
          />
        }
      />
    </Card>
  );
}
