import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BrandingProvider } from './contexts/BrandingContext';
import SuperAdminOnboarding from './pages/SuperAdminOnboarding';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CourseBuilderPage from './pages/CourseBuilderPage';
import UserManagementPage from './pages/UserManagementPage';
import SuperAdminLayout from './components/layouts/SuperAdminLayout';
import TenantAdminLayout from './components/layouts/TenantAdminLayout';
import ManagerLayout from './components/layouts/ManagerLayout';
import OrganizationsPage from './pages/super-admin/OrganizationsPage';
import MasterLibraryPage from './pages/super-admin/MasterLibraryPage';
import MasterLibraryBuilderPage from './pages/super-admin/MasterLibraryBuilderPage';
import CertificatesPage from './pages/super-admin/CertificatesPage';
import SystemHealthPage from './pages/super-admin/SystemHealthPage';
import AuditDashboardPage from './pages/super-admin/AuditDashboardPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import TenantDashboardPage from './pages/tenant-admin/TenantDashboardPage';
import LearnersPage from './pages/tenant-admin/LearnersPage';
import CourseAssignmentPage from './pages/tenant-admin/CourseAssignmentPage';
import BrandingPage from './pages/tenant-admin/BrandingPage';
import StoragePage from './pages/tenant-admin/StoragePage';
import CompliancePage from './pages/tenant-admin/CompliancePage';
import TenantAuditPage from './pages/tenant-admin/TenantAuditPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import MyTeamPage from './pages/manager/MyTeamPage';
import MyCoursesPage from './pages/manager/MyCoursesPage';
import ManagerCertificatesPage from './pages/manager/CertificatesPage';
import LearnerDashboardPage from './pages/learner/LearnerDashboardPage';
import CourseViewerPage from './pages/learner/CourseViewerPage';
import LearnerCertificatesPage from './pages/learner/CertificatesPage';
import LockedCoursePlayer from './components/learner/LockedCoursePlayer';
import UniversalLMSPlayer from './components/learner/UniversalLMSPlayer';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrandingProvider>
      <Router>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/verify-certificate/:certificateId" element={<VerifyCertificatePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <SuperAdminOnboarding />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <SuperAdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/organizations" replace />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="master-library" element={<MasterLibraryPage />} />
          <Route path="master-library/builder" element={<MasterLibraryBuilderPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route path="audit" element={<AuditDashboardPage />} />
        </Route>
        <Route
          path="/old-dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <CoursesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses/:courseId/builder"
          element={
            <PrivateRoute>
              <CourseBuilderPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant-dashboard"
          element={
            <PrivateRoute>
              <TenantAdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<TenantDashboardPage />} />
          <Route path="learners" element={<LearnersPage />} />
          <Route path="courses" element={<CourseAssignmentPage />} />
          <Route path="branding" element={<BrandingPage />} />
          <Route path="storage" element={<StoragePage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="audit" element={<TenantAuditPage />} />
            </Route>
            {/* Manager Dashboard Routes */}
            <Route
              path="/manager-dashboard"
              element={
                <PrivateRoute>
                  <ManagerLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<ManagerDashboardPage />} />
              <Route path="courses" element={<MyCoursesPage />} />
              <Route path="team" element={<MyTeamPage />} />
              <Route path="certificates" element={<ManagerCertificatesPage />} />
            </Route>
            {/* Learner Routes */}
            <Route
              path="/learner/dashboard"
              element={
                <PrivateRoute>
                  <LearnerDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/learner/course/:courseId"
              element={
                <PrivateRoute>
                  <UniversalLMSPlayer />
                </PrivateRoute>
              }
            />
            <Route
              path="/learner/course/:courseId/legacy"
              element={
                <PrivateRoute>
                  <LockedCoursePlayer />
                </PrivateRoute>
              }
            />
            <Route
              path="/learner/course/:courseId/view"
              element={
                <PrivateRoute>
                  <CourseViewerPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/learner/certificates"
              element={
                <PrivateRoute>
                  <LearnerCertificatesPage />
                </PrivateRoute>
              }
            />
          </Routes>
    </Router>
    </BrandingProvider>
  );
}

export default App;

