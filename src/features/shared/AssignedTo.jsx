/**
 * Who an assignment is for: "All students of the course", "Batch X", or "Batch X · 2 selected".
 * `inline` (inside a table's title cell) shows nothing for course-wide work, so tables keep their layout.
 */
export function AssignedTo({ assignment: a, inline = false }) {
  if (!a.batchId) return inline ? null : <span className="muted nowrap">All students of the course</span>;
  const selected = a.recipientCount > 0 ? ` · ${a.recipientCount} selected` : '';
  return (
    <span
      className="badge badge--purple"
      style={inline ? { marginTop: 4, display: 'inline-block' } : undefined}
      title={a.recipients?.length ? a.recipients.map((r) => r.fullName).join(', ') : undefined}
    >
      {a.batchName}
      {selected}
    </span>
  );
}
