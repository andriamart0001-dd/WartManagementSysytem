// =============================================================================
// PatientManagementPage.jsx — Hospital Patient Master Directory
// =============================================================================
// Purpose:
//   Allows hospital staff to browse and search the central patient directory
//   by Name, NIC, or Guardian NIC.
//   Staff can view the complete admission history for any patient in a SlideDrawer,
//   and directly trigger an admission for an existing patient.
//
// Route: /admin/patients
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SlideDrawer from '../../components/ui/SlideDrawer';

const PatientManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Only Admin, WardAdmin, and AdmissionDoctor can register or admit patients (Nurses cannot)
  const canRegisterAndAdmit = [ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR].includes(user?.role);
  const registerPath = user?.role === ROLES.ADMISSION_DOCTOR ? '/admission-doctor/patients/new' : '/staff/patients/new';
  const admitPath = user?.role === ROLES.ADMISSION_DOCTOR ? '/admission-doctor/admit' : '/staff/admit';

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // History Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch patients list
  const fetchPatients = async (query = '') => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/patients?search=${encodeURIComponent(query)}`);
      const list = Array.isArray(response.data.patients) ? response.data.patients : [];
      setPatients(list);
    } catch (err) {
      console.error('Error fetching patients:', err);
      addToast('Failed to load patient records', 'error');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  // Open drawer and load patient admission history
  const handleViewHistory = async (patientId) => {
    setIsDrawerOpen(true);
    setIsLoadingHistory(true);
    setSelectedPatientHistory(null);

    try {
      const response = await axiosInstance.get(`/patients/${patientId}/history`);
      setSelectedPatientHistory(response.data);
    } catch (err) {
      console.error('Error fetching patient history:', err);
      addToast('Failed to load patient admission history', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Patient Directory & History"
        subtitle="Manage permanent patient records, track past admissions, and lookup by NIC."
        icon="🗂️"
        actionLabel={canRegisterAndAdmit ? "+ Register New Patient" : undefined}
        onAction={canRegisterAndAdmit ? () => navigate(registerPath) : undefined}
      />

      {/* Live Search Bar */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by Patient Name, NIC, or Guardian NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="submit-button"
            style={{ width: 'auto', marginTop: 0, padding: '10px 20px', fontSize: '14px' }}
          >
            🔍 Search
          </button>
          {searchTerm && (
            <button
              type="button"
              className="cancelBtn"
              style={{ padding: '10px 16px', fontSize: '14px' }}
              onClick={() => {
                setSearchTerm('');
                fetchPatients('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Patients Data Table */}
      <DataTable
        columns={['Patient Name', 'NIC / Identity', 'Age & Gender', 'Blood Group', 'Admissions', 'Actions']}
        isEmpty={!isLoading && patients.length === 0}
        emptyMessage="No patient records found. Register a new patient to get started."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
              Loading patient directory...
            </td>
          </tr>
        ) : (
          patients.map((p) => {
            // Calculate age
            const birthDate = new Date(p.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

            return (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {p.fullName}
                  {p.contactNumber && (
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                      📞 {p.contactNumber}
                    </div>
                  )}
                </td>

                <td>
                  {p.isMinor ? (
                    <div>
                      <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        CHILD / MINOR
                      </span>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                        Guardian: <strong>{p.guardianName || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        NIC: {p.guardianNIC || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0369a1' }}>
                      {p.patientNIC || 'No NIC'}
                    </span>
                  )}
                </td>

                <td>
                  <span>{age} yrs</span>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                    {p.gender} (DOB: {formatDate(p.dateOfBirth)})
                  </div>
                </td>

                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: p.bloodGroup && p.bloodGroup !== 'Unknown' ? '#fee2e2' : '#f1f5f9',
                      color: p.bloodGroup && p.bloodGroup !== 'Unknown' ? '#b91c1c' : '#64748b'
                    }}
                  >
                    🩸 {p.bloodGroup || 'Unknown'}
                  </span>
                </td>

                <td>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {p.totalAdmissions || 0} visits
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      className="action-btn"
                      title="View Stay History"
                      onClick={() => handleViewHistory(p.id)}
                    >
                      📜 History
                    </button>
                    {canRegisterAndAdmit && (
                      <button
                        className="action-btn"
                        style={{ color: '#0284c7', borderColor: '#bae6fd' }}
                        title="Admit this patient"
                        onClick={() => navigate(`${admitPath}?patientId=${p.id}`)}
                      >
                        🛏️ Admit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* SlideDrawer for Full Admission Stay History */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Patient Admission History"
      >
        {isLoadingHistory ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Loading history...</p>
        ) : selectedPatientHistory ? (
          <div>
            {/* Patient Overview Header Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#0f172a' }}>
                {selectedPatientHistory.patient?.fullName}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                <span>🆔 NIC: <strong>{selectedPatientHistory.patient?.patientNIC || selectedPatientHistory.patient?.guardianNIC || 'Minor'}</strong></span>
                <span>🩸 Blood: <strong>{selectedPatientHistory.patient?.bloodGroup}</strong></span>
                <span>🎂 DOB: <strong>{formatDate(selectedPatientHistory.patient?.dateOfBirth)}</strong></span>
                {selectedPatientHistory.patient?.contactNumber && (
                  <span>📞 Phone: <strong>{selectedPatientHistory.patient?.contactNumber}</strong></span>
                )}
              </div>

              {/* Active Admission Banner */}
              {selectedPatientHistory.activeAdmission ? (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  🟢 Currently Admitted: {selectedPatientHistory.activeAdmission.wardName} (Bed: {selectedPatientHistory.activeAdmission.bedNumber || 'Unassigned'})
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    color: '#64748b',
                    fontSize: '13px'
                  }}
                >
                  ⚪ Not currently admitted
                </div>
              )}
            </div>

            {/* List of Previous Stays */}
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
              Past Hospital Stays ({selectedPatientHistory.admissions?.length || 0})
            </h4>

            {selectedPatientHistory.admissions?.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No admission records found for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPatientHistory.admissions.map((adm) => (
                  <div
                    key={adm.admissionId}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        🏥 {adm.wardName} {adm.bedNumber ? `• Bed ${adm.bedNumber}` : ''}
                      </span>
                      <StatusBadge status={adm.status} />
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>📅 <strong>Admitted:</strong> {new Date(adm.admissionDate).toLocaleString()}</div>
                      {adm.dischargeDate && (
                        <div>🏁 <strong>Discharged:</strong> {new Date(adm.dischargeDate).toLocaleString()}</div>
                      )}
                      {adm.admittedByName && (
                        <div>🧑‍⚕️ <strong>Admitted By:</strong> {adm.admittedByName}</div>
                      )}
                      {adm.dischargeNotes && (
                        <div style={{ marginTop: '6px', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '4px', fontStyle: 'italic' }}>
                          "{adm.dischargeNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </SlideDrawer>
    </div>
  );
};

export default PatientManagementPage;
