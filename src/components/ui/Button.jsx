import { Link } from 'react-router-dom';
import { Tooltip } from './Tooltip';

/**
 * Button or link styled as a button.
 * variant: primary (role accent) | navy | secondary | ghost | ghost-danger (turns red on hover) | danger · size: md | sm
 * tooltip: a hint shown on hover / keyboard focus (explain what an icon-only button does).
 */
export function Button({ tooltip, ...props }) {
  return tooltip ? (
    <Tooltip label={tooltip}>
      <ButtonElement {...props} />
    </Tooltip>
  ) : (
    <ButtonElement {...props} />
  );
}

function ButtonElement({ variant = 'primary', size = 'md', icon: Icon, loading = false, block, to, className = '', children, ...props }) {
  const classes = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block', !children && 'btn--icon', className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...props} className={classes} disabled={loading || props.disabled} aria-busy={loading || undefined}>
      {content}
    </button>
  );
}
