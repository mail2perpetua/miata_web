import { useState } from 'react';
import { BookOpen, CalendarDays, Check, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Dropdown, EmptyState, StatusBadge, Tabs, Tooltip } from '@/components';
import { MODULE_STATUSES, moduleStatusDetail, moduleStatusLabel } from '@/features/shared/moduleStatus';
import { weeksLabel } from '@/features/shared/timetable';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';

/** A module's actions menu: set its status (the current one is ticked) and open its course timetable. */
function ModuleActions({ module, busy, onStatus }) {
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
          {module.weeks.length > 0 && (
            <>
              <div className="dropdown__divider" role="separator" />
              <Link to={`/professor/timetable?courseId=${module.courseId}`} className="dropdown__item" role="menuitem" onClick={close}>
                <CalendarDays aria-hidden="true" /> Open course timetable
              </Link>
            </>
          )}
        </div>
      )}
    </Dropdown>
  );
}

/**
 * The modules the professor teaches, grouped by course, with how far each has got: Not Started, In Progress or
 * Completed. Each module's actions menu changes its status.
 */
export function ModuleStatusCard({ modules, onChange, loadError, onRetry }) {
  const { run, busy } = useApiAction();
  const [filter, setFilter] = useState('all');
  const count = (status) => modules.filter((m) => m.teachingStatus === status).length;
  const completed = count('completed');
  const inProgress = count('in_progress');
  const share = (n) => `${(n / modules.length) * 100}%`;
  const shown = filter === 'all' ? modules : modules.filter((m) => m.teachingStatus === filter);
  const courses = [...new Map(shown.map((m) => [m.courseId, m.courseTitle])).entries()];

  const setStatus = (m, status) =>
    run(() => api.put(`/professor/modules/${m.id}/status`, { status }), {
      success: `“${m.title}” marked ${moduleStatusLabel(status)}`,
      onDone: onChange,
    });

  return (
    <Card title="My Modules" icon={BookOpen} subtitle="Mark each module you teach as Not Started, In Progress or Completed." flush>
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
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--fs-sm)' }}>
          <strong style={{ color: 'var(--ink)' }}>
            {completed} of {modules.length} module{modules.length === 1 ? '' : 's'} completed
          </strong>
          <span className="muted">{inProgress} in progress</span>
        </div>
        <div className="status-split" aria-hidden="true">
          <span className="status-split__completed" style={{ width: share(completed) }} />
          <span className="status-split__in-progress" style={{ width: share(inProgress) }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Tabs
            label="Show modules"
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'All', count: modules.length },
              ...MODULE_STATUSES.map((s) => ({ value: s.value, label: s.label, count: count(s.value) })),
            ]}
          />
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
                  <li key={m.id} className="list__item">
                    <span className={`module-status__number is-${m.teachingStatus}`} aria-label={`Module ${m.number}`}>
                      {m.number}
                    </span>
                    <div className="list__main">
                      <span className="list__title module-status__title">{m.title}</span>
                      <div className="list__sub">
                        {[
                          `${m.lessonCount} lesson${m.lessonCount === 1 ? '' : 's'}`,
                          m.weeks.length > 0 && weeksLabel(m.weeks),
                          m.professors.join(', '),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    <Tooltip label={moduleStatusDetail(m)}>
                      <StatusBadge status={m.teachingStatus} />
                    </Tooltip>
                    <ModuleActions module={m} busy={Boolean(busy)} onStatus={setStatus} />
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </Card>
  );
}
