import { useState } from 'react';
import { formatNumber } from '@/utils/format';

/**
 * Horizontal bars for magnitude by category (single hue, value at each bar tip).
 * items: [{ key, label, value, detail? }]
 */
export function BarChart({ items, color = 'var(--accent)', valueLabel = '' }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="bars" aria-label="Bar chart">
      {items.map((item) => (
        <li
          key={item.key}
          className={`bars__row ${active === item.key ? 'is-active' : ''}`}
          tabIndex={0}
          onPointerEnter={() => setActive(item.key)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(item.key)}
          onBlur={() => setActive(null)}
        >
          <span className="bars__label" title={item.label}>
            {item.label}
          </span>
          <span className="bars__track">
            <span className="bars__bar" style={{ width: `${(item.value / max) * 100}%`, background: color }} />
            <span className="bars__value num">{formatNumber(item.value)}</span>
          </span>
          {active === item.key && (
            <span className="bars__tooltip" role="status">
              <strong className="num">
                {formatNumber(item.value)} {valueLabel}
              </strong>
              {item.detail && <span>{item.detail}</span>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
