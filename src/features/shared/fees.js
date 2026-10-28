// Fee payment labels shared by the admin and student portals.

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const methodLabel = (method) => PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending verification' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
