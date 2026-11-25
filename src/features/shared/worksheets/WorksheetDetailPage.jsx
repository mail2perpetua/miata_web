import { useState } from 'react';
import { ClipboardPen, Download, Pencil, Trash2, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AsyncContent, Button, Card, DataTable, EmptyState, InfoList, PageHeader, PersonCell, StatusBadge } from '@/components';
import { AssignedTo } from '@/features/shared/AssignedTo';
import { useFetch } from '@/hooks/useFetch';
import { download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import { LogbookStatus } from './LogbookViews';
import { WorksheetFormModal } from './WorksheetFormModal';
import { useDeleteWorksheet } from './useDeleteWorksheet';
import { formatHours } from './worksheets';

/** Every student the worksheet is for (those the professor teaches), with their logbook's progress. */
function Roster({ base, worksheetId }) {
  const navigate = useNavigate();
  const state = useFetch(`${base}/worksheets/${worksheetId}/students`);
  return (
    <DataTable
      rows={state.data}
      loading={state.loading}
      rowKey="studentId"
      onRowClick={(r) => r.submissionId && navigate(`${base}/worksheets/submissions/${r.submissionId}`)}
      columns={[
        {
          key: 'student',
          header: 'Student',
          render: (r) => <PersonCell name={r.fullName} sub={r.batchName ? `${r.studentCode} · ${r.batchName}` : r.studentCode} />,
        },
        { key: 'entries', header: 'Entries', align: 'right', render: (r) => <span className="num">{r.entryCount}</span> },
        { key: 'scans', header: 'Scans', align: 'right', render: (r) => <span className="num">{r.totalScans}</span> },
        { key: 'hours', header: 'Hours', align: 'right', render: (r) => <span className="num">{formatHours(r.totalHours)}</span> },
        {
          key: 'submitted',
          header: 'Submitted',
          render: (r) => <span className="nowrap">{r.submittedAt ? formatDateTime(r.submittedAt) : '—'}</span>,
        },
        { key: 'status', header: 'Status', render: (r) => <LogbookStatus status={r.status} /> },
      ]}
      empty={
        <EmptyState
          icon={Users}
          title="No students yet"
          message="Students enrolled in the course (or the chosen batch) appear here once the worksheet applies to them."
        />
      }
    />
  );
}

/** A practical worksheet for professors and admins: its brief and every student's logbook progress. */
export default function WorksheetDetailPage({ base }) {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const state = useFetch(`${base}/worksheets/${worksheetId}`);
  const [editing, setEditing] = useState(false);
  const remove = useDeleteWorksheet(base);

  return (
    <AsyncContent state={state}>
      {(w) => (
        <>
          <PageHeader
            back={{ to: `${base}/worksheets`, label: 'Practical worksheets' }}
            title={w.title}
            subtitle={`${w.courseTitle}${w.moduleTitle ? ` · ${w.moduleTitle}` : ''}`}
            actions={
              w.canManage ? (
                <>
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(w, () => navigate(`${base}/worksheets`))}>
                    Delete
                  </Button>
                </>
              ) : (
                <StatusBadge status="draft" label="Course-wide work · you review it for your batch" />
              )
            }
          />
          <WorksheetFormModal base={base} open={editing} worksheet={w} onClose={() => setEditing(false)} onSaved={state.reload} />
          <div className="split">
            <Card title="Student logbooks" icon={Users} subtitle="Open a submitted logbook to verify entries and sign it off" flush>
              <Roster base={base} worksheetId={w.id} />
            </Card>
            <Card title="Worksheet details" icon={ClipboardPen}>
              <InfoList
                items={[
                  ['Assigned to', <AssignedTo key="to" assignment={w} />],
                  ...(w.recipientCount > 0 ? [['Selected students', w.recipients.map((r) => r.fullName).join(', ')]] : []),
                  ['Due', formatDateTime(w.dueAt)],
                  ['Created by', w.createdByName],
                  ['Submitted', `${w.submittedCount} of ${w.studentCount}${base === '/professor' ? ' of your students' : ''}`],
                  ['In progress', w.draftCount],
                  ['Awaiting review', w.pendingCount],
                  ['Rework', w.reworkCount],
                  ['Completed', w.completedCount],
                ]}
              />
              {w.templateName && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  style={{ marginTop: 16 }}
                  onClick={() => download(`${base}/worksheets/${w.id}/template`)}
                >
                  {w.templateName} ({formatBytes(w.templateSize)})
                </Button>
              )}
              <h3 style={{ fontSize: 'var(--fs-base)', margin: '18px 0 6px' }}>Instructions</h3>
              <p className="instructions">{w.instructions || <span className="muted">No instructions provided.</span>}</p>
              {!w.isPublished && (
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
