import { useEffect, useId, useState } from 'react';
import { Download, ExternalLink, FileText, Mail, Paperclip, Pencil, RefreshCw, Send } from 'lucide-react';
import {
  Alert,
  Button,
  ErrorState,
  InfoList,
  Modal,
  PageLoader,
  SelectField,
  Spinner,
  StatusBadge,
  TextArea,
  TextField,
  useToast,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { useForm } from '@/hooks/useForm';
import { api, download } from '@/services/api';
import { durationLabel, formatDate, formatDateTime, todayIso } from '@/utils/format';
import {
  OFFER_STATUS,
  STUDY_MODES,
  courseEndDate,
  feeSummary,
  letterAmount,
  sourceList,
  toFormValues,
  toPayload,
  validateOffer,
} from './offerLetter';

/** Pending / Generated / Sent badge of an enquiry's conditional offer letter. */
export function OfferStatusBadge({ status }) {
  const meta = OFFER_STATUS[status] ?? OFFER_STATUS.pending;
  return <StatusBadge status={status} label={meta.label} tone={meta.tone} />;
}

/**
 * Prepare, preview and e-mail the Conditional Letter of Offer of one enquiry.
 * Details (prefilled from the enquiry, a matching student profile and the course catalogue) → Generate → PDF preview →
 * Send. The preview is the exact PDF the student receives.
 */
export function OfferLetterModal({ enquiryId, onClose, onChange }) {
  const path = `/admin/enquiries/${enquiryId}/offer-letter`;
  const state = useFetch(path);
  if (!state.data) {
    return (
      <Modal open title="Conditional offer letter" onClose={onClose} size="lg">
        {state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : <PageLoader />}
      </Modal>
    );
  }
  return <OfferLetterDialog path={path} data={state.data} setData={state.setData} onClose={onClose} onChange={onChange} />;
}

function OfferLetterDialog({ path, data, setData, onClose, onChange }) {
  const toast = useToast();
  const formId = useId();
  const { run, busy } = useApiAction();
  const { enquiry, email, offerLetter: letter } = data;
  const [step, setStep] = useState(letter ? 'preview' : 'details');
  const [confirmResend, setConfirmResend] = useState(false);
  const form = useForm(toFormValues(data.draft));

  const save = form.submit(async (values) => {
    const res = await api.put(path, toPayload(values));
    setData(res.data);
    form.setValues(toFormValues(res.data.draft));
    setConfirmResend(false);
    setStep('preview');
    onChange?.();
    toast.success(letter ? 'Offer letter updated' : `Offer letter ${res.data.offerLetter.referenceNumber} generated`);
  }, validateOffer);

  const send = () =>
    run(() => api.post(`${path}/send`), {
      key: 'send',
      onDone: (res) => {
        setData(res.data);
        setConfirmResend(false);
        onChange?.();
        const { delivery } = res.data;
        if (delivery.status === 'sent') toast.success(`Offer letter e-mailed to ${email.to}`);
        else toast.error(`The offer letter could not be e-mailed: ${delivery.error || 'unknown error'}`);
      },
    });

  const downloadPdf = () => run(() => download(`${path}/pdf`, { download: 1 }, email.fileName || 'offer-letter.pdf'), { key: 'download' });

  const preview = step === 'preview' && letter;
  const sending = busy === 'send' || letter?.emailStatus === 'sending';
  const footer = preview ? (
    <>
      <Button variant="ghost" icon={Pencil} onClick={() => setStep('details')} style={{ marginRight: 'auto' }}>
        Edit details
      </Button>
      <Button variant="secondary" icon={Download} loading={busy === 'download'} onClick={downloadPdf}>
        Download PDF
      </Button>
      {letter.status === 'sent' && !confirmResend ? (
        <Button variant="secondary" icon={RefreshCw} disabled={!email.configured} onClick={() => setConfirmResend(true)}>
          Send again
        </Button>
      ) : (
        <Button icon={Send} loading={sending} disabled={!email.configured} onClick={send}>
          {confirmResend ? `Yes, send again to ${email.to}` : 'Send to student'}
        </Button>
      )}
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={letter ? () => setStep('preview') : onClose}>
        {letter ? 'Back to preview' : 'Cancel'}
      </Button>
      <Button type="submit" form={formId} icon={FileText} loading={form.submitting}>
        {letter ? 'Save and preview' : 'Generate offer letter'}
      </Button>
    </>
  );

  return (
    <Modal open title={`Conditional offer letter · ${enquiry.name}`} onClose={onClose} size="xl" footer={footer}>
      {preview ? (
        <PreviewStep path={path} letter={letter} email={email} />
      ) : (
        <DetailsStep formId={formId} form={form} onSubmit={save} data={data} />
      )}
    </Modal>
  );
}

// ─── Step 1: details ────────────────────────────────────────────────────

function DetailsStep({ formId, form, onSubmit, data }) {
  const { courses, email, prefilledFrom, offerLetter: letter } = data;
  const { values, errors, set } = form;
  const course = courses.find((c) => String(c.id) === values.courseId);
  const fees = feeSummary(values);

  const courseOptions = [
    { value: '', label: 'Not from the course catalogue' },
    ...courses.map((c) => ({
      value: String(c.id),
      label: c.feeAmount ? `${c.title} — ${letterAmount(c.feeAmount, values.currency)}` : c.title,
    })),
  ];
  if (values.courseId && !course) courseOptions.push({ value: values.courseId, label: `${values.courseTitle} (no longer active)` });
  const modeOptions = [{ value: '', label: 'Not specified' }, ...STUDY_MODES.map((m) => ({ value: m, label: m }))];
  if (values.studyMode && !STUDY_MODES.includes(values.studyMode)) modeOptions.push({ value: values.studyMode, label: values.studyMode });

  const update = (changes) => {
    form.setValues((v) => ({ ...v, ...changes }));
    form.setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(changes).map((k) => [k, undefined])) }));
  };

  /** Choosing a course fills in its title, fee and (from the start date) the end date. */
  const onCourse = (event) => {
    const picked = courses.find((c) => String(c.id) === event.target.value);
    const changes = { courseId: event.target.value };
    if (picked) {
      changes.courseTitle = picked.title;
      if (picked.feeAmount !== null && picked.feeAmount !== undefined) changes.tuitionFee = String(picked.feeAmount);
      const start = values.startDate || [picked.startDate, picked.nextBatchStart].find((d) => d && d >= todayIso()) || '';
      changes.startDate = start;
      const end = courseEndDate(start, picked.durationValue, picked.durationUnit);
      if (end) changes.endDate = end;
    }
    update(changes);
  };

  const onStart = (event) => {
    const start = event.target.value;
    const end = course ? courseEndDate(start, course.durationValue, course.durationUnit) : null;
    update(end ? { startDate: start, endDate: end } : { startDate: start });
  };

  return (
    <form id={formId} className="offer-form" onSubmit={onSubmit} noValidate>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      {letter?.status === 'sent' ? (
        <Alert tone="warning">
          This letter was e-mailed on {formatDateTime(letter.sentAt)}. Saving changes updates it (same reference, {letter.referenceNumber})
          and it will need to be sent again.
        </Alert>
      ) : (
        !letter &&
        prefilledFrom.length > 0 && (
          <Alert tone="info">
            Prefilled from {sourceList(prefilledFrom)}. Please check every detail — the letter prints them exactly as entered.
          </Alert>
        )
      )}

      <section className="offer-form__section">
        <h3 className="offer-form__heading">Student</h3>
        <div className="form-grid">
          <TextField
            label="Student name (as printed on the letter)"
            required
            value={values.studentName}
            onChange={set('studentName')}
            error={errors.studentName}
            maxLength={160}
          />
          <TextField label="E-mailed to" value={email.to} readOnly disabled hint="The enquiry's e-mail address" />
          <TextArea
            className="span-2"
            label="Postal address"
            rows={3}
            value={values.address}
            onChange={set('address')}
            error={errors.address}
            hint="One line per row, as it should appear on the letter"
            placeholder={'179, Kivulakade,\nHorowpothana,\nAnuradhapura'}
          />
          <TextField
            label="Country"
            value={values.country}
            onChange={set('country')}
            error={errors.country}
            maxLength={80}
            placeholder="e.g. Sri Lanka"
          />
        </div>
      </section>

      <section className="offer-form__section">
        <h3 className="offer-form__heading">Programme</h3>
        <div className="form-grid">
          <SelectField label="Course" options={courseOptions} value={values.courseId} onChange={onCourse} error={errors.courseId} />
          <TextField
            label="Course title on the letter"
            required
            value={values.courseTitle}
            onChange={set('courseTitle')}
            error={errors.courseTitle}
            maxLength={200}
          />
          <SelectField
            label="Mode of study"
            options={modeOptions}
            value={values.studyMode}
            onChange={set('studyMode')}
            error={errors.studyMode}
          />
          <div className="form-grid offer-form__dates">
            <TextField
              label="Course start date"
              type="date"
              required
              value={values.startDate}
              onChange={onStart}
              error={errors.startDate}
            />
            <TextField
              label="Expected end date"
              type="date"
              required
              value={values.endDate}
              onChange={set('endDate')}
              error={errors.endDate}
              hint={
                course?.durationValue ? `From the course duration (${durationLabel(course.durationValue, course.durationUnit)})` : undefined
              }
            />
          </div>
        </div>
      </section>

      <section className="offer-form__section">
        <h3 className="offer-form__heading">Fees</h3>
        <div className="offer-form__fees">
          <TextField label="Currency" required value={values.currency} onChange={set('currency')} error={errors.currency} maxLength={3} />
          <TextField
            label="Total tuition fee"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.tuitionFee}
            onChange={set('tuitionFee')}
            error={errors.tuitionFee}
          />
          <TextField
            label="Initial deposit"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.depositAmount}
            onChange={set('depositAmount')}
            error={errors.depositAmount}
            hint="Non-refundable"
          />
          <TextField
            label="Full-payment discount"
            type="number"
            min="0"
            step="0.01"
            value={values.fullPaymentDiscount}
            onChange={set('fullPaymentDiscount')}
            error={errors.fullPaymentDiscount}
            hint="0 = no discount"
          />
        </div>
        {fees.valid && (
          <div className="offer-summary" aria-live="polite">
            <div>
              <span>Instalment option</span>
              <strong>
                {letterAmount(fees.deposit, values.currency)} deposit
                {fees.balance > 0 ? ` + ${letterAmount(fees.balance, values.currency)} balance` : ''}
              </strong>
            </div>
            {fees.discount > 0 && (
              <div className="offer-summary__best">
                <span>Full payment within 14 days</span>
                <strong>
                  {letterAmount(fees.fullPayment, values.currency)} (saves {letterAmount(fees.discount, values.currency)})
                </strong>
              </div>
            )}
          </div>
        )}
      </section>
    </form>
  );
}

// ─── Step 2: preview and send ───────────────────────────────────────────

function PreviewStep({ path, letter, email }) {
  const changedSinceSent = letter.status === 'generated' && letter.sentCount > 0;
  const failed = letter.emailStatus === 'failed' || letter.emailStatus === 'skipped';
  return (
    <div className="offer-preview">
      {/* Re-rendered whenever the letter changes (new details, sent copy). */}
      <PdfFrame key={`${letter.updatedAt}-${letter.status}`} path={`${path}/pdf`} title={`Letter of offer ${letter.referenceNumber}`} />
      <aside className="offer-preview__side">
        <div className="offer-preview__status">
          <OfferStatusBadge status={letter.status} />
          <span className="offer-preview__ref">{letter.referenceNumber}</span>
        </div>
        <InfoList
          items={[
            ['Student', letter.studentName],
            ['Programme', letter.courseTitle],
            ['Starts', formatDate(letter.startDate)],
            ['Tuition fee', letterAmount(letter.tuitionFee, letter.currency)],
            ['Letter dated', formatDate(letter.letterDate)],
          ]}
        />

        <div className="offer-email">
          <div className="offer-email__title">
            <Mail aria-hidden="true" /> E-mail to the student
          </div>
          <dl>
            <dt>To</dt>
            <dd>{email.to}</dd>
            <dt>Subject</dt>
            <dd>{email.subject}</dd>
            <dt>Attached</dt>
            <dd className="offer-email__file">
              <Paperclip aria-hidden="true" /> {email.fileName}
            </dd>
          </dl>
        </div>

        {!email.configured && (
          <Alert tone="warning">
            E-mail is not configured on the server (SMTP settings in miata_api/.env), so the letter cannot be sent yet. You can still
            download the PDF.
          </Alert>
        )}
        {failed && <Alert tone="error">The last attempt to e-mail this letter failed: {letter.emailError || 'unknown error'}</Alert>}
        {changedSinceSent && !failed && (
          <Alert tone="info">The details changed after the letter was sent. Send it again so the student has the current letter.</Alert>
        )}
        {letter.sentAt && (
          <p className="offer-preview__meta">
            {letter.status === 'sent' ? 'Sent' : 'Last sent'} {formatDateTime(letter.sentAt)} to {letter.sentTo}
            {letter.sentByName ? ` by ${letter.sentByName}` : ''}
            {letter.sentCount > 1 ? ` · ${letter.sentCount} times in total` : ''}
          </p>
        )}
      </aside>
    </div>
  );
}

/** The PDF, fetched with the admin's session and shown in the browser's PDF viewer. */
function PdfFrame({ path, title }) {
  const [state, setState] = useState({ url: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let url = null;
    let cancelled = false;
    api
      .raw(path)
      .then((res) => res.blob())
      .then((blob) => {
        url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (cancelled) URL.revokeObjectURL(url);
        else setState({ url, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ url: null, error });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path, attempt]);

  if (state.error) {
    return (
      <div className="offer-frame offer-frame--message">
        <ErrorState
          error={state.error}
          onRetry={() => {
            setState({ url: null, error: null });
            setAttempt((n) => n + 1);
          }}
        />
      </div>
    );
  }
  if (!state.url) {
    return (
      <div className="offer-frame offer-frame--message">
        <Spinner label="Preparing the letter" />
        <span>Preparing the letter…</span>
      </div>
    );
  }
  return (
    <div className="offer-frame-wrap">
      <iframe className="offer-frame" src={`${state.url}#view=FitH&navpanes=0`} title={title} />
      <a className="offer-frame__open" href={state.url} target="_blank" rel="noreferrer">
        <ExternalLink aria-hidden="true" /> Open in a new tab
      </a>
    </div>
  );
}
