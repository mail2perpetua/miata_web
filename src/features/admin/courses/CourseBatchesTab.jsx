import { Layers, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, StatusBadge } from '@/components';
import { dateRange } from '@/utils/format';

/** Batches taking this course. Batches (and their students and professors) are managed on the batch pages. */
export function CourseBatchesTab({ course }) {
  const navigate = useNavigate();
  return (
    <Card
      title="Batches taking this course"
      subtitle="Each batch's students are enrolled in the course and taught by the batch's professors. Students who are not in a batch stay with the course professors."
      action={
        <Button size="sm" icon={Plus} to="/admin/batches?new=1">
          New batch
        </Button>
      }
      flush
    >
      <DataTable
        rows={course.batches}
        onRowClick={(b) => navigate(`/admin/batches/${b.id}`)}
        columns={[
          {
            key: 'name',
            header: 'Batch',
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
          { key: 'professors', header: 'Batch professors', render: (b) => b.professorNames || <span className="muted">Not assigned</span> },
          { key: 'students', header: 'Students', align: 'right', render: (b) => <span className="num">{b.studentCount}</span> },
          { key: 'schedule', header: 'Schedule', render: (b) => <span className="nowrap">{dateRange(b.startDate, b.endDate)}</span> },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.isActive ? 'active' : 'inactive'} /> },
        ]}
        empty={
          <EmptyState
            icon={Layers}
            title="No batch takes this course"
            message="Add the course to a batch from the batch's Courses & Materials tab."
          />
        }
      />
    </Card>
  );
}
