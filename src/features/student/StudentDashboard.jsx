import {
  BookOpen,
  ChartColumn,
  ChevronRight,
  CirclePlay,
  ClipboardCheck,
  GraduationCap,
  Layers,
  Library,
  NotebookPen,
  Send,
  Trophy,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  ProgressRing,
  StatCard,
  StatusBadge,
  ViewAll,
} from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFetch } from '@/hooks/useFetch';
import { Balance } from '@/features/shared/FeeWidgets';
import { dateRange, daysUntil, formatDate, formatMoney } from '@/utils/format';
import { UpcomingMeetingsCard } from '@/features/shared/MeetingWidgets';
import { TimetableThisWeekCard } from '@/features/shared/TimetableViews';
import { AssignmentRow, ModuleRow, StudentActivity, VideoCard } from './StudentWidgets';

// The MIATA crest from the website's assets (public/assets).
const logo = '/assets/images/loader.png';

const QUICK_LINKS = [
  ['View Modules', '/student/modules', Library, 'var(--green-600)'],
  ['View Assignments', '/student/assignments', NotebookPen, 'var(--purple-600)'],
  ['Submit Assignment', '/student/assignments?status=pending', Send, 'var(--orange-600)'],
  ['Course Completion', '/student/completion', GraduationCap, 'var(--blue-600)'],
];

export default function StudentDashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const state = useFetch('/student/dashboard');
  const timetables = useFetch('/student/timetable');
  const firstName = user.fullName.split(' ')[0];

  return (
    <AsyncContent state={state}>
      {({ batch, stats, featuredVideos, modules, assignments, recentActivity, courses, upcomingMeetings, fees, accessEndsOn }) => {
        const primary = courses.find((c) => c.status === 'active') ?? courses[0];
        const overall = courses.length ? Math.round(courses.reduce((s, c) => s + c.progress.percent, 0) / courses.length) : 0;
        const daysLeft = daysUntil(accessEndsOn);
        return (
          <div className="dash-grid dash-grid--side student-dash">
            <div className="stack">
              <section className="card welcome">
                <div className="welcome__head">
                  <div>
                    <h1>Welcome, {firstName} 👋</h1>
                    <p className="welcome__lead">Keep learning, keep growing. Your future is built on what you learn today.</p>
                  </div>
                  <img src={logo} alt="" className="welcome__art" />
                </div>
                <div className="dash-grid dash-grid--stats4">
                  <StatCard
                    icon={CirclePlay}
                    tone="purple"
                    compact
                    label="Total Videos"
                    value={stats.totalVideos}
                    hint={`${stats.watchedVideos} watched`}
                    to="/student/videos"
                  />
                  <StatCard
                    icon={BookOpen}
                    tone="blue"
                    compact
                    label="Total Modules"
                    value={stats.totalModules}
                    hint="In your courses"
                    to="/student/modules"
                  />
                  <StatCard
                    icon={ClipboardCheck}
                    tone="green"
                    compact
                    label="Assignments"
                    value={stats.pendingAssignments}
                    hint="Pending submission"
                    to="/student/assignments"
                  />
                  <StatCard
                    icon={Trophy}
                    tone="orange"
                    compact
                    label="Completed Courses"
                    value={stats.completedCourses}
                    hint={`Out of ${stats.totalCourses}`}
                    to="/student/completion"
                  />
                </div>
              </section>

              {daysLeft !== null && daysLeft <= 30 && (
                <Alert tone="warning">
                  Your course access ends on <strong>{formatDate(accessEndsOn)}</strong>
                  {daysLeft === 0 ? ' (today)' : ` (in ${daysLeft} day${daysLeft === 1 ? '' : 's'})`}. Your account is deactivated after
                  that date — contact MIATA if you need more time.
                </Alert>
              )}

              {courses.length === 0 && (
                <Card>
                  <EmptyState
                    icon={GraduationCap}
                    title="You are not enrolled in a course yet"
                    message="MIATA admissions will enrol you once your registration is confirmed. You will get a notification when your course is ready."
                  />
                </Card>
              )}

              {timetables.data?.map((t) => (
                <TimetableThisWeekCard key={t.course.id} timetable={t} to={`/student/timetable?courseId=${t.course.id}`} tiles />
              ))}

              <Card title="Featured Videos" icon={CirclePlay} action={<ViewAll to="/student/videos" />}>
                {featuredVideos.length ? (
                  <div className="video-grid">
                    {featuredVideos.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={CirclePlay} title="No videos available yet" />
                )}
              </Card>

              <div className="dash-grid dash-grid--pair">
                <Card title="My Modules" icon={BookOpen} action={<ViewAll to="/student/modules" />} flush>
                  {modules.length ? (
                    <ul className="list">
                      {modules.map((m, i) => (
                        <ModuleRow key={m.id} module={m} index={i} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={BookOpen} title="No modules yet" />
                  )}
                </Card>
                <Card title="My Assignments" icon={ClipboardCheck} action={<ViewAll to="/student/assignments" />} flush>
                  {assignments.length ? (
                    <ul className="list">
                      {assignments.map((a) => (
                        <AssignmentRow key={a.id} assignment={a} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={ClipboardCheck} title="No assignments" />
                  )}
                </Card>
              </div>
              <Card title="Recent Activity" icon={Zap} flush>
                <StudentActivity items={recentActivity} />
              </Card>
            </div>

            <aside className="stack">
              <Card>
                <div className="profile-summary">
                  <Avatar name={user.fullName} size="xl" />
                  <div>
                    <strong style={{ fontSize: 'var(--fs-md)' }}>{user.fullName}</strong>
                    <div className="muted">Student</div>
                  </div>
                </div>
                <div className="kv-row">
                  <span className="muted">Batch</span>
                  <span style={{ textAlign: 'right' }}>{batch?.name ?? 'Not assigned yet'}</span>
                </div>
                <div className="kv-row">
                  <span className="muted">Course</span>
                  <span style={{ textAlign: 'right' }}>{primary?.title ?? '—'}</span>
                </div>
                <div className="kv-row">
                  <span className="muted">Enrolled On</span>
                  <span>{primary ? formatDate(primary.enrolledAt) : '—'}</span>
                </div>
                <div className="kv-row">
                  <span className="muted">Access Until</span>
                  <span>{accessEndsOn ? formatDate(accessEndsOn) : courses.length ? 'No end date' : '—'}</span>
                </div>
                <div className="kv-row">
                  <span className="muted">Email</span>
                  <span style={{ wordBreak: 'break-all', textAlign: 'right' }}>{user.email}</span>
                </div>
                <Link to="/student/profile" className="quick-link" style={{ marginTop: 14 }}>
                  <User size={18} aria-hidden="true" /> View Profile
                  <ChevronRight className="quick-link__chevron" aria-hidden="true" />
                </Link>
              </Card>

              {batch && (
                <Card title="My Batch" icon={Layers}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{batch.name}</div>
                  <div className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>
                    {batch.code} · {dateRange(batch.startDate, batch.endDate)}
                  </div>
                  <div className="kv-row">
                    <span className="muted">Professors</span>
                    <span style={{ textAlign: 'right' }}>{batch.professors.map((p) => p.fullName).join(', ') || '—'}</span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">Courses</span>
                    <span style={{ textAlign: 'right' }}>{batch.courses.map((c) => c.title).join(', ') || '—'}</span>
                  </div>
                  <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 10 }}>
                    Your videos, modules and assignments are the ones set for your batch.
                  </p>
                </Card>
              )}

              {fees.payable > 0 && (
                <Card title="Fees" icon={Wallet} action={<ViewAll to="/student/fees" label="Details" />}>
                  <div className="kv-row">
                    <span className="muted">Total fees</span>
                    <span className="num">{formatMoney(fees.payable, fees.currency)}</span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">Paid</span>
                    <span className="num">{formatMoney(fees.paid, fees.currency)}</span>
                  </div>
                  {fees.pending > 0 && (
                    <div className="kv-row">
                      <span className="muted">Awaiting verification</span>
                      <span className="num">{formatMoney(fees.pending, fees.currency)}</span>
                    </div>
                  )}
                  <div className="kv-row" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    <span>Pending balance</span>
                    <span className="num">
                      <Balance value={fees.balance} currency={fees.currency} />
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, Math.round((fees.paid / fees.payable) * 100))}
                    tone="green"
                    label="Share of fees paid"
                  />
                </Card>
              )}

              <UpcomingMeetingsCard
                meetings={upcomingMeetings}
                to="/student/meetings"
                sub={(m) => `${m.professorName} · ${m.batchName}`}
                emptyMessage="Classes your professors schedule for your batch appear here."
              />

              <Card title="Course Progress" icon={ChartColumn} action={<ViewAll to="/student/progress" label="Details" />}>
                {courses.length ? (
                  <>
                    <div className="progress-summary">
                      <ProgressRing value={overall} size={96} caption="overall" />
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>
                          {stats.completedCourses} of {stats.totalCourses} courses completed
                        </strong>
                        <div className="muted">Average progress across your courses</div>
                      </div>
                    </div>
                    {courses.map((c) => (
                      <div key={c.courseId} className="course-progress">
                        <div className="course-progress__head">
                          <Link to={`/student/courses/${c.courseId}`} className="course-progress__title">
                            {c.title}
                          </Link>
                          <StatusBadge status={c.status === 'active' ? (c.progress.itemsDone ? 'in_progress' : 'not_started') : c.status} />
                        </div>
                        <div className="course-progress__bar">
                          <ProgressBar
                            value={c.progress.percent}
                            tone={c.status === 'completed' ? 'green' : undefined}
                            label={`${c.title} progress`}
                          />
                          <span className="num">{c.progress.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <EmptyState title="No courses yet" />
                )}
              </Card>

              <Card title="Quick Links" icon={Zap}>
                <div className="tile-links">
                  {QUICK_LINKS.map(([label, to, Icon, color]) => (
                    <Link key={label} to={to} className="tile-link">
                      <Icon aria-hidden="true" style={{ color }} />
                      {label}
                    </Link>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        );
      }}
    </AsyncContent>
  );
}
