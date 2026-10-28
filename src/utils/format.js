const dateFmt = new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const monthFmt = new Intl.DateTimeFormat('en-AU', { month: 'short' });
const numberFmt = new Intl.NumberFormat('en-AU');

/** 'YYYY-MM-DD' strings are calendar dates; parse them as local dates so they never shift a day. */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const formatDate = (value) => (toDate(value) ? dateFmt.format(toDate(value)) : '—');
export const formatDateTime = (value) => (toDate(value) ? dateTimeFmt.format(toDate(value)) : '—');
export const formatNumber = (value) => numberFmt.format(value ?? 0);

/** '2026-05' → 'May' */
export function formatMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return monthFmt.format(new Date(y, m - 1, 1));
}

export function timeAgo(value) {
  const date = toDate(value);
  if (!date) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return n === 1 && unit === 'day' ? 'yesterday' : `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export const initials = (name = '') =>
  name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const durationLabel = (value, unit) => (value && unit ? `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}` : '—');

/** A batch schedule: "18 May 2026 – 14 May 2027", "From 1 Sep 2026", "Until …", or "—". */
export function dateRange(start, end) {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return '—';
}

/** Value for <input type="datetime-local"> from an ISO string, and back. */
export function toLocalInput(iso) {
  const d = toDate(iso);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

const moneyFormatters = new Map();
/** 36000 + 'AUD' → '$36,000'; 10000.5 → '$10,000.50' (the currency comes from the API's fee settings). */
export function formatMoney(amount, currency = 'AUD') {
  const value = Number(amount) || 0;
  const cents = !Number.isInteger(value);
  const key = `${currency}:${cents}`;
  if (!moneyFormatters.has(key)) {
    moneyFormatters.set(
      key,
      new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: cents ? 2 : 0,
      }),
    );
  }
  return moneyFormatters.get(key).format(value);
}

/** Today's calendar date as 'YYYY-MM-DD' (for date inputs). */
export function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from today until a 'YYYY-MM-DD' date (negative once it has passed). */
export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const now = new Date();
  return Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
}

/** Last day of access for a course starting on `start` ('YYYY-MM-DD'): start + duration − 1 day (as the API computes it). */
export function accessEndDate(start, value, unit) {
  if (!start || !value || !unit) return null;
  const [y, m, d] = start.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (unit === 'days') date.setUTCDate(date.getUTCDate() + value);
  if (unit === 'weeks') date.setUTCDate(date.getUTCDate() + value * 7);
  if (unit === 'months' || unit === 'years') {
    const months = unit === 'years' ? value * 12 : value;
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + months);
    // Like PostgreSQL: 31 Jan + 1 month = 28/29 Feb.
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
