import { useState } from 'react';
import {
  ChartColumn,
  ClipboardList,
  ClipboardPen,
  Download,
  FileText,
  Pencil,
  Plus,
  Send,
  Signature,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  Button,
  Card,
  EmptyState,
  FileDrop,
  FormModal,
  InfoList,
  PageHeader,
  TextArea,
  useConfirm,
  useToast,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api, download, toFormData, upload } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';
import {
  LogbookDetails,
  LogbookStatus,
  ReviewHistory,
  ScanLogTable,
  SignOff,
  SpecialtySummary,
} from '@/features/shared/worksheets/LogbookViews';
import { CATEGORIES, emptySummary, entryErrors, formatHours } from '@/features/shared/worksheets/worksheets';

const FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png';

/** Add or edit one row of the Clinical Scan Log. */
function EntryModal({ worksheetId, entry, open, onClose, onSaved }) {
  return (
    <FormModal
      open={open}
      title={entry ? 'Edit scan log entry' : 'Add scan log entry'}
      submitLabel={entry ? 'Save entry' : 'Add entry'}
      intro={
        entry?.verifiedAt ? (
          <Alert tone="warning" icon={TriangleAlert}>
            This entry is verified. Changing it removes the verification — your supervisor will verify it again.
          </Alert>
        ) : undefined
      }
      fields={[
        { name: 'entryDate', label: 'Date', type: 'date', required: true },
        { name: 'category', label: 'Specialty / examination category', type: 'select', required: true, options: CATEGORIES },
        {
          name: 'procedureType',
          label: 'Scan / procedure type',
          required: true,
          span: true,
          placeholder: 'e.g. Liver and gallbladder, NT scan, Carotid Doppler',
        },
        { name: 'scanCount', label: 'No. of scans', placeholder: '0', hint: 'Scans you performed in this session' },
        { name: 'durationHours', label: 'Training duration (hours)', placeholder: 'e.g. 2.5' },
        { name: 'supervisorName', label: 'Supervisor name', span: true, hint: 'Who supervised you on site' },
        { name: 'reflection', label: 'Reflection / learning points', type: 'textarea', span: true, rows: 3 },
      ]}
      initialValues={{
        entryDate: entry?.entryDate ?? '',
        category: entry?.category ?? '',
        procedureType: entry?.procedureType ?? '',
        scanCount: entry ? String(entry.scanCount) : '',
        durationHours: entry ? String(entry.durationHours) : '',
        supervisorName: entry?.supervisorName ?? '',
        reflection: entry?.reflection ?? '',
      }}
      validate={entryErrors}
      onSubmit={async (values) => {
        const body = {
          ...values,
          scanCount: Number(values.scanCount || 0),
          durationHours: Number(values.durationHours || 0),
        };
        const res = entry
          ? await api.put(`/student/worksheets/${worksheetId}/entries/${entry.id}`, body)
          : await api.post(`/student/worksheets/${worksheetId}/entries`, body);
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}

/** The logbook's header: the placement the student records. */
function DetailsModal({ worksheet: w, open, onClose, onSaved }) {
  const s = w.submission;
  return (
    <FormModal
      open={open}
      title="Logbook details"
      submitLabel="Save details"
      fields={[
        { name: 'trainingSite', label: 'Training site', span: true, placeholder: 'Hospital or clinic of your placement' },
        { name: 'trainingStart', label: 'Training period — from', type: 'date' },
        { name: 'trainingEnd', label: 'Training period — to', type: 'date' },
        { name: 'clinicalSupervisor', label: 'Clinical supervisor' },
        { name: 'modality', label: 'Modality', placeholder: 'e.g. Ultrasound' },
      ]}
      initialValues={{
        trainingSite: s?.trainingSite ?? '',
        trainingStart: s?.trainingStart ?? '',
        trainingEnd: s?.trainingEnd ?? '',
        clinicalSupervisor: s?.clinicalSupervisor ?? '',
        modality: s?.modality ?? '',
      }}
      validate={(v) => ({
        trainingEnd: v.trainingStart && v.trainingEnd && v.trainingEnd < v.trainingStart ? 'The period cannot end before it starts' : null,
      })}
      onSubmit={async (values) => (await api.put(`/student/worksheets/${w.id}/details`, values)).data}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}

/** The completed worksheet file (optional): e.g. the filled-in, signed logbook. */
function WorksheetFile({ worksheet: w, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const s = w.submission;

  const send = async () => {
    setProgress(0);
    try {
      const res = await upload(`/student/worksheets/${w.id}/file`, toFormData({}, { file }), { method: 'PUT', onProgress: setProgress });
      toast.success('File attached');
      setFile(null);
      onChanged(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProgress(null);
    }
  };

  const remove = async () => {
    if (await confirm({ title: 'Remove the attached file?', confirmLabel: 'Remove', danger: true })) {
      await run(() => api.delete(`/student/worksheets/${w.id}/file`), { success: 'File removed', onDone: (res) => onChanged(res.data) });
    }
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      {s?.hasFile ? (
        <div className="row row--wrap" style={{ gap: 8 }}>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => download(`/student/worksheets/${w.id}/file`)}>
            {s.fileName} ({formatBytes(s.fileSize)})
          </Button>
          {w.canEdit && (
            <Button variant="ghost-danger" size="sm" icon={Trash2} loading={Boolean(busy)} onClick={remove} aria-label="Remove file" />
          )}
        </div>
      ) : (
        !w.canEdit && (
          <p className="muted" style={{ margin: 0 }}>
            No file attached.
          </p>
        )
      )}
      {w.canEdit && (
        <>
          <FileDrop
            accept={FILE_ACCEPT}
            maxBytes={20 * 1024 * 1024}
            file={file}
            onChange={setFile}
            hint="PDF, Word, Excel, ZIP or photo of the signed pages · max 20 MB"
          />
          {progress !== null && (
            <div className="upload-progress">
              <div className="progress" style={{ flex: 1 }}>
                <div className="progress__bar" style={{ width: `${progress}%` }} />
              </div>
              <span className="num">{progress}%</span>
            </div>
          )}
          {file && (
            <div className="form-actions">
              <Button icon={Upload} size="sm" loading={progress !== null} onClick={send}>
                {s?.hasFile ? 'Replace file' : 'Attach file'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmitCard({ worksheet: w, onSubmitted }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [notes, setNotes] = useState(w.submission?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const resubmission = w.status === 'rework';

  const submit = async () => {
    const ok = await confirm({
      title: resubmission ? 'Submit your updated logbook?' : 'Submit your logbook?',
      message: 'Your supervisor is notified. The logbook cannot be changed while it is being reviewed.',
      confirmLabel: resubmission ? 'Resubmit' : 'Submit',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(`/student/worksheets/${w.id}/submit`, { notes: notes.trim() || undefined });
      toast.success(resubmission ? 'Updated logbook submitted' : 'Logbook submitted');
      onSubmitted(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={resubmission ? 'Submit updated logbook' : 'Submit logbook'}
      icon={Send}
      subtitle="When your scan log is complete, submit it to your supervisor for verification and sign-off."
    >
      <div className="stack" style={{ gap: 14 }}>
        {error && <Alert tone="error">{error}</Alert>}
        {w.isOverdue && (
          <Alert tone="warning" icon={TriangleAlert}>
            The due date has passed. You can still submit; your supervisor will see it as late.
          </Alert>
        )}
        {!w.canSubmit && (
          <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
            Add at least one scan log entry, or attach your completed worksheet, to submit.
          </p>
        )}
        <TextArea
          label="Notes for your supervisor (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <div className="form-actions">
          <Button icon={Send} loading={busy} disabled={!w.canSubmit} onClick={submit}>
            {resubmission ? 'Resubmit logbook' : 'Submit logbook'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Complete a practical worksheet: the logbook details, the Clinical Scan Log, the Specialty Summary, and submit it. */
export default function WorksheetPage() {
  const { worksheetId } = useParams();
  const state = useFetch(`/student/worksheets/${worksheetId}`);
  const confirm = useConfirm();
  const { run } = useApiAction();
  const [entryModal, setEntryModal] = useState(null);
  const [editingDetails, setEditingDetails] = useState(false);

  const deleteEntry = async (entry) => {
    if (
      await confirm({ title: 'Delete this entry?', message: 'It is removed from your scan log.', confirmLabel: 'Delete', danger: true })
    ) {
      await run(() => api.delete(`/student/worksheets/${worksheetId}/entries/${entry.id}`), {
        success: 'Entry deleted',
        onDone: (res) => state.setData(res.data),
      });
    }
  };

  return (
    <AsyncContent state={state}>
      {(w) => {
        const s = w.submission;
        const summary = s?.summary ?? emptySummary();
        const { totals } = summary;
        const rework = w.status === 'rework' ? s?.reviews.find((r) => r.decision === 'rework') : null;
        const addButton = w.canEdit && (
          <Button icon={Plus} size="sm" onClick={() => setEntryModal({})}>
            Add entry
          </Button>
        );
        return (
          <>
            <PageHeader
              back={{ to: '/student/worksheets', label: 'Practical worksheets' }}
              title={w.title}
              subtitle={
                <>
                  {w.courseTitle}
                  {w.moduleTitle ? ` · ${w.moduleTitle}` : ''} · <LogbookStatus status={w.status} />
                </>
              }
            />
            <div className="split">
              <div className="stack">
                {rework && (
                  <Alert tone="warning" icon={TriangleAlert}>
                    <strong>Rework requested by {rework.reviewerName}:</strong> {rework.feedback}
                  </Alert>
                )}
                {!w.canEdit && w.reason && <Alert tone={w.status === 'completed' ? 'success' : 'info'}>{w.reason}</Alert>}
                <Card
                  title="Clinical Scan Log"
                  icon={ClipboardList}
                  subtitle={`${totals.entries} ${totals.entries === 1 ? 'entry' : 'entries'} · ${totals.scans} scans · ${formatHours(totals.hours)} hours`}
                  action={addButton}
                  flush
                >
                  <ScanLogTable
                    entries={s?.entries ?? []}
                    actions={
                      w.canEdit
                        ? (e) => (
                            <span className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Pencil}
                                aria-label="Edit entry"
                                onClick={() => setEntryModal({ entry: e })}
                              />
                              <Button
                                variant="ghost-danger"
                                size="sm"
                                icon={Trash2}
                                aria-label="Delete entry"
                                onClick={() => deleteEntry(e)}
                              />
                            </span>
                          )
                        : undefined
                    }
                    empty={
                      <EmptyState
                        icon={ClipboardList}
                        title="No entries yet"
                        message="Add one row per clinical session: the date, specialty, the scans you performed, the hours and what you learned."
                        action={addButton}
                      />
                    }
                  />
                </Card>
                <Card title="Specialty Summary" icon={ChartColumn} subtitle="Totals per specialty, calculated from your scan log" flush>
                  <SpecialtySummary summary={summary} />
                </Card>
                {w.canEdit && <SubmitCard key={w.status} worksheet={w} onSubmitted={state.setData} />}
                <Card title="Supervisor review & sign-off" icon={Signature}>
                  {s ? (
                    <div className="stack">
                      <SignOff submission={s} />
                      <ReviewHistory reviews={s.reviews} />
                    </div>
                  ) : (
                    <p className="muted" style={{ margin: 0 }}>
                      Your supervisor verifies your entries and signs the logbook off after you submit it.
                    </p>
                  )}
                </Card>
              </div>
              <div className="stack">
                <Card title="Worksheet brief" icon={ClipboardPen}>
                  <InfoList
                    items={[
                      [
                        'Assigned to',
                        w.batchId
                          ? w.forSelectedStudents
                            ? `You (selected from ${w.batchName})`
                            : `Your batch: ${w.batchName}`
                          : 'All students of the course',
                      ],
                      [
                        'Due',
                        <span key="due">
                          {w.dueAt ? formatDateTime(w.dueAt) : 'No due date'}{' '}
                          {w.isOverdue && <span className="badge badge--red">Overdue</span>}
                        </span>,
                      ],
                      ['Status', <LogbookStatus key="status" status={w.status} />],
                      ['Submitted', s?.submittedAt ? formatDateTime(s.submittedAt) : 'Not yet'],
                    ]}
                  />
                  {w.hasTemplate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      style={{ marginTop: 14 }}
                      onClick={() => download(`/student/worksheets/${w.id}/template`)}
                    >
                      {w.templateName} ({formatBytes(w.templateSize)})
                    </Button>
                  )}
                  <h3 style={{ fontSize: 'var(--fs-base)', margin: '18px 0 6px' }}>Instructions</h3>
                  <p className="instructions">{w.instructions || <span className="muted">No additional instructions.</span>}</p>
                </Card>
                <Card
                  title="Logbook details"
                  icon={UserRound}
                  action={
                    w.canEdit && (
                      <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditingDetails(true)}>
                        Edit
                      </Button>
                    )
                  }
                >
                  <LogbookDetails
                    studentName={w.student.fullName}
                    studentCode={w.student.studentCode}
                    programme={w.courseTitle}
                    cohort={w.student.batchName}
                    details={s}
                  />
                </Card>
                <Card title="Completed worksheet file" icon={FileText} subtitle="Optional — e.g. the filled-in, signed logbook">
                  <WorksheetFile worksheet={w} onChanged={state.setData} />
                </Card>
              </div>
            </div>
            <EntryModal
              worksheetId={w.id}
              entry={entryModal?.entry}
              open={Boolean(entryModal)}
              onClose={() => setEntryModal(null)}
              onSaved={state.setData}
            />
            <DetailsModal worksheet={w} open={editingDetails} onClose={() => setEditingDetails(false)} onSaved={state.setData} />
          </>
        );
      }}
    </AsyncContent>
  );
}
