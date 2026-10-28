import { Checkbox, FormModal, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { CourseChecklist } from '../shared/PersonFormModal';

const FIELDS = [
  { name: 'name', label: 'Batch name', required: true, span: true, placeholder: 'e.g. PGDU Batch 2026-A' },
  { name: 'code', label: 'Batch code', required: true, hint: 'Letters, numbers and dashes, e.g. PGDU-2026A' },
  { name: 'startDate', label: 'Start date', type: 'date' },
  { name: 'endDate', label: 'End date', type: 'date' },
  { name: 'description', label: 'Description', type: 'textarea', span: true, rows: 3 },
  {
    name: 'isActive',
    label: 'Batch is active (open for new students and batch assignments)',
    type: 'checkbox',
  },
];

/** Professor checkboxes bound to a list of ids (active professors only). */
function ProfessorChecklist({ professors, value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="field__label" style={{ marginBottom: 8 }}>
        Assign professors (optional)
      </legend>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {professors
          .filter((p) => p.isActive)
          .map((p) => (
            <Checkbox key={p.id} checked={value.includes(p.id)} onChange={() => toggle(p.id)} label={`${p.fullName} (${p.code})`} />
          ))}
      </div>
    </fieldset>
  );
}

/** Create (batch = null: also picks its courses and professors) or edit a batch. */
export function BatchFormModal({ open, batch, onClose, onSaved }) {
  const toast = useToast();
  const creating = !batch;
  const courses = useFetch(open && creating ? '/admin/lookups/courses' : null);
  const professors = useFetch(open && creating ? '/admin/lookups/professors' : null);

  return (
    <FormModal
      open={open}
      title={creating ? 'Add batch' : 'Edit batch'}
      submitLabel={creating ? 'Create batch' : 'Save changes'}
      fields={FIELDS}
      initialValues={{
        name: batch?.name ?? '',
        code: batch?.code ?? '',
        startDate: batch?.startDate?.slice(0, 10) ?? '',
        endDate: batch?.endDate?.slice(0, 10) ?? '',
        description: batch?.description ?? '',
        isActive: batch?.isActive ?? true,
        courseIds: [],
        professorIds: [],
      }}
      validate={(values) => ({
        endDate:
          values.startDate && values.endDate && values.endDate < values.startDate
            ? 'The end date must be on or after the start date'
            : null,
      })}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          code: values.code.trim().toUpperCase(),
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          description: values.description || null,
        };
        if (!creating) {
          delete payload.courseIds;
          delete payload.professorIds;
        }
        const res = creating ? await api.post('/admin/batches', payload) : await api.put(`/admin/batches/${batch.id}`, payload);
        toast.success(creating ? 'Batch created' : 'Batch updated');
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={onClose}
    >
      {(form) =>
        creating && (
          <div className="stack" style={{ gap: 16 }}>
            {courses.data?.length > 0 && (
              <CourseChecklist
                courses={courses.data}
                value={form.values.courseIds}
                onChange={form.set('courseIds')}
                label="Courses the batch takes (students are enrolled automatically)"
              />
            )}
            {professors.data?.length > 0 && (
              <ProfessorChecklist professors={professors.data} value={form.values.professorIds} onChange={form.set('professorIds')} />
            )}
          </div>
        )
      }
    </FormModal>
  );
}
