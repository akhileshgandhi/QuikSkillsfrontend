import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SuperAdminOnboarding from './pages/SuperAdminOnboarding';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CourseBuilderPage from './pages/CourseBuilderPage';
import UserManagementPage from './pages/UserManagementPage';
import SuperAdminLayout from './components/layouts/SuperAdminLayout';
import OrganizationsPage from './pages/super-admin/OrganizationsPage';
import MasterLibraryPage from './pages/super-admin/MasterLibraryPage';
import MasterLibraryBuilderPage from './pages/super-admin/MasterLibraryBuilderPage';
import CertificatesPage from './pages/super-admin/CertificatesPage';
import SystemHealthPage from './pages/super-admin/SystemHealthPage';
import AuditDashboardPage from './pages/super-admin/AuditDashboardPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';

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
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
      </Routes>
    </Router>
  );
}

export default App;

