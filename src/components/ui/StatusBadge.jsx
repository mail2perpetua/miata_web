// One mapping from every status value in the system to its label and colour, so badges are consistent.
const STATUS = {
  // accounts / students / referrals
  active: ['Active', 'green'],
  inactive: ['Inactive', 'red'],
  pending: ['Pending', 'amber'],
  completed: ['Completed', 'purple'],
  registered: ['Registered', 'blue'],
  suspended: ['Suspended', 'gray'],
  // submissions
  submitted: ['Submitted', 'amber'],
  in_review: ['In Review', 'blue'],
  rework: ['Rework Required', 'orange'],
  // enquiries
  new: ['New', 'blue'],
  contacted: ['Contacted', 'sky'],
  follow_up: ['Follow-up', 'amber'],
  converted: ['Converted', 'green'],
  closed: ['Closed', 'gray'],
  // email delivery
  sent: ['Email sent', 'green'],
  failed: ['Email failed', 'red'],
  skipped: ['Email not sent', 'gray'],
  // content
  published: ['Published', 'green'],
  draft: ['Draft', 'gray'],
  // online classes
  upcoming: ['Scheduled', 'blue'],
  live: ['Live now', 'green'],
  ended: ['Ended', 'gray'],
  cancelled: ['Cancelled', 'red'],
  // fee payments (pending as above)
  approved: ['Approved', 'green'],
  rejected: ['Rejected', 'red'],
  // modules
  in_progress: ['In Progress', 'blue'],
  not_started: ['Not Started', 'gray'],
  no_requirements: ['No requirements', 'gray'],
};

export const statusLabel = (status) => STATUS[status]?.[0] ?? status;

export function StatusBadge({ status, label, tone }) {
  const [defaultLabel, defaultTone] = STATUS[status] ?? [status, 'gray'];
  return <span className={`badge badge--${tone ?? defaultTone}`}>{label ?? defaultLabel}</span>;
}
