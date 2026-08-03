import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import QRPrintModal from '../../components/ui/QRPrintModal';

// Drawer Forms
import AdmitPatientForm from './forms/AdmitPatientForm';
import WardTransferForm from './forms/WardTransferForm';
import HospitalTransferForm from './forms/HospitalTransferForm';
import LogVitalsForm from './forms/LogVitalsForm';

// =============================================================================
// StaffDashboard.jsx
// =============================================================================
// Purpose:
//   Dashboard for Staff Nurses.
//   Manages patient admissions, transfers, and vitals logging.
// =============================================================================

const StaffDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Drawer States
  const [activeForm, setActiveForm] = useState(null); // 'ADMIT', 'TRANSFER_WARD', 'TRANSFER_HOSPITAL', 'VITALS'
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
  
  // QR Modal State
  const [qrModalData, setQrModalData] = useState(null);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admissions?status=admitted');
      setAdmissions(res.data.admissions || res.data);
    } catch (error) {
      console.error('Error fetching admissions:', error);
      addToast('Failed to load active patients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    // eslint-disable-next-line
  }, []);

  // Form Handlers
  const openForm = (formType, admissionId = '') => {
    setSelectedAdmissionId(admissionId);
    setActiveForm(formType);
  };

  const closeForm = () => {
    setActiveForm(null);
    setSelectedAdmissionId('');
  };

  // Success Handlers
  const handleAdmissionSuccess = (newAdmission) => {
    closeForm();
    fetchAdmissions();
    
    // Show QR modal for the new patient
    if (newAdmission) {
      setQrModalData({
        admissionId: newAdmission.id,
        patientName: newAdmission.patientName,
        wardName: newAdmission.wardName || `Ward ID: ${newAdmission.wardId}`,
        bedNumber: newAdmission.bedNumber || 'N/A',
        admissionDate: new Date(newAdmission.admissionDate).toLocaleDateString()
      });
    } else {
      addToast('Patient admitted successfully', 'success');
    }
  };

  const handleGenericSuccess = (message) => {
    closeForm();
    fetchAdmissions();
    addToast(message, 'success');
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Patient Operations Dashboard" 
        subtitle={`Welcome back, ${user?.fullName}.`}
        icon="📋"
        actionLabel="+ Admit Patient"
        onAction={() => openForm('ADMIT')}
      />

      {/* Quick Actions Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => openForm('TRANSFER_WARD')}>
          🔄 Internal Transfer
        </button>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => openForm('TRANSFER_HOSPITAL')}>
          🚑 External Transfer
        </button>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => openForm('VITALS')}>
          🩸 Log Vitals
        </button>
      </div>

      {/* Active Patients Table */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>Active Admitted Patients</h3>
      <DataTable 
        columns={['ID', 'Patient Name', 'Location', 'Admitted Date', 'Status', 'Actions']} 
        isEmpty={!isLoading && admissions.length === 0}
        emptyMessage="No active patients currently."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading patients...</td>
          </tr>
        ) : (
          admissions.map((adm) => (
            <tr key={adm.id}>
              <td className="mono-data">#{adm.id}</td>
              <td style={{ fontWeight: 600 }}>{adm.patientName}</td>
              <td>{adm.wardName} {adm.bedNumber ? `(Bed ${adm.bedNumber})` : ''}</td>
              <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>
              <td>
                <StatusBadge status={adm.status} />
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn" title="Log Vitals" onClick={() => openForm('VITALS', adm.id)}>🩸</button>
                  <button className="action-btn" title="Transfer" onClick={() => openForm('TRANSFER_WARD', adm.id)}>🔄</button>
                  <button className="action-btn" title="Print QR" onClick={() => {
                    setQrModalData({
                      admissionId: adm.id,
                      patientName: adm.patientName,
                      wardName: adm.wardName,
                      bedNumber: adm.bedNumber || 'N/A',
                      admissionDate: new Date(adm.admissionDate).toLocaleDateString()
                    });
                  }}>🖨️</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Slide Drawers */}
      <AdmitPatientForm 
        isOpen={activeForm === 'ADMIT'} 
        onClose={closeForm} 
        onSuccess={handleAdmissionSuccess} 
      />
      
      <WardTransferForm 
        isOpen={activeForm === 'TRANSFER_WARD'} 
        onClose={closeForm} 
        onSuccess={() => handleGenericSuccess('Internal transfer complete')}
        preselectedAdmissionId={selectedAdmissionId}
      />
      
      <HospitalTransferForm 
        isOpen={activeForm === 'TRANSFER_HOSPITAL'} 
        onClose={closeForm} 
        onSuccess={() => handleGenericSuccess('Patient transferred to external hospital')}
        preselectedAdmissionId={selectedAdmissionId}
      />

      <LogVitalsForm 
        isOpen={activeForm === 'VITALS'} 
        onClose={closeForm} 
        onSuccess={() => handleGenericSuccess('Vitals logged successfully')}
        preselectedAdmissionId={selectedAdmissionId}
      />

      {/* QR Print Modal */}
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

    </div>
  );
};

export default StaffDashboard;
