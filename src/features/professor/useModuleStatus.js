import { moduleStatusLabel } from '@/features/shared/moduleStatus';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';

/** Set a module's status (PUT /professor/modules/:id/status) with a toast; `onDone(module)` gets the updated module. */
export function useModuleStatus(onDone) {
  const { run, busy } = useApiAction();
  const setStatus = (m, status) =>
    run(() => api.put(`/professor/modules/${m.id}/status`, { status }), {
      key: `status-${m.id}`,
      success: `“${m.title}” marked ${moduleStatusLabel(status)}`,
      onDone: (res) => onDone?.(res.data),
    });
  return { setStatus, busy };
}
