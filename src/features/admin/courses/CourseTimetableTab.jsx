import { useState } from 'react';
import { CalendarDays, Download, Link2, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { AsyncContent, Button, Card, DataTable, EmptyState, useConfirm, useToast } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { TimetableHeader, TimetableNotes, TimetableToolbar, TimetableWeeks } from '@/features/shared/TimetableViews';
import { PersonFormModal } from '../shared/PersonFormModal';
import { LecturerFormModal, LessonFormModal } from './CurriculumForms';
import { ImportTimetableModal } from './ImportTimetableModal';
import { sessionSummary } from './timetable';

/**
 * The course's weekly timetable (from GET /admin/courses/:id/timetable): lecturer allocations with their professor
 * accounts, then one block per week with each lecturer's session — topic and curriculum module — or "module complete"
 * once their stream has ended. Filters by week, module and lecturer. Lecturers and sessions are edited here; dates and
 * notes on the course. Linking a lecturer to an account makes them the professor of the modules they teach.
 */
export function CourseTimetableTab({ course, onChange, onEditCourse }) {
  const [filters, setFilters] = useState({});
  const state = useFetch(`/admin/courses/${course.id}/timetable`, filters);
  const [dialog, setDialog] = useState(null); // { kind: 'lecturer'|'lesson'|'import'|'account', item?, moduleId? }
  const confirm = useConfirm();
  const toast = useToast();
  const { run } = useApiAction();
  const close = () => setDialog(null);
  const reload = () => {
    onChange();
    state.reload();
  };
  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value ? Number(value) : undefined }));

  const removeLecturer = async (l) => {
    const ok = await confirm({
      title: `Remove ${l.lecturerName}?`,
      message: `Their ${l.sessionCount} session(s) stay in the timetable without a lecturer. Their module assignments are kept.`,
      confirmLabel: 'Remove lecturer',
      danger: true,
    });
    if (ok) await run(() => api.delete(`/admin/course-lecturers/${l.id}`), { success: 'Lecturer removed', onDone: reload });
  };

  // A new professor account for a lecturer who has none: created with the regular form, then linked to the lecturer.
  const linkAccount = async (lecturer, professor) => {
    await run(
      () =>
        api.put(`/admin/course-lecturers/${lecturer.id}`, {
          lecturerName: lecturer.lecturerName,
          professorId: professor.id,
          allocation: lecturer.allocation,
          deliveryDay: lecturer.deliveryDay,
          startTime: lecturer.startTime,
          endTime: lecturer.endTime,
          sessionMinutes: lecturer.sessionMinutes,
        }),
      { success: `${lecturer.lecturerName} linked and assigned to the modules they teach`, onDone: reload },
    );
  };

  // Sessions are lessons: edit the full lesson (its notes included), found in the course's curriculum.
  const editSession = (session) => {
    const module = course.modules.find((m) => m.id === session.moduleId);
    const lesson = module?.lessons.find((l) => l.id === session.id);
    if (lesson) setDialog({ kind: 'lesson', item: lesson, moduleId: module.id });
    else toast.error('This session is no longer in the course — reload the page.');
  };

  const dialogs = (
    <>
      <LecturerFormModal open={dialog?.kind === 'lecturer'} courseId={course.id} lecturer={dialog?.item} onClose={close} onSaved={reload} />
      <LessonFormModal
        open={dialog?.kind === 'lesson'}
        course={course}
        moduleId={dialog?.moduleId}
        lesson={dialog?.item}
        onClose={close}
        onSaved={reload}
      />
      <ImportTimetableModal open={dialog?.kind === 'import'} courseId={course.id} onClose={close} onImported={reload} />
      {dialog?.kind === 'account' && (
        <PersonFormModal
          open
          role="professor"
          defaults={{ fullName: dialog.item.lecturerName }}
          onClose={close}
          onSaved={(professor) => linkAccount(dialog.item, professor)}
        />
      )}
    </>
  );

  return (
    <AsyncContent state={state}>
      {(t) => {
        if (!t.weekCount && !t.lecturers.length) {
          return (
            <Card title="Weekly Timetable" icon={CalendarDays}>
              <EmptyState
                icon={CalendarDays}
                title="No weekly timetable yet"
                message="Give the course its start and end dates, add its lecturers, and give lessons a programme week and lecturer — or import the 2026–2027 timetable."
                action={
                  <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
                    <Button icon={Download} onClick={() => setDialog({ kind: 'import' })}>
                      Import timetable
                    </Button>
                    <Button variant="secondary" icon={Plus} onClick={() => setDialog({ kind: 'lecturer' })}>
                      Add lecturer
                    </Button>
                  </div>
                }
              />
              {dialogs}
            </Card>
          );
        }

        // Modules each lecturer teaches (from their sessions), and whether they are assigned as its professor.
        const lecturerModules = (l) =>
          course.modules
            .map((m, i) => ({
              number: i + 1,
              title: m.title,
              n: m.lessons.filter((x) => x.weekNumber && x.courseLecturerId === l.id).length,
              assigned: Boolean(l.professorId) && m.professors.some((p) => p.id === l.professorId),
            }))
            .filter((m) => m.n);

        return (
          <div className="stack" style={{ gap: 'var(--gutter)' }}>
            <TimetableHeader
              timetable={t}
              action={
                <div className="row row--wrap" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={onEditCourse}>
                    Edit dates & notes
                  </Button>
                  <Button variant="secondary" size="sm" icon={Download} onClick={() => setDialog({ kind: 'import' })}>
                    Import timetable
                  </Button>
                </div>
              }
            />

            <Card
              title="Lecturer allocations"
              subtitle="One session per lecturer per week while their module is active. A lecturer linked to a professor account teaches the modules of their sessions."
              action={
                <Button icon={Plus} size="sm" onClick={() => setDialog({ kind: 'lecturer' })}>
                  Add lecturer
                </Button>
              }
              flush
            >
              <DataTable
                rows={t.lecturers}
                columns={[
                  {
                    key: 'lecturer',
                    header: 'Lecturer',
                    render: (l) => (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.lecturerName}</div>
                        <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                          <Link2 size={12} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" />{' '}
                          {l.professorId ? `${l.professorName}${l.professorActive ? '' : ' (deactivated)'}` : 'No professor account linked'}
                        </div>
                        {!l.professorId && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={UserPlus}
                            style={{ marginTop: 6 }}
                            onClick={() => setDialog({ kind: 'account', item: l })}
                          >
                            Create account
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'allocation',
                    header: 'Allocation and modules',
                    render: (l) => (
                      <div style={{ maxWidth: 380, fontSize: 'var(--fs-sm)' }}>
                        {l.allocation || '—'}
                        <div style={{ marginTop: 4 }}>
                          {lecturerModules(l).map((m) => (
                            <span
                              key={m.number}
                              className="chip tt-module"
                              title={`${m.title}${m.assigned ? ' — assigned as module professor' : ''}`}
                              style={{ margin: '0 4px 4px 0' }}
                            >
                              M{m.number}
                              {m.assigned ? ' ✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
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
                      <div style={{ whiteSpace: 'nowrap' }}>
                        <div>{l.firstWeek ? `Weeks ${l.firstWeek}–${l.lastWeek}` : 'No sessions'}</div>
                        <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                          {l.sessionCount} sessions{l.lastWeek && l.lastWeek < t.weekCount ? ` · ends week ${l.lastWeek}` : ''}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: <span className="sr-only">Actions</span>,
                    align: 'right',
                    render: (l) => (
                      <div className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          onClick={() => setDialog({ kind: 'lecturer', item: l })}
                          aria-label={`Edit ${l.lecturerName}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeLecturer(l)}
                          aria-label={`Remove ${l.lecturerName}`}
                        />
                      </div>
                    ),
                  },
                ]}
                empty={<EmptyState icon={CalendarDays} title="No lecturers yet" message="Add the lecturers who teach this course." />}
              />
            </Card>

            <Card
              title="Weekly curriculum plan"
              subtitle="Each block is a programme week. A lecturer’s stream ends when their module is complete; it is not padded to the full programme."
              flush
            >
              <TimetableToolbar timetable={t} filters={filters} setFilter={setFilter} />
              <TimetableWeeks
                timetable={t}
                lecturerId={t.filters.lecturerId}
                moduleFiltered={Boolean(t.filters.moduleId)}
                onEditSession={editSession}
              />
            </Card>

            <TimetableNotes notes={t.course.scheduleNotes} />
            {dialogs}
          </div>
        );
      }}
    </AsyncContent>
  );
}
