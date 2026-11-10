// =============================================================================
// AppLayout.jsx — Main Application Layout Shell
// =============================================================================
// Purpose:
//   Provides the global layout wrapper for all authenticated pages.
//   Includes:
//     1. Top Header Navbar (Hospital branding, logged-in user details, Role Badge, Logout)
//     2. Left Navigation Sidebar (Role-aware navigation menu with live badges)
//     3. Main Content View area (renders child components via <Outlet />)
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mobile sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Pending clinical requests counter for badges
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // ===========================================================================
  // DATA FETCHING: Pending clinical requests count
  // ===========================================================================
  useEffect(() => {
    if (!user) return;

    const fetchPendingCount = async () => {
      try {
        const res = await axiosInstance.get('/requests/pending-count');
        setPendingRequestsCount(res.data?.count || 0);
      } catch (err) {
        // Silently fail if user role does not have access or offline
        setPendingRequestsCount(0);
      }
    };

    fetchPendingCount();
    // Check every 45 seconds for new requests
    const interval = setInterval(fetchPendingCount, 45000);
    return () => clearInterval(interval);
  }, [user]);

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
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {formatRoleLabel(user.role)}
                  </span>
                  {user.assignedWardName && (
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: '#ecfdf5', 
                        color: '#047857', 
                        border: '1px solid #a7f3d0',
                        fontWeight: 600
                      }}
                      title="Assigned Ward"
                    >
                      🏥 {user.assignedWardName}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="action-btn"
                onClick={() => navigate('/profile')}
                title="View your account profile and change password"
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <span>👤</span>
                <span>Profile</span>
              </button>
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
                    to="/admin/requests"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📋</span>
                    <span>Clinical Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {pendingRequestsCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink
                    to="/admin/transfers"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔄</span>
                    <span>Transfer History</span>
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
                    <span className="nav-icon">📜</span>
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
                    to="/ward-admin/requests"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📋</span>
                    <span>Discharge Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {pendingRequestsCount}
                      </span>
                    )}
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
                    to="/ward-admin/transfers"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔄</span>
                    <span>Transfer History</span>
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
                    to="/admission-doctor/transfers/history"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔄</span>
                    <span>Transfer History</span>
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
                    to="/nurse/requests"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📋</span>
                    <span>Discharge Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {pendingRequestsCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink
                    to="/nurse/transfers/history"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">🔄</span>
                    <span>Transfer History</span>
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
                    to="/doctor/requests"
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">📋</span>
                    <span>Discharge Requests</span>
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
