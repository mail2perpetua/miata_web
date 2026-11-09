import { accessEndDate } from '@/utils/format';
import * as v from '@/utils/validation';

// Conditional offer letter of an enquiry: pending (not generated) → generated → sent.
export const OFFER_STATUS = {
  pending: { label: 'Pending', tone: 'gray' },
  generated: { label: 'Generated', tone: 'amber' },
  sent: { label: 'Sent', tone: 'green' },
};
export const OFFER_STATUS_OPTIONS = Object.entries(OFFER_STATUS).map(([value, { label }]) => ({ value, label }));

/** The study modes offered on the Apply Now form. */
export const STUDY_MODES = ['Hybrid (6 months, online)', 'On Shore (1 year, full-time)'];

/** The expected end date printed on the letter: start + course duration (15 Oct 2026 + 12 months → 15 Oct 2027). */
export function courseEndDate(start, value, unit) {
  const lastDay = accessEndDate(start, value, unit);
  if (!lastDay) return null;
  const d = new Date(`${lastDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** 36000 + 'AUD' → 'AUD 36,000', as printed on the letter. */
export function letterAmount(value, currency) {
  const n = Number(value) || 0;
  const cents = Math.round(n * 100) % 100 !== 0;
  return `${currency || 'AUD'} ${n.toLocaleString('en-AU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** The two payment options the letter offers, from the form's (string) amounts. */
export function feeSummary({ tuitionFee, depositAmount, fullPaymentDiscount }) {
  const fee = Number(tuitionFee) || 0;
  const deposit = Number(depositAmount) || 0;
  const discount = Number(fullPaymentDiscount) || 0;
  return {
    fee,
    deposit,
    discount,
    balance: Math.round((fee - deposit) * 100) / 100,
    fullPayment: Math.round((fee - discount) * 100) / 100,
    valid: fee > 0 && deposit > 0 && deposit <= fee && discount >= 0 && discount < fee,
  };
}

const str = (value) => (value === null || value === undefined ? '' : String(value));

/** API draft → form values (inputs hold strings). */
export function toFormValues(draft) {
  return {
    studentName: str(draft.studentName),
    address: str(draft.address),
    country: str(draft.country),
    courseId: str(draft.courseId),
    courseTitle: str(draft.courseTitle),
    studyMode: str(draft.studyMode),
    startDate: str(draft.startDate),
    endDate: str(draft.endDate),
    currency: str(draft.currency) || 'AUD',
    tuitionFee: str(draft.tuitionFee),
    depositAmount: str(draft.depositAmount),
    fullPaymentDiscount: str(draft.fullPaymentDiscount),
  };
}

/** Form values → the PUT body. */
export function toPayload(values) {
  const text = (s) => s.trim() || null;
  return {
    studentName: values.studentName.trim(),
    address: text(values.address),
    country: text(values.country),
    courseId: values.courseId ? Number(values.courseId) : null,
    courseTitle: values.courseTitle.trim(),
    studyMode: text(values.studyMode),
    startDate: values.startDate,
    endDate: values.endDate,
    currency: values.currency.trim().toUpperCase(),
    tuitionFee: Number(values.tuitionFee) || 0,
    depositAmount: Number(values.depositAmount) || 0,
    fullPaymentDiscount: Number(values.fullPaymentDiscount) || 0,
  };
}

/** The same rules as the API, so mistakes show on the field before anything is sent. */
export function validateOffer(values) {
  const { fee, deposit, discount } = feeSummary(values);
  const addressLines = values.address.split('\n').filter((l) => l.trim()).length;
  return {
    studentName: v.required(values.studentName, 'Student name'),
    address: addressLines > 6 ? 'Use at most 6 address lines' : null,
    courseTitle: v.required(values.courseTitle, 'Course title'),
    startDate: v.required(values.startDate, 'Start date'),
    endDate:
      v.required(values.endDate, 'End date') ||
      (values.startDate && values.endDate <= values.startDate ? 'The end date must be after the start date' : null),
    currency: /^[A-Za-z]{3}$/.test(values.currency.trim()) ? null : 'Use a 3-letter currency code, e.g. AUD',
    tuitionFee: fee > 0 ? null : 'Enter the tuition fee',
    depositAmount: deposit <= 0 ? 'Enter the initial deposit' : deposit > fee ? 'The deposit cannot be more than the tuition fee' : null,
    fullPaymentDiscount:
      discount < 0
        ? 'The discount cannot be negative'
        : fee > 0 && discount >= fee
          ? 'The discount must be less than the tuition fee'
          : null,
  };
}

/** "the enquiry, the student profile and the course catalogue". */
export function sourceList(sources) {
  const items = sources.map((s) => `the ${s}`);
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? '');
}
