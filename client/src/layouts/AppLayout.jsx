// =============================================================================
// AppLayout.jsx — Main Application Layout Shell
// =============================================================================
// Purpose:
//   Provides the global layout wrapper for all authenticated pages.
//   Includes:
//     1. Top Header Navbar (Hospital branding, logged-in user details, Role Badge, Logout)
//     2. Left Navigation Sidebar (Role-aware navigation menu)
//     3. Main Content View area (renders child components via <Outlet />)
// =============================================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mobile sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ===========================================================================
  // HANDLER: Logout
  // ===========================================================================
  const handleLogout = () => {
    // Perform context logout cleanup
    logout();

    // Redirect user back to Staff Login page
    navigate('/login', { replace: true });
  };

  // Helper to format role names for clean display
  const formatRoleLabel = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'System Admin';
      case ROLES.WARD_ADMIN:
        return 'Ward Admin';
      case ROLES.ADMISSION_DOCTOR:
        return 'Admission Doctor';
      case ROLES.NURSE:
        return 'Staff Nurse';
      case ROLES.DOCTOR:
        return 'Medical Doctor';
      default:
        return role;
    }
  };

  // Helper to assign role badge color CSS class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'badge-admin';
      case ROLES.WARD_ADMIN:
        return 'badge-ward-admin';
      case ROLES.ADMISSION_DOCTOR:
      case ROLES.DOCTOR:
        return 'badge-doctor';
      case ROLES.NURSE:
        return 'badge-staff';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="layout-container">
      {/* Top Navigation Header Bar */}
      <header className="navbar">
        <div className="navbar-left">
          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <div className="brand-container">
            <span className="brand-logo">🏥</span>
            <span className="brand-text">Ward Management System</span>
          </div>
        </div>

        {/* User Info & Logout Controls */}
        <div className="navbar-right">
          {user && (
            <div className="user-profile-summary">
              <div className="user-text-info">
                <span className="user-name">{user.fullName}</span>
                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                  {formatRoleLabel(user.role)}
                </span>
              </div>
              <button
                className="logout-button"
                onClick={handleLogout}
                title="Sign out of your session"
              >
                <span>Logout</span>
                <span className="logout-icon">➔</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container (Sidebar + Content Area) */}
      <div className="layout-body">
        {/* Left Navigation Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-section-title">MAIN MENU</div>
            <nav className="sidebar-nav">
              {/* 1. Admin Role Navigation */}
              {user?.role === ROLES.ADMIN && (
                <>
                  <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📊</span>
                    <span>Admin Overview</span>
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">👥</span>
                    <span>Manage Users</span>
                  </NavLink>
                  <NavLink
                    to="/admin/wards"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🏥</span>
                    <span>Manage Wards</span>
                  </NavLink>
                  <NavLink
                    to="/admin/departments"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🏢</span>
                    <span>Departments</span>
                  </NavLink>
                  <NavLink
                    to="/admin/hospitals"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🚑</span>
                    <span>External Hospitals</span>
                  </NavLink>
                  <NavLink
                    to="/admin/alerts"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🚨</span>
                    <span>Shortage Alerts</span>
                  </NavLink>
                  <NavLink
                    to="/admin/patients"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🗂️</span>
                    <span>Patient Directory</span>
                  </NavLink>
                  <NavLink
                    to="/admin/admissions"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📋</span>
                    <span>Admission History</span>
                  </NavLink>
                </>
              )}

              {/* 2. Ward Admin Role Navigation */}
              {user?.role === ROLES.WARD_ADMIN && (
                <>
                  <NavLink
                    to="/ward-admin"
                    end
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📊</span>
                    <span>Ward Overview</span>
                  </NavLink>
                  <NavLink
                    to="/ward-admin/beds"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🛏️</span>
                    <span>Manage Beds</span>
                  </NavLink>
                  <NavLink
                    to="/ward-admin/sections"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📂</span>
                    <span>Ward Sections</span>
                  </NavLink>
                  <NavLink
                    to="/ward-admin/equipment"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🪛</span>
                    <span>Equipment Inventory</span>
                  </NavLink>
                  <NavLink
                    to="/admin/alerts"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🚨</span>
                    <span>Shortage Alerts</span>
                  </NavLink>
                  <NavLink
                    to="/admin/patients"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🗂️</span>
                    <span>Patient Directory</span>
                  </NavLink>
                </>
              )}

              {/* 3. Admission Doctor Role Navigation */}
              {user?.role === ROLES.ADMISSION_DOCTOR && (
                <>
                  <NavLink
                    to="/admission-doctor"
                    end
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🩺</span>
                    <span>Doctor Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/admission-doctor/admit"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🛏️</span>
                    <span>Admit Patient</span>
                  </NavLink>
                  <NavLink
                    to="/admission-doctor/patients/new"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">➕</span>
                    <span>Register Patient</span>
                  </NavLink>
                  <NavLink
                    to="/admission-doctor/lookup"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔍</span>
                    <span>Patient Lookup</span>
                  </NavLink>
                  <NavLink
                    to="/admin/patients"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🗂️</span>
                    <span>Patient Directory</span>
                  </NavLink>
                </>
              )}

              {/* 4. Staff Nurse Role Navigation */}
              {user?.role === ROLES.NURSE && (
                <>
                  <NavLink
                    to="/nurse"
                    end
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">👩‍⚕️</span>
                    <span>Nurse Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/nurse/lookup"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔍</span>
                    <span>Patient Lookup</span>
                  </NavLink>
                  <NavLink
                    to="/admin/patients"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🗂️</span>
                    <span>Patient Directory</span>
                  </NavLink>
                </>
              )}

              {/* 5. Medical Doctor Role Navigation */}
              {user?.role === ROLES.DOCTOR && (
                <>
                  <NavLink
                    to="/doctor"
                    end
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🩺</span>
                    <span>My Patients</span>
                  </NavLink>
                  <NavLink
                    to="/admin/patients"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🗂️</span>
                    <span>Patient Directory</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Quick Info Widget in Sidebar */}
          <div className="sidebar-footer">
            <div className="system-status-box">
              <span className="status-indicator"></span>
              <span>System Online & Operational</span>
            </div>
          </div>
        </aside>

        {/* Main Content Render View */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
