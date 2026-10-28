import { useState } from 'react';
import { Checkbox, FileDrop, FormModal, Spinner, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { toFormData, upload } from '@/services/api';
import { fromLocalInput, toLocalInput } from '@/utils/format';

const DOC_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png';

/** Checkboxes of the batch's students enrolled in the course, bound to a list of student ids. */
function BatchStudentPicker({ courseId, batchId, value, onChange, error }) {
  const students = useFetch('/professor/students', { courseId, batchId, pageSize: 100, sort: 'full_name', order: 'asc' });
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  if (!students.data) return <Spinner />;
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 12,
        }}
      >
        {students.data.length === 0 && <span className="muted">No students of this batch are enrolled in the course.</span>}
        {students.data.map((s) => (
          <Checkbox
            key={s.studentId}
            checked={value.includes(s.studentId)}
            onChange={() => toggle(s.studentId)}
            label={`${s.fullName} (${s.studentCode})`}
          />
        ))}
      </div>
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        <span className="field__hint">{value.length} selected</span>
      )}
    </div>
  );
}

/**
 * Create or edit an assignment (multipart: optional brief attachment). Only the professor's own courses and modules
 * are offered. Work is either course-wide (course and module professors) or for one of the professor's batches —
 * the whole batch or selected students of it.
 */
export function AssignmentFormModal({ open, assignment, defaultCourseId, defaultBatchId, onClose, onSaved }) {
  const toast = useToast();
  const courses = useFetch(open ? '/professor/courses' : null);
  const [courseId, setCourseId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const selectedCourse = courseId ?? String(assignment?.courseId ?? defaultCourseId ?? '');
  const course = courses.data?.find((c) => String(c.id) === selectedCourse);
  const courseWide = Boolean(course && (course.wholeCourse || course.modules.length > 0));
  const initialBatch = assignment ? (assignment.batchId ?? '') : (defaultBatchId ?? '');
  const selectedBatch = batchId ?? String(initialBatch);
  const modules = useFetch(
    open && selectedCourse ? `/professor/courses/${selectedCourse}/modules` : null,
    selectedBatch ? { batchId: selectedBatch } : undefined,
  );
  const moduleOnly = Boolean(course && !selectedBatch && !course.wholeCourse);
  const [file, setFile] = useState(null);

  const close = () => {
    setCourseId(null);
    setBatchId(null);
    setFile(null);
    onClose();
  };

  const fields = [
    { name: 'title', label: 'Title', required: true, span: true },
    {
      name: 'courseId',
      label: 'Course',
      type: 'select',
      required: true,
      resets: ['moduleId', 'batchId', 'studentIds'],
      options: (courses.data ?? []).map((c) => ({ value: c.id, label: `${c.title}${c.isActive ? '' : ' (inactive)'}` })),
    },
    {
      name: 'batchId',
      label: 'Assign to',
      type: 'select',
      required: Boolean(course) && !courseWide,
      resets: ['moduleId', 'studentIds'],
      options: (course?.batches ?? []).map((b) => ({ value: b.id, label: `Batch: ${b.name}${b.isActive ? '' : ' (inactive)'}` })),
      placeholder: course && !courseWide ? 'Select one of your batches' : 'All students of the course',
      hint: course?.batches.length ? 'Choose a batch to set this work for that batch only.' : undefined,
    },
    {
      name: 'moduleId',
      label: 'Module',
      type: 'select',
      required: moduleOnly,
      options: (modules.data ?? []).map((m) => ({ value: m.id, label: m.title })),
      placeholder: moduleOnly ? 'Select one of your modules' : 'Whole course',
      hint: moduleOnly ? 'You teach this course at module level.' : undefined,
    },
    { name: 'dueAt', label: 'Due date & time', type: 'datetime-local' },
    { name: 'instructions', label: 'Instructions', type: 'textarea', span: true, rows: 5 },
    { name: 'isRequired', label: 'Required for course completion', type: 'checkbox', span: false },
    {
      name: 'isPublished',
      label: selectedBatch
        ? 'Publish — assign to the batch (or the selected students)'
        : 'Publish — assign to every student enrolled in the course',
      type: 'checkbox',
      span: false,
      hint: 'Leave unticked to save as a draft that students cannot see.',
    },
  ];

  return (
    <FormModal
      open={open}
      title={assignment ? 'Edit assignment' : 'Add assignment'}
      submitLabel={assignment ? 'Save changes' : 'Create assignment'}
      fields={fields}
      initialValues={{
        title: assignment?.title ?? '',
        courseId: selectedCourse,
        batchId: String(initialBatch),
        moduleId: assignment?.moduleId ? String(assignment.moduleId) : '',
        selectStudents: Boolean(assignment?.recipientCount),
        studentIds: assignment?.recipients?.map((r) => r.id) ?? [],
        dueAt: toLocalInput(assignment?.dueAt),
        instructions: assignment?.instructions ?? '',
        isRequired: assignment?.isRequired ?? true,
        isPublished: assignment?.isPublished ?? true,
        removeAttachment: false,
      }}
      validate={(values) => ({
        studentIds: values.batchId && values.selectStudents && !values.studentIds?.length ? 'Select at least one student' : null,
      })}
      onSubmit={async (values) => {
        const selected = values.batchId && values.selectStudents ? values.studentIds || [] : [];
        const body = toFormData(
          {
            title: values.title,
            courseId: values.courseId,
            batchId: values.batchId || '',
            studentIds: selected.join(','),
            moduleId: values.moduleId || '',
            dueAt: fromLocalInput(values.dueAt) ?? '',
            instructions: values.instructions,
            isRequired: values.isRequired,
            isPublished: values.isPublished,
            removeAttachment: values.removeAttachment,
          },
          { attachment: file },
        );
        const res = assignment
          ? await upload(`/professor/assignments/${assignment.id}`, body, { method: 'PUT' })
          : await upload('/professor/assignments', body);
        toast.success(assignment ? 'Assignment updated' : values.isPublished ? 'Assignment created and assigned' : 'Draft saved');
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={close}
      onValuesChange={(values) => {
        if (values.courseId !== selectedCourse) setCourseId(values.courseId);
        if (values.batchId !== selectedBatch) setBatchId(values.batchId);
      }}
    >
      {(form) => (
        <div className="stack" style={{ gap: 16 }}>
          {form.values.batchId && (
            <div className="stack" style={{ gap: 10 }}>
              <Checkbox
                label="Only selected students of this batch"
                checked={Boolean(form.values.selectStudents)}
                onChange={form.set('selectStudents')}
              />
              {form.values.selectStudents && (
                <BatchStudentPicker
                  courseId={form.values.courseId}
                  batchId={form.values.batchId}
                  value={form.values.studentIds || []}
                  onChange={form.set('studentIds')}
                  error={form.errors.studentIds}
                />
              )}
            </div>
          )}
          <div className="stack" style={{ gap: 10 }}>
            <span className="field__label">Brief / attachment (optional)</span>
            <FileDrop
              accept={DOC_ACCEPT}
              maxBytes={20 * 1024 * 1024}
              file={file}
              onChange={setFile}
              hint="PDF, Word, PowerPoint, Excel, ZIP or image · max 20 MB"
              error={form.errors.attachment}
            />
            {assignment?.attachmentName && !file && (
              <Checkbox
                label={`Remove current attachment (${assignment.attachmentName})`}
                checked={form.values.removeAttachment}
                onChange={form.set('removeAttachment')}
              />
            )}
          </div>
        </div>
      )}
    </FormModal>
  );
}
