import { useState } from 'react';
import { BookOpen, CalendarDays, Check, MoreVertical, SquareArrowOutUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Dropdown, EmptyState, ProgressBar, StatusBadge, Tabs, Tooltip, ViewAll } from '@/components';
import { MODULE_STATUSES, moduleStatusDetail, moduleStatusLabel } from '@/features/shared/moduleStatus';
import { weeksLabel } from '@/features/shared/timetable';
import { useModuleStatus } from './useModuleStatus';

/** A module's actions menu: set its status (the current one is ticked), open the module or its course timetable. */
export function ModuleActions({ module, busy, onStatus }) {
  return (
    <Dropdown
      panelClassName="module-status__menu"
      trigger={({ open, toggle }) => (
        <Button
          variant="ghost"
          size="sm"
          icon={MoreVertical}
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Actions for ${module.title}`}
          tooltip="Module actions: update its status"
        />
      )}
    >
      {({ close }) => (
        <div role="menu" aria-label={`${module.title} actions`}>
          <div className="dropdown__section">Module status</div>
          {MODULE_STATUSES.map(({ value, label, hint, icon: Icon }) => {
            const current = module.teachingStatus === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                className="dropdown__item"
                disabled={current || busy}
                onClick={() => {
                  close();
                  onStatus(module, value);
                }}
              >
                <Icon aria-hidden="true" />
                <span className="dropdown__item-text">
                  {label}
                  <small>{hint}</small>
                </span>
                {current && <Check aria-hidden="true" />}
              </button>
            );
          })}
          <div className="dropdown__divider" role="separator" />
          <Link to={`/professor/modules/${module.id}`} className="dropdown__item" role="menuitem" onClick={close}>
            <SquareArrowOutUpRight aria-hidden="true" /> Open module
          </Link>
          {module.weeks.length > 0 && (
            <Link to={`/professor/timetable?courseId=${module.courseId}`} className="dropdown__item" role="menuitem" onClick={close}>
              <CalendarDays aria-hidden="true" /> Open course timetable
            </Link>
          )}
        </div>
      )}
    </Dropdown>
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Your topics: A, B +3", or what the professor does in a module without sessions of theirs. */
function teachingNote(m) {
  if (m.myTopics.length) {
    const shown = m.myTopics.slice(0, 2).join(', ');
    return `Your topics: ${shown}${m.myTopics.length > 2 ? ` +${m.myTopics.length - 2} more` : ''}`;
  }
  return m.wholeCourse ? 'You teach this course as a whole' : 'Assigned to you as module professor';
}

/**
 * One module in a list: number, title (opens the module), lessons and weeks, its status and the actions menu.
 * `detailed` adds the course, topics, the professor's own topics and the sessions held (the Modules page).
 */
export function ModuleRow({ module: m, busy, onStatus, detailed = false, showCourse = false }) {
  return (
    <li className={`list__item module-row${detailed ? ' module-row--detailed' : ''}`}>
      <span className={`module-status__number is-${m.teachingStatus}`} aria-label={`Module ${m.number}`}>
        {m.number}
      </span>
      <div className="list__main">
        <Link to={`/professor/modules/${m.id}`} className="list__title module-status__title module-row__link">
          {m.title}
        </Link>
        <div className="list__sub">
          {[
            showCourse && m.courseTitle,
            plural(m.lessonCount, 'lesson'),
            detailed && plural(m.topicCount, 'topic'),
            m.weeks.length > 0 && weeksLabel(m.weeks),
            !detailed && m.professors.join(', '),
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {detailed && <div className="list__sub module-row__note">{teachingNote(m)}</div>}
      </div>
      {detailed && m.sessionCount > 0 && (
        <div className="module-row__progress" title={`${m.sessionsCompleted} of ${m.sessionCount} weekly sessions held`}>
          <span className="num">
            {m.sessionsCompleted}/{m.sessionCount} sessions
          </span>
          <ProgressBar value={(m.sessionsCompleted / m.sessionCount) * 100} label={`${m.title}: sessions held`} />
        </div>
      )}
      <Tooltip label={moduleStatusDetail(m)}>
        <StatusBadge status={m.teachingStatus} />
      </Tooltip>
      <ModuleActions module={m} busy={Boolean(busy)} onStatus={onStatus} />
    </li>
  );
}

/** "2 of 15 modules completed · 5 in progress" with the completed / in-progress bar. */
export function ModuleStatusSummary({ modules }) {
  const count = (status) => modules.filter((m) => m.teachingStatus === status).length;
  const completed = count('completed');
  const inProgress = count('in_progress');
  const share = (n) => `${(n / modules.length) * 100}%`;
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--fs-sm)' }}>
        <strong style={{ color: 'var(--ink)' }}>
          {completed} of {plural(modules.length, 'module')} completed
        </strong>
        <span className="muted">{inProgress} in progress</span>
      </div>
      <div className="status-split" aria-hidden="true">
        <span className="status-split__completed" style={{ width: share(completed) }} />
        <span className="status-split__in-progress" style={{ width: share(inProgress) }} />
      </div>
    </>
  );
}

/** All / Not Started / In Progress / Completed tabs with their counts. */
export function ModuleStatusTabs({ modules, value, onChange }) {
  return (
    <Tabs
      label="Show modules"
      value={value}
      onChange={onChange}
      tabs={[
        { value: 'all', label: 'All', count: modules.length },
        ...MODULE_STATUSES.map((s) => ({
          value: s.value,
          label: s.label,
          count: modules.filter((m) => m.teachingStatus === s.value).length,
        })),
      ]}
    />
  );
}

/**
 * The modules the professor teaches, grouped by course, with how far each has got: Not Started, In Progress or
 * Completed. Each module's actions menu changes its status; its title opens the module.
 */
export function ModuleStatusCard({ modules, onChange, loadError, onRetry }) {
  const { setStatus, busy } = useModuleStatus(onChange);
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? modules : modules.filter((m) => m.teachingStatus === filter);
  const courses = [...new Map(shown.map((m) => [m.courseId, m.courseTitle])).entries()];

  return (
    <Card
      title="My Modules"
      icon={BookOpen}
      subtitle="Mark each module you teach as Not Started, In Progress or Completed."
      action={<ViewAll to="/professor/modules" />}
      flush
    >
      {loadError && (
        <div style={{ padding: '0 22px 12px' }}>
          <Alert tone="error">
            Could not refresh module statuses: {loadError.message}{' '}
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </Alert>
        </div>
      )}
      <div style={{ padding: '0 22px' }}>
        <ModuleStatusSummary modules={modules} />
        <div style={{ marginTop: 14 }}>
          <ModuleStatusTabs modules={modules} value={filter} onChange={setFilter} />
        </div>
      </div>
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title={`No modules are ${moduleStatusLabel(filter)}`} />
      ) : (
        courses.map(([courseId, courseTitle]) => (
          <section key={courseId} aria-label={courseTitle}>
            <div className="module-status__course">{courseTitle}</div>
            <ul className="list">
              {shown
                .filter((m) => m.courseId === courseId)
                .map((m) => (
                  <ModuleRow key={m.id} module={m} busy={busy} onStatus={setStatus} />
                ))}
            </ul>
          </section>
        ))
      )}
    </Card>
  );
}
