import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Handshake,
  Layers,
  Mail,
  MessageSquarePlus,
  Stethoscope,
  Upload,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  BarChart,
  Card,
  DataTable,
  DonutChart,
  EmptyState,
  LineChart,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
  ViewAll,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { activityVisual } from '@/utils/activity';
import { formatDate, formatMonth, timeAgo } from '@/utils/format';

const QUICK_ACTIONS = [
  ['Add Course', GraduationCap, '/admin/courses?new=1'],
  ['Add Batch', Layers, '/admin/batches?new=1'],
  ['Add Student', UserPlus, '/admin/students?new=1'],
  ['Add Professor', Stethoscope, '/admin/professors?new=1'],
  ['Add Agent', Handshake, '/admin/agents?new=1'],
  ['Upload Video', Upload, '/admin/videos?new=1'],
  ['Track Submissions', ClipboardList, '/admin/assignments?tab=submissions'],
  ['Verify Payments', Wallet, '/admin/payments?status=pending'],
  ['Add Enquiry', MessageSquarePlus, '/admin/enquiries?new=1'],
];

function RecentActivity({ items }) {
  if (!items.length) return <EmptyState title="No activity yet" />;
  return (
    <ul className="list">
      {items.map((a) => {
        const { icon: Icon, tone } = activityVisual(a.action);
        return (
          <li key={a.id} className="list__item">
            <span className={`timeline-icon tone-${tone}`}>
              <Icon aria-hidden="true" />
            </span>
            <div className="list__main">
              <div className="list__title">{a.description}</div>
              <div className="list__sub">
                {a.actorName ? `${a.actorName} · ` : ''}
                {timeAgo(a.createdAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminDashboard() {
  const [months, setMonths] = useState(6);
  const state = useFetch('/admin/dashboard', { months });

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage your learning platform at a glance"
        actions={
          <select
            className="select select--inline"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label="Time range for charts"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        }
      />
      <AsyncContent state={state}>
        {({ stats, monthly, completion, courses, batches, recentEnquiries, recentActivity }) => {
          const enrolmentTotal = completion.completed + completion.inProgress + completion.notStarted;
          const completedPct = enrolmentTotal ? Math.round((completion.completed / enrolmentTotal) * 100) : 0;
          return (
            <div className={`stack ${state.loading ? 'is-refreshing' : ''}`}>
              {stats.pendingPayments > 0 && (
                <Alert tone="info" icon={Wallet}>
                  {stats.pendingPayments === 1 ? '1 fee payment is' : `${stats.pendingPayments} fee payments are`} waiting for verification.{' '}
                  <Link to="/admin/payments?status=pending">Review payments</Link>
                </Alert>
              )}
              <div className="dash-grid dash-grid--stats6">
                <StatCard
                  compact
                  icon={Users}
                  tone="blue"
                  label="Total Students"
                  value={stats.totalStudents}
                  hint={`${stats.newStudentsThisMonth} new this month`}
                  to="/admin/students"
                />
                <StatCard
                  compact
                  icon={Stethoscope}
                  tone="green"
                  label="Total Professors"
                  value={stats.totalProfessors}
                  to="/admin/professors"
                />
                <StatCard compact icon={Handshake} tone="purple" label="Total Agents" value={stats.totalAgents} to="/admin/agents" />
                <StatCard
                  compact
                  icon={BookOpen}
                  tone="amber"
                  label="Total Courses"
                  value={stats.totalCourses}
                  hint={`${stats.activeCourses} active`}
                  to="/admin/courses"
                />
                <StatCard
                  compact
                  icon={ClipboardList}
                  tone="orange"
                  label="Pending Assignments"
                  value={stats.pendingAssignments}
                  hint="Awaiting review"
                  to="/admin/assignments?tab=submissions&status=pending"
                />
                <StatCard
                  compact
                  icon={Mail}
                  tone="rose"
                  label="New Enquiries"
                  value={stats.newEnquiries}
                  to="/admin/enquiries?status=new"
                />
              </div>

              <div className="dash-grid dash-grid--chart">
                <Card title="Enrolment Overview" subtitle={`Student enrolments over the last ${months} months`}>
                  <LineChart
                    data={monthly}
                    xKey="month"
                    xFormat={formatMonth}
                    series={[{ key: 'enrolments', label: 'Enrolments', color: 'var(--accent)' }]}
                    ariaLabel="Enrolments per month"
                  />
                </Card>
                <Card title="Course Completion" subtitle="Overall enrolment completion status">
                  <DonutChart
                    centerValue={`${completedPct}%`}
                    centerLabel="Completed"
                    segments={[
                      { key: 'completed', label: 'Completed', value: completion.completed, color: 'var(--seq-600)', hint: 'enrolments' },
                      { key: 'progress', label: 'In Progress', value: completion.inProgress, color: 'var(--seq-450)', hint: 'enrolments' },
                      { key: 'not', label: 'Not Started', value: completion.notStarted, color: 'var(--seq-250)', hint: 'enrolments' },
                    ]}
                  />
                </Card>
              </div>

              <div className="dash-grid dash-grid--three">
                <Card title="Recent Enquiries" action={<ViewAll to="/admin/enquiries" />} flush>
                  <DataTable
                    compact
                    rows={recentEnquiries}
                    columns={[
                      { key: 'name', header: 'Name', render: (r) => <span className="cell-person__name">{r.name}</span> },
                      { key: 'courseInterest', header: 'Course', render: (r) => r.courseInterest || r.subject || '—' },
                      { key: 'createdAt', header: 'Date', render: (r) => <span className="nowrap">{formatDate(r.createdAt)}</span> },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                    empty={<EmptyState icon={Mail} title="No enquiries yet" />}
                  />
                </Card>
                <Card title="Recent Activity" action={<ViewAll to="/admin/settings?tab=activity" />} flush>
                  <RecentActivity items={recentActivity} />
                </Card>
                <Card title="Quick Actions">
                  <div className="quick-actions">
                    {QUICK_ACTIONS.map(([label, Icon, to]) => (
                      <Link key={label} to={to} className="quick-action">
                        <Icon aria-hidden="true" />
                        {label}
                        <ChevronRight className="quick-action__chevron" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="dash-grid dash-grid--chart">
                <Card title="Courses Overview" subtitle="Enrolment and staffing per course" action={<ViewAll to="/admin/courses" />} flush>
                  <DataTable
                    compact
                    rows={courses}
                    columns={[
                      {
                        key: 'title',
                        header: 'Course',
                        render: (c) => (
                          <Link to={`/admin/courses/${c.id}`} className="cell-person__name">
                            {c.title}
                          </Link>
                        ),
                      },
                      { key: 'students', header: 'Students', align: 'right', render: (c) => <span className="num">{c.students}</span> },
                      { key: 'completed', header: 'Completed', align: 'right', render: (c) => <span className="num">{c.completed}</span> },
                      {
                        key: 'professors',
                        header: 'Professors',
                        align: 'right',
                        render: (c) => <span className="num">{c.professors}</span>,
                      },
                      { key: 'modules', header: 'Modules', align: 'right', render: (c) => <span className="num">{c.modules}</span> },
                      { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
                    ]}
                    empty={<EmptyState icon={GraduationCap} title="No courses yet" />}
                  />
                </Card>
                <Card title="Course Distribution" subtitle="Students enrolled per course">
                  {courses.some((c) => c.students > 0) ? (
                    <BarChart
                      items={courses.map((c) => ({ key: c.id, label: c.title, value: c.students, detail: `${c.completed} completed` }))}
                      valueLabel="students"
                    />
                  ) : (
                    <EmptyState title="No enrolments yet" />
                  )}
                </Card>
              </div>

              <Card
                title="Batches Overview"
                icon={Layers}
                subtitle={`${stats.activeBatches} active of ${stats.totalBatches} batches · progress and reviews per batch`}
                action={<ViewAll to="/admin/batches" />}
                flush
              >
                <DataTable
                  compact
                  rows={batches}
                  columns={[
                    {
                      key: 'name',
                      header: 'Batch',
                      render: (b) => (
                        <span>
                          <Link to={`/admin/batches/${b.id}`} className="cell-person__name">
                            {b.name}
                          </Link>
                          <span className="cell-person__sub" style={{ display: 'block' }}>
                            {b.courses.map((c) => c.title).join(', ') || 'No courses'}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'professors',
                      header: 'Professors',
                      render: (b) => b.professors.map((p) => p.fullName).join(', ') || <span className="muted">Not assigned</span>,
                    },
                    { key: 'students', header: 'Students', align: 'right', render: (b) => <span className="num">{b.studentCount}</span> },
                    {
                      key: 'progress',
                      header: 'Avg. progress',
                      render: (b) => (
                        <div className="row" style={{ minWidth: 140 }}>
                          <ProgressBar value={b.progress.averagePercent} label={`${b.name} average progress`} />
                          <span className="num">{b.progress.averagePercent}%</span>
                        </div>
                      ),
                    },
                    {
                      key: 'completed',
                      header: 'Completed',
                      align: 'right',
                      render: (b) => (
                        <span className="num">
                          {b.progress.completed}/{b.progress.enrolments}
                        </span>
                      ),
                    },
                    {
                      key: 'pending',
                      header: 'To review',
                      align: 'right',
                      render: (b) => (
                        <Link to={`/admin/batches/${b.id}?tab=submissions&status=pending`} className="num">
                          {b.pendingReviews}
                        </Link>
                      ),
                    },
                  ]}
                  empty={<EmptyState icon={Layers} title="No active batches" message="Create a batch to group students by intake." />}
                />
              </Card>

              <Card title="Monthly Overview" subtitle="Registrations, enrolments, enquiries and completions per month">
                <LineChart
                  data={monthly}
                  xKey="month"
                  xFormat={formatMonth}
                  height={280}
                  series={[
                    { key: 'registrations', label: 'New registrations', color: 'var(--series-1)' },
                    { key: 'enrolments', label: 'Enrolments', color: 'var(--series-2)' },
                    { key: 'enquiries', label: 'Enquiries', color: 'var(--series-3)' },
                    { key: 'completions', label: 'Completions', color: 'var(--series-4)' },
                  ]}
                  ariaLabel="Monthly registrations, enrolments, enquiries and completions"
                />
              </Card>
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
