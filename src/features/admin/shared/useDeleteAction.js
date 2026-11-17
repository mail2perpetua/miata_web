import { useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';

/**
 * Confirm, then DELETE. When the API refuses (409: other records depend on the item) its explanation is shown as the
 * error toast. `deleting(key)` tells which row is being deleted (for the button spinner). Resolves to true once deleted.
 */
export function useDeleteAction() {
  const confirm = useConfirm();
  const { run, busy } = useApiAction();

  const remove = async ({ path, title, message, success = 'Deleted', confirmLabel = 'Delete', onDone }) => {
    const ok = await confirm({ title, message, confirmLabel, danger: true });
    if (!ok) return false;
    const res = await run(() => api.delete(path), { success, onDone, key: path });
    return Boolean(res);
  };

  return { remove, deleting: (path) => busy === path };
}
