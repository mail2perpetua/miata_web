import { useCallback, useState } from 'react';
import { useToast } from '@/components';

/**
 * Run a mutation with consistent feedback: success toast, error toast with the API's message,
 * optional follow-up (usually a reload). `busy` is the key of the running action (for button spinners).
 */
export function useApiAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const run = useCallback(
    async (fn, { success, onDone, key = 'default' } = {}) => {
      setBusy(key);
      try {
        const result = await fn();
        if (success) toast.success(success);
        await onDone?.(result);
        return result;
      } catch (err) {
        toast.error(err.message || 'Something went wrong');
        return undefined;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  return { run, busy };
}
