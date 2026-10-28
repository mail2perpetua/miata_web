import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageWindow(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

/** "Showing 1–10 of 48 students" with numbered page buttons (reference: agent dashboard). */
export function Pagination({ meta, onPage, noun = 'records' }) {
  if (!meta || meta.total === 0) return null;
  const { page, pageSize, total, totalPages } = meta;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageWindow(page, totalPages);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        Showing {from}–{to} of {total} {noun}
      </span>
      {totalPages > 1 && (
        <span className="pagination__pages">
          <button type="button" className="page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft />
          </button>
          {pages.map((p, i) => (
            <span key={p} style={{ display: 'contents' }}>
              {i > 0 && p - pages[i - 1] > 1 && (
                <span className="page-btn" aria-hidden="true" style={{ border: 0 }}>
                  …
                </span>
              )}
              <button
                type="button"
                className={`page-btn ${p === page ? 'is-active' : ''}`}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            </span>
          ))}
          <button type="button" className="page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
            <ChevronRight />
          </button>
        </span>
      )}
    </nav>
  );
}
