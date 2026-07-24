// =============================================================================
// WardAdminDashboard.jsx — Ward Admin Dashboard View
// =============================================================================
// Placeholder dashboard view for the Ward Administrator ('wardAdmin' role).
// Accessible at route: /ward-admin
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const WardAdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      {/* Header Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Ward Admin Dashboard — Ward & Bed Management</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.fullName}</strong>. Monitor bed status, equipment stocks, and shortages.
          </p>
        </div>
        <div className="role-tag tag-ward-admin">Role: Ward Admin</div>
      </div>

      {/* Overview Cards Grid */}
      <div className="dashboard-cards-grid">
        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🛌</span>
            <h3>Bed Status Monitoring</h3>
          </div>
          <p className="card-description">
            Track bed availability, occupied beds, maintenance status, and bed shortage alerts.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🪛</span>
            <h3>Equipment & Resources</h3>
          </div>
          <p className="card-description">
            Track bulk equipment quantities (Available, In Use, Maintenance) and threshold alerts.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">📈</span>
            <h3>Ward Occupancy Analytics</h3>
          </div>
          <p className="card-description">
            View real-time bed utilization metrics and ward shortage flags.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>
      </div>
    </div>
  );
};

export default WardAdminDashboard;
