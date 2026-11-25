// Contact details and navigation shared by the header, mobile menu, footer and contact page.

export const CONTACT = {
  phone: '+61468474480',
  phoneSpaced: '+61 468 474 480',
  officePhone: '(03)96298835',
  officePhoneSpaced: '(03) 9629 8835',
  officeTel: '+61396298835', // office number for tel: links (international format)
  email: 'info@miataedu.org',
  admissionsEmail: 'admissions@miataedu.org',
  address: 'Level 3, Queen St, Melbourne Victoria 3000',
  // Floating WhatsApp / call buttons
  whatsapp: '61468474480', // wa.me needs digits only, no "+"
  whatsappMessage: 'Hello, I would like to know more details.',
  callback: '+61468474480',
};

/**
 * Header and mobile menu (the footer's Quick Links use the headings only). `children` is the heading's submenu.
 * A `#section` link goes to that section of the page (most of MIATA's own content is on the home page).
 */
export const MAIN_MENU = [
  { label: 'Home', to: '/' },
  {
    label: 'About Us',
    to: '/about',
    children: [
      { label: 'About MIATA', to: '/#about' },
      { label: 'Our Training Approach', to: '/#approach' },
      { label: 'Our Vision', to: '/#vision' },
      { label: 'Why Choose MIATA', to: '/about' },
    ],
  },
  {
    label: 'International Training',
    to: '/#network',
    children: [
      { label: 'Training Network & Locations', to: '/#network' },
      { label: 'Training Partners & Hospitals', to: '/#partners' },
      { label: 'Trainers & Faculty', to: '/#faculty' },
      { label: 'Standards & Guidelines', to: '/#standards' },
    ],
  },
  {
    label: 'Courses',
    to: '/courses',
    children: [
      { label: 'Programme Overview', to: '/courses' },
      { label: 'Theoretical Modules', to: '/courses#theory' },
      { label: 'Clinical Training', to: '/courses#clinical-training' },
      { label: 'Paid Internship', to: '/courses#internship' },
      { label: 'Certification & Pathways', to: '/#certification' },
    ],
  },
  {
    label: 'Admissions',
    to: '/fees-and-scholarships',
    children: [
      { label: 'Fees & Scholarships', to: '/fees-and-scholarships' },
      { label: 'Apply Now', to: '/apply' },
      { label: 'Important Disclaimer', to: '/#disclaimer' },
    ],
  },
  { label: 'Contact Us', to: '/contact' },
];

/** Footer link columns: a shorter, curated version of MAIN_MENU. `key` places the column in the footer grid. */
export const FOOTER_LINKS = [
  {
    key: 'about',
    title: 'About MIATA',
    links: [
      { label: 'About Us', to: '/#about' },
      { label: 'Training Approach', to: '/#approach' },
      { label: 'Trainers & Faculty', to: '/#faculty' },
      { label: 'Our Vision', to: '/#vision' },
      { label: 'Why Choose MIATA', to: '/about' },
    ],
  },
  {
    key: 'training',
    title: 'Training Network',
    links: [
      { label: 'Locations', to: '/#network' },
      { label: 'Partners & Hospitals', to: '/#partners' },
      { label: 'Standards & Guidelines', to: '/#standards' },
      { label: 'Certification & Pathways', to: '/#certification' },
    ],
  },
  {
    key: 'courses',
    title: 'Courses & Fees',
    links: [
      { label: 'Programme Overview', to: '/courses' },
      { label: 'Clinical Training', to: '/courses#clinical-training' },
      { label: 'Paid Internship', to: '/courses#internship' },
      { label: 'Fees & Scholarships', to: '/fees-and-scholarships' },
      { label: 'Apply Now', to: '/apply' },
    ],
  },
];

// Footer social icons. These still point to each platform's home page, not to MIATA's own profiles: replace each
// `href` with MIATA's page, and remove any platform MIATA does not use.
export const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/', icon: 'fab fa-facebook-f', label: 'Facebook' },
  { href: 'https://www.linkedin.com/', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
  { href: 'https://twitter.com/', icon: 'fab fa-twitter', label: 'Twitter' },
  { href: 'https://www.youtube.com/', icon: 'fab fa-youtube', label: 'YouTube' },
];

export const BROCHURE_URL = '/assets/images/miatabrochure.pdf';

/**
 * Title-banner photos of the inner pages, each matching the page it heads (MIATA's own images). `position` is the
 * focal point kept in view when the photo is cropped to the banner.
 */
export const PAGE_BANNERS = {
  about: { image: '/assets/images/course/banner-2-13.jpg', position: '50% 30%' }, // faculty teaching imaging analysis
  courses: { image: '/assets/images/resources/banner-2-15.jpg', position: '50% 30%' }, // ultrasound scanning
  fees: { image: '/assets/images/course/banner-2-11.jpg', position: '50% 0%' }, // successful MIATA students
  contact: { image: '/assets/images/blog/world-map.jpg', position: '50% 45%' }, // international training locations
  portal: { image: '/assets/images/resources/banner1.jpg', position: '50% 55%' }, // sign-in: MIATA's clinical training
  notFound: { image: '/assets/images/resources/banner-2-15.jpg', position: '50% 30%' },
};
