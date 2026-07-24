// =============================================================================
// AdminDashboard.jsx — System Administrator Dashboard View
// =============================================================================
// Placeholder dashboard view for the System Administrator ('admin' role).
// Accessible at route: /admin
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      {/* Header Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard — System Overview</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.fullName}</strong>. Manage system users, departments, and wards.
          </p>
        </div>
        <div className="role-tag tag-admin">Role: Admin</div>
      </div>

      {/* Overview Cards Grid */}
      <div className="dashboard-cards-grid">
        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">👥</span>
            <h3>User Accounts Management</h3>
          </div>
          <p className="card-description">
            Create, edit, and manage RBAC staff accounts (Admins, Ward Admins, Staff Nurses, Doctors).
          </p>
          <div className="card-status-pill pill-active">Backend CRUD Ready (/api/users)</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🏢</span>
            <h3>Departments & Wards</h3>
          </div>
          <p className="card-description">
            Configure hospital departments, ward bed capacities, and shortage alert thresholds.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">⚙️</span>
            <h3>System Settings & Logs</h3>
          </div>
          <p className="card-description">
            View system audit logs, shortage threshold alerts, and general hospital parameters.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
