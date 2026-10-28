import { CalendarDays, NotebookText, Pencil } from 'lucide-react';
import { Button, Card, DataTable, EmptyState, FilterSelect, StatusBadge, ViewAll } from '@/components';
import { useTimetableFilters } from '@/hooks/useTimetableFilters';
import { dateRange } from '@/utils/format';
import { emptySlot, sessionSummary, weekBounds, weekDates, weekLabel } from './timetable';

// A course's weekly timetable as the API returns it (GET /admin/courses/:id/timetable, /professor/timetable,
// /student/timetable): pieces shared by the admin, professor and student portals.

const STATUS = { upcoming: ['Not started', 'gray'], running: ['In progress', 'green'], finished: ['Finished', 'purple'] };

/** Course heading, academic year, dates, size and status. */
export function TimetableHeader({ timetable: t, action }) {
  const sessions = t.lecturers.reduce((n, l) => n + l.sessionCount, 0);
  return (
    <Card
      title={`${t.course.title} · Weekly Timetable${t.course.academicYear ? ` ${t.course.academicYear}` : ''}`}
      icon={CalendarDays}
      subtitle={t.course.description}
      action={action}
    >
      <div className="row row--wrap" style={{ gap: 10 }}>
        <strong>{t.course.startDate ? dateRange(t.course.startDate, t.course.endDate) : 'No dates set'}</strong>
        <span className="muted">
          {t.weekCount} programme weeks · {t.lecturers.length} lecturers · {sessions} sessions
        </span>
        {STATUS[t.status] && <StatusBadge status={t.status} label={STATUS[t.status][0]} tone={STATUS[t.status][1]} />}
        {t.currentWeek && <StatusBadge status="active" label={`This week: ${weekLabel(t.currentWeek)}`} tone="blue" />}
      </div>
    </Card>
  );
}

/**
 * The current week's sessions (the first week before the programme, the last after it); `mineIds` limits them.
 * `tiles` lays the sessions out as a grid of tiles, for a full-width card.
 */
export function TimetableThisWeekCard({ timetable: t, mineIds = [], to, title = 'This Week', tiles = false }) {
  const week = t.weeks[(t.currentWeek ?? (t.status === 'finished' ? t.weekCount : 1)) - 1];
  if (!week) return null;
  const sessions = week.sessions.filter((s) => !mineIds.length || mineIds.includes(s.courseLecturerId));
  return (
    <Card
      title={title}
      icon={CalendarDays}
      subtitle={`${t.course.title} · ${weekLabel(week.number)}${week.startsOn ? ` · ${weekDates(week)}` : ''}`}
      action={to && <ViewAll to={to} label="Timetable" />}
      flush
    >
      {sessions.length ? (
        <ul className={`list${tiles ? ' list--tiles' : ''}`}>
          {sessions.map((s) => {
            const lecturer = t.lecturers.find((l) => l.id === s.courseLecturerId);
            return (
              <li key={s.id} className="list__item" style={{ alignItems: 'flex-start' }}>
                <div className="list__main">
                  <div className="list__title" style={{ whiteSpace: 'normal' }}>
                    {s.title}
                  </div>
                  <div className="list__sub">{lecturer ? `${lecturer.lecturerName} · ${sessionSummary(lecturer)}` : 'No lecturer'}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className="chip tt-module" title={s.moduleTitle}>
                      M{s.moduleNumber} · {s.moduleTitle}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No sessions this week"
          message={mineIds.length ? 'You teach no session this week.' : undefined}
        />
      )}
    </Card>
  );
}

/** Lecturers of the course with their weekly session and weeks (read-only). `mineIds` marks the viewer's own. */
export function TimetableLecturers({ timetable: t, mineIds = [] }) {
  return (
    <Card title="Lecturers" subtitle="One session per lecturer per week while their module is active." flush>
      <DataTable
        rows={t.lecturers}
        columns={[
          {
            key: 'lecturer',
            header: 'Lecturer',
            render: (l) => (
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {l.lecturerName} {mineIds.includes(l.id) && <StatusBadge status="active" label="You" tone="blue" />}
              </span>
            ),
          },
          {
            key: 'allocation',
            header: 'Allocation',
            render: (l) => <span style={{ fontSize: 'var(--fs-sm)' }}>{l.allocation || '—'}</span>,
          },
          {
            key: 'session',
            header: 'Weekly session',
            render: (l) => <span style={{ fontSize: 'var(--fs-sm)' }}>{sessionSummary(l)}</span>,
          },
          {
            key: 'weeks',
            header: 'Weeks',
            render: (l) => (
              <span style={{ whiteSpace: 'nowrap' }}>{l.firstWeek ? `Weeks ${l.firstWeek}–${l.lastWeek}` : 'No sessions'}</span>
            ),
          },
        ]}
      />
    </Card>
  );
}

/**
 * Week blocks: one row per lecturer with their session (topic and module) or "module complete" once their stream has
 * ended. `lecturerId` / `moduleFiltered` narrow the rows; `mineIds` highlights the viewer's rows; `onEditSession`
 * (admin) adds an edit button to each session.
 */
export function TimetableWeeks({ timetable: t, lecturerId, moduleFiltered = false, mineIds = [], onEditSession }) {
  if (!t.weeks.length) return <EmptyState icon={CalendarDays} title="Nothing to show" message="No weeks match these filters." />;
  const rows = t.lecturers.filter((l) => !lecturerId || l.id === lecturerId);
  const unassigned = { id: null, lecturerName: 'No lecturer', lastWeek: null };
  return (
    <div>
      {t.weeks.map((week) => {
        const withoutLecturer = week.sessions.filter((s) => !s.courseLecturerId);
        const weekRows = [...rows, ...(withoutLecturer.length && !lecturerId ? [unassigned] : [])]
          .map((l) => ({ lecturer: l, sessions: week.sessions.filter((s) => s.courseLecturerId === l.id) }))
          // With a module filter, only the lecturers teaching that module that week.
          .filter((r) => r.sessions.length || !moduleFiltered);
        const past = t.status === 'finished' || (t.currentWeek && week.number < t.currentWeek);
        return (
          <section
            key={week.number}
            id={`tt-week-${week.number}`}
            className={`tt-week${week.number === t.currentWeek ? ' tt-week--current' : ''}${past ? ' tt-week--past' : ''}`}
            aria-label={`${weekLabel(week.number)}${week.startsOn ? `, ${weekDates(week)}` : ''}`}
          >
            <header className="tt-week__head">
              <h3 className="tt-week__title">
                {weekLabel(week.number)} {week.startsOn && <span className="tt-week__dates">| {weekDates(week)}</span>}
              </h3>
              {week.number === t.currentWeek && <StatusBadge status="active" label="This week" tone="blue" />}
            </header>
            {weekRows.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
                No sessions of this module this week.
              </p>
            ) : (
              <div className="tt-rows">
                {weekRows.map(({ lecturer, sessions }) => (
                  <div
                    key={lecturer.id ?? 'none'}
                    className={`tt-row${sessions.length ? '' : ' tt-row--empty'}${mineIds.includes(lecturer.id) ? ' tt-row--mine' : ''}`}
                  >
                    <div className="tt-row__who">
                      <div className="tt-row__name">{lecturer.lecturerName}</div>
                      {lecturer.id && <div className="tt-row__meta">{sessionSummary(lecturer)}</div>}
                    </div>
                    <div className="tt-row__what">
                      {sessions.length ? (
                        sessions.map((s) => (
                          <div key={s.id} className="tt-session">
                            <div className="tt-topic">
                              <span className="tt-row__topic">{s.title}</span>
                              {onEditSession && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Pencil}
                                  onClick={() => onEditSession(s)}
                                  aria-label={`Edit ${weekLabel(week.number)} session of ${lecturer.lecturerName}`}
                                />
                              )}
                            </div>
                            <span className="chip tt-module" title={s.moduleTitle}>
                              M{s.moduleNumber} · {s.moduleTitle}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="tt-row__none">{emptySlot(lecturer, week.number)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Week, module and lecturer selects, plus "Jump to this week". */
export function TimetableToolbar({ timetable: t, filters, setFilter, mineIds = [] }) {
  return (
    <div className="toolbar">
      <FilterSelect
        label="Week"
        allLabel="All weeks"
        value={filters.week ? String(filters.week) : undefined}
        onChange={setFilter('week')}
        options={Array.from({ length: t.weekCount }, (_, i) => ({
          value: String(i + 1),
          label: t.course.startDate ? `${weekLabel(i + 1)} · ${weekDates(weekBounds(t.course.startDate, i + 1))}` : weekLabel(i + 1),
        }))}
      />
      <FilterSelect
        label="Module"
        allLabel="All modules"
        value={filters.moduleId ? String(filters.moduleId) : undefined}
        onChange={setFilter('moduleId')}
        options={t.modules.map((m) => ({ value: String(m.id), label: `M${m.moduleNumber} · ${m.title}` }))}
      />
      <FilterSelect
        label="Lecturer"
        allLabel="All lecturers"
        value={filters.lecturerId ? String(filters.lecturerId) : undefined}
        onChange={setFilter('lecturerId')}
        options={t.lecturers.map((l) => ({
          value: String(l.id),
          label: mineIds.includes(l.id) ? `${l.lecturerName} (you)` : l.lecturerName,
        }))}
      />
      {t.currentWeek && !filters.week && (
        <Button
          variant="secondary"
          size="sm"
          icon={CalendarDays}
          onClick={() => document.getElementById(`tt-week-${t.currentWeek}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Jump to this week
        </Button>
      )}
    </div>
  );
}

/** The timetable notes, one per line. */
export function TimetableNotes({ notes }) {
  const lines = (notes ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <Card title="Timetable notes" icon={NotebookText}>
      <ul className="tt-notes">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Card>
  );
}

/** A complete read-only timetable (professor and student portals), filtered in the browser. */
export function CourseTimetableView({ timetable, mineIds = [] }) {
  const { filters, setFilter, view } = useTimetableFilters(timetable, mineIds.length === 1 ? { lecturerId: mineIds[0] } : {});
  return (
    <div className="stack" style={{ gap: 'var(--gutter)' }}>
      <TimetableHeader timetable={timetable} />
      <TimetableThisWeekCard timetable={timetable} mineIds={mineIds} title={mineIds.length ? 'My Sessions This Week' : 'This Week'} />
      <Card
        title="Weekly curriculum plan"
        subtitle="Each block is a programme week. A lecturer’s stream ends when their module is complete; it is not padded to the full programme."
        flush
      >
        <TimetableToolbar timetable={timetable} filters={filters} setFilter={setFilter} mineIds={mineIds} />
        <TimetableWeeks timetable={view} lecturerId={filters.lecturerId} moduleFiltered={Boolean(filters.moduleId)} mineIds={mineIds} />
      </Card>
      <TimetableLecturers timetable={timetable} mineIds={mineIds} />
      <TimetableNotes notes={timetable.course.scheduleNotes} />
    </div>
  );
}
