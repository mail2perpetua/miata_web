import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Checkbox, Spinner } from '@/components';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/services/api';

/**
 * Searchable multi-select of users of one role (from /admin/lookups/<role>s).
 * `selected` is an array of { id, fullName }; `excludeIds` hides people already linked.
 */
export function PeoplePicker({ role = 'student', selected, onChange, excludeIds = [] }) {
  const [term, setTerm] = useState('');
  const [result, setResult] = useState({ term: null, rows: [] });
  const debounced = useDebounce(term.trim(), 250);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/admin/lookups/${role}s`, { search: debounced || undefined, limit: 30 })
      .then((res) => !cancelled && setResult({ term: debounced, rows: res.data }))
      .catch(() => !cancelled && setResult({ term: debounced, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [debounced, role]);

  const loading = result.term !== debounced;
  const isSelected = (id) => selected.some((s) => s.id === id);
  const toggle = (person) =>
    onChange(
      isSelected(person.id) ? selected.filter((s) => s.id !== person.id) : [...selected, { id: person.id, fullName: person.fullName }],
    );
  const visible = result.rows.filter((p) => !excludeIds.includes(p.id));

  return (
    <div className="stack" style={{ gap: 12 }}>
      {selected.length > 0 && (
        <div className="row row--wrap">
          {selected.map((s) => (
            <span key={s.id} className="chip">
              {s.fullName}
              <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s.fullName}`}>
                <X />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="toolbar__search" style={{ maxWidth: 'none' }}>
        <Search aria-hidden="true" />
        <input
          className="input"
          type="search"
          placeholder={`Search ${role}s by name, email or ID`}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label={`Search ${role}s`}
        />
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: '4px 12px' }}>
        {loading && (
          <div className="page-loader" style={{ minHeight: 80 }}>
            <Spinner />
          </div>
        )}
        {!loading && visible.length === 0 && (
          <p className="muted" style={{ padding: 12 }}>
            No {role}s found.
          </p>
        )}
        {!loading &&
          visible.map((p) => (
            <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Checkbox
                checked={isSelected(p.id)}
                onChange={() => toggle(p)}
                disabled={!p.isActive}
                label={
                  <span>
                    <strong>{p.fullName}</strong>{' '}
                    <span className="muted">
                      · {p.code} · {p.email}
                    </span>
                    {p.batchName && (
                      <span className="badge badge--purple" style={{ marginLeft: 6 }}>
                        {p.batchName}
                      </span>
                    )}
                    {!p.isActive && (
                      <span className="badge badge--red" style={{ marginLeft: 6 }}>
                        Inactive
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          ))}
      </div>
    </div>
  );
}
