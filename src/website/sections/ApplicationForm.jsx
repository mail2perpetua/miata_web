import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  CircleAlert,
  FileText,
  FileUser,
  IdCard,
  Languages,
  Lock,
  Mail,
  ShieldCheck,
  Upload,
  UsersRound,
  X,
} from 'lucide-react';
import { upload } from '@/services/api';
import { formatBytes } from '@/utils/format';
import * as v from '@/utils/validation';
import {
  ACADEMIC_DOCUMENTS,
  ACCEPTED_FILES,
  ALL_DOCUMENTS,
  APPLICATION_TERMS,
  APPLY_INTRO,
  IDENTITY_DOCUMENTS,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  STUDY_MODE_INTRO,
  STUDY_MODES,
} from '../content/apply';
import { CONTACT } from '../content/site';
import '../theme/apply.css';

const EMPTY = { fullName: '', email: '', phone: '', country: '', agentName: '', agentContact: '', studyMode: '', statement: '' };
const NO_FILES = Object.fromEntries(ALL_DOCUMENTS.map((d) => [d.name, []]));
const ACCEPT = ACCEPTED_FILES.map((ext) => `.${ext}`).join(',');
const STATEMENT_MAX = 5000;
const DOC_ICONS = { passport: IdCard, cv: FileUser, language: Languages, references: UsersRound, work: Briefcase };
// The order errors are announced and focused in: the order of the form.
const FIELD_ORDER = [
  'fullName',
  'email',
  'phone',
  'country',
  'agentName',
  'agentContact',
  'studyMode',
  ...ALL_DOCUMENTS.map((d) => d.name),
  'statement',
];

// Mandatory: full name, e-mail, phone and country. Everything else (mode of study, documents, statement) is optional.
function validate(values, files) {
  const errors = {
    fullName: v.required(values.fullName, 'Full name'),
    email: v.email(values.email),
    phone: v.required(values.phone, 'Phone number') || v.phone(values.phone),
    country: v.required(values.country, 'Country'),
    statement: values.statement.length > STATEMENT_MAX ? 'Please keep it under 5,000 characters' : null,
  };
  for (const doc of ALL_DOCUMENTS) {
    if (doc.required && !files[doc.name].length) errors[doc.name] = `Please upload your ${doc.label.toLowerCase()}`;
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/** Move to the first field with a problem (screen readers then announce its error). */
function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name]);
  const el = first && (document.getElementById(`apply-${first}`) ?? document.querySelector(`[name="${first}"]`));
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  }
}

/**
 * The Apply Now form (student registration): personal details, mode of study, documents and a statement of purpose.
 * "Review & Accept Terms" checks everything, then asks the applicant to accept the terms; the application and its
 * documents are then sent in one upload and appear under Admin → Students → Online Applications.
 */
export function ApplicationForm() {
  const [values, setValues] = useState(EMPTY);
  const [files, setFiles] = useState(NO_FILES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (submitted) {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      successRef.current?.focus({ preventScroll: true });
    }
  }, [submitted]);

  const clearError = (name) => setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  const set = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    clearError(name);
  };

  const addFiles = (doc, list) => {
    const problems = [];
    const ok = [];
    for (const file of list) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ACCEPTED_FILES.includes(ext)) problems.push(`${file.name}: please use PDF, Word, JPG or PNG`);
      else if (file.size > MAX_FILE_BYTES) problems.push(`${file.name} is larger than 10 MB`);
      else if (!file.size) problems.push(`${file.name} is empty`);
      else ok.push(file);
    }
    const current = files[doc.name];
    const room = doc.maxCount - current.length;
    if (ok.length > room) problems.push(`Maximum ${doc.maxCount} file${doc.maxCount === 1 ? '' : 's'} allowed`);
    setFiles((all) => ({ ...all, [doc.name]: [...current, ...ok.slice(0, Math.max(room, 0))] }));
    setErrors((e) => ({ ...e, [doc.name]: problems.join(' · ') || undefined }));
  };
  const removeFile = (doc, index) => setFiles((all) => ({ ...all, [doc.name]: all[doc.name].filter((_, i) => i !== index) }));

  const review = (event) => {
    event.preventDefault();
    const found = validate(values, files);
    if (Object.keys(found).length) {
      setErrors(found);
      setFormError('Please complete the highlighted fields before submitting.');
      focusFirstError(found);
      return;
    }
    const total = Object.values(files)
      .flat()
      .reduce((n, f) => n + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFormError('Your documents add up to more than 60 MB. Please upload smaller scans (PDF or JPG) and try again.');
      return;
    }
    setFormError(null);
    setReviewing(true);
  };

  /** Called by the terms dialog: send everything; field errors from the server go back onto the form. */
  const submit = async (onProgress) => {
    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, value.trim());
    body.append('acceptTerms', 'true');
    for (const doc of ALL_DOCUMENTS) for (const file of files[doc.name]) body.append(doc.name, file, file.name);
    try {
      const res = await upload('/applications', body, { onProgress });
      setReviewing(false);
      setSubmitted({ ...res.data, fullName: values.fullName.trim(), email: values.email.trim() });
      setValues(EMPTY);
      setFiles(NO_FILES);
      return null;
    } catch (err) {
      if (err.details && Object.keys(err.details).length) {
        setReviewing(false);
        setErrors(err.details);
        setFormError(err.message);
        setTimeout(() => focusFirstError(err.details), 50);
        return null;
      }
      return err.message || 'Your application could not be sent. Please try again.';
    }
  };

  if (submitted) {
    return (
      <section className="apply-page">
        <div className="ap-container">
          <div className="ap-success" ref={successRef} tabIndex={-1}>
            <span className="ap-success__icon" aria-hidden="true">
              <Check />
            </span>
            <h2 className="ap-title">Application submitted</h2>
            <p className="ap-lead">Thank you, {submitted.fullName}. Your application reference number is</p>
            <div className="ap-success__ref">{submitted.referenceNumber}</div>
            <p className="ap-lead">
              Please keep this reference number. Our admissions team will review your application and contact you at{' '}
              <strong>{submitted.email}</strong> within 24 hours.
            </p>
            <div className="ap-success__actions">
              <Link to="/" className="ap-btn ap-btn--primary">
                Back to home
              </Link>
              <Link to="/courses" className="ap-btn ap-btn--outline">
                Explore the programme
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const fileCount = Object.values(files).flat().length;
  return (
    <section className="apply-page">
      <div className="ap-container">
        <header className="ap-intro">
          <span className="ap-badge">
            <span className="ap-badge__dot" aria-hidden="true" />
            {APPLY_INTRO.badge}
          </span>
          <h2 className="ap-title">{APPLY_INTRO.title}</h2>
          <p className="ap-lead">{APPLY_INTRO.text}</p>
        </header>

        <form className="ap-form" onSubmit={review} noValidate>
          <Section number={1} title="Personal Information">
            <div className="ap-grid">
              <TextInput
                name="fullName"
                label="Full name"
                required
                value={values.fullName}
                onChange={set('fullName')}
                error={errors.fullName}
                placeholder="e.g. Priya Sharma"
                autoComplete="name"
                maxLength={120}
              />
              <TextInput
                name="email"
                label="Email address"
                type="email"
                required
                value={values.email}
                onChange={set('email')}
                error={errors.email}
                placeholder="your@email.com"
                autoComplete="email"
                maxLength={254}
              />
              <TextInput
                name="phone"
                label="Phone number"
                type="tel"
                required
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="+91 99278 29520"
                autoComplete="tel"
                maxLength={30}
              />
              <TextInput
                name="country"
                label="Country"
                required
                value={values.country}
                onChange={set('country')}
                error={errors.country}
                placeholder="e.g. India"
                autoComplete="country-name"
                maxLength={100}
              />
              <TextInput
                name="agentName"
                label="Agent name"
                optional
                value={values.agentName}
                onChange={set('agentName')}
                error={errors.agentName}
                placeholder="e.g. John Doe"
                maxLength={120}
              />
              <TextInput
                name="agentContact"
                label="Agent contact / email"
                optional
                value={values.agentContact}
                onChange={set('agentContact')}
                error={errors.agentContact}
                placeholder="e.g. agent@agency.com"
                maxLength={200}
              />
            </div>
          </Section>

          <Section number={2} title="Mode of Study">
            <span className="ap-pill">
              <span className="ap-badge__dot" aria-hidden="true" />
              Select your preferred programme <span className="ap-optional">(Optional)</span>
            </span>
            <p className="ap-note" id="apply-studyMode-intro">
              {STUDY_MODE_INTRO}
            </p>
            <div
              className="ap-modes"
              role="radiogroup"
              aria-label="Mode of study"
              aria-describedby="apply-studyMode-intro"
              aria-invalid={errors.studyMode ? 'true' : undefined}
            >
              {STUDY_MODES.map((mode, i) => (
                <label
                  key={mode.value}
                  className={`ap-mode ${values.studyMode === mode.value ? 'is-selected' : ''} ${errors.studyMode ? 'has-error' : ''}`}
                >
                  <input
                    type="radio"
                    name="studyMode"
                    id={i === 0 ? 'apply-studyMode' : undefined}
                    className="ap-mode__input"
                    value={mode.value}
                    checked={values.studyMode === mode.value}
                    onChange={set('studyMode')}
                  />
                  <span className="ap-mode__radio" aria-hidden="true" />
                  <span className="ap-mode__title">{mode.title}</span>
                  <span className="ap-mode__tag">{mode.tag}</span>
                </label>
              ))}
            </div>
            {errors.studyMode && (
              <span className="ap-error" role="alert">
                {errors.studyMode}
              </span>
            )}
          </Section>

          <Section number={3} title="Academic Documents">
            <div className="ap-stack">
              {ACADEMIC_DOCUMENTS.map((doc) => (
                <DocumentDrop
                  key={doc.name}
                  doc={doc}
                  files={files[doc.name]}
                  error={errors[doc.name]}
                  onAdd={(list) => addFiles(doc, list)}
                  onRemove={(i) => removeFile(doc, i)}
                />
              ))}
            </div>
          </Section>

          <Section number={4} title="Identity & Credentials">
            <div className="ap-grid">
              {IDENTITY_DOCUMENTS.map((doc) => (
                <DocumentDrop
                  key={doc.name}
                  doc={doc}
                  compact
                  files={files[doc.name]}
                  error={errors[doc.name]}
                  onAdd={(list) => addFiles(doc, list)}
                  onRemove={(i) => removeFile(doc, i)}
                />
              ))}
            </div>
          </Section>

          <Section number={5} title="Statement of Purpose">
            <div className="ap-field">
              <label className="ap-label" htmlFor="apply-statement">
                Tell us about yourself <span className="ap-optional">(Optional)</span>
              </label>
              <textarea
                id="apply-statement"
                name="statement"
                className={`ap-input ap-textarea ${errors.statement ? 'has-error' : ''}`}
                rows={6}
                value={values.statement}
                onChange={set('statement')}
                maxLength={STATEMENT_MAX}
                aria-invalid={errors.statement ? 'true' : undefined}
                aria-describedby="apply-statement-help"
                placeholder="Share your background, clinical experience, and why you're passionate about MIATA's diagnostic ultrasound program. What are your career goals?"
              />
              <span
                className={errors.statement ? 'ap-error' : 'ap-help'}
                id="apply-statement-help"
                role={errors.statement ? 'alert' : undefined}
              >
                {errors.statement || `${values.statement.length.toLocaleString()} / 5,000 characters`}
              </span>
            </div>
          </Section>

          {formError && (
            <div className="ap-alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <button type="submit" className="ap-btn ap-btn--primary ap-btn--block">
            Review &amp; Accept Terms to Submit <ArrowRight aria-hidden="true" />
          </button>

          <footer className="ap-trust">
            <p>Your information is kept confidential and is never shared with third parties.</p>
            <ul>
              <li>
                <Lock aria-hidden="true" /> Secure upload
              </li>
              <li>
                <ShieldCheck aria-hidden="true" /> Data protected
              </li>
              <li>
                <BadgeCheck aria-hidden="true" /> No spam
              </li>
            </ul>
            <a href={`mailto:${CONTACT.email}`} className="ap-trust__mail">
              <Mail aria-hidden="true" /> {CONTACT.email}
            </a>
          </footer>
        </form>
      </div>

      {reviewing && <TermsDialog values={values} fileCount={fileCount} onCancel={() => setReviewing(false)} onSubmit={submit} />}
    </section>
  );
}

// ─── Building blocks ────────────────────────────────────────────────────

function Section({ number, title, children }) {
  const id = useId();
  return (
    <section className="ap-section" aria-labelledby={id}>
      <div className="ap-section__head">
        <span className="ap-section__num" aria-hidden="true">
          {number}
        </span>
        <h3 className="ap-section__title" id={id}>
          {title}
        </h3>
      </div>
      <div className="ap-card">{children}</div>
    </section>
  );
}

function FieldLabel({ htmlFor, label, required, optional }) {
  return (
    <label className="ap-label" htmlFor={htmlFor}>
      {label} {required && <span className="ap-req">*</span>}
      {optional && <span className="ap-optional">(Optional)</span>}
    </label>
  );
}

function TextInput({ name, label, required, optional, error, ...props }) {
  const id = `apply-${name}`;
  return (
    <div className="ap-field">
      <FieldLabel htmlFor={id} label={label} required={required} optional={optional} />
      <input
        id={id}
        name={name}
        className={`ap-input ${error ? 'has-error' : ''}`}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span className="ap-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** A document upload: click or drag & drop, chosen files listed with remove buttons. */
function DocumentDrop({ doc, files, error, onAdd, onRemove, compact = false }) {
  const id = `apply-${doc.name}`;
  const [dragging, setDragging] = useState(false);
  const Icon = DOC_ICONS[doc.icon] ?? FileText;
  const full = files.length >= doc.maxCount;
  return (
    <div className={`ap-field ${doc.wide ? 'ap-field--wide' : ''}`}>
      <FieldLabel htmlFor={id} label={doc.label} required={doc.required} optional={!doc.required} />
      <label
        htmlFor={id}
        className={`ap-drop ${compact ? 'ap-drop--compact' : ''} ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''} ${full ? 'is-full' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full) onAdd(e.dataTransfer.files);
        }}
      >
        <span className="ap-drop__icon" aria-hidden="true">
          {compact ? <Icon /> : <Upload />}
        </span>
        <span className="ap-drop__text">
          <strong>{full ? 'All files added' : (doc.title ?? 'Click to upload or drag & drop')}</strong>
          <span>
            {doc.hint} · Max {doc.maxCount} file{doc.maxCount === 1 ? '' : 's'}, 10 MB each
          </span>
        </span>
        <input
          id={id}
          type="file"
          className="ap-drop__input"
          accept={ACCEPT}
          multiple={doc.maxCount > 1}
          disabled={full}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            onAdd(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="ap-files">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${i}`}>
              <FileText aria-hidden="true" />
              <span className="ap-files__name" title={file.name}>
                {file.name}
              </span>
              <span className="ap-files__size">{formatBytes(file.size)}</span>
              <button type="button" className="ap-files__remove" onClick={() => onRemove(i)} aria-label={`Remove ${file.name}`}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className={error ? 'ap-error' : 'ap-help'} id={`${id}-help`} role={error ? 'alert' : undefined}>
        {error || (doc.maxCount > 1 ? `Maximum ${doc.maxCount} files allowed` : 'One file')}
      </span>
    </div>
  );
}

/** "Review & Accept Terms": a summary of what is being sent, the terms, and the upload with its progress. */
function TermsDialog({ values, fileCount, onCancel, onSubmit }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const [accepted, setAccepted] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const sending = progress !== null;
  const mode = STUDY_MODES.find((m) => m.value === values.studyMode);

  // Latest values for the mount-only effect below (the parent passes an inline onCancel).
  const latest = useRef({ onCancel, sending });
  useEffect(() => {
    latest.current = { onCancel, sending };
  });

  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !latest.current.sending && latest.current.onCancel();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const send = async () => {
    setError(null);
    setProgress(0);
    const problem = await onSubmit(setProgress);
    if (problem) {
      setProgress(null);
      setError(problem);
    }
  };

  return createPortal(
    <div className="ap-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !sending && onCancel()}>
      <div className="ap-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} tabIndex={-1}>
        <h2 className="ap-dialog__title" id={titleId}>
          Review &amp; accept the terms
        </h2>
        <p className="ap-dialog__text">Please check your details, then read and accept the terms to submit your application.</p>
        <dl className="ap-summary">
          <dt>Name</dt>
          <dd>{values.fullName}</dd>
          <dt>Email</dt>
          <dd>{values.email}</dd>
          <dt>Phone</dt>
          <dd>{values.phone}</dd>
          <dt>Mode of study</dt>
          <dd>{mode ? `${mode.title} (${mode.tag})` : 'Not selected'}</dd>
          <dt>Documents</dt>
          <dd>
            {fileCount} file{fileCount === 1 ? '' : 's'}
          </dd>
        </dl>
        <ol className="ap-terms">
          {APPLICATION_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
        <label className="ap-check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} disabled={sending} />
          <span>I have read and accept these terms, and confirm that my details are correct.</span>
        </label>
        {error && (
          <div className="ap-alert" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {sending && (
          <div className="ap-progress" role="status" aria-live="polite">
            <div className="ap-progress__bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <span>{progress < 100 ? `Uploading your documents… ${progress}%` : 'Saving your application…'}</span>
          </div>
        )}
        <div className="ap-dialog__actions">
          <button type="button" className="ap-btn ap-btn--ghost" onClick={onCancel} disabled={sending}>
            Back to form
          </button>
          <button type="button" className="ap-btn ap-btn--primary" onClick={send} disabled={!accepted || sending}>
            {sending ? 'Submitting…' : 'Submit application'} {!sending && <ArrowRight aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
