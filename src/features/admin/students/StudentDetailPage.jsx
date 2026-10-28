import { useState } from 'react';
import {
  CalendarClock,
  CalendarX,
  ClipboardList,
  GraduationCap,
  Handshake,
  History,
  Layers,
  Pause,
  Play,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  Avatar,
  Button,
  Card,
  DataTable,
  EmptyState,
  InfoList,
  Modal,
  PageHeader,
  ProgressBar,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange, formatDate, formatDateTime, timeAgo } from '@/utils/format';
import { AccountActions } from '../shared/AccountActions';
import { CourseChecklist } from '../shared/PersonFormModal';
import { EnrolmentScheduleModal } from './EnrolmentModals';
import { StudentFeesCard } from './StudentFeesCard';

const REFERRAL_SOURCE = { link: 'Referral link', agent: 'Registered by the agent (Apply Now)', admin: 'Administrator' };

function EnrolInCoursesModal({ student, onClose, onDone }) {
  const courses = useFetch('/admin/lookups/courses');
  const enrolled = student.enrolments.map((e) => e.courseId);
  const applied = student.referral?.appliedCourseId;
  const [courseIds, setCourseIds] = useState(applied && !enrolled.includes(applied) ? [applied] : []);
  const { run, busy } = useApiAction();
  const submit = () =>
    run(() => api.post(`/admin/students/${student.id}/enrolments`, { courseIds }), {
      success: 'Enrolment saved',
      onDone: () => {
        onDone();
        onClose();
      },
    });
  return (
    <Modal
      open
      title={`Enrol ${student.fullName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!courseIds.length} loading={Boolean(busy)}>
            Enrol
          </Button>
        </>
      }
    >
      {courses.data && (
        <CourseChecklist
          courses={courses.data.filter((c) => !enrolled.includes(c.id))}
          value={courseIds}
          onChange={setCourseIds}
          label="Active courses"
        />
      )}
    </Modal>
  );
}

function ReferralCard({ student, onChange }) {
  const agents = useFetch('/admin/lookups/agents');
  const confirm = useConfirm();
  const { run } = useApiAction();
  const current = student.referral;

  const change = async (agentId) => {
    const agent = agents.data?.find((a) => a.id === Number(agentId));
    const ok = await confirm({
      title: agentId ? 'Change referring agent?' : 'Remove referral?',
      message: agentId
        ? `${student.fullName} will be attributed to ${agent?.fullName}. This change is recorded in the activity log.`
        : `${student.fullName} will no longer be attributed to ${current.agentName}. This change is recorded in the activity log.`,
      confirmLabel: agentId ? 'Change agent' : 'Remove referral',
      danger: !agentId,
    });
    if (ok)
      await run(() => api.put(`/admin/students/${student.id}/referral`, { agentId: agentId ? Number(agentId) : null }), {
        success: 'Referral updated',
        onDone: onChange,
      });
  };

  return (
    <Card title="Referral" icon={Handshake}>
      {current ? (
        <InfoList
          items={[
            [
              'Agent',
              <Link key="a" to={`/admin/agents/${current.agentId}`}>
                {current.agentName}
              </Link>,
            ],
            ['Agent code', current.agentCode],
            ['Attributed via', REFERRAL_SOURCE[current.source] ?? current.source],
            ...(current.source === 'agent'
              ? [
                  ['Applied for', current.appliedCourseTitle ?? 'No course chosen'],
                  ['Agent’s note', current.notes],
                ]
              : []),
            ['Since', formatDate(current.createdAt)],
          ]}
        />
      ) : (
        <p className="muted">Registered directly (no referring agent).</p>
      )}
      <div className="row row--wrap" style={{ marginTop: 14 }}>
        <select className="select" value="" onChange={(e) => e.target.value && change(e.target.value)} aria-label="Change referring agent">
          <option value="">{current ? 'Reassign to another agent…' : 'Attribute to an agent…'}</option>
          {(agents.data ?? [])
            .filter((a) => a.isActive && a.id !== current?.agentId)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName} ({a.code})
              </option>
            ))}
        </select>
        {current && (
          <Button variant="ghost" size="sm" onClick={() => change(null)}>
            Remove referral
          </Button>
        )}
      </div>
    </Card>
  );
}

/** The student's batch: it decides their courses, professors and which material and assignments they get. */
function BatchCard({ student, onChange }) {
  const batches = useFetch('/admin/lookups/batches');
  const confirm = useConfirm();
  const { run } = useApiAction();
  const current = student.batch;

  const change = async (batchId) => {
    const batch = batches.data?.find((b) => b.id === Number(batchId));
    const ok = await confirm({
      title: batchId ? (current ? 'Move to another batch?' : 'Add to batch?') : 'Remove from batch?',
      message: batchId
        ? `${student.fullName} will join ${batch?.name} and be enrolled in its courses. Existing enrolments, submissions and progress are kept.`
        : `${student.fullName} will leave ${current.name}. Enrolments, submissions and progress are kept; batch-only material is no longer shown.`,
      confirmLabel: batchId ? (current ? 'Move student' : 'Add to batch') : 'Remove from batch',
      danger: !batchId,
    });
    if (ok)
      await run(() => api.put(`/admin/students/${student.id}/batch`, { batchId: batchId ? Number(batchId) : null }), {
        success: batchId ? 'Batch updated' : 'Removed from batch',
        onDone: onChange,
      });
  };

  return (
    <Card title="Batch" icon={Layers}>
      {current ? (
        <InfoList
          items={[
            [
              'Batch',
              <Link key="b" to={`/admin/batches/${current.id}`}>
                {current.name}
              </Link>,
            ],
            ['Code', current.code],
            ['Schedule', dateRange(current.startDate, current.endDate)],
            ['Courses', current.courses.map((c) => c.title).join(', ')],
            ['Professors', current.professors.map((p) => p.fullName).join(', ')],
            ['Since', formatDate(current.addedAt)],
          ]}
        />
      ) : (
        <p className="muted">Not in a batch: the student sees course-wide material and work only.</p>
      )}
      <div className="row row--wrap" style={{ marginTop: 14 }}>
        <select className="select" value="" onChange={(e) => e.target.value && change(e.target.value)} aria-label="Change batch">
          <option value="">{current ? 'Move to another batch…' : 'Add to a batch…'}</option>
          {(batches.data ?? [])
            .filter((b) => b.isActive && b.id !== current?.id)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
        </select>
        {current && (
          <Button variant="ghost" size="sm" onClick={() => change(null)}>
            Remove from batch
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function StudentDetailPage() {
  const { userId } = useParams();
  const state = useFetch(`/admin/students/${userId}`);
  const [enrolling, setEnrolling] = useState(false);
  const [scheduling, setScheduling] = useState(null);
  const confirm = useConfirm();
  const { run } = useApiAction();

  const setEnrolmentStatus = (e, status) =>
    run(() => api.patch(`/admin/enrolments/${e.enrolmentId}`, { status }), { success: 'Enrolment updated', onDone: state.reload });
  const removeEnrolment = async (e) => {
    if (
      await confirm({
        title: `Remove from ${e.courseTitle}?`,
        message: 'Submissions are kept, but the student loses access to the course.',
        confirmLabel: 'Remove',
        danger: true,
      })
    ) {
      await run(() => api.delete(`/admin/enrolments/${e.enrolmentId}`), { success: 'Enrolment removed', onDone: state.reload });
    }
  };

  return (
    <AsyncContent state={state}>
      {(s) => (
        <>
          <PageHeader
            back={{ to: '/admin/students', label: 'All students' }}
            title={s.fullName}
            subtitle={
              <>
                {s.profile?.studentCode} · <StatusBadge status={s.status} />
                {s.deactivatedReason === 'course_expired' && (
                  <span className="badge badge--red" style={{ marginLeft: 6 }}>
                    Course access ended
                  </span>
                )}
                {s.mustResetPassword && (
                  <span className="badge badge--amber" style={{ marginLeft: 6 }}>
                    Password change pending
                  </span>
                )}
              </>
            }
            actions={<AccountActions role="student" person={s} onChange={state.reload} />}
          />
          {s.deactivatedReason === 'course_expired' && (
            <div style={{ marginBottom: 'var(--gutter)' }}>
              <Alert tone="warning" icon={CalendarX}>
                {s.fullName}’s course access ended on {formatDate(s.access.accessEndsOn ?? s.access.accessExpiredOn)}, so the account was
                deactivated automatically. Extend a course’s access period below to give more time — the account is then reactivated
                automatically.
              </Alert>
            </div>
          )}
          <div className="split">
            <div className="stack">
              <Card
                title="Enrolments & progress"
                icon={GraduationCap}
                flush
                action={
                  <Button size="sm" icon={Plus} onClick={() => setEnrolling(true)}>
                    Enrol in course
                  </Button>
                }
              >
                <DataTable
                  rows={s.enrolments}
                  rowKey="enrolmentId"
                  columns={[
                    {
                      key: 'course',
                      header: 'Course',
                      render: (e) => (
                        <span>
                          <Link to={`/admin/courses/${e.courseId}`} className="cell-person__name">
                            {e.courseTitle}
                          </Link>
                          <span className="cell-person__sub" style={{ display: 'block' }}>
                            {e.batchName ? `With ${e.batchName}` : 'Not taken with a batch'}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'access',
                      header: 'Access period',
                      render: (e) => (
                        <span className="row" style={{ gap: 4 }}>
                          <span className="nowrap">
                            {e.endDate ? `Until ${formatDate(e.endDate)}` : 'No end date'}
                            <span className="cell-person__sub" style={{ display: 'block' }}>
                              From {formatDate(e.startDate)}
                            </span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={CalendarClock}
                            onClick={() => setScheduling(e)}
                            aria-label={`Change access period for ${e.courseTitle}`}
                            title="Change access period"
                          />
                        </span>
                      ),
                    },
                    {
                      key: 'progress',
                      header: 'Progress',
                      render: (e) => (
                        <div style={{ minWidth: 170 }}>
                          <div className="row">
                            <ProgressBar value={e.progress.percent} />
                            <strong className="num">{e.progress.percent}%</strong>
                          </div>
                          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                            Videos {e.progress.videosDone}/{e.progress.videosTotal} · Assignments {e.progress.assignmentsDone}/
                            {e.progress.assignmentsTotal}
                          </span>
                        </div>
                      ),
                    },
                    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
                    {
                      key: 'actions',
                      header: <span className="sr-only">Actions</span>,
                      align: 'right',
                      render: (e) =>
                        e.status === 'completed' ? (
                          <span className="muted nowrap">{formatDate(e.completedAt)}</span>
                        ) : (
                          <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                            {e.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Pause}
                                onClick={() => setEnrolmentStatus(e, 'suspended')}
                                aria-label="Suspend"
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Play}
                                onClick={() => setEnrolmentStatus(e, 'active')}
                                aria-label="Reactivate"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => removeEnrolment(e)}
                              aria-label="Remove enrolment"
                            />
                          </span>
                        ),
                    },
                  ]}
                  empty={
                    <EmptyState
                      icon={GraduationCap}
                      title="Not enrolled yet"
                      message="Enrol the student in a course to give them access."
                    />
                  }
                />
              </Card>

              <StudentFeesCard student={s} onChange={state.reload} />

              <Card title="Assignments" icon={ClipboardList} flush>
                <DataTable
                  rows={s.assignments}
                  columns={[
                    {
                      key: 'title',
                      header: 'Assignment',
                      render: (a) => (
                        <span>
                          <strong>{a.title}</strong>
                          <span className="cell-person__sub" style={{ display: 'block' }}>
                            {a.courseTitle}
                            {a.moduleTitle ? ` · ${a.moduleTitle}` : ''}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'assignedTo',
                      header: 'Assigned to',
                      render: (a) =>
                        a.batchId ? (
                          <span className="badge badge--purple">{a.forSelectedStudents ? `${a.batchName} · selected` : a.batchName}</span>
                        ) : (
                          <span className="muted nowrap">Whole course</span>
                        ),
                    },
                    { key: 'dueAt', header: 'Due', render: (a) => <span className="nowrap">{formatDate(a.dueAt)}</span> },
                    { key: 'attempt', header: 'Attempt', align: 'right', render: (a) => a.attemptNo ?? '—' },
                    { key: 'submittedAt', header: 'Submitted', render: (a) => (a.submittedAt ? formatDate(a.submittedAt) : '—') },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (a) =>
                        a.submissionId ? (
                          <Link to={`/admin/submissions/${a.submissionId}`}>
                            <StatusBadge status={a.status} />
                          </Link>
                        ) : (
                          <StatusBadge status={a.isOverdue ? 'inactive' : 'pending'} label={a.isOverdue ? 'Overdue' : 'Not submitted'} />
                        ),
                    },
                  ]}
                  empty={
                    <EmptyState
                      icon={ClipboardList}
                      title="No assignments"
                      message="Assignments appear once the student is enrolled in a course that has them."
                    />
                  }
                />
              </Card>
            </div>

            <div className="stack">
              <Card title="Profile" icon={UserRound}>
                <div className="profile-summary">
                  <Avatar name={s.fullName} size="lg" />
                  <div>
                    <strong>{s.fullName}</strong>
                    <div className="muted">{s.email}</div>
                  </div>
                </div>
                <InfoList
                  items={[
                    ['Phone', s.phone],
                    ['Date of birth', s.profile?.dateOfBirth ? formatDate(s.profile.dateOfBirth) : null],
                    ['Qualification', s.profile?.qualification],
                    ['Address', s.profile?.address],
                    ['City', s.profile?.city],
                    ['Country', s.profile?.country],
                    ['Registered', formatDate(s.createdAt)],
                    [
                      'Access until',
                      s.access.accessEndsOn ? formatDate(s.access.accessEndsOn) : s.enrolments.length ? 'No end date' : 'Not enrolled',
                    ],
                    ['Last sign-in', formatDateTime(s.lastLoginAt)],
                  ]}
                />
              </Card>
              <BatchCard student={s} onChange={state.reload} />
              <ReferralCard student={s} onChange={state.reload} />
              <Card title="Recent activity" icon={History} flush>
                {s.activity.length ? (
                  <ul className="list">
                    {s.activity.map((a) => (
                      <li key={a.id} className="list__item">
                        <div className="list__main">
                          <div className="list__title" style={{ whiteSpace: 'normal' }}>
                            {a.description}
                          </div>
                          <div className="list__sub">{timeAgo(a.createdAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No activity yet" />
                )}
              </Card>
            </div>
          </div>
          {enrolling && <EnrolInCoursesModal student={s} onClose={() => setEnrolling(false)} onDone={state.reload} />}
          {scheduling && <EnrolmentScheduleModal enrolment={scheduling} onClose={() => setScheduling(null)} onSaved={state.reload} />}
        </>
      )}
    </AsyncContent>
  );
}
