import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field } from '@/components';

export function PasswordField({ label = 'Password', error, hint, autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} required>
      {(a11y) => (
        <div className="password-field">
          <input className="input" type={visible ? 'text' : 'password'} autoComplete={autoComplete} {...a11y} {...props} />
          <button
            type="button"
            className="password-field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        </div>
      )}
    </Field>
  );
}

export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';
