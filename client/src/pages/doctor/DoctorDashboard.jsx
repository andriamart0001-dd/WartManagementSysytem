import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

// Forms
import LogVitalsForm from '../staff/forms/LogVitalsForm';
import DischargePatientForm from './forms/DischargePatientForm';

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

  // Controls which form drawer is currently open
  const [activeForm, setActiveForm] = useState(null); // 'VITALS' or 'DISCHARGE'

  // The admission ID passed into a form when opened from a table row
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');

  // ===========================================================================
  // DATA FETCHING
  // Fetches all currently admitted patients from the backend
  // ===========================================================================
  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admissions');
      // The backend returns either { admissions: [...] } or just an array
      setAdmissions(res.data.admissions || res.data);
    } catch (error) {
      console.error('Error fetching admitted patients:', error);
      addToast('Failed to load patient list', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    // eslint-disable-next-line
  }, []);

  // ===========================================================================
  // FORM OPEN / CLOSE HANDLERS
  // ===========================================================================
  const openForm = (formType, admissionId = '') => {
    setSelectedAdmissionId(admissionId.toString());
    setActiveForm(formType);
  };

  const closeForm = () => {
    setActiveForm(null);
    setSelectedAdmissionId('');
  };

  // Called after a vitals form succeeds
  const handleVitalsSuccess = () => {
    closeForm();
    addToast('Vitals logged successfully', 'success');
  };

  // Called after discharge form succeeds — refresh the patient list
  const handleDischargeSuccess = () => {
    closeForm();
    fetchAdmissions(); // Refresh to remove discharged patient from the list
    addToast('Patient discharged successfully', 'success');
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
          admissions.map((adm) => (
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
                    onClick={() => openForm('VITALS', adm.id)}
                  >
                    🩸 Vitals
                  </button>

                  {/* Discharge patient */}
                  <button
                    className="action-btn"
                    title="Discharge Patient"
                    onClick={() => openForm('DISCHARGE', adm.id)}
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

      {/* Log Vitals Drawer — shared with staff */}
      <LogVitalsForm
        isOpen={activeForm === 'VITALS'}
        onClose={closeForm}
        onSuccess={handleVitalsSuccess}
        preselectedAdmissionId={selectedAdmissionId}
      />

      {/* Discharge Patient Drawer */}
      <DischargePatientForm
        isOpen={activeForm === 'DISCHARGE'}
        onClose={closeForm}
        onSuccess={handleDischargeSuccess}
        preselectedAdmissionId={selectedAdmissionId}
      />
    </div>
  );
};

export default DoctorDashboard;
