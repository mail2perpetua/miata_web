import { FormModal, useToast } from '@/components';
import { api } from '@/services/api';
import { accessEndDate, durationLabel, formatDate, formatMoney } from '@/utils/format';

const AMOUNT = /^\d+(\.\d{1,2})?$/;
const amountError = (value, label) =>
  value !== '' && !AMOUNT.test(String(value).trim()) ? `Enter ${label} as a number, e.g. 36000` : null;

/**
 * The student's access period for one course. The account is deactivated automatically after the last end date of all
 * their courses; extending a period reactivates an account that was deactivated only because access had ended.
 */
export function EnrolmentScheduleModal({ enrolment, onClose, onSaved }) {
  const toast = useToast();
  const e = enrolment;
  const suggested = (start) => accessEndDate(start, e.durationValue, e.durationUnit);
  return (
    <FormModal
      open
      size="md"
      title={`Access period — ${e.courseTitle}`}
      submitLabel="Save access period"
      fields={[
        { name: 'startDate', label: 'Course start date', type: 'date', required: true },
        {
          name: 'endDate',
          label: 'Last day of access',
          type: 'date',
          hint: e.durationValue
            ? `Course duration ${durationLabel(e.durationValue, e.durationUnit)}. Leave empty for no end date.`
            : 'Leave empty for no end date.',
        },
      ]}
      initialValues={{ startDate: e.startDate ?? '', endDate: e.endDate ?? '' }}
      validate={(values) => ({
        endDate:
          values.endDate && values.startDate && values.endDate < values.startDate ? 'The end date cannot be before the start date' : null,
      })}
      intro={
        e.durationValue && (
          <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
            From the course duration, a start on {formatDate(e.startDate)} gives access until {formatDate(suggested(e.startDate))}. The
            student’s account is deactivated automatically the day after the last end date of all their courses.
          </p>
        )
      }
      onSubmit={async (values) => {
        const res = await api.put(`/admin/enrolments/${e.enrolmentId}/schedule`, {
          startDate: values.startDate,
          endDate: values.endDate || null,
        });
        if (res.data.accountReactivated) toast.success('Access extended — the account is active again');
        else if (res.data.accountDeactivated) toast.info('Access period saved. It has ended, so the account was deactivated.');
        else toast.success('Access period saved');
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}

/** What the student is charged for one course, and any scholarship / discount. */
export function EnrolmentFeeModal({ enrolment, currency, onClose, onSaved }) {
  const toast = useToast();
  const e = enrolment;
  return (
    <FormModal
      open
      size="md"
      title={`Fee — ${e.courseTitle}`}
      submitLabel="Save fee"
      fields={[
        { name: 'feeAmount', label: `Course fee (${currency})`, required: true },
        { name: 'discountAmount', label: `Discount / scholarship (${currency})`, hint: 'Leave empty for none.' },
      ]}
      initialValues={{ feeAmount: String(e.feeAmount ?? ''), discountAmount: e.discountAmount ? String(e.discountAmount) : '' }}
      validate={(values) => ({
        feeAmount: amountError(values.feeAmount, 'the fee'),
        discountAmount:
          amountError(values.discountAmount, 'the discount') ||
          (Number(values.discountAmount || 0) > Number(values.feeAmount || 0) ? 'The discount cannot be more than the fee' : null),
      })}
      intro={
        <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
          Paid so far: {formatMoney(e.paid, currency)}. Payments already made are kept; the balance is recalculated. The student is
          notified.
        </p>
      }
      onSubmit={async (values) => {
        const res = await api.put(`/admin/enrolments/${e.enrolmentId}/fee`, {
          feeAmount: Number(values.feeAmount),
          discountAmount: Number(values.discountAmount || 0),
        });
        toast.success('Fee saved');
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={onClose}
    />
  );
}
