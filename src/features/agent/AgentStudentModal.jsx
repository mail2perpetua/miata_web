import { Avatar, DataTable, EmptyState, InfoList, Modal, PageLoader, ProgressBar, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/utils/format';

/** What an agent may see about one of their referred students (no contact details). */
export function AgentStudentModal({ studentId, onClose }) {
  const state = useFetch(`/agent/students/${studentId}`);
  const s = state.data;
  return (
    <Modal open title="Student details" onClose={onClose} size="lg">
      {!s ? (
        <PageLoader />
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          <div className="profile-summary" style={{ marginBottom: 0 }}>
            <Avatar name={s.fullName} size="lg" />
            <div>
              <strong style={{ fontSize: 'var(--fs-md)' }}>{s.fullName}</strong>
              <div className="muted">{s.studentCode}</div>
            </div>
            <span style={{ marginLeft: 'auto' }}>
              <StatusBadge status={s.status} />
            </span>
          </div>
          <InfoList
            items={[
              ['Registered', formatDate(s.registeredAt)],
              [
                'Referred via',
                { link: 'Your referral link', agent: 'Registered by you (Apply Now)' }[s.source] ?? 'Assigned by MIATA admin',
              ],
              ...(s.source === 'agent'
                ? [
                    ['Applied for', s.appliedCourseTitle ?? 'No course chosen'],
                    ['Your note', s.applicationNotes],
                  ]
                : []),
            ]}
          />
          <DataTable
            compact
            rows={s.enrolments}
            rowKey="courseTitle"
            columns={[
              { key: 'courseTitle', header: 'Course' },
              { key: 'enrolledAt', header: 'Enrolled', render: (e) => formatDate(e.enrolledAt) },
              {
                key: 'progress',
                header: 'Progress',
                render: (e) => (
                  <div className="row" style={{ minWidth: 140 }}>
                    <ProgressBar value={e.progress.percent} />
                    <span className="num">{e.progress.percent}%</span>
                  </div>
                ),
              },
              { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
            ]}
            empty={<EmptyState title="Not enrolled yet" message="MIATA will enrol the student once admission is confirmed." />}
          />
        </div>
      )}
    </Modal>
  );
}
