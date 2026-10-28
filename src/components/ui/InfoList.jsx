/** Key/value pairs: items = [[label, value], …]; empty values show an em dash. */
export function InfoList({ items }) {
  return (
    <dl className="info-list">
      {items.map(([label, value]) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd>{value === null || value === undefined || value === '' ? '—' : value}</dd>
        </div>
      ))}
    </dl>
  );
}
