// =============================================================================
// StaffDashboard.jsx — Staff Nurse Dashboard View
// =============================================================================
// Placeholder dashboard view for Staff Nurses ('staff' role).
// Accessible at route: /staff
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      {/* Header Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Staff Dashboard — Patient Operations</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.fullName}</strong>. Manage patient admissions, bed assignments, and transfers.
          </p>
        </div>
        <div className="role-tag tag-staff">Role: Staff Nurse</div>
      </div>

      {/* Overview Cards Grid */}
      <div className="dashboard-cards-grid">
        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">📋</span>
            <h3>Patient Admissions</h3>
          </div>
          <p className="card-description">
            Register new patient admissions, allocate beds, and generate patient admission QR codes.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🔄</span>
            <h3>Transfers & Movement</h3>
          </div>
          <p className="card-description">
            Perform internal ward transfers and external hospital transfers with return tracking.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🩸</span>
            <h3>Vitals Recording</h3>
          </div>
          <p className="card-description">
            Log patient temperature, blood pressure, and pulse vitals linked to active admissions.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
