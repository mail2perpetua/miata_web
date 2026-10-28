import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';

/**
 * Load `path` (with `query`) from the API. Re-fetches when either changes.
 * Keeps the previous data while reloading (so pages don't flash) and ignores stale responses.
 * Pass `path = null` to skip fetching.
 */
export function useFetch(path, query) {
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: Boolean(path) });
  const queryKey = JSON.stringify(query ?? {});
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.get(path, JSON.parse(queryKey));
      if (id === requestId.current) setState({ data: res.data, meta: res.meta ?? null, error: null, loading: false });
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path, queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: load, setData };
}
