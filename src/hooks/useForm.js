import { useCallback, useState } from 'react';

/**
 * Minimal form state: values, field errors (client or server), submitting flag and a form-level error.
 * Server validation errors ({ details: { field: message } }) are mapped onto the matching fields.
 */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const set = useCallback(
    (name) => (eventOrValue) => {
      const target = eventOrValue?.target;
      const value = target ? (target.type === 'checkbox' ? target.checked : target.value) : eventOrValue;
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
    },
    [],
  );

  const submit = (handler, validate) => async (event) => {
    event?.preventDefault();
    const clientErrors = validate ? validate(values) : {};
    const failing = Object.fromEntries(Object.entries(clientErrors).filter(([, msg]) => msg));
    if (Object.keys(failing).length) {
      setErrors(failing);
      setFormError(null);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await handler(values);
    } catch (err) {
      setErrors(err.details && typeof err.details === 'object' ? err.details : {});
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValues, errors, setErrors, submitting, formError, setFormError, set, submit };
}
