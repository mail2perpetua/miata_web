import { useState } from 'react';
import { CircleCheck, Clock, Trophy, UserX } from 'lucide-react';
import { Card, EmptyState, PageHeader, PageLoader, PersonCell, ViewAll } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/utils/format';
import { AgentStudentModal } from './AgentStudentModal';

const COLUMNS = [
  { status: 'active', title: 'Active', hint: 'Currently learning', icon: CircleCheck, tone: 'green' },
  { status: 'pending', title: 'Pending', hint: 'Registered, awaiting enrolment', icon: Clock, tone: 'blue' },
  { status: 'completed', title: 'Course Completed', hint: 'Completed a course', icon: Trophy, tone: 'purple' },
  { status: 'inactive', title: 'Inactive', hint: 'Account deactivated', icon: UserX, tone: 'rose' },
];

function StatusColumn({ column, onView }) {
  const state = useFetch('/agent/students', { status: column.status, pageSize: 8, sort: 'registered_at', order: 'desc' });
  const Icon = column.icon;
  return (
    <Card
      title={
        <span className="row" style={{ gap: 10 }}>
          <span className={`timeline-icon tone-${column.tone}`}>
            <Icon aria-hidden="true" />
          </span>
          <span>
            {column.title}
            <span className="card__subtitle" style={{ display: 'block', fontWeight: 400 }}>
              {column.hint}
            </span>
          </span>
        </span>
      }
      action={<span className="status-col__count num">{state.meta?.total ?? '…'}</span>}
      flush
    >
      {!state.data ? (
        <PageLoader />
      ) : state.data.length === 0 ? (
        <EmptyState title="No students" />
      ) : (
        <ul className="list">
          {state.data.map((s) => (
            <li key={s.studentId} className="list__item">
              <button
                type="button"
                onClick={() => onView(s.studentId)}
                style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', flex: 1 }}
              >
                <PersonCell name={s.fullName} sub={`${s.courseTitles || 'Not enrolled'} · ${formatDate(s.registeredAt)}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {state.meta?.total > 8 && (
        <div style={{ padding: '10px 22px 16px' }}>
          <ViewAll to={`/agent/students?status=${column.status}`} label={`View all ${state.meta.total}`} />
        </div>
      )}
    </Card>
  );
}

export default function StudentStatusPage() {
  const [viewing, setViewing] = useState(null);
  return (
    <>
      <PageHeader title="Student Status" subtitle="Where each of your referred students is in their MIATA journey." />
      <div className="status-board">
        {COLUMNS.map((c) => (
          <StatusColumn key={c.status} column={c} onView={setViewing} />
        ))}
      </div>
      {viewing && <AgentStudentModal studentId={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
