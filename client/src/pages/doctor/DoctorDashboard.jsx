import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import QRScannerModal from '../../components/ui/QRScannerModal';

// =============================================================================
// DoctorDashboard.jsx
// =============================================================================
// Purpose:
//   Main dashboard for the Clinical Doctor role.
//   Shows live patient statistics, quick clinical actions (QR scan, discharge requests),
//   and an interactive patient list with vitals logging and discharge ordering.
// =============================================================================

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // List of active admitted patients
  const [admissions, setAdmissions] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Formatted date string for the student project welcome banner
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // ===========================================================================
  // DATA FETCHING
  // Fetches all currently admitted patients and pending request count
  // ===========================================================================
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [admissionsRes, requestsRes] = await Promise.allSettled([
        axiosInstance.get('/admissions?status=admitted'),
        axiosInstance.get('/requests/pending-count')
      ]);

      if (admissionsRes.status === 'fulfilled') {
        const list = Array.isArray(admissionsRes.value.data.admissions) 
          ? admissionsRes.value.data.admissions 
          : (Array.isArray(admissionsRes.value.data) ? admissionsRes.value.data : []);
        setAdmissions(list);
      }

      if (requestsRes.status === 'fulfilled') {
        setPendingRequestsCount(requestsRes.value.data?.count || 0);
      }
    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error);
      addToast('Failed to load dashboard data', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  // Handle successful QR scan from device camera
  const handleScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data && data.admissionId) {
        addToast('QR Code scanned successfully!', 'success');
        setIsScannerOpen(false);
        // Automatically redirect to patient details
        navigate(`/doctor/patient/${data.admissionId}`);
      } else {
        addToast('Invalid QR Code format', 'error');
      }
    } catch (e) {
      addToast('Failed to parse QR Code data', 'error');
    }
  };

  // Navigate to the full patient detail page
  const viewPatientDetail = (admissionId) => {
    navigate(`/doctor/patient/${admissionId}`);
  };

  return (
    <div className="dashboard-page">
      {/* Top Header */}
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Inpatient Rounds, Clinical Review & Discharge Requests"
        icon="🩺"
      />

      {/* University Project Welcome Banner Strip */}
      <div className="dashboard-welcome-strip">
        <div className="welcome-strip-left">
          <div className="welcome-strip-avatar">🩺</div>
          <div className="welcome-strip-text">
            <h3>Welcome back, Dr. {user?.fullName || 'Physician'}</h3>
            <p>Clinical Medical Officer • Hospital Wards Round</p>
          </div>
        </div>
        <div className="welcome-strip-right">
          <span>📅 {currentDate}</span>
        </div>
      </div>

      {/* Section 1: KPI Statistics Grid */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>📊</span> Clinical Overview & Metrics
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Active Patients" 
          value={isLoading ? '...' : admissions.length} 
          icon="👥"
          description="Inpatients currently under hospital care"
        />
        <StatCard 
          title="Discharge Requests" 
          value={isLoading ? '...' : pendingRequestsCount} 
          icon="📋"
          type={pendingRequestsCount > 0 ? 'maintenance' : 'default'}
          description={pendingRequestsCount > 0 ? 'Pending ward admin / nurse signoff' : 'All discharge requests cleared'}
          to="/doctor/requests"
        />
        <StatCard 
          title="Clinical Role" 
          value="Inpatient Care" 
          icon="🩺"
          description="Record vitals, assess progress & clear discharges"
        />
      </div>

      {/* Section 2: Clinical Quick Actions */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>⚡</span> Clinical Quick Actions
        </h2>
      </div>

      <div className="quick-actions-grid" style={{ marginBottom: '32px' }}>
        <button 
          className="quick-action-card highlight-blue"
          onClick={() => setIsScannerOpen(true)}
        >
          <div className="quick-action-icon">📷</div>
          <div className="quick-action-content">
            <h4>Scan Patient QR</h4>
            <p>Scan wristband to view full chart</p>
          </div>
        </button>

        <Link 
          to="/doctor/requests" 
          className={`quick-action-card ${pendingRequestsCount > 0 ? 'highlight-amber' : ''}`}
        >
          <div className="quick-action-icon">📋</div>
          <div className="quick-action-content">
            <h4>
              Discharge Requests
              {pendingRequestsCount > 0 && (
                <span className="badge-counter amber">{pendingRequestsCount}</span>
              )}
            </h4>
            <p>Track statuses of submitted discharge orders</p>
          </div>
        </Link>

        <Link to="/admin/patients" className="quick-action-card">
          <div className="quick-action-icon">🗂️</div>
          <div className="quick-action-content">
            <h4>Patient Directory</h4>
            <p>Search all current and historical patient files</p>
          </div>
        </Link>
      </div>

      {/* Section 3: Active Patient Table */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🛌</span> Current Inpatient List ({isLoading ? '...' : admissions.length})
        </h2>
      </div>

      <DataTable
        columns={['ID', 'Patient Name', 'Ward / Bed', 'Admitted Date', 'Status', 'Actions']}
        isEmpty={!isLoading && admissions.length === 0}
        emptyMessage="No active patients at this time."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
              Loading patients...
            </td>
          </tr>
        ) : (
          admissions.map((adm) => (
            <tr key={adm.id}>
              <td className="mono-data">#{adm.id}</td>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {adm.patientName}
                {adm.patientNIC && (
                  <div style={{ fontSize: '11px', color: '#0369a1', fontFamily: 'monospace', fontWeight: 'normal' }}>
                    🆔 {adm.patientNIC}
                  </div>
                )}
              </td>
              <td>
                {adm.wardName}
                {adm.bedNumber ? ` — Bed ${adm.bedNumber}` : ''}
              </td>
              <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>
              <td>
                <StatusBadge status={adm.status} />
              </td>
              <td>
                <div className="table-actions">
                  {/* View full patient record */}
                  <button
                    className="action-btn"
                    title="View Patient Record"
                    onClick={() => viewPatientDetail(adm.id)}
                  >
                    👁 View
                  </button>

                  {/* Log vitals */}
                  <button
                    className="action-btn"
                    title="Log Vitals"
                    onClick={() => navigate(`/staff/vitals/new?admissionId=${adm.id}`)}
                  >
                    🩸 Vitals
                  </button>

                  {/* Discharge patient */}
                  <button
                    className="action-btn"
                    title="Request Patient Discharge"
                    onClick={() => navigate(`/doctor/discharge/new?admissionId=${adm.id}`)}
                    style={{ color: '#2563eb', fontWeight: 600 }}
                  >
                    🏠 Request Discharge
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
};

export default DoctorDashboard;
