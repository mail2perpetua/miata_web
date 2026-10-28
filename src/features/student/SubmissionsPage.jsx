import { Download, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AsyncContent, Button, Card, DataTable, EmptyState, PageHeader, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';

/** "Submission": every file the student has submitted, with review status and latest feedback. */
export default function SubmissionsPage() {
  const state = useFetch('/student/submissions');
  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Your submission history — every attempt, its review status and your professor's feedback."
      />
      <Card flush>
        <AsyncContent state={state}>
          {(rows) => (
            <DataTable
              rows={rows}
              columns={[
                {
                  key: 'assignment',
                  header: 'Assignment',
                  render: (s) => (
                    <span>
                      <Link to={`/student/assignments/${s.assignmentId}`} className="cell-person__name">
                        {s.assignmentTitle}
                      </Link>
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
                  render: (s) => (
                    <span className="nowrap">
                      {formatDateTime(s.submittedAt)}
                      {s.dueAt && new Date(s.submittedAt) > new Date(s.dueAt) && (
                        <span className="badge badge--red" style={{ marginLeft: 6 }}>
                          Late
                        </span>
                      )}
                    </span>
                  ),
                },
                { key: 'status', header: 'Review status', render: (s) => <StatusBadge status={s.status} /> },
                {
                  key: 'feedback',
                  header: 'Professor comments',
                  render: (s) =>
                    s.latestFeedback ? (
                      <span style={{ display: 'block', maxWidth: 320 }}>
                        “{s.latestFeedback}” <span className="muted">— {s.reviewerName}</span>
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    ),
                },
                {
                  key: 'file',
                  header: 'File',
                  align: 'right',
                  render: (s) => (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => download(`/student/submissions/${s.id}/file`)}
                      title={`${s.fileName} (${formatBytes(s.fileSize)})`}
                    >
                      Download
                    </Button>
                  ),
                },
              ]}
              empty={
                <EmptyState
                  icon={Send}
                  title="No submissions yet"
                  message="Submit an assignment from the Assignments page."
                  action={<Button to="/student/assignments">Go to assignments</Button>}
                />
              }
            />
          )}
        </AsyncContent>
      </Card>
    </>
  );
}
