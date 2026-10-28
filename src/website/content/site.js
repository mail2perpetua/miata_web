// Contact details and navigation shared by the header, mobile menu, footer and contact page.

export const CONTACT = {
  phone: '+61468474480',
  phoneSpaced: '+61 4684 74480',
  officePhone: '(03)96298835',
  email: 'info@miataedu.org',
  admissionsEmail: 'admissions@miataedu.org',
  address: 'Level 3, Queen St, Melbourne Victoria 3000',
  // Floating WhatsApp / call buttons
  whatsapp: '917603913498',
  whatsappMessage: 'Hello, I would like to know more details.',
  callback: '917603913498',
};

export const MAIN_MENU = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Courses', to: '/courses' },
  { label: 'Fees & Scholarships', to: '/fees-and-scholarships' },
  { label: 'Contact Us', to: '/contact' },
];

export const FOOTER_PROGRAMS = [
  'PG Diploma in Ultrasound',
  'Clinical Training',
  'Paid Internship',
  'ARDMS Preparation',
  'Continuing Education',
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
