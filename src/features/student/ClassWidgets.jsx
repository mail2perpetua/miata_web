import { CalendarClock, ExternalLink, MonitorPlay, School } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Avatar, Button, Card, DataTable, EmptyState, InfoList, Modal, PersonCell, StatusBadge, ViewAll } from '@/components';
import { PLATFORM_LABEL } from '@/features/shared/meetings';
import { JoinMeetingButton } from '@/features/shared/MeetingWidgets';
import { sessionLength, weekLabel } from '@/features/shared/timetable';
import {
  CLASS_STATE,
  classClock,
  classDateLabel,
  classState,
  classTimeLabel,
  classWhenShort,
  MODE_LABEL,
  moduleLabel,
} from '@/features/shared/classes';

// A student's classes (weekly sessions and online classes) and the faculty who teach them: pieces shared by the
// Timetable page and the course page.

export function ClassStateBadge({ cls }) {
  const state = classState(cls);
  const [label, tone] = CLASS_STATE[state];
  return <StatusBadge status={state} label={label} tone={tone} />;
}

/** Online (with its platform) or offline. */
export function ClassModeChip({ cls }) {
  const Icon = cls.mode === 'online' ? MonitorPlay : School;
  return (
    <span className={`chip cls-mode cls-mode--${cls.mode}`}>
      <Icon aria-hidden="true" />
      {MODE_LABEL[cls.mode]}
      {cls.platform ? ` · ${PLATFORM_LABEL[cls.platform]}` : ''}
    </span>
  );
}

/** The online class's Join link while it is upcoming or live. */
export const JoinClassButton = ({ cls }) => <JoinMeetingButton meeting={{ ...cls, title: cls.topic }} />;

/** Course and module of a class; an online class belongs to its batch, not to a module. */
function ClassPlace({ cls }) {
  return (
    <div className="cls-card__place">
      <span className="cls-card__course">{cls.courseTitle ?? cls.batchName}</span>
      {cls.moduleId ? (
        <span className="chip tt-module" title={cls.moduleTitle}>
          {moduleLabel(cls)}
        </span>
      ) : (
        cls.courseTitle && cls.batchName && <span className="muted">{cls.batchName}</span>
      )}
    </div>
  );
}

/**
 * One class in a list: time, topic, course and module, lecturer, status and type (with the Join link). The whole card
 * opens the details; the topic is the keyboard-accessible button.
 */
export function ClassCard({ cls, onOpen }) {
  const state = classState(cls);
  const times = classClock(cls);
  return (
    <article className={`cls-card cls-card--${cls.mode} is-${state}`} onClick={() => onOpen(cls)}>
      <div className="cls-card__time">
        {times ? (
          <>
            <strong className="num">{times[0]}</strong>
            {times[1] && <span className="num">{times[1]}</span>}
          </>
        ) : cls.startTime ? (
          <strong className="num">{classTimeLabel(cls)}</strong>
        ) : (
          <span>Time TBC</span>
        )}
        {cls.durationMinutes && <span className="cls-card__length">{sessionLength(cls.durationMinutes)}</span>}
      </div>
      <div className="cls-card__main">
        <button
          type="button"
          className="cls-card__topic"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(cls);
          }}
        >
          {cls.topic}
        </button>
        <ClassPlace cls={cls} />
        <div className="cls-card__who">
          <Avatar name={cls.lecturerName ?? '?'} size="sm" />
          <span>{cls.lecturerName ?? 'Lecturer to be confirmed'}</span>
          {cls.weekNumber && <span className="muted">· {weekLabel(cls.weekNumber)}</span>}
        </div>
      </div>
      <div className="cls-card__side">
        <ClassStateBadge cls={cls} />
        <ClassModeChip cls={cls} />
        <JoinClassButton cls={cls} />
      </div>
    </article>
  );
}

/** Everything about one class. */
export function ClassDetailsModal({ cls, onClose }) {
  const online = cls.kind === 'online';
  const state = classState(cls);
  const person = cls.professor;
  return (
    <Modal
      open
      title={cls.topic}
      onClose={onClose}
      footer={
        <>
          {cls.courseId && (
            <Button variant="secondary" to={`/student/courses/${cls.courseId}${cls.moduleId ? `#module-${cls.moduleId}` : ''}`}>
              Open course
            </Button>
          )}
          <JoinClassButton cls={cls} />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className="row row--wrap" style={{ gap: 8 }}>
          <ClassStateBadge cls={cls} />
          <ClassModeChip cls={cls} />
          {cls.weekNumber && <span className="chip">Programme {weekLabel(cls.weekNumber)}</span>}
        </div>
        {state === 'cancelled' && (
          <Alert tone="warning">This class has been cancelled{cls.cancelReason ? `: ${cls.cancelReason}` : '.'}</Alert>
        )}
        <InfoList
          items={[
            ['Course', cls.courseTitle ?? (online ? `Your batch: ${cls.batchName}` : null)],
            ['Module', moduleLabel(cls) ?? (online ? 'Not linked to a module' : null)],
            ['Topic', cls.topic],
            [
              online ? 'Professor' : 'Lecturer',
              cls.lecturerName && (
                <PersonCell
                  key="person"
                  name={cls.lecturerName}
                  sub={[person?.specialization, person?.department].filter(Boolean).join(' · ') || undefined}
                />
              ),
            ],
            ['Date', classDateLabel(cls)],
            ['Time', cls.startsAt ? `${classTimeLabel(cls)} (your time)` : classTimeLabel(cls)],
            ['Duration', sessionLength(cls.durationMinutes)],
            ['Class type', `${MODE_LABEL[cls.mode]}${cls.platform ? ` · ${PLATFORM_LABEL[cls.platform]}` : ''}`],
            ['Status', CLASS_STATE[state][0]],
            [
              'Meeting link',
              online &&
                (cls.meetingUrl ? (
                  <a key="link" href={cls.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                    {cls.meetingUrl} <ExternalLink size={13} aria-hidden="true" style={{ verticalAlign: -2 }} />
                  </a>
                ) : (
                  'Withdrawn: the class was cancelled'
                )),
            ],
            ['Batch', cls.batchName],
            ['Notes', cls.details && <span style={{ whiteSpace: 'pre-wrap' }}>{cls.details}</span>],
          ].filter(([, value]) => value !== null && value !== undefined && value !== false && value !== '')}
        />
      </div>
    </Modal>
  );
}

/** A module's sessions: week, date and day, time, topic, lecturer, type and status. A row opens the class. */
export function SessionSchedule({ sessions, onOpen }) {
  return (
    <DataTable
      compact
      rows={sessions}
      rowKey="key"
      onRowClick={onOpen}
      caption="Session schedule"
      columns={[
        { key: 'week', header: 'Week', render: (s) => <span className="nowrap num">{s.weekNumber ? weekLabel(s.weekNumber) : '—'}</span> },
        { key: 'date', header: 'Date & day', render: (s) => <span className="cls-cell-date">{classDateLabel(s, { short: true })}</span> },
        {
          key: 'time',
          header: 'Time',
          render: (s) =>
            s.startsAt || s.startTime ? (
              <span className="nowrap">{classTimeLabel(s)}</span>
            ) : (
              <span className="muted" title="Time to be confirmed">
                TBC
              </span>
            ),
        },
        {
          key: 'topic',
          header: 'Topic',
          className: 'cls-cell-topic',
          render: (s) => (
            <button
              type="button"
              className="cls-link"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(s);
              }}
            >
              {s.topic}
            </button>
          ),
        },
        { key: 'lecturer', header: 'Lecturer', render: (s) => <span className="nowrap">{s.lecturerName ?? '—'}</span> },
        { key: 'type', header: 'Type', render: (s) => <ClassModeChip cls={s} /> },
        { key: 'status', header: 'Status', render: (s) => <ClassStateBadge cls={s} /> },
      ]}
    />
  );
}

/** The course's next classes (sessions and online classes), for the course page. */
export function UpcomingClassesCard({ classes, courseId, onOpen }) {
  return (
    <Card
      title="Upcoming classes"
      icon={CalendarClock}
      action={<ViewAll to={`/student/timetable?courseId=${courseId}`} label="Timetable" />}
      flush
    >
      {classes.length ? (
        <ul className="list">
          {classes.map((c) => (
            <li key={c.key} className="list__item" style={{ alignItems: 'flex-start' }}>
              <div className="list__main">
                <button type="button" className="cls-link list__title" style={{ whiteSpace: 'normal' }} onClick={() => onOpen(c)}>
                  {c.topic}
                </button>
                <div className="list__sub">{classWhenShort(c)}</div>
                <div className="list__sub">
                  {c.lecturerName}
                  {moduleLabel(c) ? ` · ${moduleLabel(c)}` : ''}
                </div>
                <div className="row row--wrap" style={{ gap: 6, marginTop: 6 }}>
                  <ClassModeChip cls={c} />
                  <JoinClassButton cls={c} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={CalendarClock} title="No upcoming classes" message="Classes appear here once they are scheduled." />
      )}
    </Card>
  );
}
