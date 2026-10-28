import { useState } from 'react';
import { formatNumber } from '@/utils/format';

function arcPath(cx, cy, r, inner, start, end) {
  const large = end - start > Math.PI ? 1 : 0;
  const p = (radius, angle) => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const [x1, y1] = p(r, start);
  const [x2, y2] = p(r, end);
  const [x3, y3] = p(inner, end);
  const [x4, y4] = p(inner, start);
  return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${inner},${inner} 0 ${large} 0 ${x4},${y4} Z`;
}

/**
 * Part-to-whole donut with a centre figure and a legend that carries every value and share,
 * so identity never depends on colour alone. segments: [{ key, label, value, color, hint? }]
 */
export function DonutChart({ segments, centerValue, centerLabel, size = 190, thickness = 28 }) {
  const [active, setActive] = useState(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2;
  const inner = r - thickness;
  let angle = 0;
  const arcs = segments.map((seg) => {
    const sweep = total ? (seg.value / total) * Math.PI * 2 : 0;
    const arc = { ...seg, start: angle, end: angle + sweep };
    angle += sweep;
    return arc;
  });
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <div className="donut">
      <div className="donut__figure" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={segments.map((s) => `${s.label} ${pct(s.value)}%`).join(', ')}>
          {total === 0 ? (
            <circle cx={r} cy={r} r={r - thickness / 2} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          ) : (
            arcs.map((a) =>
              a.end - a.start >= Math.PI * 2 - 1e-6 ? (
                <circle key={a.key} cx={r} cy={r} r={r - thickness / 2} fill="none" stroke={a.color} strokeWidth={thickness} />
              ) : a.end > a.start ? (
                <path
                  key={a.key}
                  d={arcPath(r, r, r - 1, inner, a.start, a.end)}
                  fill={a.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  opacity={active && active !== a.key ? 0.45 : 1}
                  onPointerEnter={() => setActive(a.key)}
                  onPointerLeave={() => setActive(null)}
                >
                  <title>{`${a.label}: ${formatNumber(a.value)} (${pct(a.value)}%)`}</title>
                </path>
              ) : null,
            )
          )}
        </svg>
        <div className="donut__center">
          <span className="donut__value">{centerValue}</span>
          <span className="donut__label">{centerLabel}</span>
        </div>
      </div>
      <ul className="donut__legend">
        {segments.map((s) => (
          <li
            key={s.key}
            className={active === s.key ? 'is-active' : undefined}
            onPointerEnter={() => setActive(s.key)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="donut__swatch" style={{ background: s.color }} />
            <span className="donut__name">{s.label}</span>
            <span className="donut__pct num">{pct(s.value)}%</span>
            <span className="donut__count">
              ({formatNumber(s.value)} {s.hint ?? ''})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
