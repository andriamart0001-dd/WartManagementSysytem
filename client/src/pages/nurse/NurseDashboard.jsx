// =============================================================================
// NurseDashboard.jsx — Staff Nurse Dashboard Page
// =============================================================================
// Purpose:
//   Primary dashboard for Staff Nurses.
//   Allows nurses to log patient vitals, perform internal & external transfers,
//   review & approve doctor discharge requests, scan QR codes, and view active ward patients.
//   Note: Patient registration and admission are handled by Admission Doctors.
// =============================================================================

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
import QRPrintModal from '../../components/ui/QRPrintModal';
import QRScannerModal from '../../components/ui/QRScannerModal';

const NurseDashboard = () => {
  // Grab current authenticated staff nurse details
  const { user } = useAuth();
  // Toast notifications helper
  const { addToast } = useToast();
  // Navigation hook
  const navigate = useNavigate();

  // State to store active admissions and loading state
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // State for the QR printing modal
  const [qrModalData, setQrModalData] = useState(null);

  // State for toggling the camera scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Formatted date string for the student project welcome banner
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Fetch all active admitted patients and pending discharge request count
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [admissionsRes, pendingRes] = await Promise.allSettled([
        axiosInstance.get('/admissions?status=admitted'),
        axiosInstance.get('/requests/pending-count')
      ]);

      if (admissionsRes.status === 'fulfilled') {
        const admissionList = Array.isArray(admissionsRes.value.data.admissions)
          ? admissionsRes.value.data.admissions
          : (Array.isArray(admissionsRes.value.data) ? admissionsRes.value.data : []);
        setAdmissions(admissionList);
      }

      if (pendingRes.status === 'fulfilled') {
        setPendingRequestsCount(pendingRes.value.data?.count || 0);
      }
    } catch (error) {
      console.error('Error fetching data for nurse dashboard:', error);
      addToast('Failed to load active patients', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  // Callback when a QR code is scanned via device camera
  const handleScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data && data.admissionId) {
        addToast('QR Code scanned successfully!', 'success');
        setIsScannerOpen(false);
        // Automatically redirect to log vitals for this patient
        navigate(`/nurse/vitals/new?admissionId=${data.admissionId}`);
      } else {
        addToast('Invalid QR Code format', 'error');
      }
    } catch (parseError) {
      addToast('Failed to parse QR Code data', 'error');
    }
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader 
        title="Nurse Operations Dashboard" 
        subtitle="Patient Care, Vitals Monitoring & Hospital Transfers"
        icon="👩‍⚕️"
      />

      {/* University Project Welcome Banner Strip */}
      <div className="dashboard-welcome-strip">
        <div className="welcome-strip-left">
          <div className="welcome-strip-avatar">👩‍⚕️</div>
          <div className="welcome-strip-text">
            <h3>Welcome back, {user?.fullName || 'Staff Nurse'}</h3>
            <p>Staff Nurse • Inpatient Nursing Care & Ward Duty</p>
          </div>
        </div>
        <div className="welcome-strip-right">
          <span>📅 {currentDate}</span>
        </div>
      </div>

      {/* Section 1: KPI Summary Cards */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>📊</span> Inpatient Care Metrics
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Active Ward Patients" 
          value={isLoading ? '...' : admissions.length} 
          icon="👥"
          description="Inpatients currently admitted across hospital wards"
        />
        <StatCard 
          title="Discharge Requests" 
          value={isLoading ? '...' : pendingRequestsCount} 
          icon="📋"
          type={pendingRequestsCount > 0 ? 'maintenance' : 'default'}
          description={pendingRequestsCount > 0 ? 'Awaiting nurse confirmation & bed release' : 'All discharge requests verified'}
          to="/nurse/requests"
        />
      </div>

      {/* Section 2: Grouped Operations */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>⚡</span> Nursing Operations & Quick Actions
        </h2>
      </div>

      {/* Group 1: Patient Care & Vitals */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🩸</span> Patient Care & Clinical Tracking
        </div>
        <div className="quick-actions-grid">
          <Link 
            to="/nurse/requests" 
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
              <p>Review & approve doctor discharge orders</p>
            </div>
          </Link>

          <button 
            className="quick-action-card highlight-blue"
            onClick={() => setIsScannerOpen(true)}
          >
            <div className="quick-action-icon">📷</div>
            <div className="quick-action-content">
              <h4>Scan QR Code</h4>
              <p>Scan wristband to quickly log vitals</p>
            </div>
          </button>

          <Link to="/nurse/vitals/new" className="quick-action-card">
            <div className="quick-action-icon">🩸</div>
            <div className="quick-action-content">
              <h4>Log Vitals</h4>
              <p>Record temperature, BP, pulse & SpO2</p>
            </div>
          </Link>

          <Link to="/nurse/lookup" className="quick-action-card">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-content">
              <h4>Patient Lookup</h4>
              <p>Find patient by NIC, name, or bed</p>
            </div>
          </Link>

          <Link to="/admin/patients" className="quick-action-card">
            <div className="quick-action-icon">🗂️</div>
            <div className="quick-action-content">
              <h4>Patient Directory</h4>
              <p>View complete hospital patient directory</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Group 2: Transfer Operations */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🚑</span> Patient Transfers & Movement
        </div>
        <div className="quick-actions-grid">
          <Link to="/nurse/transfers/internal/new" className="quick-action-card">
            <div className="quick-action-icon">🔄</div>
            <div className="quick-action-content">
              <h4>Internal Transfer</h4>
              <p>Move patient between wards or beds</p>
            </div>
          </Link>

          <Link to="/nurse/transfers/external/new" className="quick-action-card">
            <div className="quick-action-icon">🚑</div>
            <div className="quick-action-content">
              <h4>External Transfer</h4>
              <p>Transfer patient to another hospital</p>
            </div>
          </Link>

          <Link to="/nurse/transfers/external/return" className="quick-action-card">
            <div className="quick-action-icon">🏥</div>
            <div className="quick-action-content">
              <h4>Return Patient</h4>
              <p>Readmit returning external transfer patient</p>
            </div>
          </Link>

          <Link to="/nurse/transfers/history" className="quick-action-card">
            <div className="quick-action-icon">📜</div>
            <div className="quick-action-content">
              <h4>Transfer History</h4>
              <p>View historical transfer movement logs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Section 3: Active Admitted Patients Table */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🛌</span> Currently Admitted Inpatients ({isLoading ? '...' : admissions.length})
        </h2>
      </div>

      <DataTable 
        columns={['ID', 'Patient Name', 'Location', 'Admitted Date', 'Status', 'Actions']} 
        isEmpty={!isLoading && admissions.length === 0}
        emptyMessage="No active patients currently admitted."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
              Loading active patients...
            </td>
          </tr>
        ) : (
          admissions.map((admission) => (
            <tr key={admission.id}>
              <td className="mono-data">#{admission.id}</td>
              <td style={{ fontWeight: 600 }}>
                {admission.patientName}
                {admission.patientNIC && (
                  <div style={{ fontSize: '11px', color: '#0369a1', fontFamily: 'monospace', fontWeight: 'normal' }}>
                    🆔 {admission.patientNIC}
                  </div>
                )}
                {admission.isMinor === 1 && (
                  <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'normal' }}>
                    👶 Minor (Guardian: {admission.guardianNIC || 'N/A'})
                  </div>
                )}
              </td>
              <td>
                {admission.wardName} {admission.bedNumber ? `(Bed ${admission.bedNumber})` : ''}
              </td>
              <td>
                {new Date(admission.admissionDate).toLocaleDateString()}
              </td>
              <td>
                <StatusBadge status={admission.status} />
              </td>
              <td>
                <div className="table-actions">
                  <button 
                    className="action-btn" 
                    title="Log Vitals" 
                    onClick={() => navigate(`/nurse/vitals/new?admissionId=${admission.id}`)}
                  >
                    🩸
                  </button>
                  <button 
                    className="action-btn" 
                    title="Transfer Patient" 
                    onClick={() => navigate(`/nurse/transfers/internal/new?admissionId=${admission.id}`)}
                  >
                    🔄
                  </button>
                  <button 
                    className="action-btn" 
                    title="Print Admission QR Code" 
                    onClick={() => {
                      setQrModalData({
                        admissionId: admission.id,
                        patientName: admission.patientName,
                        wardName: admission.wardName,
                        bedNumber: admission.bedNumber || 'N/A',
                        admissionDate: new Date(admission.admissionDate).toLocaleDateString()
                      });
                    }}
                  >
                    🖨️
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* QR Print Modal Dialog */}
      {qrModalData && (
        <QRPrintModal
          isOpen={!!qrModalData}
          onClose={() => setQrModalData(null)}
          admissionId={qrModalData.admissionId}
          patientName={qrModalData.patientName}
          wardName={qrModalData.wardName}
          bedNumber={qrModalData.bedNumber}
          admissionDate={qrModalData.admissionDate}
        />
      )}

      {/* QR Scanner Camera Modal */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
};

export default NurseDashboard;
