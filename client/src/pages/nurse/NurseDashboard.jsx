// =============================================================================
// NurseDashboard.jsx — Staff Nurse Dashboard Page
// =============================================================================
// Purpose:
//   Primary dashboard for Staff Nurses.
//   Allows nurses to log patient vitals, perform internal & external transfers,
//   look up patients, scan admission QR codes, and view active ward patients.
//   Note: Patient registration and admission are handled by Admission Doctors.
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

  // State for the QR printing modal
  const [qrModalData, setQrModalData] = useState(null);

  // State for toggling the camera scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Fetch all active admitted patients across wards
  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/admissions?status=admitted');
      const admissionList = Array.isArray(response.data.admissions)
        ? response.data.admissions
        : (Array.isArray(response.data) ? response.data : []);
      setAdmissions(admissionList);
    } catch (error) {
      console.error('Error fetching admissions for nurse dashboard:', error);
      addToast('Failed to load active patients', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admissions on component mount
  useEffect(() => {
    fetchAdmissions();
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
      {/* Page Header — No Admit button for nurses */}
      <PageHeader 
        title="Nurse Operations Dashboard" 
        subtitle={`Welcome back, ${user?.fullName || 'Nurse'}.`}
        icon="👩‍⚕️"
      />

      {/* Quick Action Buttons Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/nurse/lookup')}
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
          onClick={() => navigate('/nurse/vitals/new')}
        >
          🩸 Log Vitals
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/nurse/transfers/internal/new')}
        >
          🔄 Internal Transfer
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/nurse/transfers/external/new')}
        >
          🚑 External Transfer
        </button>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/nurse/transfers/external/return')}
        >
          🏥 Return Patient
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
