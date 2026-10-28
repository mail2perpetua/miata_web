import { useRef, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { Button, Card, EmptyState, StatusBadge, Tooltip, useConfirm } from '@/components';
import { moduleStatusDetail } from '@/features/shared/moduleStatus';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';
import { AvailabilityChips, AvailabilityModal } from '../shared/BatchAvailability';
import { LessonFormModal, ModuleFormModal } from './CurriculumForms';
import { moveItem, moveItemBy } from './curriculumOrder';
import { weekBounds, weekDates, weekLabel, weeksLabel } from './timetable';

function DragHandle({ noun, title, disabled, onMove, onDragStart, onDragEnd }) {
  return (
    <Tooltip label={`Drag to reorder this ${noun}. With the handle focused, use Alt+Up or Alt+Down to move it.`}>
      <button
        type="button"
        className="curriculum__drag-handle"
        draggable={!disabled}
        disabled={disabled}
        aria-label={`Reorder ${noun}: ${title}`}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onKeyDown={(event) => {
          if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          onMove(event.key === 'ArrowUp' ? -1 : 1);
        }}
      >
        <GripVertical aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/** Modules (ordered) with their lessons, module-level professors and batch availability. */
export function CurriculumTab({ course, professors, onChange }) {
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const dragRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set(course.modules.slice(0, 1).map((m) => m.id)));
  const [dialog, setDialog] = useState(null); // { kind: 'module'|'lesson', item?, moduleId? }
  const [availability, setAvailability] = useState(null); // module whose batches are being edited
  // The course's lecturers linked to professor accounts (one entry per account) — the only module professors it takes.
  const hasLecturers = (course.lecturers ?? []).length > 0;
  const lecturerAccounts = [
    ...new Map(
      (course.lecturers ?? [])
        .filter((l) => l.professorId)
        .map((l) => [l.professorId, { id: l.professorId, fullName: l.professorName, isActive: l.professorActive }]),
    ).values(),
  ];
  const lecturerIds = new Set(lecturerAccounts.map((p) => p.id));

  const toggle = (id) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const removeModule = async (m) => {
    const ok = await confirm({
      title: `Delete “${m.title}”?`,
      message: `Its ${m.lessons.length} lesson(s) are deleted. Videos and assignments stay on the course without a module.`,
      confirmLabel: 'Delete module',
      danger: true,
    });
    if (ok) await run(() => api.delete(`/admin/modules/${m.id}`), { success: 'Module deleted', onDone: onChange });
  };

  const removeLesson = async (l) => {
    if (await confirm({ title: `Delete lesson “${l.title}”?`, confirmLabel: 'Delete lesson', danger: true })) {
      await run(() => api.delete(`/admin/lessons/${l.id}`), { success: 'Lesson deleted', onDone: onChange });
    }
  };

  // One reorder at a time: the displayed order changes only after the saved order reloads successfully.
  const reordering = busy === 'reorder';
  const saveOrder = (path, items, noun) =>
    run(() => api.put(path, { ids: items.map((item) => item.id) }), {
      key: 'reorder',
      success: `${noun} order updated`,
      onDone: onChange,
    });
  const reorderModules = (items) => saveOrder(`/admin/courses/${course.id}/modules/order`, items, 'Module');
  const reorderLessons = (m, items) => saveOrder(`/admin/modules/${m.id}/lessons/order`, items, 'Lesson');

  const startDrag = (event, item) => {
    if (reordering) {
      event.preventDefault();
      return;
    }
    dragRef.current = item;
    setDragState({ item, target: null });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${item.type}:${item.id}`);
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragState(null);
  };
  const canDrop = (type, parentId = null) => {
    const source = dragRef.current;
    return !reordering && source?.type === type && (type === 'module' || source.parentId === parentId);
  };
  const previewDrop = (event, type, targetId, parentId = null) => {
    if (!canDrop(type, parentId)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const bounds = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > bounds.top + bounds.height / 2;
    setDragState((current) =>
      current?.target?.id === targetId && current.target.after === after
        ? current
        : { ...current, target: { id: targetId, after } },
    );
  };
  const dropItem = (event, type, targetId, items, parentId = null, parentModule = null) => {
    if (!canDrop(type, parentId)) return;
    event.preventDefault();
    event.stopPropagation();
    const source = dragRef.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > bounds.top + bounds.height / 2;
    const ordered = moveItem(items, source.id, targetId, after);
    endDrag();
    if (ordered !== items) {
      if (type === 'module') reorderModules(ordered);
      else reorderLessons(parentModule, ordered);
    }
  };
  const dragHandlers = (type, id, parentId = null) => ({
    onDragStart: (event) => startDrag(event, { type, id, parentId }),
    onDragEnd: endDrag,
  });

  const assignProfessor = (moduleId, professorId) =>
    run(() => api.post(`/admin/modules/${moduleId}/professors`, { professorId: Number(professorId) }), {
      success: 'Professor assigned to module',
      onDone: onChange,
    });
  const unassignProfessor = (moduleId, professorId) =>
    run(() => api.delete(`/admin/modules/${moduleId}/professors/${professorId}`), {
      success: 'Professor removed from module',
      onDone: onChange,
    });

  return (
    <Card
      title="Modules & Lessons"
      subtitle="Students see modules and lessons in this order. Drag the grip handles to reorder."
      action={
        <Button icon={Plus} size="sm" onClick={() => setDialog({ kind: 'module' })}>
          Add module
        </Button>
      }
    >
      {course.modules.length === 0 ? (
        <EmptyState icon={BookOpen} title="No modules yet" message="Add the first module of this course." />
      ) : (
        <div className="curriculum">
          {course.modules.map((m, mi) => {
            const open = expanded.has(m.id);
            // A course with lecturers (a timetable) has its modules taught by them: only their accounts can be assigned.
            const available = (hasLecturers ? lecturerAccounts : professors).filter((p) => p.isActive && !m.professors.some((x) => x.id === p.id));
            // Curriculum topics keep their numbering; weekly sessions (lessons with a week) show their week instead.
            const sessions = m.lessons.filter((l) => l.weekNumber);
            const lecturerNames = [...new Set(sessions.map((l) => l.lecturerName).filter(Boolean))].join(', ');
            const topicNumbers = Object.fromEntries(m.lessons.filter((l) => !l.weekNumber).map((l, i) => [l.id, i + 1]));
            return (
              <div
                key={m.id}
                className={[
                  'module',
                  dragState?.item.type === 'module' && dragState.item.id === m.id && 'is-dragging',
                  dragState?.item.type === 'module' &&
                    dragState.target?.id === m.id &&
                    `is-drop-${dragState.target.after ? 'after' : 'before'}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onDragOver={(event) => previewDrop(event, 'module', m.id)}
                onDrop={(event) => dropItem(event, 'module', m.id, course.modules)}
              >
                <div className="module__head">
                  <Tooltip label={open ? 'Hide this module’s lessons' : 'Show this module’s lessons'}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => toggle(m.id)}
                      aria-expanded={open}
                      aria-label={open ? 'Collapse module' : 'Expand module'}
                    >
                      {open ? <ChevronDown /> : <ChevronRight />}
                    </button>
                  </Tooltip>
                  <span className="module__index">{mi + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="row row--wrap" style={{ gap: '4px 10px' }}>
                      <span className="module__title">{m.title}</span>
                      <Tooltip label={`${moduleStatusDetail(m)}. The module’s professors update this from their dashboard.`}>
                        <StatusBadge status={m.teachingStatus} />
                      </Tooltip>
                    </div>
                    <div className="module__sub">
                      {m.lessons.length} lessons · {m.videoCount} videos · {m.assignmentCount} assignments
                    </div>
                    {sessions.length > 0 && (
                      <div className="module__sub" style={{ marginTop: 2 }}>
                        <CalendarClock size={12} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" />{' '}
                        {sessions.length} weekly sessions · {weeksLabel([...new Set(sessions.map((l) => l.weekNumber))].sort((a, b) => a - b))}
                        {lecturerNames && ` · ${lecturerNames}`}
                      </div>
                    )}
                    {m.batches.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <AvailabilityChips batches={m.batches} />
                      </div>
                    )}
                  </div>
                  <div className="module-admin__actions">
                    <DragHandle
                      noun="module"
                      title={m.title}
                      disabled={reordering}
                      onMove={(delta) => reorderModules(moveItemBy(course.modules, m.id, delta))}
                      {...dragHandlers('module', m.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      onClick={() => setDialog({ kind: 'module', item: m })}
                      aria-label="Edit module"
                      tooltip="Edit the module’s title and description"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={SlidersHorizontal}
                      onClick={() => setAvailability(m)}
                      aria-label="Choose which batches get this module"
                      tooltip="Choose which batches get this module"
                    />
                    <Button
                      variant="ghost-danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeModule(m)}
                      aria-label="Delete module"
                      tooltip="Delete the module and its lessons"
                    />
                  </div>
                </div>
                {open && (
                  <div className="module__body">
                    {m.description && (
                      <p className="muted" style={{ margin: '8px 0', fontSize: 'var(--fs-sm)' }}>
                        {m.description}
                      </p>
                    )}

                    <div className="row row--wrap" style={{ margin: '10px 0' }}>
                      <strong style={{ fontSize: 'var(--fs-sm)' }}>Module professors:</strong>
                      {m.professors.length === 0 && (
                        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                          None (course professors review all assignments)
                        </span>
                      )}
                      {m.professors.map((p) => (
                        <span key={p.id} className="chip" title={hasLecturers && !lecturerIds.has(p.id) ? 'Not one of the course’s lecturers' : undefined}>
                          {p.fullName}
                          {hasLecturers && !lecturerIds.has(p.id) && <span className="muted"> (not a course lecturer)</span>}
                          <button type="button" onClick={() => unassignProfessor(m.id, p.id)} aria-label={`Remove ${p.fullName}`}>
                            <X />
                          </button>
                        </span>
                      ))}
                      {hasLecturers && lecturerIds.size === 0 && (
                        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                          · Link the course’s lecturers to professor accounts (Weekly Timetable tab) to assign them.
                        </span>
                      )}
                      {available.length > 0 && (
                        <select
                          className="select select--inline"
                          value=""
                          onChange={(e) => e.target.value && assignProfessor(m.id, e.target.value)}
                          aria-label="Assign professor to module"
                        >
                          <option value="">{hasLecturers ? '+ Assign lecturer' : '+ Assign professor'}</option>
                          {available.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {m.lessons.map((l) => (
                      <div
                        key={l.id}
                        className={[
                          'lesson',
                          dragState?.item.type === 'lesson' && dragState.item.id === l.id && 'is-dragging',
                          dragState?.item.type === 'lesson' &&
                            dragState.item.parentId === m.id &&
                            dragState.target?.id === l.id &&
                            `is-drop-${dragState.target.after ? 'after' : 'before'}`,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onDragOver={(event) => {
                          event.stopPropagation();
                          previewDrop(event, 'lesson', l.id, m.id);
                        }}
                        onDrop={(event) => {
                          event.stopPropagation();
                          dropItem(event, 'lesson', l.id, m.lessons, m.id, m);
                        }}
                      >
                        {l.weekNumber ? (
                          <CalendarClock className="lesson__icon" size={18} aria-label="Weekly session" />
                        ) : (
                          <FileText className="lesson__icon" size={18} aria-hidden="true" />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="lesson__title">
                            {topicNumbers[l.id] ? `${topicNumbers[l.id]}. ` : ''}
                            {l.title} {l.durationMinutes ? <span className="muted">· {l.durationMinutes} min</span> : null}
                          </div>
                          {l.weekNumber && (
                            <div className="lesson__content">
                              {weekLabel(l.weekNumber)}
                              {course.startDate && ` · ${weekDates(weekBounds(course.startDate, l.weekNumber))}`}
                              {l.lecturerName && ` · ${l.lecturerName}`}
                            </div>
                          )}
                          {l.content && (
                            <div className="lesson__content">{l.content.length > 220 ? `${l.content.slice(0, 220)}…` : l.content}</div>
                          )}
                        </div>
                        <div className="module-admin__actions">
                          <DragHandle
                            noun="lesson"
                            title={l.title}
                            disabled={reordering}
                            onMove={(delta) => reorderLessons(m, moveItemBy(m.lessons, l.id, delta))}
                            {...dragHandlers('lesson', l.id, m.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() => setDialog({ kind: 'lesson', item: l, moduleId: m.id })}
                            aria-label="Edit lesson"
                            tooltip="Edit the lesson’s title, week, lecturer and notes"
                          />
                          <Button
                            variant="ghost-danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => removeLesson(l)}
                            aria-label="Delete lesson"
                            tooltip="Delete the lesson"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => setDialog({ kind: 'lesson', moduleId: m.id })}
                      style={{ marginTop: 10 }}
                    >
                      Add lesson
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ModuleFormModal
        open={dialog?.kind === 'module'}
        courseId={course.id}
        module={dialog?.item}
        onClose={() => setDialog(null)}
        onSaved={onChange}
      />
      <LessonFormModal
        open={dialog?.kind === 'lesson'}
        course={course}
        moduleId={dialog?.moduleId}
        lesson={dialog?.item}
        onClose={() => setDialog(null)}
        onSaved={onChange}
      />
      {availability && (
        <AvailabilityModal
          kind="module"
          item={availability}
          courseId={course.id}
          onClose={() => setAvailability(null)}
          onSaved={onChange}
        />
      )}
    </Card>
  );
}
