// MIATA programme content shown on the Home, Courses and Fees pages.

/** The three phases of the PG Diploma in Ultrasound (course cards). */
export const PROGRAM_PHASES = [
  {
    title: 'Phase 1',
    duration: 'Theory (6 Months)',
    mode: 'Online • Self-paced',
    text: 'Comprehensive online learning with expert-led modules, live sessions, and assessments.',
    image: '/assets/images/course/banner-2-12.jpg',
    reviews: '(25 Reviews)',
  },
  {
    title: 'Phase 2',
    duration: 'Clinical Training (3 Months)',
    mode: 'International • On-site',
    text: 'Supervised live scanning in international facilities with experienced mentors.',
    image: '/assets/images/course/banner-2-13.jpg',
    reviews: '(25 Reviews)',
  },
  {
    title: 'Phase 3',
    duration: 'Paid Internship (3–6 Months)',
    mode: 'Paid • Professional',
    text: 'Supervised independent practice with performance-based stipend and career support.',
    image: '/assets/images/course/banner-2-11.jpg',
    reviews: '(25 Reviews)',
  },
];

/** Course page accordions: one section per phase. */
export const CURRICULUM = [
  {
    tagline: 'Phase 1',
    title: 'Theoretical Modules',
    modules: [
      {
        title: 'Module 1: Ultrasound Physics & Instrumentation',
        points: [
          'Wave propagation and acoustic properties',
          'Doppler principles and hemodynamics',
          'Image optimization and quality assurance',
          'Safety protocols and bioeffects',
          'Equipment specifications and troubleshooting',
        ],
      },
      {
        title: 'Module 2: Abdominal Ultrasound',
        points: [
          'Liver, gallbladder and biliary system imaging',
          'Pancreas and spleen assessment',
          'Renal and adrenal gland evaluation',
          'Bowel and peritoneal cavity scanning',
          'Retroperitoneal structures and aorta',
        ],
      },
      {
        title: 'Module 3: Obstetrics & Gynecology',
        points: [
          'First, second and third trimester scanning protocols',
          'Fetal biometry and growth assessment',
          'Placental and amniotic fluid evaluation',
          'Uterine and ovarian pathology',
          'Transvaginal ultrasound techniques',
        ],
      },
      {
        title: 'Module 4: Vascular & Doppler Studies',
        points: [
          'Carotid and vertebral artery assessment',
          'Peripheral arterial and venous mapping',
          'Deep vein thrombosis (DVT) evaluation',
          'Portal and hepatic vascular studies',
          'Colour and spectral Doppler interpretation',
        ],
      },
      {
        title: 'Module 5: Professional Practice & Reporting',
        points: [
          'Structured report writing and clinical communication',
          'Medicolegal and ethical responsibilities',
          'Patient care and infection control standards',
          'Quality management systems in imaging',
          'Continuing professional development (CPD)',
        ],
      },
    ],
  },
  {
    tagline: 'Phase 2',
    title: 'Clinical Training',
    modules: [
      {
        title: 'Phase 2: Clinical Training',
        points: [
          'Supervised live scanning with real patients',
          'Equipment handling and optimization techniques',
          'Patient positioning and communication',
          'Real-time reporting and case documentation',
          'Interventional ultrasound exposure',
        ],
      },
    ],
  },
  {
    tagline: 'Phase 3',
    title: 'Paid Internship',
    modules: [
      {
        title: 'Phase 3: Paid Internship',
        badge: 'STIPEND',
        points: [
          'Supervised independent scanning responsibilities',
          'Comprehensive case log maintenance',
          'Performance-based monthly stipend',
          'Regular clinical evaluation and feedback',
        ],
      },
    ],
  },
];

/** Fees & Scholarships cards. */
export const FEE_PLANS = [
  {
    name: 'Program Fee',
    price: 'AUD $36,000',
    summary: 'Comprehensive fee covering all three phases: theory, clinical training, and internship placement.',
    features: [
      'Complete online theory curriculum with live sessions',
      'International clinical training placement',
      'Paid internship arrangement and support',
      'ARDMS preparation and career guidance',
      'Postgraduate Diploma certification',
    ],
    featured: false,
  },
  {
    name: 'Merit Scholarships',
    price: 'Up to $10,000',
    summary: 'Academic excellence and professional merit scholarships available for qualifying candidates.',
    features: [
      'Based on academic performance and credentials',
      'Professional experience consideration',
      'First-come, first-served basis per cohort',
      'Applied directly to program fees',
      'No separate repayment required',
    ],
    featured: true,
  },
];
