import { BookOpen, GraduationCap, UsersRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AsyncContent, Button, Card, EmptyState, PageHeader, SearchInput, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { moduleStatusLabel } from '@/features/shared/moduleStatus';
import { dateRange } from '@/utils/format';
import { ModuleRow, ModuleStatusSummary, ModuleStatusTabs } from './ModuleStatusCard';
import { useModuleStatus } from './useModuleStatus';

const GROUPINGS = [
  { value: 'course', label: 'By course', icon: GraduationCap },
  { value: 'cohort', label: 'By cohort', icon: UsersRound },
];

/** Modules by course (in course order), with the cohorts taking each course and whether the professor teaches it all. */
function byCourse(modules) {
  const groups = new Map();
  for (const m of modules) {
    if (!groups.has(m.courseId)) {
      groups.set(m.courseId, {
        key: `course-${m.courseId}`,
        icon: GraduationCap,
        title: m.courseTitle,
        subtitle: [m.courseCode, m.courseAcademicYear, m.courseStartDate && dateRange(m.courseStartDate, m.courseEndDate)]
          .filter(Boolean)
          .join(' · '),
        badges: [m.wholeCourse ? ['Whole course', 'blue'] : ['Module professor', 'sky']],
        cohorts: new Map(),
        modules: [],
      });
    }
    const group = groups.get(m.courseId);
    group.modules.push(m);
    for (const c of m.cohorts) group.cohorts.set(c.id, c);
  }
  return [...groups.values()].map((g) => ({
    ...g,
    note: g.cohorts.size ? `Cohorts: ${[...g.cohorts.values()].map((c) => c.name).join(', ')}` : 'No cohort takes this course yet',
  }));
}

/** Modules by the cohorts (batches) studying them — the professor's own first; a module may be in several. */
function byCohort(modules) {
  const groups = new Map();
  const add = (key, make, m) => {
    if (!groups.has(key)) groups.set(key, { ...make(), modules: [] });
    groups.get(key).modules.push(m);
  };
  for (const m of modules) {
    if (!m.cohorts.length) {
      add(
        'none',
        () => ({ key: 'cohort-none', icon: UsersRound, title: 'Not taken by a cohort', subtitle: 'Students enrolled directly', order: 2 }),
        m,
      );
    }
    for (const c of m.cohorts) {
      add(
        c.id,
        () => ({
          key: `cohort-${c.id}`,
          icon: UsersRound,
          title: c.name,
          subtitle: [
            c.code,
            `${c.studentCount} student${c.studentCount === 1 ? '' : 's'}`,
            c.startDate && dateRange(c.startDate, c.endDate),
          ]
            .filter(Boolean)
            .join(' · '),
          badges: [c.mine && ['Your cohort', 'blue'], !c.isActive && ['Inactive', 'gray']].filter(Boolean),
          order: c.mine && c.isActive ? 0 : 1,
        }),
        m,
      );
    }
  }
  return [...groups.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/**
 * The modules the professor teaches (GET /professor/modules) — every module of a course they teach as a whole, and the
 * modules assigned to them — grouped by course or cohort, with their topics, sessions and teaching status.
 */
export default function ModulesPage() {
  const state = useFetch('/professor/modules');
  const [params, setParams] = useSearchParams();
  const grouping = params.get('group') === 'cohort' ? 'cohort' : 'course';
  const status = params.get('status') ?? 'all';
  const search = params.get('search') ?? '';
  // Show the saved status at once; the list's other modules are unchanged.
  const { setStatus, busy } = useModuleStatus((updated) => state.setData((list) => list.map((m) => (m.id === updated.id ? updated : m))));

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value && value !== 'all' && value !== 'course') next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Modules"
        subtitle="Every module you teach, by course or cohort: its topics, its sessions, and how far teaching has got."
      />
      <AsyncContent state={state}>
        {(modules) => {
          if (!modules.length) {
            return (
              <Card>
                <EmptyState
                  icon={BookOpen}
                  title="No modules assigned yet"
                  message="Modules appear here once an administrator assigns you to a course or to some of its modules."
                />
              </Card>
            );
          }
          const term = search.toLowerCase();
          const shown = modules.filter(
            (m) =>
              (status === 'all' || m.teachingStatus === status) &&
              (!term || m.title.toLowerCase().includes(term) || m.courseTitle.toLowerCase().includes(term)),
          );
          const groups = grouping === 'cohort' ? byCohort(shown) : byCourse(shown);
          return (
            <div className="stack">
              <Card flush>
                <div className="toolbar">
                  <SearchInput value={search} onSearch={(value) => update({ search: value })} placeholder="Search modules or courses" />
                  <div className="spacer" />
                  <div className="segmented" role="group" aria-label="Group modules">
                    {GROUPINGS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`segmented__option${grouping === value ? ' is-active' : ''}`}
                        aria-pressed={grouping === value}
                        onClick={() => update({ group: value })}
                      >
                        <Icon aria-hidden="true" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '16px 22px 0' }}>
                  <ModuleStatusSummary modules={modules} />
                  <div style={{ marginTop: 14 }}>
                    <ModuleStatusTabs modules={modules} value={status} onChange={(value) => update({ status: value })} />
                  </div>
                </div>
              </Card>
              {groups.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={BookOpen}
                    title={search ? 'No modules match your search' : `No modules are ${moduleStatusLabel(status)}`}
                    action={
                      <Button variant="secondary" size="sm" onClick={() => update({ search: undefined, status: undefined })}>
                        Show all modules
                      </Button>
                    }
                  />
                </Card>
              ) : (
                groups.map((g) => (
                  <Card
                    key={g.key}
                    icon={g.icon}
                    title={g.title}
                    subtitle={g.subtitle}
                    action={
                      g.badges?.length > 0 && (
                        <div className="row row--wrap" style={{ gap: 6, justifyContent: 'flex-end' }}>
                          {g.badges.map(([label, tone]) => (
                            <StatusBadge key={label} status="active" label={label} tone={tone} />
                          ))}
                        </div>
                      )
                    }
                    flush
                  >
                    {g.note && <p className="module-group__note">{g.note}</p>}
                    <ul className="list">
                      {g.modules.map((m) => (
                        <ModuleRow key={m.id} module={m} busy={busy} onStatus={setStatus} detailed showCourse={grouping === 'cohort'} />
                      ))}
                    </ul>
                  </Card>
                ))
              )}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
