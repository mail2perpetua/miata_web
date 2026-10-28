import { useId } from 'react';

/** Label + control + hint/error. The control receives id/aria props through the render function. */
export function Field({ label, error, hint, required, className = '', children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${id}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export function TextField({ label, error, hint, required, className, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => <input className="input" required={required} {...a11y} {...inputProps} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => <textarea className="textarea" required={required} {...a11y} {...props} />}
    </Field>
  );
}

/** options: [{ value, label }] */
export function SelectField({ label, error, hint, required, className, options, placeholder, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => (
        <select className="select" required={required} {...a11y} {...props}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ label, ...props }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

/** Compact select for toolbars (no label element; uses aria-label). */
export function FilterSelect({ label, options, value, onChange, allLabel = 'All' }) {
  return (
    <select
      className="select select--inline"
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
