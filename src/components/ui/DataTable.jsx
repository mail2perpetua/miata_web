import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import { EmptyState } from '../feedback/States';

/**
 * Accessible data table.
 * columns: [{ key, header, render?(row), sortKey?, align?, width?, className? }]
 * sort/order + onSort enable sortable headers (server-side sorting).
 */
export function DataTable({
  columns,
  rows,
  loading = false,
  rowKey = 'id',
  onRowClick,
  sort,
  order,
  onSort,
  empty,
  compact = false,
  caption,
}) {
  const showSkeleton = loading && !rows?.length;
  return (
    <div className={`table-wrap ${loading && rows?.length ? 'is-refreshing' : ''}`}>
      <table className={`table ${compact ? 'table--compact' : ''}`}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align ? `align-${col.align}` : undefined}
                style={col.width ? { width: col.width } : undefined}
                aria-sort={col.sortKey && sort === col.sortKey ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {col.sortKey && onSort ? (
                  <button
                    type="button"
                    className={`th-sort ${sort === col.sortKey ? 'is-active' : ''}`}
                    onClick={() => onSort(col.sortKey)}
                  >
                    {col.header}
                    {sort !== col.sortKey ? (
                      <ArrowUpDown aria-hidden="true" />
                    ) : order === 'asc' ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showSkeleton &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={`sk${i}`} className="table-skeleton" aria-hidden="true">
                {columns.map((col) => (
                  <td key={col.key} />
                ))}
              </tr>
            ))}
          {!showSkeleton &&
            rows?.map((row, index) => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? index)}
                className={onRowClick ? 'is-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={[col.align && `align-${col.align}`, col.className].filter(Boolean).join(' ') || undefined}>
                    {col.render ? col.render(row, index) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {!loading &&
        !rows?.length &&
        (empty ?? <EmptyState icon={Inbox} title="Nothing here yet" message="No records match the current filters." />)}
    </div>
  );
}
