// =============================================================================
// DoctorDashboard.jsx — Doctor Dashboard View
// =============================================================================
// Placeholder dashboard view for Doctors ('doctor' role).
// Accessible at route: /doctor
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      {/* Header Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Doctor Dashboard — Medical Overview</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.fullName}</strong>. Review patient records, vitals history, and process discharges.
          </p>
        </div>
        <div className="role-tag tag-doctor">Role: Medical Doctor</div>
      </div>

      {/* Overview Cards Grid */}
      <div className="dashboard-cards-grid">
        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🩺</span>
            <h3>Patient Records & Vitals</h3>
          </div>
          <p className="card-description">
            View admitted patient lists, bed assignments, and historical vitals charts.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">🏥</span>
            <h3>Discharge Management</h3>
          </div>
          <p className="card-description">
            Log discharge notes, complete patient discharge, and release occupied bed.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>

        <div className="dash-card">
          <div className="card-header">
            <span className="card-icon">📷</span>
            <h3>QR Lookup</h3>
          </div>
          <p className="card-description">
            Scan patient QR codes to quickly view admission medical summary.
          </p>
          <div className="card-status-pill pill-pending">Phase 2 Module</div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
