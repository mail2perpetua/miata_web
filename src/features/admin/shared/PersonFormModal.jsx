import { Alert, Checkbox, FormModal, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';

const LABEL = { student: 'student', professor: 'professor', agent: 'agent' };

const PROFILE_FIELDS = {
  student: [
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { name: 'qualification', label: 'Qualification', placeholder: 'e.g. B.Sc. Medical Imaging' },
    { name: 'address', label: 'Address', span: true },
    { name: 'city', label: 'City' },
    { name: 'country', label: 'Country' },
  ],
  professor: [
    { name: 'department', label: 'Department', placeholder: 'e.g. Diagnostic Sonography' },
    { name: 'specialization', label: 'Specialization', placeholder: 'e.g. Obstetrics & Gynecology' },
    { name: 'qualification', label: 'Qualification', placeholder: 'e.g. MD, RDMS' },
    { name: 'bio', label: 'Short bio', type: 'textarea', span: true, rows: 3 },
  ],
  agent: [
    { name: 'organization', label: 'Organization' },
    { name: 'city', label: 'City' },
    { name: 'country', label: 'Country' },
  ],
};

/** Course checkboxes bound to form.values.courseIds. */
export function CourseChecklist({ courses, value, onChange, label }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="field__label" style={{ marginBottom: 8 }}>
        {label}
      </legend>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {courses
          .filter((c) => c.isActive)
          .map((c) => (
            <Checkbox key={c.id} checked={value.includes(c.id)} onChange={() => toggle(c.id)} label={`${c.title} (${c.code})`} />
          ))}
      </div>
    </fieldset>
  );
}

/** What happened to the welcome e-mail of a new account (the API reports sent / failed / skipped). */
function announceWelcomeEmail(toast, name, email) {
  if (email?.status === 'sent') toast.success(`${name} added. Welcome e-mail sent to ${email.recipient}.`);
  else if (email?.status === 'failed') {
    toast.error(
      `${name} added, but the welcome e-mail could not be sent (${email.error}). Use "Send set-password e-mail" on their page to retry.`,
    );
  } else toast.info(`${name} added. E-mail is not set up on the server, so give them the temporary password in person.`);
}

/**
 * Create or edit a student / professor / agent. New accounts are e-mailed a single-use link to set their own password;
 * the admin may also set a temporary password to hand over in person (required when e-mail is not set up).
 * Passwords are never e-mailed. `defaults` prefills a new account (e.g. a lecturer's name from a course timetable).
 */
export function PersonFormModal({ open, role, person, defaults, onClose, onSaved }) {
  const toast = useToast();
  const creating = !person;
  const courses = useFetch(open && creating && role !== 'agent' ? '/admin/lookups/courses' : null);
  const agents = useFetch(open && creating && role === 'student' ? '/admin/lookups/agents' : null);
  const batches = useFetch(open && creating && role === 'student' ? '/admin/lookups/batches' : null);

  const fields = [
    { name: 'fullName', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    ...(creating
      ? [
          {
            name: 'temporaryPassword',
            label: 'Temporary password (optional)',
            type: 'password',
            hint: 'Only if you will hand it over in person. It is never e-mailed; they must change it at first sign-in.',
          },
        ]
      : []),
    ...(creating && role === 'student'
      ? [
          {
            name: 'agentId',
            label: 'Referred by agent',
            type: 'select',
            options: (agents.data ?? []).filter((a) => a.isActive).map((a) => ({ value: a.id, label: `${a.fullName} (${a.code})` })),
          },
          {
            name: 'batchId',
            label: 'Batch',
            type: 'select',
            hint: 'The student is enrolled in the batch’s courses.',
            options: (batches.data ?? []).filter((b) => b.isActive).map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
          },
        ]
      : []),
    ...PROFILE_FIELDS[role],
  ];

  const p = person?.profile ?? {};
  const initialValues = {
    fullName: person?.fullName ?? '',
    email: person?.email ?? '',
    phone: person?.phone ?? '',
    temporaryPassword: '',
    agentId: '',
    batchId: '',
    courseIds: [],
    ...Object.fromEntries(PROFILE_FIELDS[role].map((f) => [f.name, p[f.name] ?? ''])),
    ...(creating ? defaults : null),
  };

  return (
    <FormModal
      open={open}
      title={creating ? `Add ${LABEL[role]}` : `Edit ${person.fullName}`}
      submitLabel={creating ? `Create ${LABEL[role]}` : 'Save changes'}
      fields={fields}
      initialValues={initialValues}
      intro={
        creating && (
          <Alert tone="info">
            A welcome e-mail with their account details and a secure link to set their own password is sent to this address. Passwords are
            never e-mailed.
          </Alert>
        )
      }
      onSubmit={async (values) => {
        const payload = { ...values, phone: values.phone || null };
        for (const f of PROFILE_FIELDS[role]) payload[f.name] = values[f.name] === '' ? null : values[f.name];
        if (!creating) {
          delete payload.temporaryPassword;
          delete payload.agentId;
          delete payload.courseIds;
        } else if (role === 'agent') {
          delete payload.agentId;
          delete payload.courseIds;
        } else if (role === 'professor') {
          delete payload.agentId;
        }
        if (!creating || role !== 'student') delete payload.batchId;
        const res = creating ? await api.post(`/admin/${role}s`, payload) : await api.put(`/admin/${role}s/${person.id}`, payload);
        if (!creating) toast.success('Changes saved');
        else announceWelcomeEmail(toast, values.fullName, res.data.welcomeEmail);
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={onClose}
    >
      {(form) =>
        creating &&
        role !== 'agent' &&
        courses.data?.length > 0 && (
          <CourseChecklist
            courses={courses.data}
            value={form.values.courseIds}
            onChange={form.set('courseIds')}
            label={role === 'student' ? 'Enrol in courses (optional)' : 'Assign to courses (optional)'}
          />
        )
      }
    </FormModal>
  );
}
