import { useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';

/** Ask, then delete. Only assignments without submissions can be deleted; the API explains otherwise. */
export function useDeleteAssignment() {
  const confirm = useConfirm();
  const { run } = useApiAction();
  return async (assignment, onDone) => {
    if (
      await confirm({
        title: `Delete “${assignment.title}”?`,
        message: 'Only assignments without submissions can be deleted. Unpublish it otherwise.',
        confirmLabel: 'Delete',
        danger: true,
      })
    ) {
      await run(() => api.delete(`/professor/assignments/${assignment.id}`), { success: 'Assignment deleted', onDone });
    }
  };
}
