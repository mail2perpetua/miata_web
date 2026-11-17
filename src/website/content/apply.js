// Content of the Apply Now page (the student registration form). The fields and document rules match the API
// (miata_api/src/modules/applications/applications.schemas.js); keep both in step.

export const APPLY_INTRO = {
  badge: 'Admissions open',
  title: 'Student Registration',
  text: 'Fields marked * are required. Our admissions team will contact you within 24 hours of submission.',
};

export const STUDY_MODE_INTRO =
  'Choose the study mode that best suits your schedule and location. Both pathways lead to ARDMS certification eligibility.';

export const STUDY_MODES = [
  { value: 'hybrid', title: 'Hybrid', tag: '6 months · Online' },
  { value: 'on_shore', title: 'On Shore', tag: '1 year · Full-time' },
];

// Every document: PDF, Word, JPG or PNG, at most 10 MB; all documents together at most 60 MB.
export const ACCEPTED_FILES = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

/** Document uploads, by section. `name` is the form field the API expects. */
export const ACADEMIC_DOCUMENTS = [
  { name: 'degreeCertificates', label: 'Undergraduate degree certificate', hint: 'PDF, JPG, PNG', maxCount: 2, required: false },
  { name: 'transcripts', label: 'Academic transcripts', hint: 'PDF, JPG, PNG', maxCount: 6, required: false },
];

export const IDENTITY_DOCUMENTS = [
  { name: 'passport', label: 'Passport', title: 'Upload passport', hint: 'PDF or image', maxCount: 2, required: false, icon: 'passport' },
  { name: 'cv', label: 'CV / Resume', title: 'Upload CV', hint: 'PDF format preferred', maxCount: 1, required: false, icon: 'cv' },
  {
    name: 'englishProficiency',
    label: 'English proficiency proof',
    title: 'IELTS / TOEFL etc.',
    hint: 'PDF or image',
    maxCount: 2,
    required: false,
    icon: 'language',
  },
  {
    name: 'referenceLetters',
    label: 'Reference letters',
    title: 'Reference letters',
    hint: 'PDF format preferred',
    maxCount: 4,
    required: false,
    icon: 'references',
  },
  {
    name: 'workExperience',
    label: 'Work experience certificates',
    title: 'Upload if available',
    hint: 'Experience certificates, letters',
    maxCount: 5,
    required: false,
    icon: 'work',
    wide: true,
  },
];

export const ALL_DOCUMENTS = [...ACADEMIC_DOCUMENTS, ...IDENTITY_DOCUMENTS];

/** What the applicant confirms before submitting ("Review & Accept Terms"). */
export const APPLICATION_TERMS = [
  'The information and documents I have provided are true and complete. False or misleading information may lead to my application being declined or an offer being withdrawn.',
  'MIATA may verify my documents with the institutions that issued them.',
  'MIATA may contact me by e-mail or phone about this application, and may share its progress with the agent I have named (if any).',
  'My details and documents are used to assess my application and are stored securely. They are never sold or shared with unrelated third parties.',
  'Submitting an application does not guarantee admission. Any offer is subject to MIATA’s admission requirements and its terms.',
];
