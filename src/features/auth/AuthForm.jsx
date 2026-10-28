// Form building blocks for the sign-in pages, in the original website's login page design.
import { useId, useState } from 'react';

/** The login-page section; `single` centres one column (no dashed divider). */
export function AuthArea({ notice, single = false, children }) {
  return (
    <section className="login-page">
      <div className="container">
        {notice}
        <div className={`login-page__area${single ? ' login-page__area--single' : ''}`}>
          {single ? children : <div className="row">{children}</div>}
        </div>
      </div>
    </section>
  );
}

/** Highlighted one-line message above the form area. */
export function AuthNotice({ children }) {
  return (
    <div className="login-page__info" role="status">
      <p>{children}</p>
    </div>
  );
}

/** A theme input; password fields get an eye button that shows or hides the password. */
export function AuthField({ error, hint, label, type, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`login-page__form-input-box${isPassword ? ' login-page__form-input-box--password' : ''}`}>
      <input
        id={id}
        type={isPassword && visible ? 'text' : type}
        aria-label={label ?? props.placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          className="login-page__password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={id}
        >
          <span className={`fa ${visible ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></span>
        </button>
      )}
      {hint && !error && (
        <span className="login-page__field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="login-page__field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

/** The theme's round checkbox (the label's empty span is the drawn box). */
export function AuthCheckbox({ checked, onChange, error, children, aside }) {
  const id = useId();
  return (
    <div className="login-page__checked-box">
      <input type="checkbox" id={id} checked={checked} onChange={onChange} />{' '}
      <label htmlFor={id}>
        <span></span>
        {children}
      </label>
      {aside}
      {error && <span className="login-page__field-error login-page__field-error--block">{error}</span>}
    </div>
  );
}

export function AuthSubmit({ busy, children }) {
  return (
    <div className="login-page__form-btn-box">
      <button type="submit" className="eduact-btn eduact-btn-second" disabled={busy} aria-busy={busy || undefined}>
        <span className="eduact-btn__curve"></span>
        {busy ? 'Please wait…' : children}
      </button>
    </div>
  );
}
