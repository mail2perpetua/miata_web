import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ErrorBoundary, PageLoader } from '@/components';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import LoginRolesPage from '@/features/auth/LoginRolesPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import RoleLoginPage from '@/features/auth/RoleLoginPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { WebsiteLayout } from '@/website/layout/WebsiteLayout';
import AboutPage from '@/website/pages/AboutPage';
import ContactPage from '@/website/pages/ContactPage';
import CoursesPage from '@/website/pages/CoursesPage';
import FeesPage from '@/website/pages/FeesPage';
import HomePage from '@/website/pages/HomePage';
import WebsiteNotFoundPage from '@/website/pages/NotFoundPage';
import { GuestOnly, PortalScope, RequireAuth } from './RequireAuth';

// The website and sign-in pages load with the app; each dashboard page loads on first use.
const page = (loader) => lazy(loader);

// Addresses of the original HTML site keep working.
const LEGACY_PAGES = {
  'index.html': '/',
  'about.html': '/about',
  'course.html': '/courses',
  'feesandacollar.html': '/fees-and-scholarships',
  'contact.html': '/contact',
  'login.html': '/login',
};

/** The dashboards used to live under /portal; old links and bookmarks are forwarded. */
function PortalRedirect() {
  const { '*': rest } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/${rest}${search}`} replace />;
}

// Shared
const ProfilePage = page(() => import('@/features/shared/ProfilePage'));
const NotFoundPage = page(() => import('@/features/shared/NotFoundPage'));

// Admin
const AdminDashboard = page(() => import('@/features/admin/dashboard/AdminDashboard'));
const AdminCoursesPage = page(() => import('@/features/admin/courses/CoursesPage'));
const CourseDetailPage = page(() => import('@/features/admin/courses/CourseDetailPage'));
const BatchesPage = page(() => import('@/features/admin/batches/BatchesPage'));
const BatchDetailPage = page(() => import('@/features/admin/batches/BatchDetailPage'));
const StudentsPage = page(() => import('@/features/admin/students/StudentsPage'));
const StudentDetailPage = page(() => import('@/features/admin/students/StudentDetailPage'));
const ProfessorsPage = page(() => import('@/features/admin/professors/ProfessorsPage'));
const ProfessorDetailPage = page(() => import('@/features/admin/professors/ProfessorDetailPage'));
const AgentsPage = page(() => import('@/features/admin/agents/AgentsPage'));
const AgentDetailPage = page(() => import('@/features/admin/agents/AgentDetailPage'));
const ReferralsPage = page(() => import('@/features/admin/agents/ReferralsPage'));
const AdminAssignmentsPage = page(() => import('@/features/admin/assignments/AssignmentsPage'));
const AdminSubmissionPage = page(() => import('@/features/admin/assignments/SubmissionPage'));
const AdminMeetingsPage = page(() => import('@/features/admin/meetings/MeetingsPage'));
const PaymentsPage = page(() => import('@/features/admin/payments/PaymentsPage'));
const EnquiriesPage = page(() => import('@/features/admin/enquiries/EnquiriesPage'));
const AdminVideosPage = page(() => import('@/features/admin/videos/VideosPage'));
const SettingsPage = page(() => import('@/features/admin/settings/SettingsPage'));

// Agent
const AgentDashboard = page(() => import('@/features/agent/AgentDashboard'));
const ReferredStudentsPage = page(() => import('@/features/agent/ReferredStudentsPage'));
const StudentStatusPage = page(() => import('@/features/agent/StudentStatusPage'));
const ReferralCountPage = page(() => import('@/features/agent/ReferralCountPage'));

// Professor
const ProfessorDashboard = page(() => import('@/features/professor/ProfessorDashboard'));
const ProfessorStudentsPage = page(() => import('@/features/professor/StudentsPage'));
const ProfessorAssignmentsPage = page(() => import('@/features/professor/AssignmentsPage'));
const ProfessorAssignmentPage = page(() => import('@/features/professor/AssignmentPage'));
const ReviewQueuePage = page(() => import('@/features/professor/ReviewQueuePage'));
const ReviewPage = page(() => import('@/features/professor/ReviewPage'));
const CompletedReworkPage = page(() => import('@/features/professor/CompletedReworkPage'));
const ProfessorMeetingsPage = page(() => import('@/features/professor/MeetingsPage'));
const ProfessorTimetablePage = page(() => import('@/features/professor/TimetablePage'));

// Student
const StudentDashboard = page(() => import('@/features/student/StudentDashboard'));
const MyCoursesPage = page(() => import('@/features/student/MyCoursesPage'));
const CoursePage = page(() => import('@/features/student/CoursePage'));
const ModulesPage = page(() => import('@/features/student/ModulesPage'));
const StudentVideosPage = page(() => import('@/features/student/VideosPage'));
const VideoPlayerPage = page(() => import('@/features/student/VideoPlayerPage'));
const StudentAssignmentsPage = page(() => import('@/features/student/AssignmentsPage'));
const StudentAssignmentPage = page(() => import('@/features/student/AssignmentPage'));
const SubmissionsPage = page(() => import('@/features/student/SubmissionsPage'));
const ProgressPage = page(() => import('@/features/student/ProgressPage'));
const CompletionPage = page(() => import('@/features/student/CompletionPage'));
const StudentMeetingsPage = page(() => import('@/features/student/MeetingsPage'));
const StudentTimetablePage = page(() => import('@/features/student/TimetablePage'));
const StudentFeesPage = page(() => import('@/features/student/FeesPage'));

export function AppRoutes() {
  const { pathname } = useLocation();
  // One broken page shows a message instead of blanking the whole app; moving to another page clears it.
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public website and sign-in pages (original Eduact design) */}
          <Route element={<WebsiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="fees-and-scholarships" element={<FeesPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route element={<GuestOnly />}>
              <Route path="login" element={<LoginRolesPage />} />
              <Route path="login/:role" element={<RoleLoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="reset-password" element={<ResetPasswordPage />} />
            {Object.entries(LEGACY_PAGES).map(([file, to]) => (
              <Route key={file} path={file} element={<Navigate to={to} replace />} />
            ))}
            <Route path="portal/*" element={<PortalRedirect />} />
            <Route path="*" element={<WebsiteNotFoundPage />} />
          </Route>

          {/* Dashboards (one per role) */}
          <Route element={<PortalScope />}>
            <Route path="admin" element={<RequireAuth role="admin" />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="courses/:courseId" element={<CourseDetailPage />} />
                <Route path="batches" element={<BatchesPage />} />
                <Route path="batches/:batchId" element={<BatchDetailPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="students/:userId" element={<StudentDetailPage />} />
                <Route path="professors" element={<ProfessorsPage />} />
                <Route path="professors/:userId" element={<ProfessorDetailPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="agents/:userId" element={<AgentDetailPage />} />
                <Route path="referrals" element={<ReferralsPage />} />
                <Route path="assignments" element={<AdminAssignmentsPage />} />
                <Route path="submissions/:submissionId" element={<AdminSubmissionPage />} />
                <Route path="meetings" element={<AdminMeetingsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="payments/:paymentId" element={<PaymentsPage />} />
                <Route path="enquiries" element={<EnquiriesPage />} />
                <Route path="videos" element={<AdminVideosPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="agent" element={<RequireAuth role="agent" />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<AgentDashboard />} />
                <Route path="students" element={<ReferredStudentsPage />} />
                <Route path="status" element={<StudentStatusPage />} />
                <Route path="referrals" element={<ReferralCountPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="professor" element={<RequireAuth role="professor" />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<ProfessorDashboard />} />
                <Route path="students" element={<ProfessorStudentsPage />} />
                <Route path="assignments" element={<ProfessorAssignmentsPage />} />
                <Route path="assignments/:assignmentId" element={<ProfessorAssignmentPage />} />
                <Route path="reviews" element={<ReviewQueuePage />} />
                <Route path="reviews/:submissionId" element={<ReviewPage />} />
                <Route path="completed" element={<CompletedReworkPage />} />
                <Route path="meetings" element={<ProfessorMeetingsPage />} />
                <Route path="timetable" element={<ProfessorTimetablePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="student" element={<RequireAuth role="student" />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<MyCoursesPage />} />
                <Route path="courses/:courseId" element={<CoursePage />} />
                <Route path="modules" element={<ModulesPage />} />
                <Route path="videos" element={<StudentVideosPage />} />
                <Route path="videos/:videoId" element={<VideoPlayerPage />} />
                <Route path="assignments" element={<StudentAssignmentsPage />} />
                <Route path="assignments/:assignmentId" element={<StudentAssignmentPage />} />
                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="completion" element={<CompletionPage />} />
                <Route path="meetings" element={<StudentMeetingsPage />} />
                <Route path="timetable" element={<StudentTimetablePage />} />
                <Route path="fees" element={<StudentFeesPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
