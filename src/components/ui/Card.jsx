import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Card({ title, subtitle, icon: Icon, action, flush = false, className = '', bodyClassName = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card__header">
          <div>
            {title && (
              <h2 className="card__title">
                {Icon && <Icon aria-hidden="true" />}
                {title}
              </h2>
            )}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`${flush ? 'card__body--flush' : 'card__body'} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** The "View All →" link used in card headers across the reference dashboards. */
export function ViewAll({ to, label = 'View All' }) {
  return (
    <Link to={to} className="link-btn">
      {label} <ChevronRight aria-hidden="true" />
    </Link>
  );
}
