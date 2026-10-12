import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import QRScannerModal from '../../components/ui/QRScannerModal';

// =============================================================================
// DoctorDashboard.jsx
// =============================================================================
// Purpose:
//   Main dashboard for the Doctor role.
//   Shows a live list of all currently admitted patients with quick actions
//   for viewing details, logging vitals, and discharging.
// =============================================================================

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // List of active admitted patients
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // ===========================================================================
  // DATA FETCHING
  // Fetches all currently admitted patients from the backend
  // ===========================================================================
  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admissions');
      const list = Array.isArray(res.data.admissions) 
        ? res.data.admissions 
        : (Array.isArray(res.data) ? res.data : []);
      setAdmissions(list);
    } catch (error) {
      console.error('Error fetching admitted patients:', error);
      addToast('Failed to load patient list', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    // eslint-disable-next-line
  }, []);

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
      <PageHeader
        title="My Patients"
        subtitle={`Welcome back, Dr. ${user?.fullName}. Here are the currently admitted patients.`}
        icon="🩺"
      />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className="action-btn" 
          style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
          onClick={() => setIsScannerOpen(true)}
        >
          📷 Scan Patient QR
        </button>
      </div>

      {/* Active Patient Table */}
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
          (Array.isArray(admissions) ? admissions : []).map((adm) => (
            <tr key={adm.id}>
              <td className="mono-data">#{adm.id}</td>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {adm.patientName}
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
                    title="Discharge Patient"
                    onClick={() => navigate(`/doctor/discharge/new?admissionId=${adm.id}`)}
                    style={{ color: 'var(--status-occupied)' }}
                  >
                    🏠 Discharge
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

