import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import NotFound from "../pages/public/NotFound";
import Unauthorized from "../pages/public/Unauthorized";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import StudentDashboard from "../pages/student/StudentDashboard";
import Notifications from "../pages/student/Notifications";
import CurrentAffairs from "../pages/student/CurrentAffairs";
import CurrentAffairDetail from "../pages/student/CurrentAffairDetail";
import RecruitmentNotices from "../pages/student/RecruitmentNotices";
import RecruitmentNoticeDetail from "../pages/student/RecruitmentNoticeDetail";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminStudents from "../pages/admin/AdminStudents";
import AdminStudentDetail from "../pages/admin/AdminStudentDetail";
import AdminSubjects from "../pages/admin/AdminSubjects";
import AdminTopics from "../pages/admin/AdminTopics";
import AdminNotes from "../pages/admin/AdminNotes";
import AdminStudyMaterials from "../pages/admin/AdminStudyMaterials";
import AdminCurrentAffairs from "../pages/admin/AdminCurrentAffairs";
import AdminCurrentAffairForm from "../pages/admin/AdminCurrentAffairForm";
import AdminRecruitmentNotices from "../pages/admin/AdminRecruitmentNotices";
import AdminRecruitmentNoticeForm from "../pages/admin/AdminRecruitmentNoticeForm";
import AdminPreviousYearPdfs from "../pages/admin/AdminPreviousYearPdfs";
import AdminVideos from "../pages/admin/AdminVideos";
import AdminTests from "../pages/admin/AdminTests";
import AdminTestForm from "../pages/admin/AdminTestForm";
import AdminTestDetail from "../pages/admin/AdminTestDetail";
import AdminTestAnalytics from "../pages/admin/AdminTestAnalytics";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminTestAttempts from "../pages/admin/AdminTestAttempts";
import AdminTestAttemptDetail from "../pages/admin/AdminTestAttemptDetail";
import AdminAbout from "../pages/admin/AdminAbout";
import AdminContactSettings from "../pages/admin/AdminContactSettings";
import AdminContactMessages from "../pages/admin/AdminContactMessages";
import AdminContactMessageDetail from "../pages/admin/AdminContactMessageDetail";
import AdminTeamMembers from "../pages/admin/AdminTeamMembers";
import AdminTeamMemberForm from "../pages/admin/AdminTeamMemberForm";
import Performance from "../pages/student/Performance";
import AIAssistant from "../pages/student/AIAssistant";
import StudentProfile from "../pages/student/StudentProfile";
import PhysicalTraining from "../pages/student/physical/PhysicalTraining";
import StudyMaterial from "../pages/student/study/StudyMaterial";
import SubjectTopics from "../pages/student/study/SubjectTopics";
import TopicDetail from "../pages/student/study/TopicDetail";
import PYQPage from "../pages/student/pyq/PYQPage";
import PreviousYearPdfs from "../pages/student/previous-year/PreviousYearPdfs";
import StudentTests from "../pages/student/tests/StudentTests";
import TestHistory from "../pages/student/tests/TestHistory";
import TestDetails from "../pages/student/tests/TestDetails";
import TestAttempt from "../pages/student/tests/TestAttempt";
import TestResult from "../pages/student/tests/TestResult";

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================
          PUBLIC ROUTES
      ====================================== */}

      <Route element={<PublicLayout />}>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

      </Route>

      {/* ======================================
          PROTECTED ADMIN ROUTES
      ====================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/notifications"
              element={<AdminNotifications />}
            />
            <Route
              path="/admin/students"
              element={<AdminStudents />}
            />
            <Route
              path="/admin/students/:studentId"
              element={<AdminStudentDetail />}
            />
            <Route
              path="/admin/subjects"
              element={<AdminSubjects />}
            />
            <Route
              path="/admin/topics"
              element={<AdminTopics />}
            />
            <Route
              path="/admin/test-attempts"
              element={<AdminTestAttempts />}
            />
            <Route
              path="/admin/test-attempts/:attemptId"
              element={<AdminTestAttemptDetail />}
            />
            <Route
              path="/admin/tests"
              element={<AdminTests />}
            />
            <Route
              path="/admin/tests/new"
              element={<AdminTestForm />}
            />
            <Route
              path="/admin/tests/:testId/edit"
              element={<AdminTestForm />}
            />
            <Route
              path="/admin/tests/:testId/analytics"
              element={<AdminTestAnalytics />}
            />
            <Route
              path="/admin/tests/:testId"
              element={<AdminTestDetail />}
            />
            <Route
              path="/admin/notes"
              element={<AdminNotes />}
            />
            <Route
              path="/admin/study-materials"
              element={<AdminStudyMaterials />}
            />
            <Route
              path="/admin/current-affairs"
              element={<AdminCurrentAffairs />}
            />
            <Route
              path="/admin/current-affairs/new"
              element={<AdminCurrentAffairForm />}
            />
            <Route
              path="/admin/current-affairs/:id/edit"
              element={<AdminCurrentAffairForm />}
            />
            <Route
              path="/admin/recruitment-notices"
              element={<AdminRecruitmentNotices />}
            />
            <Route
              path="/admin/recruitment-notices/new"
              element={<AdminRecruitmentNoticeForm />}
            />
            <Route
              path="/admin/recruitment-notices/:id/edit"
              element={<AdminRecruitmentNoticeForm />}
            />
            <Route
              path="/admin/previous-year"
              element={<AdminPreviousYearPdfs />}
            />
            <Route
              path="/admin/videos"
              element={<AdminVideos />}
            />
            <Route path="/admin/site-content/about" element={<AdminAbout />} />
            <Route path="/admin/site-content/contact" element={<AdminContactSettings />} />
            <Route path="/admin/site-content/team-members" element={<AdminTeamMembers />} />
            <Route path="/admin/site-content/team-members/new" element={<AdminTeamMemberForm />} />
            <Route path="/admin/site-content/team-members/:id/edit" element={<AdminTeamMemberForm />} />
            <Route path="/admin/site-content/contact-messages" element={<AdminContactMessages />} />
            <Route path="/admin/site-content/contact-messages/:id" element={<AdminContactMessageDetail />} />
          </Route>
        </Route>
      </Route>


      {/* ======================================
          AUTH ROUTES
      ====================================== */}

      <Route element={<AuthLayout />}>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

      </Route>


      {/* ======================================
          PROTECTED STUDENT ROUTES
      ====================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["student"]} />}>

          <Route element={<StudentLayout />}>

            <Route
              path="/student/dashboard"
              element={<StudentDashboard />}
            />
            <Route
              path="/student/notifications"
              element={<Notifications />}
            />
            <Route
              path="/student/current-affairs"
              element={<CurrentAffairs />}
            />
            <Route
              path="/student/current-affairs/:id"
              element={<CurrentAffairDetail />}
            />
            <Route
              path="/student/recruitment-notices"
              element={<RecruitmentNotices />}
            />
            <Route
              path="/student/recruitment-notices/:id"
              element={<RecruitmentNoticeDetail />}
            />

            <Route
              path="/student/performance"
              element={<Performance />}
            />

            <Route
              path="/student/ai-assistant"
              element={<AIAssistant />}
            />

            <Route
              path="/student/profile"
              element={<StudentProfile />}
            />

            <Route
              path="/student/physical"
              element={<PhysicalTraining />}
            />

            <Route
              path="/student/tests"
              element={<StudentTests />}
            />

            <Route
              path="/student/tests/history"
              element={<TestHistory />}
            />

            <Route
              path="/student/tests/:testId"
              element={<TestDetails />}
            />

            <Route
              path="/student/tests/:testId/start"
              element={<TestAttempt />}
            />

            <Route
              path="/student/tests/:testId/attempt/:attemptId"
              element={<TestAttempt />}
            />

            <Route
              path="/student/tests/:testId/result/:attemptId"
              element={<TestResult />}
            />

            <Route
              path="/student/tests/:testId/attempt/:attemptId/result"
              element={<TestResult />}
            />

            <Route
              path="/student/study"
              element={<StudyMaterial />}
            />
            <Route
              path="/student/study/:subjectId"
              element={<SubjectTopics />}
            />

            <Route
              path="/student/study/:subjectId/topic/:topicId"
              element={<TopicDetail />}
            />

            <Route
              path="/student/pyq"
              element={<PYQPage />}
            />

            <Route
              path="/student/previous-year"
              element={<PreviousYearPdfs />}
            />

          </Route>

        </Route>
      </Route>


      {/* ======================================
          UNAUTHORIZED
      ====================================== */}

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />


      {/* ======================================
          404
      ====================================== */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}

export default AppRoutes;
