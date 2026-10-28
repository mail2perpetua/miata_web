import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

/** Debounced search box; calls onSearch only after the user pauses typing. */
export function SearchInput({ value = '', onSearch, placeholder = 'Search…', label = 'Search' }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow external changes (e.g. browser back) without an effect.
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }
  const debounced = useDebounce(text);

  useEffect(() => {
    if (debounced.trim() !== (value || '')) onSearch(debounced.trim() || undefined);
    // Only the debounced text should trigger a search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="toolbar__search">
      <Search aria-hidden="true" />
      <input
        className="input"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}
