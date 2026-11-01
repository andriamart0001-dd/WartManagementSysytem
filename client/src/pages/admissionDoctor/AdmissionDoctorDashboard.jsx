// =============================================================================
// AdmissionDoctorDashboard.jsx — Admission Doctor Dashboard Page
// =============================================================================
// Purpose:
//   Primary dashboard for Admission Doctors.
//   Allows admission doctors to admit patients, register new patients,
//   manage internal/external transfers, and log patient vitals.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
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
        subtitle={`Welcome back, Dr. ${user?.fullName || 'Doctor'}.`}
        icon="🩺"
        actionLabel="+ Admit Patient"
        onAction={() => navigate('/admission-doctor/admit')}
      />

      {/* Quick Action Buttons Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#ffffff', border: '1px solid #0284c7', fontWeight: 600 }} 
          onClick={() => navigate('/admission-doctor/patients/new')}
        >
          ➕ Register Patient
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admission-doctor/lookup')}
        >
          🔍 Patient Lookup
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admin/patients')}
        >
          🗂️ Patient Directory
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => setIsScannerOpen(true)}
        >
          📷 Scan QR
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admission-doctor/transfers/internal/new')}
        >
          🔄 Internal Transfer
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admission-doctor/transfers/external/new')}
        >
          🚑 External Transfer
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admission-doctor/transfers/external/return')}
        >
          🏥 Return Patient
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admission-doctor/vitals/new')}
        >
          🩸 Log Vitals
        </button>
      </div>

      {/* Active Admitted Patients Table */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>
        Active Admitted Patients
      </h3>

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
