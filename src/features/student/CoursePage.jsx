import { useState } from 'react';
import { CalendarClock, CalendarDays, ChevronDown, ChevronRight, CircleCheck, CirclePlay, ClipboardList, FileText } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AsyncContent, Avatar, Button, Card, EmptyState, PageHeader, ProgressRing, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { durationLabel, formatDate, formatDuration } from '@/utils/format';
import { ClassDetailsModal, SessionSchedule, UpcomingClassesCard } from './ClassWidgets';
import { classWhenShort, sessionWindow } from '@/features/shared/classes';

// Sessions shown in a module's schedule before "Show all".
const SCHEDULE_ROWS = 6;

function VideoRow({ video }) {
  return (
    <Link to={`/student/videos/${video.id}`} className="content-row">
      {video.completedAt ? <CircleCheck aria-hidden="true" style={{ color: 'var(--green-600)' }} /> : <CirclePlay aria-hidden="true" />}
      <span className="content-row__title">{video.title}</span>
      <span className="muted num">{formatDuration(video.durationSeconds)}</span>
    </Link>
  );
}

function AssignmentRow({ assignment }) {
  return (
    <Link to={`/student/assignments/${assignment.id}`} className="content-row">
      <ClipboardList aria-hidden="true" />
      <span className="content-row__title">{assignment.title}</span>
      {assignment.dueAt && <span className="muted nowrap">Due {formatDate(assignment.dueAt)}</span>}
      <StatusBadge status={assignment.status} />
    </Link>
  );
}

/** "Dr. Niveditha", "Dr. Bagyavasan, Dr. Niveditha", "Dr. Bagyavasan, Dr. Niveditha +3". */
const facultyNames = (faculty) =>
  `${faculty
    .slice(0, 2)
    .map((f) => f.name)
    .join(', ')}${faculty.length > 2 ? ` +${faculty.length - 2}` : ''}`;

/** In the module heading: who teaches it, its next class and how many sessions are done. */
function ModuleTeaching({ module: m }) {
  const { total, completed } = m.sessionStats;
  return (
    <span className="module__meta">
      {m.faculty.length > 0 ? (
        <span className="module__faculty" title={m.faculty.map((f) => f.name).join(', ')}>
          <span className="avatar-stack" aria-hidden="true">
            {m.faculty.slice(0, 3).map((f) => (
              <Avatar key={f.key} name={f.name} size="sm" />
            ))}
          </span>
          <span className="module__faculty-names">
            <span className="module__faculty-label">Faculty – </span>
            {facultyNames(m.faculty)}
          </span>
        </span>
      ) : (
        <span className="module__faculty">Faculty – To be announced</span>
      )}
      {total > 0 && (
        <>
          <span className="module__fact">
            <CalendarClock aria-hidden="true" />
            {m.nextClass ? `Next: ${classWhenShort(m.nextClass)}` : 'All sessions held'}
          </span>
          <span className="module__fact num">
            {completed}/{total} sessions
          </span>
        </>
      )}
    </span>
  );
}

/** Inside an open module: its session-wise schedule. Its faculty are shown once, in the module heading. */
function ModuleSchedule({ module: m, onOpenClass }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? m.sessions : sessionWindow(m.sessions, SCHEDULE_ROWS);
  return (
    <div className="module-teaching">
      <h3 className="module-section__title">
        <CalendarDays aria-hidden="true" /> Session schedule
        {m.sessionStats.total > 0 && (
          <span className="muted">
            · {m.sessionStats.completed} of {m.sessionStats.total} completed
          </span>
        )}
      </h3>
      {m.sessions.length ? (
        <>
          <SessionSchedule sessions={shown} onOpen={onOpenClass} />
          {m.sessions.length > SCHEDULE_ROWS && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)} style={{ marginTop: 6 }}>
              {showAll ? 'Show fewer sessions' : `Show all ${m.sessions.length} sessions`}
            </Button>
          )}
        </>
      ) : (
        <p className="muted module-section__empty">No classes are scheduled for this module yet.</p>
      )}
    </div>
  );
}

/** Course content in order: modules (with who teaches them and when) → lessons (with their videos) → module assignments. */
export default function CoursePage() {
  const { courseId } = useParams();
  const { hash } = useLocation();
  const state = useFetch(`/student/courses/${courseId}`);
  const [open, setOpen] = useState(() => new Set(hash.startsWith('#module-') ? [Number(hash.slice(8))] : []));
  const [selectedClass, setSelectedClass] = useState(null);

  const toggle = (id) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <AsyncContent state={state}>
      {(c) => {
        const p = c.enrolment.progress;
        const isOpen = (m, i) => open.has(m.id) || (open.size === 0 && i === 0);
        return (
          <>
            <PageHeader
              back={{ to: '/student/courses', label: 'My courses' }}
              title={c.title}
              subtitle={`${c.code} · ${durationLabel(c.durationValue, c.durationUnit)}${c.batchName ? ` · ${c.batchName}` : ''}${c.professors.length ? ` · ${c.professors.map((x) => x.fullName).join(', ')}` : ''}`}
            />
            <div className="split">
              <div className="curriculum">
                {c.modules.length === 0 && (
                  <Card>
                    <EmptyState title="Content coming soon" message="Your professors are preparing the modules for this course." />
                  </Card>
                )}
                {c.modules.map((m, i) => {
                  // Lessons with a week are the module's weekly sessions, listed in its schedule.
                  const topics = m.lessons.filter((l) => !l.weekNumber);
                  const topicIds = new Set(topics.map((l) => l.id));
                  return (
                    <div key={m.id} className="module" id={`module-${m.id}`}>
                      <button type="button" className="module__head" onClick={() => toggle(m.id)} aria-expanded={isOpen(m, i)}>
                        <span className="module__index">{i + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="module__title" style={{ display: 'block' }}>
                            {m.title}
                          </span>
                          <span className="module__sub">
                            {topics.length} lessons
                            {m.sessionStats.total > 0 && ` · ${m.sessionStats.total} sessions`} · {m.videos.length} videos ·{' '}
                            {m.assignments.length} assignments
                          </span>
                        </span>
                        <ModuleTeaching module={m} />
                        {m.status && <StatusBadge status={m.status === 'no_requirements' ? 'not_started' : m.status} />}
                        {isOpen(m, i) ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                      </button>
                      {isOpen(m, i) && (
                        <div className="module__body">
                          {m.description && (
                            <p className="muted" style={{ margin: '10px 0', fontSize: 'var(--fs-sm)' }}>
                              {m.description}
                            </p>
                          )}
                          <ModuleSchedule module={m} onOpenClass={setSelectedClass} />
                          {topics.length > 0 && (
                            <h3 className="module-section__title">
                              <FileText aria-hidden="true" /> Lessons
                            </h3>
                          )}
                          {topics.map((l, li) => (
                            <div key={l.id} className="lesson">
                              <FileText className="lesson__icon" size={18} aria-hidden="true" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="lesson__title">
                                  Lesson {li + 1}: {l.title}{' '}
                                  {l.durationMinutes ? <span className="muted">· {l.durationMinutes} min</span> : null}
                                </div>
                                {l.content && <div className="lesson__content">{l.content}</div>}
                                {m.videos
                                  .filter((v) => v.lessonId === l.id)
                                  .map((v) => (
                                    <VideoRow key={v.id} video={v} />
                                  ))}
                              </div>
                            </div>
                          ))}
                          {m.videos
                            .filter((v) => !topicIds.has(v.lessonId))
                            .map((v) => (
                              <VideoRow key={v.id} video={v} />
                            ))}
                          {m.assignments.map((a) => (
                            <AssignmentRow key={a.id} assignment={a} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(c.generalVideos.length > 0 || c.generalAssignments.length > 0) && (
                  <Card title="Course resources">
                    {c.generalVideos.map((v) => (
                      <VideoRow key={v.id} video={v} />
                    ))}
                    {c.generalAssignments.map((a) => (
                      <AssignmentRow key={a.id} assignment={a} />
                    ))}
                  </Card>
                )}
              </div>
              <div className="stack">
                <Card title="Your progress">
                  <div className="row" style={{ gap: 18 }}>
                    <ProgressRing value={p.percent} size={110} caption={c.enrolment.status === 'completed' ? 'Completed' : 'complete'} />
                    <div style={{ fontSize: 'var(--fs-sm)' }}>
                      {p.requiresVideos && (
                        <div className="kv-row">
                          <span className="muted">Videos watched</span>
                          <strong className="num">
                            {p.videosDone}/{p.videosTotal}
                          </strong>
                        </div>
                      )}
                      {p.requiresAssignments && (
                        <div className="kv-row">
                          <span className="muted">Assignments completed</span>
                          <strong className="num">
                            {p.assignmentsDone}/{p.assignmentsTotal}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                  {c.enrolment.status === 'completed' ? (
                    <p style={{ marginTop: 12 }}>
                      <StatusBadge status="completed" label={`Completed ${formatDate(c.enrolment.completedAt)}`} />
                    </p>
                  ) : (
                    <p className="muted" style={{ marginTop: 12, fontSize: 'var(--fs-sm)' }}>
                      The course completes automatically once every required video is watched and every required assignment is marked
                      Completed by your professor.
                    </p>
                  )}
                </Card>
                <UpcomingClassesCard classes={c.upcomingClasses} courseId={c.id} onOpen={setSelectedClass} />
              </div>
            </div>
            {selectedClass && <ClassDetailsModal cls={selectedClass} onClose={() => setSelectedClass(null)} />}
          </>
        );
      }}
    </AsyncContent>
  );
}
