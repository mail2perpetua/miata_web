import { useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';

/** Ask, then delete. Only worksheets no student has started can be deleted; the API explains otherwise. */
export function useDeleteWorksheet(base) {
  const confirm = useConfirm();
  const { run } = useApiAction();
  return async (worksheet, onDone) => {
    if (
      await confirm({
        title: `Delete “${worksheet.title}”?`,
        message: 'Only worksheets no student has started can be deleted. Unpublish it otherwise.',
        confirmLabel: 'Delete',
        danger: true,
      })
    ) {
      await run(() => api.delete(`${base}/worksheets/${worksheet.id}`), { success: 'Worksheet deleted', onDone });
    }
  };
}
