import { useEffect, useId } from 'react';
import { useForm } from '@/hooks/useForm';
import * as v from '@/utils/validation';
import { Alert } from '../feedback/States';
import { Button } from './Button';
import { Checkbox, SelectField, TextArea, TextField } from './Form';
import { Modal } from './Modal';

/**
 * Create/edit dialog driven by a field list:
 *   { name, label, type: text|email|tel|password|number|date|datetime-local|textarea|select|checkbox,
 *     required?, options?, placeholder?, hint?, span?: true (full width), disabled?,
 *     resets?: ['otherField'] (cleared when this field changes, e.g. course → module) }
 * `onValuesChange(values)` lets the parent load dependent options (e.g. modules of the chosen course).
 * `onSubmit(values)` performs the save and may return the saved record; the dialog then closes and
 * `onSuccess(result)` runs (navigate there, not in onSubmit, so closing cannot undo the navigation).
 * Client-side checks mirror the API; server field errors are shown on the matching field.
 */
export function FormModal({ open, ...props }) {
  if (!open) return null;
  return <FormModalInner {...props} />;
}

function clientErrors(fields, values, validate) {
  const errors = {};
  for (const f of fields) {
    const value = values[f.name];
    if (f.required && f.type !== 'checkbox') errors[f.name] = v.required(value, f.label);
    if (!errors[f.name] && value) {
      if (f.type === 'email') errors[f.name] = v.email(value);
      if (f.type === 'tel') errors[f.name] = v.phone(value);
      if (f.type === 'password') errors[f.name] = v.password(value);
      if (f.type === 'number') errors[f.name] = v.positiveInt(value, f.label);
    }
  }
  return { ...errors, ...(validate ? validate(values) : {}) };
}

function FormModalInner({
  title,
  onSuccess,
  fields,
  initialValues,
  onSubmit,
  onClose,
  onValuesChange,
  submitLabel = 'Save',
  size = 'lg',
  validate,
  intro,
  children,
}) {
  const formId = useId();
  const form = useForm(initialValues);

  useEffect(() => {
    onValuesChange?.(form.values);
    // Only value changes matter; parents pass inline callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values]);
  const handleSubmit = form.submit(
    async (values) => {
      const result = await onSubmit(values);
      onClose();
      onSuccess?.(result);
    },
    (values) => clientErrors(fields, values, validate),
  );

  const renderField = (f) => {
    const common = {
      label: f.label,
      value: form.values[f.name] ?? '',
      onChange: (e) => {
        form.set(f.name)(e);
        if (f.resets) form.setValues((vals) => ({ ...vals, ...Object.fromEntries(f.resets.map((r) => [r, ''])) }));
      },
      error: form.errors[f.name],
      required: f.required,
      hint: f.hint,
      disabled: f.disabled,
      placeholder: f.placeholder,
      className: f.span ? 'span-2' : undefined,
    };
    if (f.type === 'textarea') return <TextArea key={f.name} {...common} rows={f.rows ?? 4} />;
    if (f.type === 'select')
      return <SelectField key={f.name} {...common} options={f.options} placeholder={f.placeholder ?? (f.required ? 'Select…' : 'None')} />;
    if (f.type === 'checkbox') {
      return (
        <div key={f.name} className={f.span === false ? undefined : 'span-2'}>
          <Checkbox label={f.label} checked={Boolean(form.values[f.name])} onChange={form.set(f.name)} disabled={f.disabled} />
          {f.hint && (
            <div className="field__hint" style={{ marginLeft: 26 }}>
              {f.hint}
            </div>
          )}
        </div>
      );
    }
    return (
      <TextField
        key={f.name}
        {...common}
        type={f.type ?? 'text'}
        min={f.type === 'number' ? 1 : undefined}
        autoComplete={f.type === 'password' ? 'new-password' : undefined}
      />
    );
  };

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={form.submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="stack" style={{ gap: 16 }}>
        {intro}
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <div className="form-grid">{fields.map(renderField)}</div>
        {children?.(form)}
      </form>
    </Modal>
  );
}
