import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '@/utils/format';

/** Overview tile: tinted icon circle, label, big number, optional hint and link arrow. */
export function StatCard({ icon: Icon, tone = 'blue', label, value, hint, to, compact = false }) {
  const body = (
    <>
      <span className={`stat-card__icon tone-${tone}`}>
        <Icon aria-hidden="true" />
      </span>
      <span className="stat-card__text">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value" style={{ display: 'block' }}>
          {typeof value === 'number' ? formatNumber(value) : (value ?? '—')}
        </span>
        {hint && <span className="stat-card__hint">{hint}</span>}
      </span>
      {to && <ArrowRight className="stat-card__arrow" aria-hidden="true" />}
    </>
  );
  const className = `card stat-card ${compact ? 'stat-card--compact' : ''}`;
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
