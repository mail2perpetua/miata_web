import { useState } from 'react';
import { CalendarDays, CalendarX, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AsyncContent, Button, Card, EmptyState, FilterSelect, PageHeader, Spinner, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { weekDates } from '@/features/shared/timetable';
import { ClassCard, ClassDetailsModal } from './ClassWidgets';
import { addDays, classState, dayLabel, dayParts, localDate, nearestClassDay, weekSchedule, weekStart } from '@/features/shared/classes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VIEWER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Course and module filters, week navigation (previous / Today / next) and the week shown. */
function Toolbar({ data, start, today, courseId, moduleId, loading, update, goTo }) {
  const course = data.courses.find((c) => String(c.id) === courseId);
  const many = data.courses.length > 1;
  const modules = (course ? [course] : data.courses).flatMap((c) =>
    c.modules.map((m) => ({ value: String(m.id), label: `${many && !course ? `${c.code} · ` : ''}M${m.number} · ${m.title}` })),
  );
  return (
    <div className="toolbar cls-toolbar">
      <div className="cls-weeknav" role="group" aria-label="Week">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          tooltip="Previous week"
          aria-label="Previous week"
          onClick={() => goTo(addDays(start, -7))}
        />
        <Button variant="secondary" size="sm" onClick={() => goTo(today)}>
          Today
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronRight}
          tooltip="Next week"
          aria-label="Next week"
          onClick={() => goTo(addDays(start, 7))}
        />
      </div>
      <h2 className="cls-weeknav__title" aria-live="polite">
        {weekDates({ startsOn: start, endsOn: addDays(start, 6) })}
      </h2>
      {start === weekStart(today) && <StatusBadge status="active" label="This week" tone="blue" />}
      {loading && <Spinner label="Loading classes" />}
      <div className="spacer" />
      <div className="cls-filters">
        <FilterSelect
          label="Course"
          allLabel="All courses"
          value={course ? courseId : undefined}
          onChange={(value) => update({ courseId: value, moduleId: undefined })}
          options={data.courses.map((c) => ({ value: String(c.id), label: c.title }))}
        />
        <FilterSelect
          label="Module"
          allLabel="All modules"
          value={moduleId}
          onChange={(value) => update({ moduleId: value })}
          options={modules}
        />
      </div>
    </div>
  );
}

/** Monday to Sunday with how many classes each day has; a day with classes scrolls to them. */
function WeekStrip({ days, today }) {
  return (
    <ol className="wk-strip" aria-label="Days of the week">
      {days.map((d) => {
        const n = d.classes.length;
        const [weekday, day] = dayParts(d.date);
        const content = (
          <>
            <span className="wk-strip__day">{weekday}</span>
            <span className="wk-strip__date num">{day}</span>
            <span className="wk-strip__count">{n ? `${n} class${n === 1 ? '' : 'es'}` : '—'}</span>
          </>
        );
        return (
          <li key={d.date} className={`wk-strip__cell${d.date === today ? ' is-today' : ''}${n ? ' has-classes' : ''}`}>
            {n ? (
              <button
                type="button"
                aria-label={`${dayLabel(d.date)}: ${n} class${n === 1 ? '' : 'es'}`}
                onClick={() => document.getElementById(`cls-day-${d.date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {content}
              </button>
            ) : (
              <div aria-label={`${dayLabel(d.date)}: no classes`}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The week's classes day by day, the sessions on a day still to be agreed, or a way to the nearest class. */
function WeekClasses({ classes, start, today, onOpen, goTo }) {
  const { days, open } = weekSchedule(classes, start);
  const inWeek = [...open, ...days.flatMap((d) => d.classes)];
  const count = (pred) => inWeek.filter(pred).length;
  const previous = nearestClassDay(classes, start, -1);
  const next = nearestClassDay(classes, start, 1);

  return (
    <>
      <WeekStrip days={days} today={today} />
      {inWeek.length > 0 && (
        <div className="cls-summary">
          <span>
            <strong className="num">{inWeek.length}</strong> class{inWeek.length === 1 ? '' : 'es'} this week
          </span>
          <span>{count((c) => c.mode === 'online')} online</span>
          <span>{count((c) => c.mode === 'offline')} offline</span>
          {count((c) => classState(c) === 'cancelled') > 0 && <span>{count((c) => classState(c) === 'cancelled')} cancelled</span>}
        </div>
      )}
      {inWeek.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No classes this week"
          message={next || previous ? 'Jump to the nearest week with classes.' : undefined}
          action={
            (previous || next) && (
              <div className="row row--wrap" style={{ justifyContent: 'center', gap: 8 }}>
                {previous && (
                  <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => goTo(previous)}>
                    Previous class · {dayLabel(previous, { short: true })}
                  </Button>
                )}
                {next && (
                  <Button variant="secondary" size="sm" onClick={() => goTo(next)}>
                    Next class · {dayLabel(next, { short: true })} <ChevronRight aria-hidden="true" />
                  </Button>
                )}
              </div>
            )
          }
        />
      ) : (
        <div className="cls-days">
          {open.length > 0 && (
            <section className="cls-day" aria-labelledby="cls-day-open">
              <header className="cls-day__head">
                <h3 id="cls-day-open">Day to be confirmed</h3>
                <span className="muted">Taught this week on a weekday or a day agreed with the lecturer</span>
              </header>
              <div className="cls-day__list">
                {open.map((c) => (
                  <ClassCard key={c.key} cls={c} onOpen={onOpen} />
                ))}
              </div>
            </section>
          )}
          {days
            .filter((d) => d.classes.length)
            .map((d) => (
              <section
                key={d.date}
                id={`cls-day-${d.date}`}
                className={`cls-day${d.date === today ? ' cls-day--today' : ''}`}
                aria-labelledby={`cls-day-${d.date}-title`}
              >
                <header className="cls-day__head">
                  <h3 id={`cls-day-${d.date}-title`}>{dayLabel(d.date)}</h3>
                  {d.date === today && <StatusBadge status="active" label="Today" tone="blue" />}
                </header>
                <div className="cls-day__list">
                  {d.classes.map((c) => (
                    <ClassCard key={c.key} cls={c} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </>
  );
}

/**
 * Every class of the student's courses, week by week (GET /student/classes): the weekly sessions of their courses'
 * timetables and their batch's online classes, with who teaches what, when, and how to join.
 */
export default function TimetablePage() {
  const [params, setParams] = useSearchParams();
  const courseId = params.get('courseId') || undefined;
  const moduleId = params.get('moduleId') || undefined;
  const state = useFetch('/student/classes', { courseId, moduleId });
  const [selected, setSelected] = useState(null);

  const today = localDate();
  const week = params.get('week');
  const start = weekStart(week && ISO_DATE.test(week) ? week : today);

  /** Change URL parameters (an empty value removes one). */
  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };
  // The current week needs no parameter.
  const goTo = (date) => update({ week: weekStart(date) === weekStart(today) ? undefined : weekStart(date) });
  const filtered = Boolean(courseId || moduleId);

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Your classes week by week: who teaches each module and topic, when each class takes place, and how to join online."
      />
      <AsyncContent state={state}>
        {(data) =>
          !data.classes.length && !filtered ? (
            <Card>
              <EmptyState
                icon={CalendarDays}
                title="No classes scheduled yet"
                message="Your classes appear here once your course’s timetable is published or a professor schedules an online class."
              />
            </Card>
          ) : (
            <Card flush className={`cls-week${state.loading ? ' is-refreshing' : ''}`} bodyClassName="cls-week__body">
              <Toolbar
                data={data}
                start={start}
                today={today}
                courseId={courseId}
                moduleId={moduleId}
                loading={state.loading}
                update={update}
                goTo={goTo}
              />
              {state.error && (
                <div style={{ padding: '14px 22px 0' }}>
                  <Alert tone="error">
                    Could not load these classes: {state.error.message}{' '}
                    <button type="button" className="link-btn" onClick={state.reload}>
                      Try again
                    </button>
                  </Alert>
                </div>
              )}
              {!data.classes.length ? (
                <EmptyState
                  icon={CalendarX}
                  title="No classes match these filters"
                  message={moduleId ? 'Online classes belong to a batch, not a module: choose All modules to see them.' : undefined}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => update({ courseId: undefined, moduleId: undefined })}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <WeekClasses classes={data.classes} start={start} today={today} onOpen={setSelected} goTo={goTo} />
              )}
              <p className="cls-footnote">Times are shown in your time zone ({VIEWER_ZONE}). Select a class for its full details.</p>
            </Card>
          )
        }
      </AsyncContent>
      {selected && <ClassDetailsModal cls={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
