import { useState } from 'react';
import { BookOpen, CirclePlay, GraduationCap, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AsyncContent, Button, Card, DataTable, EmptyState, StatusBadge, useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDuration } from '@/utils/format';
import { AvailabilityChips, AvailabilityModal } from '../shared/BatchAvailability';

const ForBatch = ({ available }) =>
  available ? <StatusBadge status="active" label="Included" /> : <StatusBadge status="draft" label="Not for this batch" />;

/**
 * The batch's courses and, for each, which modules and videos the batch gets. Material is available to every batch
 * unless it is restricted; restricting it here (or on the course / video pages) decides who sees it.
 */
export function BatchMaterialsTab({ batch, onChange }) {
  const materials = useFetch(`/admin/batches/${batch.id}/materials`);
  const courses = useFetch('/admin/lookups/courses');
  const [selected, setSelected] = useState('');
  const [editing, setEditing] = useState(null); // { kind, item, courseId }
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const available = (courses.data ?? []).filter((c) => c.isActive && !batch.courses.some((x) => x.id === c.id));
  const refresh = () => {
    materials.reload();
    onChange();
  };

  const addCourse = () =>
    run(() => api.post(`/admin/batches/${batch.id}/courses`, { courseId: Number(selected) }), {
      success: 'Course added — the batch’s students are enrolled in it',
      key: 'add',
      onDone: () => {
        setSelected('');
        refresh();
      },
    });

  const removeCourse = async (course) => {
    const ok = await confirm({
      title: `Remove ${course.title} from ${batch.name}?`,
      message:
        'Students stay enrolled in the course, but it is no longer taken with this batch: its batch professors stop seeing it and the course’s own professors take over.',
      confirmLabel: 'Remove course',
      danger: true,
    });
    if (ok) await run(() => api.delete(`/admin/batches/${batch.id}/courses/${course.id}`), { success: 'Course removed', onDone: refresh });
  };

  const editButton = (kind, item, courseId) => (
    <Button
      variant="ghost"
      size="sm"
      icon={SlidersHorizontal}
      aria-label={`Change who can see ${item.title}`}
      onClick={() => setEditing({ kind, item, courseId })}
    />
  );

  return (
    <div className="stack">
      <Card flush>
        <div className="toolbar">
          <select
            className="select select--inline"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Course to add"
          >
            <option value="">Add a course to this batch…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
          <Button icon={Plus} size="sm" disabled={!selected || !batch.isActive} loading={busy === 'add'} onClick={addCourse}>
            Add course
          </Button>
          {!batch.isActive && <span className="muted">Activate the batch to add courses.</span>}
        </div>
      </Card>

      <AsyncContent state={materials}>
        {({ modules, videos }) =>
          batch.courses.length === 0 ? (
            <Card>
              <EmptyState icon={GraduationCap} title="No courses yet" message="Add the courses this batch takes." />
            </Card>
          ) : (
            batch.courses.map((course) => (
              <Card
                key={course.id}
                title={
                  <Link to={`/admin/courses/${course.id}`} style={{ color: 'inherit' }}>
                    {course.title}
                  </Link>
                }
                icon={GraduationCap}
                subtitle={`${course.code} · ${course.enrolledCount} of the batch’s students enrolled · ${course.completedCount} completed`}
                action={
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => removeCourse(course)}>
                    Remove
                  </Button>
                }
                flush
              >
                <DataTable
                  compact
                  rows={modules.filter((m) => m.courseId === course.id)}
                  columns={[
                    {
                      key: 'title',
                      header: (
                        <span className="row" style={{ gap: 6 }}>
                          <BookOpen size={15} aria-hidden="true" /> Module
                        </span>
                      ),
                      render: (m) => <strong style={{ color: 'var(--ink)' }}>{m.title}</strong>,
                    },
                    { key: 'lessons', header: 'Lessons', align: 'right', render: (m) => <span className="num">{m.lessonCount}</span> },
                    { key: 'audience', header: 'Available to', render: (m) => <AvailabilityChips batches={m.batches} /> },
                    { key: 'batch', header: 'This batch', render: (m) => <ForBatch available={m.available} /> },
                    {
                      key: 'actions',
                      header: <span className="sr-only">Actions</span>,
                      align: 'right',
                      render: (m) => editButton('module', m, course.id),
                    },
                  ]}
                  empty={<EmptyState icon={BookOpen} title="No modules in this course" />}
                />
                <DataTable
                  compact
                  rows={videos.filter((v) => v.courseId === course.id)}
                  columns={[
                    {
                      key: 'title',
                      header: (
                        <span className="row" style={{ gap: 6 }}>
                          <CirclePlay size={15} aria-hidden="true" /> Video
                        </span>
                      ),
                      render: (v) => (
                        <span>
                          <strong style={{ color: 'var(--ink)' }}>{v.title}</strong>
                          <span className="cell-person__sub" style={{ display: 'block' }}>
                            {v.moduleTitle || 'Whole course'} · {formatDuration(v.durationSeconds)}
                          </span>
                        </span>
                      ),
                    },
                    { key: 'published', header: 'Status', render: (v) => <StatusBadge status={v.isPublished ? 'published' : 'draft'} /> },
                    { key: 'audience', header: 'Available to', render: (v) => <AvailabilityChips batches={v.batches} /> },
                    { key: 'batch', header: 'This batch', render: (v) => <ForBatch available={v.available} /> },
                    {
                      key: 'actions',
                      header: <span className="sr-only">Actions</span>,
                      align: 'right',
                      render: (v) => editButton('video', v, course.id),
                    },
                  ]}
                  empty={<EmptyState icon={CirclePlay} title="No videos in this course" />}
                />
              </Card>
            ))
          )
        }
      </AsyncContent>
      {editing && (
        <AvailabilityModal
          kind={editing.kind}
          item={editing.item}
          courseId={editing.courseId}
          onClose={() => setEditing(null)}
          onSaved={materials.reload}
        />
      )}
    </div>
  );
}
