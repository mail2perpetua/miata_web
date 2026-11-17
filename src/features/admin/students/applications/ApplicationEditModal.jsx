import { ErrorState, FormModal, Modal, PageLoader, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { STUDY_MODES } from './applications';

const FIELDS = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'country', label: 'Country', required: true },
  { name: 'agentName', label: 'Agent name' },
  { name: 'agentContact', label: 'Agent contact / email' },
  { name: 'studyMode', label: 'Mode of study', type: 'select', options: STUDY_MODES, span: true },
  { name: 'statement', label: 'Statement of purpose', type: 'textarea', span: true, rows: 6 },
];

/** Correct an applicant's details (e.g. a mistyped e-mail) before approving. Approved applications cannot be edited. */
export function ApplicationEditModal({ applicationId, onClose, onSaved }) {
  const toast = useToast();
  const state = useFetch(`/admin/applications/${applicationId}`);
  const a = state.data;
  if (!a) {
    return (
      <Modal open title="Edit application" onClose={onClose}>
        {state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : <PageLoader />}
      </Modal>
    );
  }
  return (
    <FormModal
      open
      title={`Edit application ${a.referenceNumber}`}
      submitLabel="Save changes"
      fields={FIELDS}
      initialValues={{
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        country: a.country,
        agentName: a.agentName ?? '',
        agentContact: a.agentContact ?? '',
        studyMode: a.studyMode ?? '',
        statement: a.statement ?? '',
      }}
      onSubmit={async (values) => {
        await api.put(`/admin/applications/${applicationId}`, values);
        toast.success('Application updated');
        onSaved?.();
      }}
      onClose={onClose}
    />
  );
}
