import { Alert, FormModal, Modal, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { durationLabel, formatMoney } from '@/utils/format';

const FIELDS = [
  { name: 'fullName', label: 'Student’s full name', required: true },
  { name: 'email', label: 'Student’s e-mail', type: 'email', required: true, hint: 'They sign in with this address.' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { name: 'qualification', label: 'Qualification', placeholder: 'e.g. B.Sc. Medical Imaging' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country' },
  { name: 'address', label: 'Address', span: true },
];

/**
 * Apply Now: the agent registers a student they referred. The student is linked to the agent, MIATA is notified and
 * enrols them; the student gets a welcome e-mail to set their own password (or a temporary password, if e-mail is off).
 */
export function ApplyNowModal({ open, onClose, onApplied }) {
  const toast = useToast();
  const options = useFetch(open ? '/agent/apply' : null);
  const o = options.data;
  const needsPassword = o && !o.emailConfigured;

  const fields = [
    ...FIELDS,
    {
      name: 'courseId',
      label: 'Course applied for',
      type: 'select',
      span: true,
      placeholder: 'Not decided yet',
      options: (o?.courses ?? []).map((c) => ({
        value: c.id,
        label: [c.title, durationLabel(c.durationValue, c.durationUnit), c.feeAmount !== null ? formatMoney(c.feeAmount, o.currency) : null]
          .filter((x) => x && x !== '—')
          .join(' · '),
      })),
    },
    {
      name: 'notes',
      label: 'Note for MIATA admissions',
      type: 'textarea',
      span: true,
      rows: 2,
      placeholder: 'e.g. preferred intake or batch',
    },
    ...(needsPassword
      ? [
          {
            name: 'temporaryPassword',
            label: 'Temporary password',
            type: 'password',
            required: true,
            span: true,
            hint: 'E-mail is not set up, so give this to the student in person. They must change it at first sign-in.',
          },
        ]
      : []),
  ];

  if (open && options.error) {
    return (
      <Modal open title="Apply Now" onClose={onClose}>
        <Alert tone="error">{options.error.message}</Alert>
      </Modal>
    );
  }
  return (
    <FormModal
      open={open && Boolean(o)}
      title="Apply Now — register a student"
      submitLabel="Submit application"
      fields={fields}
      initialValues={{
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        qualification: '',
        city: '',
        country: '',
        address: '',
        courseId: '',
        notes: '',
        temporaryPassword: '',
      }}
      intro={
        <Alert tone="info">
          The student is added to your referrals straight away. MIATA admissions confirms the course and enrols them.
          {o?.emailConfigured && ' They receive an e-mail with a secure link to set their own password.'}
        </Alert>
      }
      onSubmit={async (values) => {
        const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v]));
        if (!needsPassword) delete payload.temporaryPassword;
        const res = await api.post('/agent/students', payload);
        const { fullName, studentCode, welcomeEmail } = res.data;
        if (welcomeEmail?.status === 'sent')
          toast.success(`${fullName} (${studentCode}) registered. A welcome e-mail was sent to ${welcomeEmail.recipient}.`);
        else if (welcomeEmail?.status === 'failed') {
          toast.error(`${fullName} (${studentCode}) registered, but the welcome e-mail could not be sent. MIATA admissions can resend it.`);
        } else toast.success(`${fullName} (${studentCode}) registered. Give them the temporary password to sign in.`);
        return res.data;
      }}
      onSuccess={onApplied}
      onClose={onClose}
    />
  );
}
