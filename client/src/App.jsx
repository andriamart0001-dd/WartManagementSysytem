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

// Role-Based Dashboards & Pages
// 1. Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import WardManagementPage from './pages/admin/WardManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import HospitalManagementPage from './pages/admin/HospitalManagementPage';
import AddUserPage from './pages/admin/forms/AddUserPage';
import EditUserPage from './pages/admin/forms/EditUserPage';
import AddWardPage from './pages/admin/forms/AddWardPage';
import EditWardPage from './pages/admin/forms/EditWardPage';

// 2. Ward Admin
import WardAdminDashboard from './pages/wardAdmin/WardAdminDashboard';
import BedManagementPage from './pages/wardAdmin/BedManagementPage';
import EquipmentManagementPage from './pages/wardAdmin/EquipmentManagementPage';
import AddBedPage from './pages/wardAdmin/forms/AddBedPage';
import AddEquipmentPage from './pages/wardAdmin/forms/AddEquipmentPage';
import EditEquipmentPage from './pages/wardAdmin/forms/EditEquipmentPage';

// 3. Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import PatientLookupPage from './pages/staff/PatientLookupPage';
import AdmitPatientPage from './pages/staff/AdmitPatientPage';
import InternalTransferPage from './pages/staff/InternalTransferPage';
import ExternalTransferPage from './pages/staff/ExternalTransferPage';
import LogVitalsPage from './pages/staff/LogVitalsPage';

// 4. Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDetailPage from './pages/doctor/PatientDetailPage';
import DischargePage from './pages/doctor/DischargePage';

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

                {/* 1. Admin Role Dashboard & Pages */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AddUserPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <EditUserPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/wards"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <WardManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/wards/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AddWardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/wards/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <EditWardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <DepartmentManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hospitals"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <HospitalManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* 2. Ward Admin Role Dashboard & Pages */}
                <Route
                  path="/ward-admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <WardAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ward-admin/beds"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <BedManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ward-admin/beds/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <AddBedPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ward-admin/equipment"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <EquipmentManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ward-admin/equipment/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <AddEquipmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ward-admin/equipment/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WARD_ADMIN]}>
                      <EditEquipmentPage />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Staff Role Dashboard & Pages */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/lookup"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <PatientLookupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/admit"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <AdmitPatientPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/transfers/internal/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <InternalTransferPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/transfers/external/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <ExternalTransferPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/vitals/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                      <LogVitalsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 4. Doctor Role Dashboard & Pages */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/patient/:id"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                      <PatientDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/discharge/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                      <DischargePage />
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
