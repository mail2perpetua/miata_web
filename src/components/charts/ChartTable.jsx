/** Accessible table view of a chart's data (every value reachable without hovering). */
export function ChartTable({ data, xKey, xFormat = (v) => v, series, valueFormat = (v) => v }) {
  return (
    <div className="table-wrap">
      <table className="table table--compact">
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.key} className="align-right">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d[xKey]}>
              <td>{xFormat(d[xKey])}</td>
              {series.map((s) => (
                <td key={s.key} className="align-right num">
                  {valueFormat(d[s.key] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
