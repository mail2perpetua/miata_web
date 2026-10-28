import { CircleAlert, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty">
      <Icon aria-hidden="true" />
      {title && <p className="empty__title">{title}</p>}
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty" role="alert">
      <CircleAlert aria-hidden="true" style={{ color: 'var(--red-600)' }} />
      <p className="empty__title">{error?.status === 404 ? 'Not found' : 'Could not load this page'}</p>
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && error?.status !== 404 && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Standard wrapper: spinner on first load, error with retry, otherwise children(data). */
export function AsyncContent({ state, children }) {
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <PageLoader />;
  return children(state.data);
}

export function Alert({ tone = 'info', icon: Icon = CircleAlert, children }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
