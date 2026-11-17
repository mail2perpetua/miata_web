// Online applications (website Apply Now form): labels shared by the list, the review dialog and the edit form.

export const STUDY_MODES = [
  { value: 'hybrid', label: 'Hybrid (6 months, online)', short: 'Hybrid' },
  { value: 'on_shore', label: 'On Shore (1 year, full-time)', short: 'On Shore' },
];
export const studyModeShort = (value) => STUDY_MODES.find((m) => m.value === value)?.short ?? value ?? '—';

export const APPLICATION_STATUSES = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/** Document categories in the order of the form. */
export const DOCUMENT_CATEGORIES = [
  ['degree_certificate', 'Undergraduate degree certificate'],
  ['transcript', 'Academic transcripts'],
  ['passport', 'Passport'],
  ['cv', 'CV / résumé'],
  ['english_proficiency', 'English proficiency proof'],
  ['reference_letter', 'Reference letters'],
  ['work_experience', 'Work experience certificates'],
];

/** Documents grouped by category, in form order: [[label, [doc, …]], …]. */
export function groupDocuments(documents) {
  return DOCUMENT_CATEGORIES.map(([category, label]) => [label, documents.filter((d) => d.category === category)]).filter(
    ([, docs]) => docs.length,
  );
}
