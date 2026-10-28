// The four portals offered on the login page, in the order they are shown.

export const LOGIN_ROLES = ['admin', 'student', 'professor', 'agent'];

export const ROLE_INFO = {
  admin: {
    label: 'Admin',
    icon: 'fas fa-user-shield',
    summary: 'Manage courses, students, professors, agents, assignments and website enquiries.',
    features: [
      'Courses, modules and lessons',
      'Student, professor and agent accounts',
      'Enrolments, videos and assignments',
      'Enquiries, referrals and reports',
    ],
  },
  student: {
    label: 'Student',
    icon: 'fas fa-user-graduate',
    summary: 'Watch lecture videos, submit assignments and follow your course progress.',
    features: [
      'Your enrolled courses and modules',
      'Lecture videos',
      'Assignments and professor feedback',
      'Progress and course completion',
    ],
  },
  professor: {
    label: 'Professor',
    icon: 'fas fa-chalkboard-teacher',
    summary: 'Review student submissions, give feedback and follow your assigned courses.',
    features: ['Assigned courses and students', 'Assignment review queue', 'Feedback and rework requests', 'Completed reviews'],
  },
  agent: {
    label: 'Agent',
    icon: 'fas fa-handshake',
    summary: 'Share your referral link and follow the students you have referred.',
    features: ['Your personal referral link', 'Referred students', 'Student status and progress', 'Referral counts'],
  },
};

export const isLoginRole = (role) => LOGIN_ROLES.includes(role);
