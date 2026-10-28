import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// URL parameters that only drive the UI (open dialog, active tab) and are never sent to the API.
const UI_KEYS = ['new', 'tab'];

/**
 * List state (page, pageSize, search, sort, order and filters) stored in the URL, so lists are
 * shareable, survive reloads and work with the browser back button.
 */
export function useListQuery(defaults = {}) {
  const [params, setParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);
  const base = useMemo(() => ({ page: 1, pageSize: 10, order: 'desc', ...JSON.parse(defaultsKey) }), [defaultsKey]);

  const query = useMemo(() => {
    const q = { ...base };
    for (const [key, value] of params.entries()) q[key] = value;
    q.page = Number(q.page) || 1;
    q.pageSize = Number(q.pageSize) || base.pageSize;
    return q;
  }, [params, base]);

  const apiQuery = useMemo(() => Object.fromEntries(Object.entries(query).filter(([k]) => !UI_KEYS.includes(k))), [query]);

  /** Merge changes; any change other than the page resets to page 1. */
  const update = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === null || value === '' || value === base[key]) next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in changes) && Object.keys(changes).some((k) => !UI_KEYS.includes(k))) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams, base],
  );

  const setSort = useCallback(
    (sort) => update({ sort, order: query.sort === sort && query.order === 'desc' ? 'asc' : 'desc' }),
    [update, query.sort, query.order],
  );

  return { query, apiQuery, update, setPage: (page) => update({ page }), setSort };
}

/** `?new=1` opens a page's create dialog (used by dashboard quick actions). */
export function useCreateDialog() {
  const [params, setParams] = useSearchParams();
  const open = params.get('new') === '1';
  const setOpen = useCallback(
    (value) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('new', '1');
          else next.delete('new');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [open, setOpen];
}
