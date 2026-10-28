import { FileText, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AsyncContent, Card, InfoList, PageHeader, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDateTime } from '@/utils/format';
import { AttemptsList, ReviewFeed } from '@/features/shared/SubmissionThread';

/** Read-only oversight of a submission for admins (reviews are done by professors). */
export default function SubmissionPage() {
  const { submissionId } = useParams();
  const state = useFetch(`/admin/submissions/${submissionId}`);
  return (
    <AsyncContent state={state}>
      {(s) => (
        <>
          <PageHeader
            back={{ to: '/admin/assignments?tab=submissions', label: 'Submission tracking' }}
            title={s.assignmentTitle}
            subtitle={
              <>
                <Link to={`/admin/students/${s.studentId}`}>{s.studentName}</Link> · {s.studentCode} · <StatusBadge status={s.status} />
              </>
            }
          />
          <div className="split">
            <div className="stack">
              <Card title="Attempts" icon={FileText}>
                <AttemptsList attempts={s.attempts} fileUrl={(id) => `/admin/submissions/${id}/file`} />
              </Card>
              <Card title="Reviews & comments" icon={MessageSquare}>
                <ReviewFeed reviews={s.reviews} comments={s.comments} />
              </Card>
            </div>
            <Card title="Details">
              <InfoList
                items={[
                  [
                    'Batch',
                    s.batchId ? (
                      <Link key="b" to={`/admin/batches/${s.batchId}`}>
                        {s.batchName}
                      </Link>
                    ) : (
                      'Not in a batch'
                    ),
                  ],
                  ['Course', s.courseTitle],
                  ['Module', s.moduleTitle],
                  ['Due', formatDateTime(s.dueAt)],
                  ['Latest attempt', s.attemptNo],
                  ['Submitted', formatDateTime(s.submittedAt)],
                  ['Reviewed', s.reviewedAt ? `${formatDateTime(s.reviewedAt)} by ${s.reviewerName}` : 'Not yet'],
                ]}
              />
              {s.instructions && (
                <>
                  <h3 style={{ fontSize: 'var(--fs-base)', margin: '18px 0 6px' }}>Instructions</h3>
                  <p className="instructions muted">{s.instructions}</p>
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
