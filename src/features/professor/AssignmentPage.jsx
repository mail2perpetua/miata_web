import { useState } from 'react';
import { Download, FileText, Pencil, Trash2, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AsyncContent, Button, Card, InfoList, PageHeader, StatusBadge } from '@/components';
import { AssignedTo } from '@/features/shared/AssignedTo';
import { useFetch } from '@/hooks/useFetch';
import { download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import { AssignmentFormModal } from './AssignmentFormModal';
import { SubmissionsTable } from './SubmissionsTable';
import { useDeleteAssignment } from './useDeleteAssignment';

export default function AssignmentPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const state = useFetch(`/professor/assignments/${assignmentId}`);
  const [query, setQuery] = useState({ assignmentId, page: 1, pageSize: 10, sort: 'submitted_at', order: 'desc', latestOnly: true });
  const [editing, setEditing] = useState(false);
  const remove = useDeleteAssignment();

  return (
    <AsyncContent state={state}>
      {(a) => (
        <>
          <PageHeader
            back={{ to: '/professor/assignments', label: 'Assignments' }}
            title={a.title}
            subtitle={`${a.courseTitle}${a.moduleTitle ? ` · ${a.moduleTitle}` : ''}`}
            actions={
              a.canManage ? (
                <>
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(a, () => navigate('/professor/assignments'))}>
                    Delete
                  </Button>
                </>
              ) : (
                <StatusBadge status="draft" label="Course-wide work · you review it for your batch" />
              )
            }
          />
          <AssignmentFormModal open={editing} assignment={a} onClose={() => setEditing(false)} onSaved={state.reload} />
          <div className="split">
            <Card title="Submissions" icon={Users} subtitle="Latest attempt per student" flush>
              <div className="toolbar">
                <select
                  className="select select--inline"
                  value={query.status ?? ''}
                  onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}
                  aria-label="Status"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Awaiting review</option>
                  <option value="rework">Rework required</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <SubmissionsTable
                query={query}
                onSort={(sort) => setQuery((q) => ({ ...q, sort, order: q.sort === sort && q.order === 'desc' ? 'asc' : 'desc' }))}
                onPage={(page) => setQuery((q) => ({ ...q, page }))}
                emptyTitle="No submissions yet"
              />
            </Card>
            <Card title="Assignment details" icon={FileText}>
              <InfoList
                items={[
                  ['Assigned to', <AssignedTo key="to" assignment={a} />],
                  ...(a.recipientCount > 0 ? [['Selected students', a.recipients.map((r) => r.fullName).join(', ')]] : []),
                  ['Due', formatDateTime(a.dueAt)],
                  ['Required', a.isRequired ? 'Yes — counts towards completion' : 'Optional'],
                  ['Created by', a.createdByName],
                  ['Submitted', `${a.submittedCount} of ${a.studentCount} of your students`],
                  ['Awaiting review', a.pendingCount],
                  ['Rework', a.reworkCount],
                  ['Completed', a.completedCount],
                ]}
              />
              {a.attachmentName && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  style={{ marginTop: 16 }}
                  onClick={() => download(`/professor/assignments/${a.id}/attachment`)}
                >
                  {a.attachmentName} ({formatBytes(a.attachmentSize)})
                </Button>
              )}
              <h3 style={{ fontSize: 'var(--fs-base)', margin: '18px 0 6px' }}>Instructions</h3>
              <p className="instructions">{a.instructions || <span className="muted">No instructions provided.</span>}</p>
              {!a.isPublished && (
                <p style={{ marginTop: 10 }}>
                  <StatusBadge status="draft" label="Draft — not assigned to students yet" />
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
