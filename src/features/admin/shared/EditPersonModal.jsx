import { Modal, PageLoader, ErrorState } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { PersonFormModal } from './PersonFormModal';

/**
 * Edit a student / professor / agent from a list row. List rows do not carry the profile, so the full record is loaded
 * first (saving without it would clear the profile fields).
 */
export function EditPersonModal({ role, personId, onClose, onSaved }) {
  const state = useFetch(`/admin/${role}s/${personId}`);
  if (!state.data) {
    return (
      <Modal open title="Edit" onClose={onClose}>
        {state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : <PageLoader />}
      </Modal>
    );
  }
  return <PersonFormModal open role={role} person={state.data} onClose={onClose} onSaved={onSaved} />;
}
