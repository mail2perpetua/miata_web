import { useState } from 'react';
import { ChartTable } from './ChartTable';
import { compactNumber, niceTicks, useElementWidth } from './chartUtils';

const MARGIN = { top: 28, right: 24, bottom: 32, left: 44 };

/**
 * Line / area chart for change over time.
 * series: [{ key, label, color }]. One series → area wash + value labels when sparse (≤ 8 points);
 * several → legend, end labels and a "Table" view. Crosshair tooltip on hover and arrow keys.
 */
export function LineChart({ data, xKey, xFormat = (v) => v, series, height = 260, valueFormat = (v) => v, ariaLabel }) {
  const [containerRef, width] = useElementWidth();
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const multi = series.length > 1;

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const maxValue = Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  const { top, ticks } = niceTicks(maxValue);
  const x = (i) => (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => innerH - (v / top) * innerH;
  const labelEveryPoint = !multi && data.length <= 8;

  const pointerToIndex = (clientX, rect) => {
    const px = clientX - rect.left - MARGIN.left;
    const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
    return Math.max(0, Math.min(data.length - 1, Math.round(px / (step || 1))));
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') setActive((i) => Math.min(data.length - 1, (i ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? data.length) - 1));
    else if (e.key === 'Escape') setActive(null);
  };

  const tooltipLeft = active !== null ? MARGIN.left + x(active) : 0;

  return (
    <div className="chart">
      {multi && (
        <div className="chart__legend">
          {series.map((s) => (
            <span key={s.key} className="chart__legend-item">
              <span className="chart__line-key" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          <button type="button" className="link-btn chart__table-toggle" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? 'Chart' : 'Table'}
          </button>
        </div>
      )}
      {showTable ? (
        <ChartTable data={data} xKey={xKey} xFormat={xFormat} series={series} valueFormat={valueFormat} />
      ) : (
        <div className="chart__canvas" ref={containerRef} style={{ height }}>
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={ariaLabel}
              tabIndex={0}
              onKeyDown={onKey}
              onBlur={() => setActive(null)}
              onPointerMove={(e) => setActive(pointerToIndex(e.clientX, e.currentTarget.getBoundingClientRect()))}
              onPointerLeave={() => setActive(null)}
            >
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
                    <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" className="chart__axis num">
                      {compactNumber(t)}
                    </text>
                  </g>
                ))}
                {data.map((d, i) => (
                  <text key={d[xKey]} x={x(i)} y={innerH + 22} textAnchor="middle" className="chart__axis">
                    {xFormat(d[xKey])}
                  </text>
                ))}

                {series.map((s) => {
                  const pts = data.map((d, i) => [x(i), y(Number(d[s.key]) || 0)]);
                  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ');
                  return (
                    <g key={s.key}>
                      {!multi && <path d={`${line} L${x(data.length - 1)},${innerH} L${x(0)},${innerH} Z`} fill={s.color} opacity={0.1} />}
                      <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                      {pts.map(([px, py], i) =>
                        labelEveryPoint || i === pts.length - 1 || active === i ? (
                          <circle key={i} cx={px} cy={py} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                        ) : null,
                      )}
                      {labelEveryPoint &&
                        pts.map(([px, py], i) => (
                          <text key={`l${i}`} x={px} y={py - 12} textAnchor="middle" className="chart__value num">
                            {valueFormat(data[i][s.key] ?? 0)}
                          </text>
                        ))}
                    </g>
                  );
                })}

                {active !== null && <line x1={x(active)} x2={x(active)} y1={0} y2={innerH} stroke="var(--border-strong)" strokeWidth={1} />}
              </g>
            </svg>
          )}
          {active !== null && width > 0 && (
            <div className="chart__tooltip" style={{ left: Math.min(Math.max(tooltipLeft, 70), width - 70), top: 4 }} role="status">
              <div className="chart__tooltip-title">{xFormat(data[active][xKey])}</div>
              {series.map((s) => (
                <div key={s.key} className="chart__tooltip-row">
                  <span className="chart__line-key" style={{ background: s.color }} />
                  <strong className="num">{valueFormat(data[active][s.key] ?? 0)}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
