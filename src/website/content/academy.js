// MIATA's own description of the academy, its international training network, standards, certification and
// disclaimer (home page). Where the source documents repeated a passage it appears here once.
//
// The disclaimer and the "Please note" texts are legal wording: change them only with MIATA's approval.

import {
  Activity,
  Award,
  Building2,
  ClipboardList,
  Dna,
  FileText,
  FlaskConical,
  Globe,
  HandHeart,
  HeartPulse,
  Hospital,
  Laptop,
  MessagesSquare,
  Microscope,
  MonitorPlay,
  Presentation,
  Scale,
  ScanLine,
  ScanSearch,
  ShieldAlert,
  Stethoscope,
  Target,
} from 'lucide-react';

export const ACADEMY_NAME = 'Medical Imaging Training Academy';
export const ACADEMY_SLOGAN = 'MIATA – Bridging the Gap Between Medical Knowledge and Practical Sonography.';

export const HERO = {
  eyebrow: 'MIATA – Medical Imaging Training Academy',
  title: 'Advancing Ultrasound Education Through',
  titleAccent: 'Practical Excellence',
  text: 'An International Professional Ultrasound Training Academy Operating from Melbourne, Australia.',
};

/** The four countries of the training network, in the order used everywhere on the site. */
export const NETWORK_COUNTRIES = ['Australia', 'United Kingdom', 'Malaysia', 'Cambodia'];

/** Key facts under the hero (all taken from the content below). */
export const HIGHLIGHTS = [
  { icon: Globe, value: '4 Countries', text: 'Australia, the United Kingdom, Malaysia and Cambodia' },
  { icon: Building2, value: '8 Training Partners', text: 'Institutions, hospitals and clinical training facilities' },
  { icon: MonitorPlay, value: 'Online & Hands-on', text: 'Online learning, practical workshops and supervised scanning' },
  { icon: Award, value: 'Professional Certificate', text: 'of Course Completion, issued by MIATA' },
];

/** In-page navigation under the highlights; each `id` is a section on the home page. */
export const HOME_SECTIONS = [
  { id: 'about', label: 'About Us' },
  { id: 'approach', label: 'Training Approach' },
  { id: 'network', label: 'Training Network' },
  { id: 'partners', label: 'Training Partners' },
  { id: 'faculty', label: 'Trainers & Faculty' },
  { id: 'standards', label: 'Standards' },
  { id: 'certification', label: 'Certification & Pathways' },
  { id: 'disclaimer', label: 'Disclaimer' },
];

// ─── About Us ───

export const ABOUT = {
  intro: [
    'MIATA (Medical Imaging Training Academy) is an international professional training academy operating from Melbourne, Australia, specialising in comprehensive, structured and practical ultrasound (sonography) education.',
    'We are dedicated to bridging the gap between theoretical medical knowledge and the practical clinical skills required in diagnostic medical ultrasound.',
  ],
  backgroundsIntro: 'Our training programs are specifically designed for graduates from diverse educational backgrounds, including:',
  backgrounds: [
    { icon: Stethoscope, label: 'Medicine and Medical Sciences' },
    { icon: HeartPulse, label: 'Nursing' },
    { icon: HandHeart, label: 'Allied Health Sciences' },
    { icon: Activity, label: 'Health Sciences' },
    { icon: Dna, label: 'Biomedical Sciences' },
    { icon: FlaskConical, label: 'Other recognised Science disciplines' },
  ],
  objective:
    'Our objective is to provide aspiring ultrasound professionals with structured education, supervised practical exposure and the technical competencies necessary to develop their skills in diagnostic medical sonography.',
};

export const APPROACH = {
  intro:
    'At MIATA, we believe that ultrasound education requires more than theoretical knowledge. It demands comprehensive anatomical understanding, image interpretation, scanning techniques, clinical correlation and practical experience.',
  methodsIntro: 'Our training methodology combines:',
  methods: [
    { icon: Laptop, title: 'Online Theory', text: 'Structured online theoretical education.' },
    { icon: ScanLine, title: 'Supervised Scanning', text: 'Practical ultrasound training and supervised scanning sessions.' },
    { icon: Presentation, title: 'Workshops & Simulation', text: 'Hands-on workshops and clinical simulation.' },
    { icon: Microscope, title: 'Anatomy & Pathology', text: 'Ultrasound anatomy and pathology education.' },
    { icon: ClipboardList, title: 'Scanning Protocols', text: 'Systematic scanning protocols and examination techniques.' },
    { icon: ScanSearch, title: 'Image Optimisation', text: 'Image acquisition, optimisation and interpretation.' },
    { icon: MessagesSquare, title: 'Case Discussions', text: 'Clinical case discussions and assessments.' },
    { icon: Target, title: 'Competency Development', text: 'Practical competency development across various ultrasound specialities.' },
    {
      icon: Scale,
      title: 'Professional Practice',
      text: 'Professional practice principles informed by relevant ARDMS, HCPC, SoR and ASMIRT guidance, where applicable.',
    },
  ],
  delivery: {
    text: 'Our programs are delivered through a combination of online learning, practical workshops and hands-on training at our associated training facilities and institutional partners.',
    steps: [
      { icon: Laptop, label: 'Online learning' },
      { icon: Presentation, label: 'Practical workshops' },
      { icon: Hospital, label: 'Hands-on training at associated facilities and partners' },
    ],
  },
};

// ─── International training: network, partners, hospitals and locations ───

export const NETWORK = {
  intro: [
    'MIATA operates an international practical training network across Australia, the United Kingdom, Malaysia and Cambodia.',
    'Through our associated training institutions, hospitals, clinical facilities and international training partners, MIATA delivers structured ultrasound education and practical training at multiple geographical locations.',
  ],
  hospitalsNote:
    'Hospitals and clinical facilities may support practical exposure, supervised scanning, clinical observation, case-based learning and hands-on ultrasound training, subject to the availability of facilities, patient consent, local requirements and the arrangements applicable at each location.',
  summary:
    'This network provides MIATA with an international practical training presence across four countries, allowing students to access structured ultrasound training at designated institutions, hospitals and clinical facilities.',
};

/** Training locations by country. `hospital: true` marks hospital and clinical facility entries (different icon). */
export const TRAINING_COUNTRIES = [
  {
    code: 'AU',
    country: 'Australia',
    places: [
      { name: 'Scan Me Radiology' },
      { name: 'Avita / Level Up Training Institute, Melbourne' },
      { name: 'Associated hospital and clinical training facilities, where applicable', hospital: true },
    ],
  },
  {
    code: 'UK',
    country: 'United Kingdom',
    places: [
      { name: 'Scan Me Radiology' },
      { name: 'NHS Trust facilities in Kent', hospital: true },
      { name: 'NHS Grampian, Scotland', hospital: true },
      { name: 'Associated hospital and clinical training facilities, where applicable', hospital: true },
    ],
    note: 'UK-based training activities are coordinated under the professional supervision of Jaichandran, Chief Sonographer and Ultrasound Coordinator (UK).',
  },
  {
    code: 'MY',
    country: 'Malaysia',
    places: [
      { name: 'DSH Institute of Technology' },
      { name: 'Klinik Mediveron', hospital: true },
      { name: 'Klinik Dhanvantri', hospital: true },
      { name: 'Klinik SSKK – Pavilion Bukit Jalil', hospital: true },
      { name: 'Associated hospital and clinical training facilities, where applicable', hospital: true },
    ],
  },
  {
    code: 'KH',
    country: 'Cambodia',
    places: [
      { name: 'NGI – Nanyang Global Institute' },
      { name: 'NGI-associated hospital and clinical training facilities', hospital: true },
    ],
  },
];

export const COORDINATION = {
  statement:
    'All practical ultrasound training conducted under the MIATA programs is delivered and academically coordinated solely by MIATA.',
  text: 'Our international partner institutions provide access to designated training locations, hospitals and facilities, while MIATA retains responsibility for the training curriculum, practical teaching methodology, trainer allocation, student competency development and assessment framework.',
  partnersProvide: ['Designated training locations', 'Hospitals', 'Facilities'],
  miataRetains: [
    'Training curriculum',
    'Practical teaching methodology',
    'Trainer allocation',
    'Student competency development',
    'Assessment framework',
  ],
};

export const TRAINING_PARTNERS = [
  { name: 'Scan Me Radiology', country: 'United Kingdom & Australia' },
  { name: 'NGI – Nanyang Global Institute', country: 'Cambodia' },
  { name: 'NGI-associated hospital and clinical training facilities', country: 'Cambodia' },
  { name: 'DSH Institute of Technology', country: 'Malaysia' },
  { name: 'Klinik Mediveron', country: 'Malaysia' },
  { name: 'Klinik Dhanvantri', country: 'Malaysia' },
  { name: 'Klinik SSKK – Pavilion Bukit Jalil', country: 'Malaysia' },
  { name: 'Avita / Level Up Training Institute', country: 'Melbourne, Australia' },
];

export const FACULTY = {
  intro: [
    'MIATA’s practical training programs are delivered exclusively by its appointed professional trainers and academic faculty.',
    'Our trainers comprise experienced ultrasound professionals with professional education, clinical training and registration or credentials in Australia and the United Kingdom, as applicable to their professional backgrounds.',
    'Our faculty brings together clinical experience, academic knowledge and practical sonography expertise to ensure that students receive structured instruction in accordance with recognised professional expectations.',
  ],
  emphasisIntro: 'The training framework emphasises:',
  emphasis: [
    'Clinical scanning competency',
    'Standardised ultrasound examination protocols',
    'Anatomical and pathological correlation',
    'Image acquisition and optimisation',
    'Patient safety and professional conduct',
    'Clinical documentation and reporting principles',
    'Supervised practical competency development',
  ],
  responsibility:
    'MIATA maintains responsibility for appointing its trainers, coordinating practical sessions and ensuring that the prescribed training curriculum is delivered consistently across its international training locations, hospitals and clinical facilities.',
};

// ─── Standards and professional references ───

export const STANDARDS = {
  intro: [
    'MIATA recognises the importance of maintaining internationally informed educational and clinical training standards.',
    'Accordingly, our theoretical and practical training frameworks are developed with reference to the relevant requirements, protocols and professional guidelines of the following organisations:',
  ],
  rolesIntro:
    'MIATA recognises that professional requirements differ between countries, jurisdictions and employers. Accordingly, students are encouraged to understand the role of each organisation.',
  governance: {
    title: 'Clinical Governance & Professional Conduct',
    text: 'Relevant clinical governance, patient safety, infection prevention, consent, confidentiality and professional conduct principles.',
  },
  consistency:
    'MIATA aims to maintain consistency in its academic delivery and practical training protocols across all four countries, taking into account the applicable requirements and professional guidance relevant to each jurisdiction.',
  notice:
    'These references are used to support the development of educational content and practical competencies. They do not mean that MIATA is accredited, approved, endorsed or formally recognised by ARDMS, HCPC, SoR or ASMIRT.',
};

export const ORGANISATIONS = [
  {
    acronym: 'ARDMS',
    name: 'American Registry for Diagnostic Medical Sonography',
    scope: 'Examinations & Credentials',
    reference:
      'Our ultrasound curriculum incorporates relevant ARDMS examination domains, anatomical knowledge, scanning protocols, pathology recognition and sonographic principles to help prepare students for professional examinations.',
    role: 'The American Registry for Diagnostic Medical Sonography (ARDMS) administers professional examinations and credentials in diagnostic medical sonography and related disciplines. Eligibility requirements, examination pathways, documentation requirements and credentialing rules are determined solely by ARDMS and may change over time.',
    note: 'MIATA training may assist students in developing relevant knowledge and practical skills, but completion of a MIATA program does not guarantee ARDMS examination eligibility, examination success or credential award.',
  },
  {
    acronym: 'HCPC',
    name: 'Health and Care Professions Council',
    scope: 'United Kingdom · Statutory Regulator',
    reference:
      'Our training framework considers relevant HCPC standards of conduct, performance and ethics, particularly those relating to patient safety, professional responsibility and clinical practice where applicable.',
    role: 'The Health and Care Professions Council (HCPC) is the statutory regulator for a range of health and care professions in the United Kingdom. Where an individual’s intended role falls within an HCPC-regulated profession, the individual must satisfy the applicable registration, education, conduct, language and professional requirements established by HCPC.',
    note: 'MIATA does not provide HCPC registration and does not guarantee that its courses or certificates will be accepted as evidence of eligibility for HCPC registration.',
  },
  {
    acronym: 'SoR',
    name: 'Society and College of Radiographers',
    scope: 'United Kingdom · Professional Guidance',
    reference:
      'We refer to applicable SoR professional guidance and recommendations concerning ultrasound education, clinical practice, professional conduct and medical imaging standards.',
    role: 'The Society and College of Radiographers (SoR) provides professional guidance, standards and resources relevant to radiography, medical imaging and ultrasound practice in the United Kingdom. SoR guidance may inform professional practice, education, clinical governance and workforce expectations.',
    note: 'MIATA may refer to relevant SoR guidance when developing educational content; however, MIATA is not a substitute for an approved university qualification, employer-based clinical training, professional registration or any other requirement established by SoR, HCPC or an employing organisation.',
  },
  {
    acronym: 'ASMIRT',
    name: 'Australian Society of Medical Imaging and Radiation Therapy',
    scope: 'Australia · Professional Organisation',
    reference:
      'Our Australian training framework considers relevant ASMIRT professional guidance, sonography practice expectations, scanning protocols and applicable skills assessment requirements.',
    role: 'The Australian Society of Medical Imaging and Radiation Therapy (ASMIRT) is a professional organisation representing medical imaging and radiation therapy practitioners in Australia. ASMIRT may assess qualifications, education, clinical experience and other evidence in accordance with its applicable policies and requirements.',
    note: 'MIATA course completion does not guarantee ASMIRT recognition, membership, accreditation, registration, skills assessment approval or eligibility to practise in Australia.',
  },
];

// ─── Certification and pathways ───

export const CERTIFICATION = {
  intro: [
    'MIATA provides a Professional Certificate of Course Completion upon successful completion of the prescribed academic modules, assessments and required practical training components.',
    'Our certification confirms that students have successfully completed the training requirements prescribed by MIATA.',
    'We aim to prepare our graduates to pursue further professional accreditation, examination eligibility, registration or skills assessment through the relevant professional organisations.',
  ],
  certificate: {
    title: 'Professional Certificate of Course Completion',
    awardedFor: ['Prescribed academic modules', 'Assessments', 'Required practical training components'],
  },
  pathwaysIntro: 'Graduates are encouraged to:',
  pathways: [
    {
      title: 'Complete your training',
      text: 'Successfully complete all prescribed theoretical and practical training requirements.',
    },
    {
      title: 'Review ARDMS eligibility',
      tag: 'ARDMS',
      text: 'Review and satisfy the current eligibility requirements for the American Registry for Diagnostic Medical Sonography (ARDMS) examinations.',
    },
    {
      title: 'Pursue ARDMS credentials',
      tag: 'ARDMS',
      text: 'Pursue relevant ARDMS examinations and credentials, subject to eligibility.',
    },
    {
      title: 'Consider HCPC requirements',
      tag: 'United Kingdom',
      text: 'Consider relevant professional registration or employment requirements administered by the Health and Care Professions Council (HCPC), where applicable to their intended role and jurisdiction.',
    },
    {
      title: 'Review SoR guidance',
      tag: 'United Kingdom',
      text: 'Review applicable Society and College of Radiographers (SoR) guidance and professional expectations when pursuing ultrasound practice or employment in the United Kingdom.',
    },
    {
      title: 'Apply for an ASMIRT skills assessment',
      tag: 'Australia',
      text: 'Apply to the Australian Society of Medical Imaging and Radiation Therapy (ASMIRT) for the applicable skills assessment if intending to pursue sonography employment in Australia.',
    },
    {
      title: 'Submit your documentation',
      text: 'Submit the necessary academic qualifications, clinical experience records, practical training documentation and other supporting evidence required by the relevant organisation.',
    },
    {
      title: 'Confirm current requirements',
      text: 'Confirm all current requirements directly with ARDMS, HCPC, SoR, ASMIRT or any other applicable professional, regulatory or employing organisation before relying on MIATA training for professional purposes.',
    },
  ],
  support:
    'MIATA provides course completion documentation and relevant training records to assist graduates in pursuing these professional pathways.',
};

export const VISION = {
  statement:
    'To become an internationally recognised centre for professional ultrasound education, developing competent, confident and clinically knowledgeable ultrasound professionals.',
  text: 'Through our international partnerships, hospitals, practical training facilities and experienced teaching professionals, MIATA aims to contribute to addressing the growing global demand for skilled medical imaging and sonography professionals.',
};

// ─── Disclaimer (legal wording) ───

export const DISCLAIMER = {
  title: 'Important Disclaimer',
  subtitle: 'Professional Recognition, Accreditation and Skills Assessment',
  lead: 'MIATA is an independent international professional ultrasound training academy operating from Melbourne, Australia.',
  blocks: [
    {
      icon: FileText,
      title: 'Independently Issued Certificates',
      paragraphs: [
        'The courses, training programs and Professional Certificates of Course Completion offered by MIATA are issued independently by MIATA. They do not constitute professional registration, statutory accreditation, an ARDMS credential, HCPC registration, SoR accreditation, an ASMIRT-approved qualification or an automatic grant of eligibility to practise as a sonographer or other healthcare professional in any country.',
      ],
    },
    {
      icon: ShieldAlert,
      title: 'No Claim of Accreditation or Endorsement',
      paragraphs: [
        'Although our training curriculum and practical teaching frameworks are developed with reference to relevant professional guidelines, protocols and educational requirements of ARDMS, HCPC, SoR and ASMIRT, MIATA is not claiming formal accreditation, endorsement or approval by these organisations.',
        'The completion of a MIATA course does not guarantee recognition, validation, registration, examination eligibility, credential award, employment or a positive skills assessment by any of these organisations or any other professional or regulatory body.',
      ],
    },
  ],
  jurisdictions: [
    {
      label: 'Australia',
      body: 'ASMIRT',
      text: 'Students intending to work as sonographers in Australia must independently apply to ASMIRT for the relevant skills assessment and satisfy all applicable professional and employment requirements. The current requirements must be confirmed directly with ASMIRT and any other relevant Australian authority or employer. Any recognition of qualifications, training hours or practical experience is entirely subject to ASMIRT’s assessment and decision.',
    },
    {
      label: 'United Kingdom',
      body: 'HCPC & SoR',
      text: 'Students intending to work in the United Kingdom must independently confirm whether their intended role requires HCPC registration, whether any relevant SoR guidance applies and whether their education and clinical experience satisfy the requirements of the relevant employer, regulator or professional body.',
    },
    {
      label: 'ARDMS Credentials',
      body: 'ARDMS',
      text: 'Students intending to pursue ARDMS credentials must independently satisfy the respective requirements of ARDMS and relevant employers, wherever applicable.',
    },
  ],
  responsibilitiesTitle: 'Students are solely responsible for:',
  responsibilities: [
    'Understanding the applicable professional eligibility requirements.',
    'Applying independently to the relevant professional organisations, including ARDMS, HCPC and ASMIRT where applicable.',
    'Submitting all necessary academic and clinical documentation for assessment, accreditation, registration or examination eligibility.',
    'Meeting examination, registration and skills assessment requirements.',
    'Obtaining the necessary professional recognition before commencing regulated professional practice.',
  ],
  decisions: {
    title: 'Decisions Rest with Each Organisation',
    paragraphs: [
      'MIATA does not guarantee that its courses, certificates, practical training hours, hospital exposure or academic documentation will be accepted or recognised by any external professional organisation.',
      'MIATA does not undertake, guarantee or accept responsibility for the approval, validation, accreditation, registration or outcome of any student’s application to ARDMS, HCPC, SoR, ASMIRT or any other professional, regulatory, educational or employing organisation.',
      'The decision to recognise qualifications, accept training hours, determine examination or registration eligibility, assess professional competence or issue a positive skills assessment rests entirely with the respective organisation.',
    ],
  },
  advice:
    'Students are strongly advised to familiarise themselves with the current eligibility criteria, professional standards, registration requirements and documentation requirements of the relevant organisations before enrolling in the program.',
  closing: [
    'Successful completion of MIATA training is an educational achievement.',
    'Enrolment in or successful completion of a MIATA training program does not guarantee employment, professional registration, migration eligibility, examination eligibility, credential award or a positive skills assessment in Australia, the United Kingdom or any other country.',
  ],
};
