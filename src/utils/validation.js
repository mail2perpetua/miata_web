// Client-side checks mirror the API's rules for instant feedback; the API remains the authority.

export const required = (value, label = 'This field') => (String(value ?? '').trim() ? null : `${label} is required`);

export const email = (value) => {
  if (!String(value ?? '').trim()) return 'Email is required';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Enter a valid email address';
};

export const password = (value) => {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain a letter';
  if (!/\d/.test(value)) return 'Password must contain a number';
  return null;
};

export const matches = (value, other, message = 'Passwords do not match') => (value === other ? null : message);

export const phone = (value) => (!value || /^[+\d][\d\s()-]{5,29}$/.test(value.trim()) ? null : 'Enter a valid phone number');

export const positiveInt = (value, label = 'Value') =>
  value === '' || value === null || value === undefined || (/^\d+$/.test(String(value)) && Number(value) > 0)
    ? null
    : `${label} must be a whole number`;
