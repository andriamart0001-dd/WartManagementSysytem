// =============================================================================
// App.jsx — Application Router & Root Configuration
// =============================================================================
// Purpose:
//   Configures React Router routes for the Hospital Ward Management System.
//   Enforces role-based protected routing using AuthProvider & ProtectedRoute.
// =============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROLES, ROLE_DASHBOARDS } from './constants';

// Layouts & Route Wrappers
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Auth Pages
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Role-Based Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import WardAdminDashboard from './pages/wardAdmin/WardAdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// Helper component for Root Route ('/') redirection based on auth status
const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userDashboard = ROLE_DASHBOARDS[user.role] || '/admin';
  return <Navigate to={userDashboard} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Authenticated Application Layout Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>

                {/* 1. Admin Role Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 2. Ward Admin Role Dashboard */}
                <Route
                  path="/ward-admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <WardAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Staff Role Dashboard */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 4. Doctor Role Dashboard */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />

              </Route>
            </Route>

            {/* Fallback Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
