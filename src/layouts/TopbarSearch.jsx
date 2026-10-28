import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/services/api';

const GROUPS = [
  ['students', 'Students', (r) => `/admin/students/${r.id}`],
  ['professors', 'Professors', (r) => `/admin/professors/${r.id}`],
  ['agents', 'Agents', (r) => `/admin/agents/${r.id}`],
  ['courses', 'Courses', (r) => `/admin/courses/${r.id}`],
  ['batches', 'Batches', (r) => `/admin/batches/${r.id}`],
];

/** Admin: live search across students, professors, agents, courses and batches. */
export function AdminSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const debounced = useDebounce(term.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) return undefined;
    let cancelled = false;
    api
      .get('/admin/search', { q: debounced })
      .then((res) => !cancelled && setResults(res.data))
      .catch(() => !cancelled && setResults(null));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const go = (path) => {
    setTerm('');
    setResults(null);
    navigate(path);
  };

  const showResults = debounced.length >= 2 && results;
  const empty = showResults && GROUPS.every(([key]) => !results[key]?.length);

  return (
    <div className="topbar__search dropdown">
      <Search aria-hidden="true" />
      <input
        type="search"
        placeholder="Search courses, students, professors…"
        aria-label="Search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setTerm('')}
      />
      {showResults && (
        <div className="dropdown__panel dropdown__panel--left" style={{ width: '100%' }}>
          {empty && <div className="dropdown__item muted">No matches for “{debounced}”</div>}
          {GROUPS.map(([key, label, path]) =>
            results[key]?.length ? (
              <div key={key}>
                <div className="dropdown__section">{label}</div>
                {results[key].map((r) => (
                  <button key={r.id} type="button" className="dropdown__item" onClick={() => go(path(r))}>
                    <span>
                      <span style={{ display: 'block', fontWeight: 600 }}>{r.title}</span>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                        {r.subtitle}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

/** Agent: search jumps to "My Referred Students" filtered by the term. */
export function AgentSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  return (
    <form
      className="topbar__search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/agent/students${term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''}`);
      }}
    >
      <Search aria-hidden="true" />
      <input
        type="search"
        placeholder="Search students, courses, status…"
        aria-label="Search my students"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </form>
  );
}
