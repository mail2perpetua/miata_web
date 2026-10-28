import { useState } from 'react';
import {
  BookOpen,
  CircleCheck,
  ClipboardList,
  GraduationCap,
  Layers,
  MessageSquare,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  AsyncContent,
  Avatar,
  Button,
  Card,
  DataTable,
  EmptyState,
  InfoList,
  PageHeader,
  StatCard,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange, formatDate, formatDateTime, timeAgo } from '@/utils/format';
import { AccountActions } from '../shared/AccountActions';

export default function ProfessorDetailPage() {
  const { userId } = useParams();
  const state = useFetch(`/admin/professors/${userId}`);
  const courses = useFetch('/admin/lookups/courses');
  const [courseToAssign, setCourseToAssign] = useState('');
  const confirm = useConfirm();
  const { run, busy } = useApiAction();

  const assign = () =>
    run(() => api.post(`/admin/courses/${courseToAssign}/professors`, { professorId: Number(userId) }), {
      success: 'Assigned to course',
      key: 'assign',
      onDone: () => {
        setCourseToAssign('');
        state.reload();
      },
    });

  const unassign = async (kind, target) => {
    const ok = await confirm({
      title: `Remove from ${target.title}?`,
      message: 'The professor will no longer review its assignments.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok)
      await run(() => api.delete(`/admin/${kind}s/${target.id}/professors/${userId}`), {
        success: 'Assignment removed',
        onDone: state.reload,
      });
  };

  return (
    <AsyncContent state={state}>
      {(p) => {
        const assignedIds = p.courses.map((c) => c.id);
        return (
          <>
            <PageHeader
              back={{ to: '/admin/professors', label: 'All professors' }}
              title={p.fullName}
              subtitle={
                <>
                  {p.profile?.employeeCode} · {p.profile?.specialization || 'Professor'} ·{' '}
                  <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                </>
              }
              actions={<AccountActions role="professor" person={p} onChange={state.reload} />}
            />
            <div className="dash-grid dash-grid--stats4" style={{ marginBottom: 'var(--gutter)' }}>
              <StatCard icon={Users} tone="blue" label="Assigned students" value={p.workload.studentCount} />
              <StatCard
                icon={ClipboardList}
                tone="amber"
                label="Pending reviews"
                value={p.workload.pendingReviews}
                to={`/admin/assignments?tab=submissions&professorId=${p.id}&status=pending`}
              />
              <StatCard icon={CircleCheck} tone="green" label="Completed reviews" value={p.workload.completedReviews} />
              <StatCard icon={RefreshCw} tone="orange" label="Awaiting rework" value={p.workload.reworkCount} />
            </div>
            <div className="split">
              <div className="stack">
                <Card title="Assigned courses" icon={GraduationCap} subtitle="Reviews every assignment of these courses." flush>
                  <div className="toolbar">
                    <select
                      className="select select--inline"
                      value={courseToAssign}
                      onChange={(e) => setCourseToAssign(e.target.value)}
                      aria-label="Course to assign"
                    >
                      <option value="">Select a course…</option>
                      {(courses.data ?? [])
                        .filter((c) => c.isActive && !assignedIds.includes(c.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                    </select>
                    <Button size="sm" disabled={!courseToAssign} loading={busy === 'assign'} onClick={assign}>
                      Assign to course
                    </Button>
                  </div>
                  <DataTable
                    rows={p.courses}
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
                      {
                        key: 'studentCount',
                        header: 'Students',
                        align: 'right',
                        render: (c) => <span className="num">{c.studentCount}</span>,
                      },
                      { key: 'assignedAt', header: 'Assigned', render: (c) => formatDate(c.assignedAt) },
                      { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
                      {
                        key: 'x',
                        header: <span className="sr-only">Actions</span>,
                        align: 'right',
                        render: (c) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => unassign('course', c)}
                            aria-label={`Remove from ${c.title}`}
                          />
                        ),
                      },
                    ]}
                    empty={<EmptyState icon={GraduationCap} title="No courses assigned" />}
                  />
                </Card>
                <Card
                  title="Assigned modules"
                  icon={BookOpen}
                  subtitle="Module-only assignments (manage them from the course's Modules tab)."
                  flush
                >
                  <DataTable
                    rows={p.modules}
                    columns={[
                      { key: 'title', header: 'Module', render: (m) => <strong>{m.title}</strong> },
                      { key: 'course', header: 'Course', render: (m) => <Link to={`/admin/courses/${m.courseId}`}>{m.courseTitle}</Link> },
                      { key: 'assignedAt', header: 'Assigned', render: (m) => formatDate(m.assignedAt) },
                      {
                        key: 'x',
                        header: <span className="sr-only">Actions</span>,
                        align: 'right',
                        render: (m) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => unassign('module', m)}
                            aria-label={`Remove from ${m.title}`}
                          />
                        ),
                      },
                    ]}
                    empty={<EmptyState icon={BookOpen} title="No module assignments" />}
                  />
                </Card>
                <Card
                  title="Assigned batches"
                  icon={Layers}
                  subtitle="Teaches every course of these batches, to the batch's students only (manage them from the batch page)."
                  flush
                >
                  <DataTable
                    rows={p.batches}
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
                              {b.code}
                            </span>
                          </span>
                        ),
                      },
                      { key: 'courses', header: 'Courses', render: (b) => b.courseTitles || '—' },
                      { key: 'students', header: 'Students', align: 'right', render: (b) => <span className="num">{b.studentCount}</span> },
                      {
                        key: 'schedule',
                        header: 'Schedule',
                        render: (b) => <span className="nowrap">{dateRange(b.startDate, b.endDate)}</span>,
                      },
                      { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.isActive ? 'active' : 'inactive'} /> },
                    ]}
                    empty={<EmptyState icon={Layers} title="No batches assigned" />}
                  />
                </Card>
              </div>
              <div className="stack">
                <Card title="Profile" icon={UserRound}>
                  <div className="profile-summary">
                    <Avatar name={p.fullName} size="lg" />
                    <div>
                      <strong>{p.fullName}</strong>
                      <div className="muted">{p.email}</div>
                    </div>
                  </div>
                  <InfoList
                    items={[
                      ['Phone', p.phone],
                      ['Department', p.profile?.department],
                      ['Specialization', p.profile?.specialization],
                      ['Qualification', p.profile?.qualification],
                      ['Joined', formatDate(p.createdAt)],
                      ['Last sign-in', formatDateTime(p.lastLoginAt)],
                    ]}
                  />
                  {p.profile?.bio && (
                    <p className="muted" style={{ marginTop: 14, fontSize: 'var(--fs-sm)' }}>
                      {p.profile.bio}
                    </p>
                  )}
                </Card>
                <Card title="Recent reviews" icon={MessageSquare} flush>
                  {p.recentReviews.length ? (
                    <ul className="list">
                      {p.recentReviews.map((r) => (
                        <li key={r.id} className="list__item">
                          <div className="list__main">
                            <Link to={`/admin/submissions/${r.submissionId}`} className="list__title">
                              {r.assignmentTitle}
                            </Link>
                            <div className="list__sub">
                              {r.studentName} · {timeAgo(r.createdAt)}
                            </div>
                          </div>
                          <StatusBadge status={r.decision} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState title="No reviews yet" />
                  )}
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </AsyncContent>
  );
}
