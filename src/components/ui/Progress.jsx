export function ProgressBar({ value = 0, label, tone }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`progress ${tone ? `progress--${tone}` : ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular meter: the unfilled track is a lighter step of the accent (student reference image). */
export function ProgressRing({ value = 0, size = 120, stroke = 10, caption }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="progress-ring" role="img" aria-label={`${pct}% ${caption ?? 'complete'}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="progress-ring__label">
        <span className="progress-ring__value" style={{ display: 'block' }}>
          {pct}%
        </span>
        {caption && <span className="progress-ring__caption">{caption}</span>}
      </span>
    </div>
  );
}
