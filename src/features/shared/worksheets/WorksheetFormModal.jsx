import { useState } from 'react';
import { Checkbox, FileDrop, FormModal, Spinner, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { toFormData, upload } from '@/services/api';
import { fromLocalInput, toLocalInput } from '@/utils/format';

const TEMPLATE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png';

/** Checkboxes of the batch's students enrolled in the course, bound to a list of student ids. */
function BatchStudentPicker({ base, courseId, batchId, value, onChange, error }) {
  const students = useFetch(`${base}/worksheet-options/students`, { courseId, batchId });
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
          <Checkbox key={s.id} checked={value.includes(s.id)} onChange={() => toggle(s.id)} label={`${s.fullName} (${s.studentCode})`} />
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
 * Create or edit a practical worksheet (multipart: optional blank worksheet / logbook template). `base` is the portal
 * ('/professor' or '/admin'): professors are offered their own courses, modules and batches (as for assignments),
 * admins every course. A worksheet is course-wide or for one batch — the whole batch or selected students of it.
 */
export function WorksheetFormModal({ base, open, worksheet, defaultCourseId, defaultBatchId, onClose, onSaved }) {
  const toast = useToast();
  const courses = useFetch(open ? `${base}/worksheet-options/courses` : null);
  const [courseId, setCourseId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const selectedCourse = courseId ?? String(worksheet?.courseId ?? defaultCourseId ?? '');
  const course = courses.data?.find((c) => String(c.id) === selectedCourse);
  const courseWide = Boolean(course && (course.wholeCourse || course.modules.length > 0));
  const initialBatch = worksheet ? (worksheet.batchId ?? '') : (defaultBatchId ?? '');
  const selectedBatch = batchId ?? String(initialBatch);
  const modules = useFetch(
    open && selectedCourse ? `${base}/worksheet-options/courses/${selectedCourse}/modules` : null,
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
    { name: 'title', label: 'Title', required: true, span: true, placeholder: 'e.g. Abdominal clinical placement logbook' },
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
      hint: course?.batches.length ? 'Choose a batch to set this worksheet for that batch only.' : undefined,
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
    {
      name: 'instructions',
      label: 'Instructions',
      type: 'textarea',
      span: true,
      rows: 5,
      placeholder: 'What the student must log: placement, specialties, minimum scans or hours, how to get entries signed…',
    },
    {
      name: 'isPublished',
      label: selectedBatch
        ? 'Publish — assign to the batch (or the selected students)'
        : 'Publish — assign to every student enrolled in the course',
      type: 'checkbox',
      hint: 'Leave unticked to save as a draft that students cannot see.',
    },
  ];

  return (
    <FormModal
      open={open}
      title={worksheet ? 'Edit practical worksheet' : 'Add practical worksheet'}
      submitLabel={worksheet ? 'Save changes' : 'Create worksheet'}
      fields={fields}
      initialValues={{
        title: worksheet?.title ?? '',
        courseId: selectedCourse,
        batchId: String(initialBatch),
        moduleId: worksheet?.moduleId ? String(worksheet.moduleId) : '',
        selectStudents: Boolean(worksheet?.recipientCount),
        studentIds: worksheet?.recipients?.map((r) => r.id) ?? [],
        dueAt: toLocalInput(worksheet?.dueAt),
        instructions: worksheet?.instructions ?? '',
        isPublished: worksheet?.isPublished ?? true,
        removeTemplate: false,
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
            isPublished: values.isPublished,
            removeTemplate: values.removeTemplate,
          },
          { template: file },
        );
        const res = worksheet
          ? await upload(`${base}/worksheets/${worksheet.id}`, body, { method: 'PUT' })
          : await upload(`${base}/worksheets`, body);
        toast.success(worksheet ? 'Worksheet updated' : values.isPublished ? 'Worksheet created and assigned' : 'Draft saved');
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
                  base={base}
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
            <span className="field__label">Worksheet template (optional)</span>
            <FileDrop
              accept={TEMPLATE_ACCEPT}
              maxBytes={20 * 1024 * 1024}
              file={file}
              onChange={setFile}
              hint="The blank worksheet or logbook students download — Excel, Word, PDF, ZIP or image · max 20 MB"
              error={form.errors.template}
            />
            {worksheet?.templateName && !file && (
              <Checkbox
                label={`Remove current template (${worksheet.templateName})`}
                checked={form.values.removeTemplate}
                onChange={form.set('removeTemplate')}
              />
            )}
          </div>
        </div>
      )}
    </FormModal>
  );
}
