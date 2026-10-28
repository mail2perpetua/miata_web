import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable, EmptyState, PersonCell, StatusBadge } from '@/components';
import { formatDate } from '@/utils/format';

/**
 * Referred students. `admin` adds contact details, agent column and links to the student record;
 * agents see only name, ID, course, registration date and status.
 */
export function ReferralTable({ state, query, onSort, admin = false, showAgent = false, actions }) {
  const offset = ((state.meta?.page ?? 1) - 1) * (state.meta?.pageSize ?? 10);
  const columns = [
    ...(!admin ? [{ key: 'n', header: '#', render: (_r, i) => <span className="muted num">{offset + i + 1}</span>, width: 48 }] : []),
    {
      key: 'name',
      header: 'Student Name',
      sortKey: 'full_name',
      render: (r) =>
        admin ? (
          <Link to={`/admin/students/${r.studentId}`}>
            <PersonCell name={r.fullName} sub={r.email} />
          </Link>
        ) : (
          <PersonCell name={r.fullName} />
        ),
    },
    { key: 'studentCode', header: 'Student ID', sortKey: 'student_code', render: (r) => <span className="nowrap">{r.studentCode}</span> },
    {
      key: 'course',
      header: 'Course',
      render: (r) =>
        r.courseTitles || (
          <span className="muted">{r.appliedCourseTitle ? `Applied for ${r.appliedCourseTitle}` : 'Not enrolled yet'}</span>
        ),
    },
    ...(showAgent
      ? [{ key: 'agent', header: 'Agent', sortKey: 'agent', render: (r) => <Link to={`/admin/agents/${r.agentId}`}>{r.agentName}</Link> }]
      : []),
    {
      key: 'registeredAt',
      header: 'Registered Date',
      sortKey: 'registered_at',
      render: (r) => <span className="nowrap">{formatDate(r.registeredAt)}</span>,
    },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
    ...(actions ? [{ key: 'action', header: 'Action', align: 'right', render: (r) => actions?.(r) }] : []),
  ];
  return (
    <DataTable
      rows={state.data}
      loading={state.loading}
      rowKey="studentId"
      sort={query.sort}
      order={query.order}
      onSort={onSort}
      columns={columns}
      empty={
        <EmptyState
          icon={Users}
          title="No referred students"
          message={
            admin
              ? 'Students who register with an agent’s referral link, or whom an agent registers with Apply Now, appear here.'
              : 'Students who register with your referral link, or whom you register with Apply Now, appear here.'
          }
        />
      }
    />
  );
}
