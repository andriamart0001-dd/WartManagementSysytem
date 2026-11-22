// =============================================================================
// AdmissionDoctorDashboard.jsx — Admission Doctor Dashboard Page
// =============================================================================
// Purpose:
//   Primary dashboard for Admission Doctors.
//   Allows admission doctors to register patients, perform formal hospital admissions,
//   manage internal/external patient transfers, and log patient vitals.
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

const AdmissionDoctorDashboard = () => {
  // Grab the currently logged-in user from AuthContext
  const { user } = useAuth();
  // Toast notifications helper
  const { addToast } = useToast();
  // React router navigation hook
  const navigate = useNavigate();

  // State for active admissions list and loading status
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State to hold data for the QR Print Modal popup
  const [qrModalData, setQrModalData] = useState(null);

  // State to toggle the QR Scanner Camera Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Formatted date string for the student project welcome banner
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // This function fetches all active admitted patients from the server
  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      // Query the admissions endpoint for patients whose status is currently 'admitted'
      const response = await axiosInstance.get('/admissions?status=admitted');
      const admissionList = Array.isArray(response.data.admissions)
        ? response.data.admissions
        : (Array.isArray(response.data) ? response.data : []);
      setAdmissions(admissionList);
    } catch (error) {
      console.error('Error fetching admissions for admission doctor:', error);
      addToast('Failed to load active patients', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the fetch on initial page load
  useEffect(() => {
    fetchAdmissions();
    // eslint-disable-next-line
  }, []);

  // Handler triggered when a QR code is successfully read by the camera scanner
  const handleScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data && data.admissionId) {
        addToast('QR Code scanned successfully!', 'success');
        setIsScannerOpen(false);
        // Automatically redirect to log vitals for this admitted patient
        navigate(`/admission-doctor/vitals/new?admissionId=${data.admissionId}`);
      } else {
        addToast('Invalid QR Code format', 'error');
      }
    } catch (parseError) {
      addToast('Failed to parse QR Code data', 'error');
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header section with Admit Patient primary action button */}
      <PageHeader 
        title="Admission Doctor Dashboard" 
        subtitle="Patient Registration, Hospital Admission & Intake Operations"
        icon="🩺"
        actionLabel="+ Admit Patient"
        onAction={() => navigate('/admission-doctor/admit')}
      />

      {/* University Project Welcome Banner Strip */}
      <div className="dashboard-welcome-strip">
        <div className="welcome-strip-left">
          <div className="welcome-strip-avatar">🩺</div>
          <div className="welcome-strip-text">
            <h3>Welcome back, Dr. {user?.fullName || 'Doctor'}</h3>
            <p>Admission Medical Officer • Inpatient Intake & Bed Allocations</p>
          </div>
        </div>
        <div className="welcome-strip-right">
          <span>📅 {currentDate}</span>
        </div>
      </div>

      {/* Section 1: KPI Statistics Grid */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>📊</span> Admission & Ward Intake Metrics
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Active Inpatients" 
          value={isLoading ? '...' : admissions.length} 
          icon="👥"
          description="Patients currently admitted across hospital wards"
        />
        <StatCard 
          title="Intake Authority" 
          value="Admissions" 
          icon="🩺"
          description="Authorized for patient registration & ward admissions"
        />
      </div>

      {/* Section 2: Grouped Operations */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>⚡</span> Intake & Clinical Operations
        </h2>
      </div>

      {/* Group 1: Registration & Admissions */}
      <div className="action-group">
        <div className="action-group-title">
          <span>📝</span> Patient Registration & Admissions
        </div>
        <div className="quick-actions-grid">
          <Link to="/admission-doctor/patients/new" className="quick-action-card highlight-blue">
            <div className="quick-action-icon">➕</div>
            <div className="quick-action-content">
              <h4>Register Patient</h4>
              <p>Create new patient record with NIC / Guardian</p>
            </div>
          </Link>

          <Link to="/admission-doctor/admit" className="quick-action-card highlight-blue">
            <div className="quick-action-icon">📝</div>
            <div className="quick-action-content">
              <h4>Admit Patient</h4>
              <p>Assign patient to ward and available bed</p>
            </div>
          </Link>

          <button 
            className="quick-action-card"
            onClick={() => setIsScannerOpen(true)}
          >
            <div className="quick-action-icon">📷</div>
            <div className="quick-action-content">
              <h4>Scan QR Code</h4>
              <p>Scan wristband to quickly locate patient</p>
            </div>
          </button>

          <Link to="/admission-doctor/lookup" className="quick-action-card">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-content">
              <h4>Patient Lookup</h4>
              <p>Search active and registered patients</p>
            </div>
          </Link>

          <Link to="/admin/patients" className="quick-action-card">
            <div className="quick-action-icon">🗂️</div>
            <div className="quick-action-content">
              <h4>Patient Directory</h4>
              <p>View complete hospital master directory</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Group 2: Transfers & Care */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🚑</span> Transfers & Clinical Care
        </div>
        <div className="quick-actions-grid">
          <Link to="/admission-doctor/vitals/new" className="quick-action-card">
            <div className="quick-action-icon">🩸</div>
            <div className="quick-action-content">
              <h4>Log Vitals</h4>
              <p>Record temperature, BP, pulse & SpO2</p>
            </div>
          </Link>

          <Link to="/admission-doctor/transfers/internal/new" className="quick-action-card">
            <div className="quick-action-icon">🔄</div>
            <div className="quick-action-content">
              <h4>Internal Transfer</h4>
              <p>Move patient between hospital wards or beds</p>
            </div>
          </Link>

          <Link to="/admission-doctor/transfers/external/new" className="quick-action-card">
            <div className="quick-action-icon">🚑</div>
            <div className="quick-action-content">
              <h4>External Transfer</h4>
              <p>Send patient to partner hospital</p>
            </div>
          </Link>

          <Link to="/admission-doctor/transfers/external/return" className="quick-action-card">
            <div className="quick-action-icon">🏥</div>
            <div className="quick-action-content">
              <h4>Return Patient</h4>
              <p>Readmit returning external transfer patient</p>
            </div>
          </Link>

          <Link to="/admission-doctor/transfers/history" className="quick-action-card">
            <div className="quick-action-icon">📜</div>
            <div className="quick-action-content">
              <h4>Transfer History</h4>
              <p>Audit trail of all patient transfer logs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Section 3: Active Admitted Patients Table */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🛌</span> Currently Admitted Patients ({isLoading ? '...' : admissions.length})
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
                    onClick={() => navigate(`/admission-doctor/vitals/new?admissionId=${admission.id}`)}
                  >
                    🩸
                  </button>
                  <button 
                    className="action-btn" 
                    title="Transfer Patient" 
                    onClick={() => navigate(`/admission-doctor/transfers/internal/new?admissionId=${admission.id}`)}
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

export default AdmissionDoctorDashboard;
