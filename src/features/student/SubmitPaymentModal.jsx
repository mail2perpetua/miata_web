import { FileDrop, FormModal, useToast } from '@/components';
import { PAYMENT_METHODS } from '@/features/shared/fees';
import { api, toFormData } from '@/services/api';
import { formatMoney, todayIso } from '@/utils/format';

const PROOF_TYPES = '.png,.jpg,.jpeg,.webp,.pdf';
const MAX_PROOF_BYTES = 20 * 1024 * 1024;
const AMOUNT = /^\d+(\.\d{1,2})?$/;

/** Report a fee payment with a screenshot or receipt. It counts as paid once MIATA approves it. */
export function SubmitPaymentModal({ open, courses, currency, onClose, onSubmitted }) {
  const toast = useToast();
  const payable = courses.filter((c) => c.balance - c.pending > 0);
  const openFor = (courseId) => {
    const c = courses.find((x) => x.courseId === Number(courseId));
    return c ? Math.round((c.balance - c.pending) * 100) / 100 : 0;
  };

  return (
    <FormModal
      open={open}
      title="Upload payment proof"
      submitLabel="Submit for verification"
      size="lg"
      fields={[
        {
          name: 'courseId',
          label: 'Course',
          type: 'select',
          required: true,
          span: true,
          options: payable.map((c) => ({
            value: c.courseId,
            label: `${c.courseTitle} — ${formatMoney(c.balance - c.pending, currency)} to pay`,
          })),
        },
        { name: 'amount', label: `Amount paid (${currency})`, required: true, placeholder: 'e.g. 5000' },
        { name: 'paidOn', label: 'Date of payment', type: 'date', required: true },
        { name: 'method', label: 'Payment method', type: 'select', required: true, options: PAYMENT_METHODS },
        { name: 'reference', label: 'Transaction / reference number', placeholder: 'As shown on your receipt' },
        { name: 'notes', label: 'Note for MIATA (optional)', type: 'textarea', span: true, rows: 2 },
      ]}
      initialValues={{
        courseId: payable.length === 1 ? String(payable[0].courseId) : '',
        amount: '',
        paidOn: todayIso(),
        method: 'bank_transfer',
        reference: '',
        notes: '',
        proof: null,
      }}
      validate={(values) => {
        const amount = values.amount.trim();
        const max = openFor(values.courseId);
        return {
          amount:
            amount && !AMOUNT.test(amount)
              ? 'Enter the amount as a number, e.g. 5000 or 5000.50'
              : amount && Number(amount) <= 0
                ? 'Enter the amount you paid'
                : values.courseId && Number(amount) > max
                  ? `The most you can report for this course now is ${formatMoney(max, currency)}`
                  : null,
          paidOn: values.paidOn > todayIso() ? 'The payment date cannot be in the future' : null,
          proof: values.proof ? null : 'Choose the screenshot or receipt of your payment',
        };
      }}
      onSubmit={async ({ proof, ...values }) => {
        const res = await api.post('/student/payments', toFormData({ ...values, amount: values.amount.trim() }, { proof }));
        toast.success('Payment proof submitted. MIATA will verify it and update your balance.');
        return res.data;
      }}
      onSuccess={onSubmitted}
      onClose={onClose}
    >
      {(form) => (
        <FileDrop
          accept={PROOF_TYPES}
          maxBytes={MAX_PROOF_BYTES}
          file={form.values.proof}
          onChange={form.set('proof')}
          error={form.errors.proof}
          label="Choose the payment screenshot or receipt, or drag it here"
          hint="PNG, JPG, WEBP or PDF · up to 20 MB"
        />
      )}
    </FormModal>
  );
}
