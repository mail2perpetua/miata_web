// Practical worksheets (clinical training logbooks): shared by the admin, professor and student portals.

/** The specialty / examination categories of the Clinical Scan Log, in logbook order (as the API validates them). */
export const CATEGORIES = [
  { value: 'abdominal', label: 'Abdominal' },
  { value: 'obstetrics', label: 'Obstetrics' },
  { value: 'gynaecology', label: 'Gynaecology' },
  { value: 'small_parts_thyroid', label: 'Small Parts / Thyroid' },
  { value: 'breast', label: 'Breast' },
  { value: 'vascular_doppler', label: 'Vascular / Doppler' },
  { value: 'musculoskeletal', label: 'Musculoskeletal' },
  { value: 'scrotal', label: 'Scrotal' },
  { value: 'paediatric', label: 'Paediatric' },
  { value: 'cardiac_echo', label: 'Cardiac / Echocardiography' },
  { value: 'general_ultrasound', label: 'General Ultrasound' },
  { value: 'other', label: 'Other' },
];

export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** A logbook's status → badge label and tone. `not_started` means the student has not opened a logbook yet. */
export const LOGBOOK_STATUS = {
  not_started: ['Not started', 'gray'],
  draft: ['In progress', 'blue'],
  submitted: ['Submitted', 'amber'],
  in_review: ['In review', 'sky'],
  rework: ['Rework required', 'orange'],
  completed: ['Completed', 'green'],
};

const hoursFmt = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 });

/** 2.5 → '2.5', 3 → '3', 1.25 → '1.25' (training hours). */
export const formatHours = (hours) => hoursFmt.format(Number(hours) || 0);

/** '12 scans · 7.5 h' for a logbook's totals. */
export const scanHoursLabel = (scans, hours) => `${scans} scan${scans === 1 ? '' : 's'} · ${formatHours(hours)} h`;

/** The Specialty Summary of a logbook with no entries yet (every category at zero, as on a blank logbook). */
export const emptySummary = () => ({
  categories: CATEGORIES.map(({ value }) => ({
    category: value,
    entries: 0,
    scans: 0,
    hours: 0,
    verifiedScans: 0,
    verifiedHours: 0,
    verifiers: [],
  })),
  totals: { entries: 0, scans: 0, hours: 0, verifiedEntries: 0, verifiedScans: 0, verifiedHours: 0 },
});

/** Client-side checks for a scan log entry (the API applies the same rules). */
export function entryErrors(values) {
  const scans = String(values.scanCount ?? '').trim();
  const hours = String(values.durationHours ?? '').trim();
  const errors = {};
  if (scans && !/^\d+$/.test(scans)) errors.scanCount = 'Use a whole number';
  else if (Number(scans) > 500) errors.scanCount = 'At most 500 scans per entry';
  if (hours && !/^\d+(\.\d{1,2})?$/.test(hours)) errors.durationHours = 'Use a number with at most two decimals';
  else if (Number(hours) > 24) errors.durationHours = 'At most 24 hours per entry';
  if (!errors.scanCount && !errors.durationHours && !(Number(scans) > 0) && !(Number(hours) > 0)) {
    errors.scanCount = 'Enter the number of scans or the training hours';
  }
  return errors;
}
