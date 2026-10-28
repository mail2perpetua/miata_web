import { useEffect, useRef, useState } from 'react';
import { CircleCheck, FileText, MessageSquare, RefreshCw, UserRound } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Alert, AsyncContent, Button, Card, InfoList, PageHeader, StatusBadge, TextArea, useConfirm, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import { AttemptsList, CommentBox, ResubmitHint, ReviewFeed } from '@/features/shared/SubmissionThread';

function DecisionPanel({ submission, onReviewed }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const decide = async (decision) => {
    if (decision === 'rework' && !feedback.trim()) {
      setError('Explain what the student needs to rework.');
      return;
    }
    const ok = await confirm({
      title: decision === 'completed' ? 'Mark as Completed?' : 'Request rework?',
      message:
        decision === 'completed'
          ? 'The student is notified and this attempt is closed. If this was their last requirement, the course is completed automatically.'
          : 'The student is notified and can upload a revised file as a new attempt.',
      confirmLabel: decision === 'completed' ? 'Mark Completed' : 'Request Rework',
    });
    if (!ok) return;
    setBusy(decision);
    setError(null);
    try {
      const res = await api.post(`/professor/submissions/${submission.id}/review`, { decision, feedback: feedback.trim() || undefined });
      toast.success(decision === 'completed' ? 'Marked as Completed' : 'Rework requested');
      if (res.data.courseCompleted) toast.info(`${submission.studentName} has now completed the course.`);
      setFeedback('');
      onReviewed(res.data.submission);
    } catch (err) {
      setError(err.details?.feedback || err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title="Review decision"
      icon={CircleCheck}
      subtitle={`Attempt ${submission.attemptNo} · submitted ${formatDateTime(submission.submittedAt)}`}
    >
      <div className="stack" style={{ gap: 12 }}>
        {error && <Alert tone="error">{error}</Alert>}
        <TextArea
          label="Feedback for the student"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          hint="Required when requesting rework; optional when completing."
          maxLength={5000}
        />
        <div className="row row--wrap" style={{ justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={busy === 'rework'}
            disabled={Boolean(busy)}
            onClick={() => decide('rework')}
          >
            Request Rework
          </Button>
          <Button icon={CircleCheck} loading={busy === 'completed'} disabled={Boolean(busy)} onClick={() => decide('completed')}>
            Mark Completed
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ReviewPage() {
  const { submissionId } = useParams();
  const state = useFetch(`/professor/submissions/${submissionId}`);
  const started = useRef(false);

  // Opening a new submission moves it to "In Review" so the student can see it is being looked at.
  const { data, setData } = state;
  useEffect(() => {
    if (data?.status === 'submitted' && !started.current) {
      started.current = true;
      api
        .post(`/professor/submissions/${submissionId}/start-review`)
        .then((res) => setData(res.data))
        .catch(() => {});
    }
  }, [data?.status, submissionId, setData]);

  return (
    <AsyncContent state={state}>
      {(s) => {
        const isLatest = s.attempts[0]?.id === s.id;
        const open = isLatest && (s.status === 'submitted' || s.status === 'in_review');
        return (
          <>
            <PageHeader
              back={{ to: '/professor/reviews', label: 'Review queue' }}
              title={s.assignmentTitle}
              subtitle={
                <>
                  {s.studentName} · {s.studentCode} · Attempt {s.attemptNo} · <StatusBadge status={s.status} />
                </>
              }
            />
            <div className="split">
              <div className="stack">
                {open && <DecisionPanel submission={s} onReviewed={setData} />}
                {!isLatest && <Alert tone="info">A newer attempt exists. Open the latest attempt from the list below to review it.</Alert>}
                {s.status === 'rework' && isLatest && (
                  <Card>
                    <ResubmitHint />
                  </Card>
                )}
                <Card title="Reviews & comments" icon={MessageSquare}>
                  <ReviewFeed reviews={s.reviews} comments={s.comments} />
                  <div style={{ marginTop: 18 }}>
                    <CommentBox
                      placeholder="Ask a question or give interim feedback…"
                      onSubmit={async (body) => {
                        const res = await api.post(`/professor/submissions/${s.id}/comments`, { body });
                        setData(res.data);
                      }}
                    />
                  </div>
                </Card>
              </div>
              <div className="stack">
                <Card title="Submitted files" icon={FileText}>
                  <AttemptsList attempts={s.attempts} fileUrl={(id) => `/professor/submissions/${id}/file`} />
                </Card>
                <Card title="Student & assignment" icon={UserRound}>
                  <InfoList
                    items={[
                      ['Student', s.studentName],
                      ['Student ID', s.studentCode],
                      ['Batch', s.batchName ?? 'Not in a batch'],
                      ['Course', s.courseTitle],
                      ['Module', s.moduleTitle],
                      ['Due', formatDateTime(s.dueAt)],
                      ['Student notes', s.notes],
                    ]}
                  />
                  {s.instructions && (
                    <>
                      <h3 style={{ fontSize: 'var(--fs-base)', margin: '16px 0 6px' }}>Instructions</h3>
                      <p className="instructions muted">{s.instructions}</p>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </AsyncContent>
  );
}
