import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function PageHeader({ title, subtitle, actions, back }) {
  useDocumentTitle(typeof title === 'string' ? title : undefined);
  return (
    <div>
      {back && (
        <Link to={back.to} className="back-link">
          <ArrowLeft aria-hidden="true" /> {back.label}
        </Link>
      )}
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </div>
  );
}
