import { useState } from 'react';
import { Download, FileText, MessageSquare, Send, TriangleAlert } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Alert, AsyncContent, Button, Card, FileDrop, InfoList, PageHeader, StatusBadge, TextArea, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api, download, toFormData, upload } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import { AttemptsList, CommentBox, ReviewFeed } from '@/features/shared/SubmissionThread';

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png';

function SubmitForm({ assignment, onSubmitted }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const resubmission = assignment.status === 'rework';

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const res = await upload(`/student/assignments/${assignment.id}/submissions`, toFormData({ notes }, { file }), {
        onProgress: setProgress,
      });
      toast.success(resubmission ? 'Revised work submitted' : 'Assignment submitted');
      setFile(null);
      setNotes('');
      onSubmitted(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Card title={resubmission ? 'Submit revised work' : 'Submit your work'} icon={Send} subtitle={assignment.reason ?? undefined}>
      <form onSubmit={submit} className="stack" style={{ gap: 14 }} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        {assignment.isOverdue && (
          <Alert tone="warning" icon={TriangleAlert}>
            The due date has passed. You can still submit; your professor will see it as late.
          </Alert>
        )}
        <FileDrop
          accept={ACCEPT}
          maxBytes={20 * 1024 * 1024}
          file={file}
          onChange={setFile}
          hint="PDF, Word, PowerPoint, Excel, ZIP, TXT or image · max 20 MB"
        />
        <TextArea
          label="Notes for your professor (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        {progress !== null && (
          <div className="upload-progress">
            <div className="progress" style={{ flex: 1 }}>
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="num">{progress}%</span>
          </div>
        )}
        <div className="form-actions">
          <Button type="submit" icon={Send} loading={progress !== null}>
            {resubmission ? 'Resubmit' : 'Submit assignment'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AssignmentPage() {
  const { assignmentId } = useParams();
  const state = useFetch(`/student/assignments/${assignmentId}`);

  return (
    <AsyncContent state={state}>
      {(a) => (
        <>
          <PageHeader
            back={{ to: '/student/assignments', label: 'All assignments' }}
            title={a.title}
            subtitle={
              <>
                {a.courseTitle}
                {a.moduleTitle ? ` · ${a.moduleTitle}` : ''} ·{' '}
                <StatusBadge status={a.status} label={a.status === 'pending' ? 'Not submitted' : undefined} />
              </>
            }
          />
          <div className="split">
            <div className="stack">
              {a.status === 'rework' && a.reviews[0] && (
                <Alert tone="warning" icon={TriangleAlert}>
                  <strong>Rework requested by {a.reviews[0].professorName}:</strong> {a.reviews[0].feedback}
                </Alert>
              )}
              {a.canSubmit ? (
                <SubmitForm assignment={a} onSubmitted={(updated) => state.setData(updated)} />
              ) : (
                a.reason && <Alert tone={a.status === 'completed' ? 'success' : 'info'}>{a.reason}</Alert>
              )}
              <Card title="Feedback & comments" icon={MessageSquare}>
                <ReviewFeed reviews={a.reviews} comments={a.comments} />
                {a.latestSubmissionId && (
                  <div style={{ marginTop: 18 }}>
                    <CommentBox
                      placeholder="Ask your professor a question about this submission…"
                      onSubmit={async (body) => {
                        const res = await api.post(`/student/submissions/${a.latestSubmissionId}/comments`, { body });
                        state.setData(res.data);
                      }}
                    />
                  </div>
                )}
              </Card>
              <Card title="My submissions" icon={FileText}>
                <AttemptsList attempts={a.attempts} fileUrl={(id) => `/student/submissions/${id}/file`} />
              </Card>
            </div>
            <Card title="Assignment brief">
              <InfoList
                items={[
                  [
                    'Assigned to',
                    a.batchId
                      ? a.forSelectedStudents
                        ? `You (selected from ${a.batchName})`
                        : `Your batch: ${a.batchName}`
                      : 'All students of the course',
                  ],
                  ['Due', a.dueAt ? formatDateTime(a.dueAt) : 'No due date'],
                  ['Required', a.isRequired ? 'Yes — needed to complete the course' : 'Optional'],
                  ['Attempts', a.attempts.length],
                ]}
              />
              {a.hasAttachment && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  style={{ marginTop: 14 }}
                  onClick={() => download(`/student/assignments/${a.id}/attachment`)}
                >
                  {a.attachmentName} ({formatBytes(a.attachmentSize)})
                </Button>
              )}
              <h3 style={{ fontSize: 'var(--fs-base)', margin: '18px 0 6px' }}>Instructions</h3>
              <p className="instructions">{a.instructions || <span className="muted">No additional instructions.</span>}</p>
            </Card>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
