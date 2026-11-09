import { useState } from 'react';
import { CalendarDays, ChartColumn, ClipboardList, Flag, ListOrdered, Save, Users, UsersRound } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  AsyncContent,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  PersonCell,
  ProgressBar,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import {
  CLASS_STATE,
  classDateLabel,
  classState,
  classTimeLabel,
  classWhenShort,
  designation,
  sessionWindow,
} from '@/features/shared/classes';
import { MODULE_STATUSES, moduleStatusDetail, moduleStatusLabel } from '@/features/shared/moduleStatus';
import { sessionLength, weekLabel, weeksLabel } from '@/features/shared/timetable';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange } from '@/utils/format';

// Sessions shown in the schedule before "Show all".
const SCHEDULE_ROWS = 8;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Not Started / In Progress / Completed, saved with PUT /professor/modules/:id/status. Setting a started module back to
 * Not Started clears its dates, so it asks first. `onSaved(module)` receives the module as saved.
 */
function ModuleStatusPanel({ module: m, onSaved }) {
  const [choice, setChoice] = useState(m.teachingStatus);
  const { run, busy } = useApiAction();
  const confirm = useConfirm();
  const changed = choice !== m.teachingStatus;

  const save = async () => {
    if (choice === 'not_started') {
      const ok = await confirm({
        title: 'Set this module back to Not Started?',
        message: 'Its start and completion dates are cleared. Every cohort taking the course sees the change.',
        confirmLabel: 'Set to Not Started',
      });
      if (!ok) return;
    }
    await run(() => api.put(`/professor/modules/${m.id}/status`, { status: choice }), {
      success: `“${m.title}” marked ${moduleStatusLabel(choice)}`,
      onDone: (res) => onSaved(res.data),
    });
  };

  return (
    <Card title="Module status" icon={Flag} subtitle="How far the teaching of this module has got. Every cohort taking the course sees it.">
      <div className="status-options" role="radiogroup" aria-label="Module status">
        {MODULE_STATUSES.map(({ value, label, hint, icon: Icon }) => (
          <label key={value} className={`status-option is-${value}${choice === value ? ' is-selected' : ''}`}>
            <input type="radio" name="module-status" value={value} checked={choice === value} onChange={() => setChoice(value)} />
            <Icon className="status-option__icon" aria-hidden="true" />
            <span className="status-option__text">
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
            {m.teachingStatus === value && <span className="status-option__current">Current</span>}
          </label>
        ))}
      </div>
      <p className="status-options__detail">{moduleStatusDetail(m)}</p>
      <div className="row row--wrap" style={{ gap: 8 }}>
        <Button icon={Save} onClick={save} disabled={!changed} loading={Boolean(busy)}>
          Save status
        </Button>
        {changed && (
          <Button variant="ghost" onClick={() => setChoice(m.teachingStatus)} disabled={Boolean(busy)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Status, sessions held, the professor's own sessions, topics, weeks and attached material. */
function TeachingProgress({ module: m }) {
  const held = m.sessionCount ? Math.round((m.sessionsCompleted / m.sessionCount) * 100) : 0;
  return (
    <Card title="Teaching progress" icon={ChartColumn}>
      <div className="row row--wrap" style={{ gap: 10, marginBottom: 14 }}>
        <StatusBadge status={m.teachingStatus} />
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {moduleStatusDetail(m)}
        </span>
      </div>
      {m.sessionCount > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 6 }}>
            <strong style={{ color: 'var(--ink)' }}>
              {m.sessionsCompleted} of {plural(m.sessionCount, 'weekly session')} held
            </strong>
            <span className="muted num">{held}%</span>
          </div>
          <ProgressBar value={held} label="Weekly sessions held" />
        </div>
      )}
      <div>
        {[
          [
            'Your sessions',
            m.mySessionCount ? `${m.mySessionCount} of ${m.sessionCount}` : m.wholeCourse ? 'You teach the course as a whole' : 'None',
          ],
          ['Next session', m.nextSession ? `${classWhenShort(m.nextSession)} · ${m.nextSession.lecturerName ?? 'no lecturer'}` : '—'],
          ['Weeks', m.weeks.length ? weeksLabel(m.weeks) : 'Not on the timetable'],
          ['Curriculum topics', m.topicCount],
          ['Videos · assignments', `${m.videoCount} · ${m.assignmentCount}`],
        ].map(([label, value]) => (
          <div key={label} className="kv-row">
            <span className="muted">{label}</span>
            <strong style={{ textAlign: 'right' }}>{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** The module's weekly sessions: week, date and day, time, topic, lecturer (the professor's own marked) and status. */
function SessionSchedule({ module: m }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? m.sessions : sessionWindow(m.sessions, SCHEDULE_ROWS);
  return (
    <Card
      title="Session schedule"
      icon={CalendarDays}
      subtitle={m.sessions.length ? `${m.sessionStats.completed} of ${m.sessionStats.total} held · from the course timetable` : undefined}
      flush
    >
      {m.sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No weekly sessions"
          message="This module has no sessions on the course timetable. Its curriculum topics are below."
        />
      ) : (
        <DataTable
          compact
          rows={shown}
          rowKey="key"
          caption="Session schedule"
          columns={[
            { key: 'week', header: 'Week', render: (s) => <span className="nowrap num">{weekLabel(s.weekNumber)}</span> },
            { key: 'date', header: 'Date & day', render: (s) => <span className="nowrap">{classDateLabel(s, { short: true })}</span> },
            {
              key: 'time',
              header: 'Time',
              render: (s) =>
                s.startsAt || s.startTime ? <span className="nowrap">{classTimeLabel(s)}</span> : <span className="muted">TBC</span>,
            },
            {
              key: 'topic',
              header: 'Topic & lecturer',
              className: 'cls-cell-topic',
              render: (s) => (
                <>
                  <div style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.topic}</div>
                  <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                    {s.lecturerName ?? 'No lecturer'}
                    {s.mine && ' (you)'}
                  </div>
                </>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (s) => {
                const [label, tone] = CLASS_STATE[classState(s)];
                return <StatusBadge status={classState(s)} label={label} tone={tone} />;
              },
            },
          ]}
        />
      )}
      {m.sessions.length > SCHEDULE_ROWS && (
        <div style={{ padding: '6px 22px 8px' }}>
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer sessions' : `Show all ${m.sessions.length} sessions`}
          </Button>
        </div>
      )}
    </Card>
  );
}

/** The module's curriculum topics in order. */
function Topics({ module: m }) {
  return (
    <Card title={`Curriculum topics (${m.topics.length})`} icon={ListOrdered} flush>
      {m.topics.length ? (
        <ol className="list module-topics">
          {m.topics.map((t) => (
            <li key={t.id} className="list__item">
              <div className="list__main">
                <div className="list__title" style={{ whiteSpace: 'normal' }}>
                  {t.title}
                </div>
                {(t.durationMinutes || t.videoCount > 0) && (
                  <div className="list__sub">
                    {[sessionLength(t.durationMinutes), t.videoCount > 0 && plural(t.videoCount, 'video')].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState icon={ListOrdered} title="No curriculum topics" message="An administrator adds topics to the module." />
      )}
    </Card>
  );
}

/** Who teaches the module: its lecturers and module professors, else the course's professors. */
function Faculty({ module: m, userId }) {
  return (
    <Card title="Faculty" icon={Users} flush>
      {m.faculty.length ? (
        <ul className="list">
          {m.faculty.map((f) => (
            <li key={f.key} className="list__item">
              <PersonCell
                name={f.name}
                sub={[designation(f), f.sessionsTotal > 0 && plural(f.sessionsTotal, 'session')].filter(Boolean).join(' · ')}
              />
              <div className="spacer" />
              {f.professor?.id === userId && <StatusBadge status="active" label="You" tone="blue" />}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Users} title="No faculty yet" />
      )}
    </Card>
  );
}

/** The cohorts (batches) studying the module. */
function Cohorts({ module: m }) {
  return (
    <Card title="Cohorts" icon={UsersRound} subtitle="Batches taking the course that this module is available to." flush>
      {m.cohorts.length ? (
        <ul className="list">
          {m.cohorts.map((c) => (
            <li key={c.id} className="list__item">
              <div className="list__main">
                <div className="list__title">{c.name}</div>
                <div className="list__sub">
                  {[c.code, plural(c.studentCount, 'student'), c.startDate && dateRange(c.startDate, c.endDate)]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              {c.mine && <StatusBadge status="active" label="Yours" tone="blue" />}
              {!c.isActive && <StatusBadge status="inactive" label="Inactive" tone="gray" />}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={UsersRound} title="No cohort yet" message="Students enrolled in the course directly study it too." />
      )}
    </Card>
  );
}

/**
 * One module the professor teaches (GET /professor/modules/:id): its status (which they set here), teaching progress,
 * session schedule, curriculum topics, faculty and cohorts.
 */
export default function ModulePage() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const state = useFetch(`/professor/modules/${moduleId}`);

  return (
    <AsyncContent state={state}>
      {(m) => (
        <>
          <PageHeader
            back={{ to: '/professor/modules', label: 'Modules' }}
            title={m.title}
            subtitle={`Module ${m.number} · ${m.courseTitle} (${m.courseCode}) · ${m.wholeCourse ? 'You teach the whole course' : 'You are its module professor'}`}
            actions={
              <>
                {m.sessionCount > 0 && (
                  <Button variant="secondary" icon={CalendarDays} to={`/professor/timetable?courseId=${m.courseId}`}>
                    Course timetable
                  </Button>
                )}
                <Button variant="secondary" icon={ClipboardList} to="/professor/assignments">
                  Assignments
                </Button>
              </>
            }
          />
          {m.description && <p className="module-page__description">{m.description}</p>}
          <div className="stack">
            <div className="dash-grid dash-grid--pair">
              <TeachingProgress module={m} />
              {/* Keyed on the saved status, so the choice resets to it after a save. */}
              <ModuleStatusPanel
                key={`${m.teachingStatus}-${m.teachingUpdatedAt}`}
                module={m}
                onSaved={(saved) => state.setData((d) => ({ ...d, ...saved }))}
              />
            </div>
            <div className="split">
              <div className="stack">
                <SessionSchedule module={m} />
                <Topics module={m} />
              </div>
              <div className="stack">
                <Faculty module={m} userId={user?.id} />
                <Cohorts module={m} />
              </div>
            </div>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
