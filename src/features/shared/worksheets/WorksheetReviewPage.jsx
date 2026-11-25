import { useEffect, useRef, useState } from 'react';
import {
  ChartColumn,
  CircleCheck,
  ClipboardList,
  ClipboardPen,
  Download,
  FileText,
  MessageSquare,
  RefreshCw,
  Signature,
  UserRound,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  Button,
  Card,
  FormModal,
  InfoList,
  PageHeader,
  TextArea,
  TextField,
  useConfirm,
  useToast,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api, download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import { LogbookDetails, LogbookStatus, ReviewHistory, ScanLogTable, SignOff, SpecialtySummary } from './LogbookViews';
import { formatHours } from './worksheets';

/**
 * Decide on a logbook under review — sign it off as Completed (verifies every entry) or request rework — or, once
 * signed off, reopen it for rework. Feedback is required for rework.
 */
function DecisionPanel({ base, submission: s, onReviewed }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [feedback, setFeedback] = useState('');
  const [designation, setDesignation] = useState(s.supervisorDesignation ?? '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const reopen = s.canReopen;
  const unverified = s.summary.totals.entries - s.summary.totals.verifiedEntries;

  const decide = async (decision) => {
    if (decision === 'rework' && !feedback.trim()) {
      setError(reopen ? 'Explain why the logbook is being reopened.' : 'Explain what the student needs to rework.');
      return;
    }
    const ok = await confirm(
      decision === 'completed'
        ? {
            title: 'Sign off as Completed?',
            message: `${unverified > 0 ? `The ${unverified} unverified ${unverified === 1 ? 'entry is' : 'entries are'} verified with your signature, and t` : 'T'}he logbook is closed. The student is notified.`,
            confirmLabel: 'Sign off',
          }
        : {
            title: reopen ? 'Reopen this logbook?' : 'Request rework?',
            message:
              'The student is notified and can update the logbook and submit it again. Verified entries stay verified unless changed.',
            confirmLabel: reopen ? 'Reopen for rework' : 'Request Rework',
          },
    );
    if (!ok) return;
    setBusy(decision);
    setError(null);
    try {
      const res = await api.post(`${base}/worksheet-submissions/${s.id}/review`, {
        decision,
        feedback: feedback.trim() || undefined,
        designation: decision === 'completed' ? designation.trim() || undefined : undefined,
      });
      toast.success(
        decision === 'completed' ? 'Logbook signed off as Completed' : reopen ? 'Logbook reopened for rework' : 'Rework requested',
      );
      setFeedback('');
      onReviewed(res.data);
    } catch (err) {
      setError(err.details?.feedback || err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title={reopen ? 'Reopen logbook' : 'Review decision'}
      icon={reopen ? RefreshCw : CircleCheck}
      subtitle={
        reopen
          ? 'Signed off. Reopen it if the student needs to correct or add entries.'
          : `Submitted ${formatDateTime(s.submittedAt)}${s.submitCount > 1 ? ` · submission ${s.submitCount}` : ''}`
      }
    >
      <div className="stack" style={{ gap: 12 }}>
        {error && <Alert tone="error">{error}</Alert>}
        <TextArea
          label={reopen ? 'Reason for reopening' : 'Overall supervisor comments'}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          hint={reopen ? 'Required. The student sees it.' : 'Required when requesting rework; optional when signing off.'}
          maxLength={5000}
        />
        {!reopen && (
          <TextField
            label="Professional registration / designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            hint="Shown on the sign-off, e.g. Senior Sonographer, AHPRA reg. no."
            maxLength={200}
          />
        )}
        <div className="row row--wrap" style={{ justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={busy === 'rework'}
            disabled={Boolean(busy)}
            onClick={() => decide('rework')}
          >
            {reopen ? 'Reopen for rework' : 'Request Rework'}
          </Button>
          {!reopen && (
            <Button icon={Signature} loading={busy === 'completed'} disabled={Boolean(busy)} onClick={() => decide('completed')}>
              Sign off as Completed
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Per-entry review actions: verify (sign) or un-verify, and leave feedback on the entry. */
function EntryActions({ base, submissionId, entry, onChanged }) {
  const { run, busy } = useApiAction();
  const [editing, setEditing] = useState(false);
  const annotate = (body, success) =>
    run(() => api.put(`${base}/worksheet-submissions/${submissionId}/entries/${entry.id}`, body), {
      success,
      onDone: (res) => res && onChanged(res.data),
    });
  return (
    <span className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
      <Button
        variant={entry.verifiedAt ? 'ghost' : 'secondary'}
        size="sm"
        icon={entry.verifiedAt ? RefreshCw : CircleCheck}
        loading={Boolean(busy)}
        onClick={() => annotate({ verified: !entry.verifiedAt }, entry.verifiedAt ? 'Verification removed' : 'Entry verified')}
      >
        {entry.verifiedAt ? 'Unverify' : 'Verify'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={MessageSquare}
        tooltip={entry.supervisorFeedback ? 'Edit feedback' : 'Add feedback'}
        aria-label="Feedback on this entry"
        onClick={() => setEditing(true)}
      />
      <FormModal
        open={editing}
        title="Feedback on this entry"
        submitLabel="Save feedback"
        size="md"
        fields={[
          { name: 'feedback', label: 'Supervisor comments / feedback', type: 'textarea', span: true, rows: 4 },
          { name: 'verified', label: 'Verified — sign this entry', type: 'checkbox' },
        ]}
        initialValues={{ feedback: entry.supervisorFeedback ?? '', verified: Boolean(entry.verifiedAt) }}
        validate={(values) => ({ feedback: values.feedback.length > 2000 ? 'At most 2000 characters' : null })}
        onSubmit={async (values) => {
          const res = await api.put(`${base}/worksheet-submissions/${submissionId}/entries/${entry.id}`, {
            feedback: values.feedback.trim() || null,
            verified: values.verified,
          });
          return res.data;
        }}
        onSuccess={onChanged}
        onClose={() => setEditing(false)}
      />
    </span>
  );
}

/** Review a student's logbook (professors in scope, admins): verify entries, leave feedback, sign off or request rework. */
export default function WorksheetReviewPage({ base }) {
  const { submissionId } = useParams();
  const state = useFetch(`${base}/worksheet-submissions/${submissionId}`);
  const started = useRef(false);
  const { data, setData } = state;

  // A professor opening a submitted logbook moves it to "In Review", so the student can see it is being looked at.
  useEffect(() => {
    if (base === '/professor' && data?.status === 'submitted' && !started.current) {
      started.current = true;
      api
        .post(`/professor/worksheet-submissions/${submissionId}/start-review`)
        .then((res) => setData(res.data))
        .catch(() => {});
    }
  }, [base, data?.status, submissionId, setData]);

  return (
    <AsyncContent state={state}>
      {(s) => {
        const { totals } = s.summary;
        return (
          <>
            <PageHeader
              back={{ to: `${base}/worksheets?tab=logbooks`, label: 'Student logbooks' }}
              title={s.worksheetTitle}
              subtitle={
                <>
                  {s.studentName} · {s.studentCode} · <LogbookStatus status={s.status} />
                </>
              }
            />
            <div className="split">
              <div className="stack">
                {(s.canReview || s.canReopen) && <DecisionPanel key={s.status} base={base} submission={s} onReviewed={setData} />}
                {s.status === 'draft' && (
                  <Alert tone="info">The student is still filling in this logbook. You can review it once they submit it.</Alert>
                )}
                {s.status === 'rework' && (
                  <Alert tone="info">Rework requested. The student is updating the logbook and will submit it again.</Alert>
                )}
                <Card
                  title="Clinical Scan Log"
                  icon={ClipboardList}
                  subtitle={`${totals.entries} ${totals.entries === 1 ? 'entry' : 'entries'} · ${totals.scans} scans · ${formatHours(totals.hours)} hours · ${totals.verifiedEntries} verified`}
                  flush
                >
                  <ScanLogTable
                    entries={s.entries}
                    actions={
                      s.canReview ? (e) => <EntryActions base={base} submissionId={s.id} entry={e} onChanged={setData} /> : undefined
                    }
                  />
                </Card>
                <Card title="Specialty Summary" icon={ChartColumn} flush>
                  <SpecialtySummary summary={s.summary} />
                </Card>
                <Card title="Review history" icon={MessageSquare}>
                  <ReviewHistory reviews={s.reviews} />
                </Card>
              </div>
              <div className="stack">
                <Card title="Supervisor review & sign-off" icon={Signature}>
                  <SignOff submission={s} />
                </Card>
                <Card title="Logbook details" icon={UserRound}>
                  <LogbookDetails
                    studentName={s.studentName}
                    studentCode={s.studentCode}
                    programme={s.courseTitle}
                    cohort={s.batchName}
                    details={s}
                  />
                </Card>
                <Card title="Completed worksheet file" icon={FileText}>
                  {s.hasFile ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => download(`${base}/worksheet-submissions/${s.id}/file`)}
                    >
                      {s.fileName} ({formatBytes(s.fileSize)})
                    </Button>
                  ) : (
                    <p className="muted" style={{ margin: 0 }}>
                      No file attached — the logbook was completed online.
                    </p>
                  )}
                  {s.notes && (
                    <>
                      <h3 style={{ fontSize: 'var(--fs-base)', margin: '16px 0 6px' }}>Student notes</h3>
                      <p className="instructions muted">{s.notes}</p>
                    </>
                  )}
                </Card>
                <Card title="Worksheet" icon={ClipboardPen}>
                  <InfoList
                    items={[
                      ['Course', s.courseTitle],
                      ['Module', s.moduleTitle],
                      ['Batch', s.batchName ?? 'Not in a batch'],
                      ['Due', formatDateTime(s.dueAt)],
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
