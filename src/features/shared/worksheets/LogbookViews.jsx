import { CircleCheck, ClipboardList, MessageSquare } from 'lucide-react';
import { Avatar, DataTable, EmptyState, InfoList, StatusBadge } from '@/components';
import { dateRange, formatDate, formatDateTime, initials } from '@/utils/format';
import { categoryLabel, formatHours, LOGBOOK_STATUS } from './worksheets';

// The views of a clinical training logbook, laid out like the MIATA logbook workbook: its header, the Clinical Scan Log,
// the Specialty Summary and the Supervisor Review and Sign-off.

export function LogbookStatus({ status }) {
  const [label, tone] = LOGBOOK_STATUS[status] ?? [status, 'gray'];
  return <StatusBadge status={status} label={label} tone={tone} />;
}

/** The logbook's header: the student, programme and cohort, and the placement details the student records. */
export function LogbookDetails({ studentName, studentCode, programme, cohort, details }) {
  const period = details?.trainingStart || details?.trainingEnd ? dateRange(details.trainingStart, details.trainingEnd) : null;
  return (
    <InfoList
      items={[
        ['Student name', studentName],
        ['Student ID', studentCode],
        ['Programme', programme],
        ['Cohort', cohort || 'Not in a batch'],
        ['Training site', details?.trainingSite],
        ['Training period', period],
        ['Clinical supervisor', details?.clinicalSupervisor],
        ['Modality', details?.modality],
      ]}
    />
  );
}

function Verified({ entry: e }) {
  if (!e.verifiedAt) return <span className="muted nowrap">Not verified</span>;
  return (
    <span>
      <span className="logbook-verified">
        <CircleCheck aria-hidden="true" /> {e.verifiedByName || 'Verified'}
      </span>
      <span className="cell-person__sub" style={{ display: 'block' }}>
        {formatDate(e.verifiedAt)}
      </span>
    </span>
  );
}

const longText = (text) => (text ? <span className="logbook-text">{text}</span> : '—');

/** The Clinical Scan Log: one row per session. `actions(entry)` renders a last column (edit, verify…). */
export function ScanLogTable({ entries, actions, empty }) {
  const columns = [
    { key: 'date', header: 'Date', render: (e) => <span className="nowrap">{formatDate(e.entryDate)}</span> },
    { key: 'category', header: 'Specialty / Examination Category', render: (e) => categoryLabel(e.category) },
    { key: 'procedure', header: 'Scan / Procedure Type', render: (e) => longText(e.procedureType) },
    { key: 'scans', header: 'No. of Scans', align: 'right', render: (e) => <span className="num">{e.scanCount}</span> },
    {
      key: 'hours',
      header: 'Duration (hours)',
      align: 'right',
      render: (e) => <span className="num">{formatHours(e.durationHours)}</span>,
    },
    { key: 'supervisor', header: 'Supervisor Name', render: (e) => e.supervisorName || '—' },
    { key: 'reflection', header: 'Student Reflection / Learning Points', render: (e) => longText(e.reflection) },
    { key: 'feedback', header: 'Supervisor Comments / Feedback', render: (e) => longText(e.supervisorFeedback) },
    { key: 'verified', header: 'Signature / Verified Date', render: (e) => <Verified entry={e} /> },
  ];
  if (actions) columns.push({ key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: actions });
  return (
    <DataTable
      compact
      rows={entries}
      columns={columns}
      caption="Clinical Scan Log"
      empty={empty ?? <EmptyState icon={ClipboardList} title="No scan log entries yet" />}
    />
  );
}

/** Totals per specialty (every category, as in the logbook) with what is verified and by whom, and a TOTAL row. */
export function SpecialtySummary({ summary }) {
  const { totals } = summary;
  const rows = [
    ...summary.categories.map((c) => ({ ...c, id: c.category })),
    {
      id: 'total',
      total: true,
      scans: totals.scans,
      hours: totals.hours,
      verifiedScans: totals.verifiedScans,
      verifiedHours: totals.verifiedHours,
      verifiers: [],
    },
  ];
  const cell = (r, value) => (r.total ? <strong>{value}</strong> : value);
  return (
    <DataTable
      compact
      rows={rows}
      caption="Specialty Summary"
      columns={[
        { key: 'category', header: 'Specialty / Category', render: (r) => cell(r, r.total ? 'TOTAL' : categoryLabel(r.category)) },
        { key: 'scans', header: 'Total Scans', align: 'right', render: (r) => <span className="num">{cell(r, r.scans)}</span> },
        {
          key: 'hours',
          header: 'Training Duration (hours)',
          align: 'right',
          render: (r) => <span className="num">{cell(r, formatHours(r.hours))}</span>,
        },
        {
          key: 'verified',
          header: 'Verified (scans · hours)',
          align: 'right',
          render: (r) => <span className="num">{cell(r, `${r.verifiedScans} · ${formatHours(r.verifiedHours)}`)}</span>,
        },
        {
          key: 'initials',
          header: 'Supervisor Initials',
          render: (r) => (r.verifiers.length ? <span title={r.verifiers.join(', ')}>{r.verifiers.map(initials).join(', ')}</span> : '—'),
        },
      ]}
    />
  );
}

/** The Supervisor Review and Sign-off: who signed the logbook off, what they verified, and when both parties signed. */
export function SignOff({ submission: s }) {
  const signedOff = s.status === 'completed';
  const signOff = s.reviews.find((r) => r.decision === 'completed');
  return (
    <div className="stack" style={{ gap: 12 }}>
      {!signedOff && (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
          Not signed off yet. The supervisor signs the logbook off by marking it Completed, which verifies every entry.
        </p>
      )}
      <InfoList
        items={[
          ['Supervisor name', signedOff ? s.reviewerName : null],
          ['Registration / designation', signedOff ? s.supervisorDesignation : null],
          ['Overall comments', signedOff ? signOff?.feedback : null],
          ['Total scans verified', s.summary.totals.verifiedScans],
          ['Training hours verified', formatHours(s.summary.totals.verifiedHours)],
          ['Supervisor signed', signedOff ? formatDateTime(s.reviewedAt) : null],
          ['Student submitted', s.submittedAt ? formatDateTime(s.submittedAt) : null],
        ]}
      />
    </div>
  );
}

/** Review decisions, newest first: sign-offs with the totals they verified, and rework requests with their feedback. */
export function ReviewHistory({ reviews }) {
  if (!reviews.length) {
    return <EmptyState icon={MessageSquare} title="No reviews yet" message="The supervisor's decisions and feedback appear here." />;
  }
  return (
    <ul className="feed">
      {reviews.map((r) => (
        <li key={r.id} className={`feed__item feed__item--${r.decision}`}>
          <Avatar name={r.reviewerName} size="sm" />
          <div className="feed__body">
            <div className="feed__meta">
              <strong>{r.reviewerName}</strong>
              <StatusBadge
                status={r.decision}
                label={r.decision === 'completed' ? 'Signed off' : 'Rework requested'}
                tone={r.decision === 'completed' ? 'green' : 'orange'}
              />
              <span className="muted">{formatDateTime(r.createdAt)}</span>
            </div>
            {r.decision === 'completed' && (
              <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                Verified {r.verifiedScans} scans · {formatHours(r.verifiedHours)} hours
              </div>
            )}
            {r.feedback && <p className="feed__text">{r.feedback}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
