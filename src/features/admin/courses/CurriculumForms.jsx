import { FormModal, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { DAY_OPTIONS, weekBounds, weekDates, weekLabel, weeksInRange } from './timetable';

const MODULE_FIELDS = [
  { name: 'title', label: 'Module title', required: true, span: true },
  { name: 'description', label: 'Description', type: 'textarea', span: true },
];

/** Add (module = null) or edit a curriculum module. */
export function ModuleFormModal({ open, courseId, module, onClose, onSaved }) {
  return (
    <FormModal
      open={open}
      title={module ? 'Edit module' : 'Add module'}
      fields={MODULE_FIELDS}
      size="md"
      initialValues={{ title: module?.title ?? '', description: module?.description ?? '' }}
      onSubmit={async (values) => {
        if (module) await api.put(`/admin/modules/${module.id}`, values);
        else await api.post(`/admin/courses/${courseId}/modules`, values);
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}

/**
 * Add (lesson = null) or edit a lesson of `moduleId`: a curriculum topic, or a weekly session when it has a programme
 * week and a lecturer. With course dates, the week is chosen from the course's weeks.
 */
export function LessonFormModal({ open, course, moduleId, lesson, onClose, onSaved }) {
  const toast = useToast();
  const weekCount = course.startDate && course.endDate ? weeksInRange(course.startDate, course.endDate) : 0;
  const weekField = weekCount
    ? {
        name: 'weekNumber',
        label: 'Programme week',
        type: 'select',
        placeholder: 'Not scheduled (curriculum topic)',
        options: Array.from({ length: weekCount }, (_, i) => ({
          value: i + 1,
          label: `${weekLabel(i + 1)} · ${weekDates(weekBounds(course.startDate, i + 1))}`,
        })),
      }
    : {
        name: 'weekNumber',
        label: 'Programme week',
        type: 'number',
        hint: 'Set the course’s start and end dates to choose from its weeks.',
      };
  return (
    <FormModal
      open={open}
      title={lesson ? 'Edit lesson' : 'Add lesson'}
      fields={[
        { name: 'title', label: 'Lesson title', required: true, span: true },
        weekField,
        {
          name: 'courseLecturerId',
          label: 'Lecturer',
          type: 'select',
          placeholder: 'None',
          hint: 'Who teaches it in that week.',
          options: (course.lecturers ?? []).map((l) => ({ value: l.id, label: l.lecturerName })),
        },
        { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
        { name: 'content', label: 'Lesson notes / content', type: 'textarea', span: true, rows: 6 },
      ]}
      initialValues={{
        title: lesson?.title ?? '',
        weekNumber: lesson?.weekNumber ? String(lesson.weekNumber) : '',
        courseLecturerId: lesson?.courseLecturerId ? String(lesson.courseLecturerId) : '',
        durationMinutes: lesson?.durationMinutes ?? '',
        content: lesson?.content ?? '',
      }}
      validate={(values) => ({
        weekNumber: values.courseLecturerId && !values.weekNumber ? 'Choose the week in which the lecturer teaches it' : null,
      })}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
          weekNumber: values.weekNumber ? Number(values.weekNumber) : null,
          courseLecturerId: values.courseLecturerId ? Number(values.courseLecturerId) : null,
        };
        if (lesson) await api.put(`/admin/lessons/${lesson.id}`, payload);
        else await api.post(`/admin/modules/${moduleId}/lessons`, payload);
        toast.success(lesson ? 'Lesson updated' : 'Lesson added');
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}

/** Add (lecturer = null) or edit a course lecturer: name as on the timetable, professor account, delivery pattern. */
export function LecturerFormModal({ open, courseId, lecturer, onClose, onSaved }) {
  const toast = useToast();
  const professors = useFetch(open ? '/admin/lookups/professors' : null);
  if (open && !professors.data && !professors.error) return null;
  return (
    <FormModal
      open={open}
      title={lecturer ? `Edit ${lecturer.lecturerName}` : 'Add lecturer'}
      fields={[
        {
          name: 'lecturerName',
          label: 'Lecturer name',
          required: true,
          placeholder: 'e.g. Dr. Niveditha',
          hint: 'Exactly as on the timetable.',
        },
        {
          name: 'professorId',
          label: 'Professor account',
          type: 'select',
          placeholder: 'Not linked',
          hint: 'Link the lecturer to their MIATA professor account, when they have one.',
          options: (professors.data ?? [])
            .filter((p) => p.isActive || p.id === lecturer?.professorId)
            .map((p) => ({ value: p.id, label: `${p.fullName} (${p.code})` })),
        },
        { name: 'deliveryDay', label: 'Day of the weekly session', type: 'select', options: DAY_OPTIONS, placeholder: 'Not set' },
        { name: 'sessionMinutes', label: 'Session length (minutes)', type: 'number', placeholder: 'e.g. 60' },
        { name: 'startTime', label: 'Start time', type: 'time', hint: 'Leave empty until confirmed.' },
        { name: 'endTime', label: 'End time', type: 'time' },
        { name: 'allocation', label: 'Allocation', type: 'textarea', rows: 3, span: true, hint: 'What the lecturer covers.' },
      ]}
      initialValues={{
        lecturerName: lecturer?.lecturerName ?? '',
        professorId: lecturer?.professorId ? String(lecturer.professorId) : '',
        deliveryDay: lecturer?.deliveryDay ?? '',
        sessionMinutes: lecturer?.sessionMinutes ?? '',
        startTime: lecturer?.startTime?.slice(0, 5) ?? '',
        endTime: lecturer?.endTime?.slice(0, 5) ?? '',
        allocation: lecturer?.allocation ?? '',
      }}
      validate={(values) => ({
        endTime:
          values.startTime && values.endTime && values.endTime <= values.startTime ? 'The end time must be after the start time' : null,
        sessionMinutes:
          values.sessionMinutes && (Number(values.sessionMinutes) < 15 || Number(values.sessionMinutes) > 480)
            ? 'Between 15 and 480 minutes'
            : null,
      })}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          professorId: values.professorId ? Number(values.professorId) : null,
          deliveryDay: values.deliveryDay || null,
          startTime: values.startTime || null,
          endTime: values.endTime || null,
          sessionMinutes: values.sessionMinutes ? Number(values.sessionMinutes) : null,
        };
        if (lecturer) await api.put(`/admin/course-lecturers/${lecturer.id}`, payload);
        else await api.post(`/admin/courses/${courseId}/lecturers`, payload);
        toast.success(lecturer ? 'Lecturer updated' : 'Lecturer added');
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}
