import { useState } from 'react';
import { Check, Download, ExternalLink, FileText, Pencil, UserRound, X } from 'lucide-react';
import {
  Alert,
  Button,
  ErrorState,
  InfoList,
  Modal,
  PageLoader,
  SelectField,
  StatusBadge,
  TextArea,
  TextField,
  useToast,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api, download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import { CourseChecklist } from '../../shared/PersonFormModal';
import { groupDocuments } from './applications';

/**
 * Review one online application: the applicant's details, documents and statement of purpose. Approve adds the
 * applicant to the student list (or links the student who already uses the e-mail address); Reject records the decision.
 * Approve and Reject are steps of this dialog, so no second dialog opens on top of it.
 */
export function ApplicationReviewModal({ applicationId, onClose, onChange, onEdit }) {
  const path = `/admin/applications/${applicationId}`;
  const state = useFetch(path);
  const [step, setStep] = useState('review');
  const a = state.data;

  if (!a) {
    return (
      <Modal open title="Online application" onClose={onClose} size="lg">
        {state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : <PageLoader />}
      </Modal>
    );
  }
  const done = (res) => {
    state.setData(res.data);
    setStep('review');
    onChange?.();
  };
  const props = { a, path, onBack: () => setStep('review'), onDone: done };
  if (step === 'approve') return <ApproveStep {...props} onClose={onClose} />;
  if (step === 'reject') return <RejectStep {...props} onClose={onClose} />;
  return (
    <ReviewStep
      a={a}
      path={path}
      onClose={onClose}
      onEdit={onEdit}
      onApprove={() => setStep('approve')}
      onReject={() => setStep('reject')}
    />
  );
}

// ─── Review ─────────────────────────────────────────────────────────────

function ReviewStep({ a, path, onClose, onEdit, onApprove, onReject }) {
  const toast = useToast();
  const { run, busy } = useApiAction();
  const blockedAccount = a.existingAccount && a.existingAccount.role !== 'student';

  /** Open a document in a new tab (the window opens first, so pop-up blockers allow it). */
  const view = async (doc) => {
    const win = window.open('', '_blank');
    try {
      const res = await api.raw(`${path}/documents/${doc.id}`);
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
      else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      win?.close();
      toast.error(err.message || 'The document could not be opened');
    }
  };

  const footer =
    a.status === 'approved' ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {a.studentId && (
          <Button icon={UserRound} to={`/admin/students/${a.studentId}`}>
            View student
          </Button>
        )}
      </>
    ) : (
      <>
        <Button variant="ghost" icon={Pencil} onClick={() => onEdit(a.id)} style={{ marginRight: 'auto' }}>
          Edit details
        </Button>
        {a.status === 'pending' && (
          <Button variant="danger" icon={X} onClick={onReject}>
            Reject
          </Button>
        )}
        <Button icon={Check} onClick={onApprove} disabled={Boolean(blockedAccount)}>
          Approve
        </Button>
      </>
    );

  return (
    <Modal open title={`Application from ${a.fullName}`} onClose={onClose} size="xl" footer={footer}>
      <div className="application-review">
        <div className="row row--wrap">
          <StatusBadge status={a.status} label={a.status === 'pending' ? 'Pending review' : undefined} />
          <strong className="application-review__ref">{a.referenceNumber}</strong>
          <span className="muted">Submitted {formatDateTime(a.createdAt)} through the website&apos;s Apply Now form</span>
        </div>

        {a.status === 'approved' && (
          <Alert tone="success">
            Approved {a.reviewedByName ? `by ${a.reviewedByName} ` : ''}on {formatDateTime(a.reviewedAt)} — {a.studentName ?? a.fullName} is
            on the student list{a.studentCode ? ` (${a.studentCode})` : ''}.{a.reviewNote ? ` Note: ${a.reviewNote}` : ''}
          </Alert>
        )}
        {a.status === 'rejected' && (
          <Alert tone="error">
            Rejected {a.reviewedByName ? `by ${a.reviewedByName} ` : ''}on {formatDateTime(a.reviewedAt)}.
            {a.reviewNote ? ` Reason: ${a.reviewNote}` : ''} You can still approve it if the decision changes.
          </Alert>
        )}
        {a.existingAccount?.role === 'student' && (
          <Alert tone="info">
            {a.existingAccount.fullName} ({a.existingAccount.studentCode}) already has a student account with this e-mail address. Approving
            links this application to that student instead of creating a new account.
          </Alert>
        )}
        {blockedAccount && (
          <Alert tone="warning">
            {a.email} is already used by a {a.existingAccount.role} account ({a.existingAccount.fullName}), so it cannot become a student
            account. Edit the e-mail address or reject the application.
          </Alert>
        )}

        <div className="application-review__grid">
          <section>
            <h3 className="application-review__heading">Applicant</h3>
            <InfoList
              items={[
                ['Full name', a.fullName],
                [
                  'Email',
                  <a key="e" href={`mailto:${a.email}`}>
                    {a.email}
                  </a>,
                ],
                [
                  'Phone',
                  <a key="p" href={`tel:${a.phone}`}>
                    {a.phone}
                  </a>,
                ],
                ['Country', a.country],
                ['Mode of study', a.studyModeLabel],
                [
                  'Agent',
                  a.agentName || a.agentContact ? (
                    <span key="ag">
                      {[a.agentName, a.agentContact].filter(Boolean).join(' · ')}
                      {a.matchedAgent && <span className="badge badge--purple application-review__tag">MIATA agent</span>}
                    </span>
                  ) : (
                    'Applied directly'
                  ),
                ],
              ]}
            />
          </section>
          <section>
            <h3 className="application-review__heading">Documents ({a.documents.length})</h3>
            <div className="application-docs">
              {!a.documents.length && <p className="muted">No documents uploaded</p>}
              {groupDocuments(a.documents).map(([label, docs]) => (
                <div key={label} className="application-docs__group">
                  <div className="application-docs__label">{label}</div>
                  {docs.map((doc) => (
                    <div key={doc.id} className="application-docs__file">
                      <FileText aria-hidden="true" />
                      <span className="application-docs__name" title={doc.originalName}>
                        {doc.originalName}
                      </span>
                      <span className="muted application-docs__size">{formatBytes(doc.sizeBytes)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ExternalLink}
                        tooltip="Open"
                        aria-label={`Open ${doc.originalName}`}
                        onClick={() => view(doc)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        tooltip="Download"
                        aria-label={`Download ${doc.originalName}`}
                        loading={busy === doc.id}
                        onClick={() =>
                          run(() => download(`${path}/documents/${doc.id}`, { download: 1 }, doc.originalName), { key: doc.id })
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section>
          <h3 className="application-review__heading">Statement of purpose</h3>
          {a.statement ? <p className="application-review__statement">{a.statement}</p> : <p className="muted">Not provided</p>}
        </section>
      </div>
    </Modal>
  );
}

// ─── Approve ────────────────────────────────────────────────────────────

function ApproveStep({ a, path, onBack, onDone, onClose }) {
  const toast = useToast();
  const linking = a.existingAccount?.role === 'student';
  const courses = useFetch(linking ? null : '/admin/lookups/courses');
  const batches = useFetch(linking ? null : '/admin/lookups/batches');
  const agents = useFetch(linking ? null : '/admin/lookups/agents');
  const [values, setValues] = useState({
    courseIds: [],
    batchId: '',
    agentId: a.matchedAgent ? String(a.matchedAgent.id) : '',
    temporaryPassword: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (name) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const approve = async (event) => {
    event.preventDefault();
    if (!linking && !a.emailConfigured && !values.temporaryPassword) {
      setErrors({ temporaryPassword: 'E-mail is not set up on the server, so a temporary password is required' });
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.post(`${path}/approve`, {
        courseIds: values.courseIds,
        batchId: values.batchId || null,
        agentId: values.agentId || null,
        temporaryPassword: values.temporaryPassword || undefined,
        note: values.note.trim() || null,
      });
      const { welcomeEmail, linkedExistingStudent } = res.data;
      if (linkedExistingStudent) toast.success(`Application approved and linked to ${a.existingAccount.fullName}'s student account`);
      else if (welcomeEmail?.status === 'sent')
        toast.success(`${a.fullName} added to the student list. Welcome e-mail sent to ${welcomeEmail.recipient}.`);
      else if (welcomeEmail?.status === 'failed') {
        toast.error(
          `${a.fullName} added to the student list, but the welcome e-mail failed (${welcomeEmail.error}). Resend it from their page.`,
        );
      } else toast.info(`${a.fullName} added to the student list. Give them the temporary password in person.`);
      onDone(res);
    } catch (err) {
      setErrors(err.details && typeof err.details === 'object' ? err.details : {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" form="approve-application" icon={Check} loading={saving}>
        {linking ? 'Approve and link' : 'Approve and add student'}
      </Button>
    </>
  );

  return (
    <Modal open title={`Approve ${a.fullName}`} onClose={onClose} size="lg" footer={footer}>
      <form id="approve-application" className="stack" style={{ gap: 16 }} onSubmit={approve} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        {linking ? (
          <Alert tone="info">
            {a.existingAccount.fullName} ({a.existingAccount.studentCode}) already has a student account with {a.email}. The application is
            linked to it; no new account is created.
          </Alert>
        ) : (
          <Alert tone="info">
            {a.fullName} is added to the student list ({a.email}, {a.country}).{' '}
            {a.emailConfigured
              ? 'They receive a welcome e-mail with a link to set their password.'
              : 'E-mail is not set up on the server, so set a temporary password to give them in person.'}
          </Alert>
        )}
        {!linking && (
          <>
            {courses.data && (
              <CourseChecklist
                courses={courses.data}
                value={values.courseIds}
                onChange={set('courseIds')}
                label="Enrol in courses (optional)"
              />
            )}
            <div className="form-grid">
              <SelectField
                label="Batch (optional)"
                placeholder="No batch yet"
                options={(batches.data ?? []).map((b) => ({ value: String(b.id), label: b.name }))}
                value={values.batchId}
                onChange={set('batchId')}
                error={errors.batchId}
              />
              <SelectField
                label="Referred by agent"
                placeholder="No agent"
                options={(agents.data ?? []).map((ag) => ({ value: String(ag.id), label: ag.fullName }))}
                value={values.agentId}
                onChange={set('agentId')}
                error={errors.agentId}
                hint={
                  a.matchedAgent
                    ? `Matched from the form: ${a.agentName || a.agentContact}`
                    : a.agentName || a.agentContact
                      ? `The form names "${[a.agentName, a.agentContact].filter(Boolean).join(' · ')}", which is not a MIATA agent account`
                      : undefined
                }
              />
              <TextField
                className="span-2"
                label={a.emailConfigured ? 'Temporary password (optional)' : 'Temporary password'}
                type="password"
                required={!a.emailConfigured}
                value={values.temporaryPassword}
                onChange={set('temporaryPassword')}
                error={errors.temporaryPassword}
                hint="Only if you will hand it over in person. It is never e-mailed."
                autoComplete="new-password"
              />
            </div>
          </>
        )}
        <TextArea
          label="Note (optional)"
          rows={2}
          value={values.note}
          onChange={set('note')}
          placeholder="e.g. Documents verified"
          maxLength={1000}
        />
      </form>
    </Modal>
  );
}

// ─── Reject ─────────────────────────────────────────────────────────────

function RejectStep({ a, path, onBack, onDone, onClose }) {
  const { run, busy } = useApiAction();
  const [note, setNote] = useState('');
  const reject = (event) => {
    event.preventDefault();
    run(() => api.post(`${path}/reject`, { note: note.trim() || null }), { success: 'Application rejected', key: 'reject', onDone });
  };
  const footer = (
    <>
      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" form="reject-application" variant="danger" icon={X} loading={busy === 'reject'}>
        Reject application
      </Button>
    </>
  );
  return (
    <Modal open title={`Reject the application from ${a.fullName}?`} onClose={onClose} size="md" footer={footer}>
      <form id="reject-application" className="stack" style={{ gap: 12 }} onSubmit={reject} noValidate>
        <p style={{ lineHeight: 1.6 }}>
          {a.referenceNumber} is marked as rejected and stays in the list. Nothing is e-mailed to the applicant. You can approve it later if
          the decision changes.
        </p>
        <TextArea
          label="Reason (optional, for the admissions team)"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="e.g. Transcripts incomplete"
        />
      </form>
    </Modal>
  );
}
