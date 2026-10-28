import {
  Bell,
  BookOpen,
  Calendar,
  CircleCheck,
  Clock,
  FilePlus2,
  FileText,
  Layers,
  MessageSquare,
  MonitorPlay,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AsyncContent,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  PersonCell,
  ProgressBar,
  StatCard,
  StatusBadge,
  ViewAll,
} from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { UpcomingMeetingsCard } from '@/features/shared/MeetingWidgets';
import { TimetableThisWeekCard } from '@/features/shared/TimetableViews';
import { useFetch } from '@/hooks/useFetch';
import { dateRange, formatDate, formatDateTime, timeAgo } from '@/utils/format';
import { ModuleStatusCard } from './ModuleStatusCard';

/** The batches the professor teaches: their courses, size, progress and what awaits review, with batch-wise shortcuts. */
function MyBatches({ batches }) {
  return (
    <Card title="My Batches" icon={Layers} subtitle="You teach these batches’ students in every course of the batch." flush>
      <DataTable
        compact
        rows={batches}
        columns={[
          {
            key: 'name',
            header: 'Batch',
            render: (b) => (
              <span>
                <Link to={`/professor/students?batchId=${b.id}`} className="cell-person__name">
                  {b.name}
                </Link>
                <span className="cell-person__sub" style={{ display: 'block' }}>
                  {b.courses.map((c) => c.title).join(', ')} · {dateRange(b.startDate, b.endDate)}
                </span>
              </span>
            ),
          },
          {
            key: 'students',
            header: 'Students',
            align: 'right',
            render: (b) => (
              <Link to={`/professor/students?batchId=${b.id}`} className="num">
                {b.studentCount}
              </Link>
            ),
          },
          {
            key: 'progress',
            header: 'Avg. progress',
            render: (b) => (
              <div className="row" style={{ minWidth: 120 }}>
                <ProgressBar value={b.progress.averagePercent} label={`${b.name} average progress`} />
                <span className="num">{b.progress.averagePercent}%</span>
              </div>
            ),
          },
          {
            key: 'work',
            header: 'Batch work',
            align: 'right',
            render: (b) => (
              <Link to={`/professor/assignments?batchId=${b.id}`} className="num">
                {b.batchAssignmentCount}
              </Link>
            ),
          },
          {
            key: 'pending',
            header: 'To review',
            render: (b) =>
              b.pendingReviews > 0 ? (
                <Link to={`/professor/reviews?batchId=${b.id}`}>
                  <StatusBadge status="pending" label={`${b.pendingReviews} to review`} />
                </Link>
              ) : (
                <StatusBadge status="active" label="Up to date" />
              ),
          },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.isActive ? 'active' : 'inactive'} /> },
        ]}
      />
    </Card>
  );
}

const ACTIVITY = {
  submitted: ['Assignment Submitted', 'green'],
  comment: ['Comment Added', 'blue'],
  rework: ['Rework Requested', 'amber'],
  completed: ['Assignment Reviewed', 'purple'],
};

const QUICK = [
  ['Create Assignment', '/professor/assignments?new=1', FilePlus2, 'purple'],
  ['Schedule Online Class', '/professor/meetings?new=1', MonitorPlay, 'green'],
  ['View Students List', '/professor/students', Users, 'blue'],
  ['Review / Comment', '/professor/reviews', MessageSquare, 'green'],
  ['View Completed / Rework', '/professor/completed', CircleCheck, 'orange'],
];

const dueTone = (dueAt) => {
  const days = (new Date(dueAt) - Date.now()) / 86_400_000;
  return days < 2 ? 'var(--red-600)' : days < 5 ? 'var(--amber-700)' : 'var(--blue-600)';
};

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const state = useFetch('/professor/dashboard');
  const notifications = useFetch('/notifications', { limit: 3 });
  const timetables = useFetch('/professor/timetable');
  const modules = useFetch('/professor/modules');

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        subtitle="Here's an overview of your teaching activities and assignments."
        actions={
          <span className="dashboard-date">
            <Calendar size={18} aria-hidden="true" />
            {new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        }
      />
      <AsyncContent state={state}>
        {({ stats, batches, recentStudents, recentAssignments, upcomingDeadlines, recentActivity, upcomingMeetings }) => (
          <div className="stack">
            <div className="dash-grid dash-grid--stats4">
              <StatCard
                icon={Users}
                tone="blue"
                label="Total Students"
                value={stats.totalStudents}
                hint={
                  stats.totalBatches > 0
                    ? `In your ${stats.totalBatches} batch${stats.totalBatches === 1 ? '' : 'es'} and courses`
                    : 'Enrolled in your courses'
                }
                to="/professor/students"
              />
              <StatCard
                icon={FileText}
                tone="purple"
                label="Assignments"
                value={stats.totalAssignments}
                hint={`${stats.pendingReviews} pending review`}
                to="/professor/reviews"
              />
              <StatCard
                icon={CircleCheck}
                tone="green"
                label="Completed Assignments"
                value={stats.completed}
                hint="Marked completed"
                to="/professor/completed"
              />
              <StatCard
                icon={RefreshCw}
                tone="orange"
                label="Rework Assignments"
                value={stats.rework}
                hint="Needs revision"
                to="/professor/completed?tab=rework"
              />
            </div>

            <div className="dash-grid dash-grid--side">
              <div className="stack">
                {batches.length > 0 && <MyBatches batches={batches} />}
                {modules.error && !modules.data?.length ? (
                  <Card title="My Modules" icon={BookOpen}>
                    <ErrorState error={modules.error} onRetry={modules.reload} />
                  </Card>
                ) : (
                  modules.data?.length > 0 && (
                    <ModuleStatusCard
                      modules={modules.data}
                      onChange={modules.reload}
                      loadError={modules.error}
                      onRetry={modules.reload}
                    />
                  )
                )}
                <div className="dash-grid dash-grid--pair">
                  <Card title="Recent Students" icon={Users} action={<ViewAll to="/professor/students" />} flush>
                    <DataTable
                      compact
                      rows={recentStudents}
                      rowKey="enrolmentId"
                      columns={[
                        { key: 'name', header: 'Student Name', render: (s) => <PersonCell name={s.fullName} sub={s.courseTitle} /> },
                        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.isActive ? s.status : 'inactive'} /> },
                        {
                          key: 'last',
                          header: 'Last Activity',
                          render: (s) => <span className="nowrap">{formatDate(s.lastActivity)}</span>,
                        },
                      ]}
                      empty={
                        <EmptyState
                          icon={Users}
                          title="No students yet"
                          message="Students appear once they are enrolled in your courses."
                        />
                      }
                    />
                  </Card>
                  <Card title="My Assignments" icon={FileText} action={<ViewAll to="/professor/assignments" />} flush>
                    <DataTable
                      compact
                      rows={recentAssignments}
                      columns={[
                        {
                          key: 'title',
                          header: 'Assignment Title',
                          render: (a) => (
                            <span>
                              <Link to={`/professor/assignments/${a.id}`} className="cell-person__name">
                                {a.title}
                              </Link>
                              <span className="cell-person__sub" style={{ display: 'block' }}>
                                {a.courseTitle}
                              </span>
                            </span>
                          ),
                        },
                        {
                          key: 'due',
                          header: 'Due Date',
                          render: (a) => <span className="nowrap">{a.dueAt ? formatDate(a.dueAt) : '—'}</span>,
                        },
                        {
                          key: 'status',
                          header: 'Status',
                          render: (a) =>
                            a.pendingCount > 0 ? (
                              <StatusBadge status="pending" label={`${a.pendingCount} to review`} />
                            ) : (
                              <StatusBadge status="completed" label="Up to date" tone="green" />
                            ),
                        },
                      ]}
                      empty={<EmptyState icon={FileText} title="No assignments" />}
                    />
                  </Card>
                </div>
                <Card title="Recent Activity" icon={Clock} flush>
                  <DataTable
                    compact
                    rows={recentActivity}
                    rowKey={(a) => `${a.kind}-${a.submissionId}-${a.at}`}
                    columns={[
                      { key: 'at', header: 'Date & Time', render: (a) => <span className="nowrap">{formatDateTime(a.at)}</span> },
                      { key: 'student', header: 'Student Name', render: (a) => a.studentName },
                      {
                        key: 'action',
                        header: 'Action',
                        render: (a) => <StatusBadge status={a.kind} label={ACTIVITY[a.kind]?.[0]} tone={ACTIVITY[a.kind]?.[1]} />,
                      },
                      {
                        key: 'details',
                        header: 'Details',
                        render: (a) => (
                          <Link to={`/professor/reviews/${a.submissionId}`}>
                            {a.kind === 'submitted'
                              ? `Submitted: ${a.assignmentTitle}`
                              : a.detail
                                ? `${a.assignmentTitle} — ${a.detail.slice(0, 80)}`
                                : a.assignmentTitle}
                          </Link>
                        ),
                      },
                    ]}
                    empty={<EmptyState icon={Clock} title="No activity yet" />}
                  />
                </Card>
              </div>
              <aside className="stack">
                <Card title="Quick Actions" icon={Zap}>
                  <div className="stack" style={{ gap: 10 }}>
                    {QUICK.map(([label, to, Icon, tone]) => (
                      <Link key={to} to={to} className="quick-link">
                        <span className={`timeline-icon tone-${tone}`}>
                          <Icon aria-hidden="true" />
                        </span>
                        {label}
                        <span className="quick-link__chevron" aria-hidden="true">
                          ›
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card>
                {timetables.data?.map((t) => (
                  <TimetableThisWeekCard
                    key={t.course.id}
                    timetable={t}
                    mineIds={t.myLecturerIds}
                    to={`/professor/timetable?courseId=${t.course.id}`}
                    title={t.myLecturerIds.length ? 'My Sessions This Week' : 'This Week'}
                  />
                ))}
                <UpcomingMeetingsCard
                  meetings={upcomingMeetings}
                  to="/professor/meetings"
                  sub={(m) => `${m.batchName} · ${m.recipientCount} invited`}
                  emptyMessage="Schedule a Google Meet or Zoom class for one of your batches."
                />
                <Card title="Upcoming Deadlines" icon={Calendar} flush>
                  {upcomingDeadlines.length ? (
                    <ul className="list">
                      {upcomingDeadlines.map((d) => (
                        <li key={d.id} className="list__item">
                          <span
                            style={{ width: 8, height: 8, borderRadius: '50%', background: dueTone(d.dueAt), flexShrink: 0 }}
                            aria-hidden="true"
                          />
                          <div className="list__main">
                            <Link to={`/professor/assignments/${d.id}`} className="list__title">
                              {d.title}
                            </Link>
                            <div className="list__sub">{formatDate(d.dueAt)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={Clock} title="No upcoming deadlines" />
                  )}
                </Card>
                <Card title="Notifications" icon={Bell} flush>
                  {notifications.data?.length ? (
                    <ul className="list">
                      {notifications.data.map((n) => (
                        <li key={n.id} className="list__item">
                          <span
                            className="notification__dot"
                            style={{ marginTop: 0, background: n.readAt ? 'var(--border-strong)' : 'var(--accent)' }}
                          />
                          <div className="list__main">
                            {n.link ? (
                              <Link to={n.link} className="list__title">
                                {n.title}
                              </Link>
                            ) : (
                              <div className="list__title">{n.title}</div>
                            )}
                            <div className="list__sub">{timeAgo(n.createdAt)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={Bell} title="No notifications" />
                  )}
                </Card>
              </aside>
            </div>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
