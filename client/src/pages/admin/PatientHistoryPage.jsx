// =============================================================================
// PatientHistoryPage.jsx — Comprehensive Patient Medical History & Timeline
// =============================================================================
// Purpose:
//   Provides a full-page, unified medical timeline for a single patient.
//   It displays:
//     1. Patient Demographics (Name, NIC/Guardian, DOB, Blood Group, Contact, Address)
//     2. Active Stay Banner (Current ward & bed, or 'Not currently admitted')
//     3. Admission History (All previous hospital stays, dates, doctors, notes)
//     4. Lazy-loaded Vitals Log (Click an admission to view recorded vitals)
//     5. Transfer Records (Internal ward moves & external hospital transfers)
//     6. Clinical Discharge Requests (Doctor requests with approval/rejection status)
//     7. Inline Edit Modal (Admin, WardAdmin, AdmissionDoctor can edit patient info)
//     8. Print View (window.print() with print-friendly layout)
//
// Route: /admin/patients/:id/history or /patients/:id/history
// Allowed Roles: All hospital staff (Admin, WardAdmin, AdmissionDoctor, Doctor, Nurse)
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

const PatientHistoryPage = () => {
  // Read the patient ID from the browser URL path (e.g., /admin/patients/4/history)
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Roles permitted to edit patient demographic info
  const canEditPatient = [
    ROLES.ADMIN,
    ROLES.WARD_ADMIN,
    ROLES.ADMISSION_DOCTOR
  ].includes(user?.role);

  // ---------------------------------------------------------------------------
  // Component State Variables
  // ---------------------------------------------------------------------------
  // Patient demographic profile and active admission info
  const [patientData, setPatientData] = useState(null);
  const [activeAdmission, setActiveAdmission] = useState(null);
  const [admissionList, setAdmissionList] = useState([]);

  // Transfer history states
  const [internalTransfers, setInternalTransfers] = useState([]);
  const [externalTransfers, setExternalTransfers] = useState([]);

  // Clinical discharge request history state
  const [clinicalRequests, setClinicalRequests] = useState([]);

  // Loading and error states
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageErrorMessage, setPageErrorMessage] = useState('');

  // Vitals storage: cache vitals per admission ID so we do not re-fetch unnecessarily
  // Example: { [admissionId]: [ { temperature, bloodPressure, ... } ] }
  const [vitalsMap, setVitalsMap] = useState({});
  const [expandedVitalsAdmissionId, setExpandedVitalsAdmissionId] = useState(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  // Edit Patient Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    patientNIC: '',
    isMinor: false,
    guardianName: '',
    guardianNIC: '',
    contactNumber: '',
    address: '',
    bloodGroup: 'Unknown'
  });

  // ---------------------------------------------------------------------------
  // Data Fetching: Load All Patient History Information
  // ---------------------------------------------------------------------------
  const loadCompletePatientHistory = async () => {
    setIsLoadingPage(true);
    setPageErrorMessage('');

    try {
      // 1. Fetch patient demographic details and admission list
      const historyResponse = await axiosInstance.get(`/patients/${patientId}/history`);
      const data = historyResponse.data;

      setPatientData(data.patient || null);
      setActiveAdmission(data.activeAdmission || null);
      setAdmissionList(Array.isArray(data.admissions) ? data.admissions : []);

      // Pre-fill the edit form with current patient data
      if (data.patient) {
        setEditFormData({
          fullName: data.patient.fullName || '',
          dateOfBirth: data.patient.dateOfBirth ? data.patient.dateOfBirth.substring(0, 10) : '',
          gender: data.patient.gender || 'Male',
          patientNIC: data.patient.patientNIC || '',
          isMinor: Boolean(data.patient.isMinor),
          guardianName: data.patient.guardianName || '',
          guardianNIC: data.patient.guardianNIC || '',
          contactNumber: data.patient.contactNumber || '',
          address: data.patient.address || '',
          bloodGroup: data.patient.bloodGroup || 'Unknown'
        });
      }

      // 2. Fetch internal transfers for this patient
      try {
        const internalResponse = await axiosInstance.get(`/transfers/patient/${patientId}/internal`);
        setInternalTransfers(Array.isArray(internalResponse.data.transfers) ? internalResponse.data.transfers : []);
      } catch (transferError) {
        console.error('Error fetching internal transfers:', transferError);
        setInternalTransfers([]);
      }

      // 3. Fetch external transfers for this patient
      try {
        const externalResponse = await axiosInstance.get(`/transfers/patient/${patientId}/external`);
        setExternalTransfers(Array.isArray(externalResponse.data.transfers) ? externalResponse.data.transfers : []);
      } catch (transferError) {
        console.error('Error fetching external transfers:', transferError);
        setExternalTransfers([]);
      }

      // 4. Fetch clinical discharge requests for this patient
      try {
        const requestResponse = await axiosInstance.get(`/requests/patient/${patientId}`);
        setClinicalRequests(Array.isArray(requestResponse.data.requests) ? requestResponse.data.requests : []);
      } catch (reqError) {
        console.error('Error fetching clinical requests:', reqError);
        setClinicalRequests([]);
      }

    } catch (error) {
      console.error('Failed to load patient history:', error);
      setPageErrorMessage('Could not load patient history. The patient record may not exist.');
      addToast('Failed to load patient record', 'error');
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Run initial data load when component mounts or patientId changes
  useEffect(() => {
    if (patientId) {
      loadCompletePatientHistory();
    }
  }, [patientId]);

  // ---------------------------------------------------------------------------
  // Lazy-load Vitals for a Specific Admission
  // ---------------------------------------------------------------------------
  const toggleAdmissionVitals = async (admissionId) => {
    // If user clicks the currently opened admission, collapse it
    if (expandedVitalsAdmissionId === admissionId) {
      setExpandedVitalsAdmissionId(null);
      return;
    }

    // Expand the selected admission
    setExpandedVitalsAdmissionId(admissionId);

    // If we have already fetched vitals for this admission, do not re-fetch
    if (vitalsMap[admissionId]) {
      return;
    }

    // Otherwise, fetch vitals from the backend
    setIsLoadingVitals(true);
    try {
      const response = await axiosInstance.get(`/admissions/${admissionId}/vitals`);
      const recordedVitals = Array.isArray(response.data.vitals) ? response.data.vitals : [];

      setVitalsMap((previousMap) => ({
        ...previousMap,
        [admissionId]: recordedVitals
      }));
    } catch (vitalsError) {
      console.error('Error loading vitals for admission:', vitalsError);
      addToast('Failed to load vitals for this admission', 'error');
      // Store an empty list to avoid stuck loading state
      setVitalsMap((previousMap) => ({
        ...previousMap,
        [admissionId]: []
      }));
    } finally {
      setIsLoadingVitals(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit Patient Form Handling
  // ---------------------------------------------------------------------------
  const handleEditInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setIsSubmittingEdit(true);

    try {
      await axiosInstance.put(`/patients/${patientId}`, editFormData);
      addToast('Patient details updated successfully!', 'success');
      setIsEditModalOpen(false);

      // Refresh the page data to show the updated fields
      await loadCompletePatientHistory();
    } catch (error) {
      console.error('Error updating patient:', error);
      const serverMessage = error.response?.data?.message || 'Failed to update patient details';
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Print Handler
  // ---------------------------------------------------------------------------
  const handlePrintRecord = () => {
    window.print();
  };

  // ---------------------------------------------------------------------------
  // Helper Formatters
  // ---------------------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Calculate age from date of birth
  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const birthDate = new Date(dobString);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge >= 0 ? `${computedAge} yrs` : 'N/A';
  };

  // ---------------------------------------------------------------------------
  // Loading & Error States
  // ---------------------------------------------------------------------------
  if (isLoadingPage) {
    return (
      <div className="dashboard-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>Loading comprehensive patient history...</p>
        </div>
      </div>
    );
  }

  if (pageErrorMessage || !patientData) {
    return (
      <div className="dashboard-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>Patient Record Not Found</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>{pageErrorMessage || 'The requested patient profile could not be found.'}</p>
          <button
            type="button"
            className="action-btn"
            style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: '#fff' }}
            onClick={() => navigate('/admin/patients')}
          >
            ← Back to Patient Directory
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="dashboard-page patient-history-page">
      {/* Top Navigation & Action Buttons (Hidden during printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          type="button"
          className="action-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
          onClick={() => navigate('/admin/patients')}
        >
          ← Back to Patient Directory
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px', backgroundColor: '#f8fafc' }}
            onClick={handlePrintRecord}
            title="Print complete patient record"
          >
            🖨️ Print Record
          </button>

          {canEditPatient && (
            <button
              type="button"
              className="action-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px', backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }}
              onClick={() => setIsEditModalOpen(true)}
              title="Edit patient details"
            >
              ✏️ Edit Patient
            </button>
          )}
        </div>
      </div>

      {/* Page Header Banner */}
      <PageHeader
        title={`${patientData.fullName} — Patient Medical Timeline`}
        subtitle="Complete chronological history of admissions, vital signs, transfers, and discharge requests."
        icon="👤"
      />

      {/* =====================================================================
          SECTION 1: PATIENT DEMOGRAPHICS & ACTIVE STAY BANNER
          ===================================================================== */}
      <div className="patient-demographics-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 700 }}>
              {patientData.fullName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>
                {patientData.gender} • {calculateAge(patientData.dateOfBirth)} (DOB: {formatDate(patientData.dateOfBirth)})
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: patientData.bloodGroup && patientData.bloodGroup !== 'Unknown' ? '#fee2e2' : '#f1f5f9',
                  color: patientData.bloodGroup && patientData.bloodGroup !== 'Unknown' ? '#b91c1c' : '#64748b'
                }}
              >
                🩸 Blood: {patientData.bloodGroup || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Identification Badge */}
          <div style={{ textAlign: 'right' }}>
            {patientData.isMinor ? (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '8px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  👶 Minor / Child Patient
                </span>
                <div style={{ fontSize: '12px', color: '#451a03', marginTop: '2px' }}>
                  Guardian: <strong>{patientData.guardianName || 'N/A'}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#78350f' }}>
                  Guardian NIC: <strong>{patientData.guardianNIC || 'N/A'}</strong>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 14px', borderRadius: '8px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>
                  National Identity Card (NIC)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0c4a6e', fontFamily: 'monospace', marginTop: '2px' }}>
                  {patientData.patientNIC || 'No NIC Registered'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact and Address Details Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</span>
            <strong style={{ color: '#1e293b' }}>{patientData.contactNumber || 'Not provided'}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Residential Address</span>
            <strong style={{ color: '#1e293b' }}>{patientData.address || 'Not provided'}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Total Admissions</span>
            <strong style={{ color: '#1e293b' }}>{admissionList.length} hospital stays</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>First Registered</span>
            <strong style={{ color: '#1e293b' }}>{formatDate(patientData.createdAt)}</strong>
          </div>
        </div>

        {/* Live Admission Status Banner */}
        <div style={{ marginTop: '20px' }}>
          {activeAdmission ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '8px',
                color: '#166534'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🟢</span>
                <div>
                  <strong style={{ fontSize: '14px' }}>Currently Admitted</strong>
                  <div style={{ fontSize: '13px', marginTop: '2px', color: '#14532d' }}>
                    Ward: <strong>{activeAdmission.wardName}</strong> • Bed: <strong>{activeAdmission.bedNumber || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#bbf7d0', padding: '4px 8px', borderRadius: '6px' }}>
                ACTIVE STAY
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '13px'
              }}
            >
              <span>⚪</span>
              <span><strong>Not Currently Admitted</strong> — Patient is not actively occupying a ward bed.</span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: ADMISSION STAY HISTORY & VITALS TIMELINE
          ===================================================================== */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Admission Stay History ({admissionList.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Latest stays appear first</span>
        </div>

        {admissionList.length === 0 ? (
          <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            No admission history on file for this patient.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {admissionList.map((admissionRecord, index) => {
              const isVitalsExpanded = expandedVitalsAdmissionId === admissionRecord.admissionId;
              const vitalsForThisAdmission = vitalsMap[admissionRecord.admissionId] || [];

              return (
                <div
                  key={admissionRecord.admissionId}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Top Row: Ward Name + Bed + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        Stay #{admissionList.length - index}: {admissionRecord.wardName}
                      </span>
                      {admissionRecord.wardType && (
                        <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          {admissionRecord.wardType}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Bed: <strong>{admissionRecord.bedNumber || 'Unassigned'}</strong>
                      </span>
                    </div>

                    <StatusBadge status={admissionRecord.status} />
                  </div>

                  {/* Admission & Discharge Timestamps */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px', color: '#475569', backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Admitted On</span>
                      <strong>{formatDateTime(admissionRecord.admissionDate)}</strong>
                      {admissionRecord.admittedByName && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>By: {admissionRecord.admittedByName}</div>
                      )}
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Discharged On</span>
                      {admissionRecord.dischargeDate ? (
                        <strong>{formatDateTime(admissionRecord.dischargeDate)}</strong>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Still Admitted</span>
                      )}
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Emergency Contact</span>
                      <strong>{admissionRecord.emergencyContactName || 'None'}</strong>
                      {admissionRecord.emergencyContactNumber && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {admissionRecord.emergencyContactNumber}</div>
                      )}
                    </div>
                  </div>

                  {/* Admission Notes */}
                  {admissionRecord.admissionNotes && (
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                      <strong style={{ color: '#1e293b' }}>Admission Notes:</strong> {admissionRecord.admissionNotes}
                    </div>
                  )}

                  {/* Discharge Notes */}
                  {admissionRecord.dischargeNotes && (
                    <div style={{ fontSize: '13px', color: '#0f172a', backgroundColor: '#fefce8', borderLeft: '3px solid #eab308', padding: '8px 12px', borderRadius: '0 6px 6px 0', marginBottom: '12px' }}>
                      <strong>Discharge Summary:</strong> {admissionRecord.dischargeNotes}
                    </div>
                  )}

                  {/* Expandable Vitals Button */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      className="action-btn no-print"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        backgroundColor: isVitalsExpanded ? '#e0f2fe' : '#f8fafc',
                        borderColor: isVitalsExpanded ? '#7dd3fc' : '#cbd5e1',
                        color: isVitalsExpanded ? '#0369a1' : '#475569',
                        fontWeight: 600
                      }}
                      onClick={() => toggleAdmissionVitals(admissionRecord.admissionId)}
                    >
                      <span>{isVitalsExpanded ? '▲ Hide Vitals Log' : '🩺 View Vitals Log (Lazy Loaded)'}</span>
                    </button>

                    {/* Vitals Table Section (Shown when expanded or when printing) */}
                    {(isVitalsExpanded || true) && (
                      <div className={!isVitalsExpanded ? 'print-only' : ''} style={{ marginTop: '12px' }}>
                        {isLoadingVitals && expandedVitalsAdmissionId === admissionRecord.admissionId ? (
                          <div style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                            Loading vitals records...
                          </div>
                        ) : vitalsForThisAdmission.length === 0 ? (
                          <div style={{ padding: '12px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                            No vital signs recorded during this hospital stay.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>Recorded Time</th>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>Temperature (°C)</th>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>Blood Pressure</th>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>Pulse (bpm)</th>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>Recorded By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vitalsForThisAdmission.map((vitalRow) => (
                                  <tr key={vitalRow.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 12px', color: '#334155' }}>
                                      {formatDateTime(vitalRow.recordedAt)}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                                      {vitalRow.temperature ? `${vitalRow.temperature} °C` : 'N/A'}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                                      {vitalRow.bloodPressure || 'N/A'}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                                      {vitalRow.pulse ? `${vitalRow.pulse} bpm` : 'N/A'}
                                    </td>
                                    <td style={{ padding: '8px 12px', color: '#64748b' }}>
                                      {vitalRow.recordedByName || 'Staff'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 3: WARD & HOSPITAL TRANSFER LOGS
          ===================================================================== */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔄</span> Transfer History ({internalTransfers.length + externalTransfers.length})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Internal Ward-to-Ward Transfers */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
              Internal Ward Transfers ({internalTransfers.length})
            </h4>

            {internalTransfers.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No internal transfers logged for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {internalTransfers.map((item) => (
                  <div key={item.id} style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #0284c7', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.fromWardName} (Bed {item.fromBedNumber || 'N/A'}) → {item.toWardName} (Bed {item.toBedNumber || 'N/A'})
                    </div>
                    <div style={{ color: '#64748b', marginTop: '3px' }}>
                      📅 {formatDateTime(item.transferDate)} {item.transferredByName && `• By: ${item.transferredByName}`}
                    </div>
                    {item.transferReason && (
                      <div style={{ marginTop: '4px', color: '#475569', fontStyle: 'italic' }}>
                        Reason: {item.transferReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Hospital Transfers */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
              External Hospital Transfers ({externalTransfers.length})
            </h4>

            {externalTransfers.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No external transfers logged for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {externalTransfers.map((item) => (
                  <div key={item.id} style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #f97316', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        🏥 {item.hospitalName}
                      </span>
                      {item.returnDate ? (
                        <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          RETURNED
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9a3412', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          CURRENTLY AWAY
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#64748b', marginTop: '3px' }}>
                      Transferred Out: <strong>{formatDateTime(item.transferOutDate)}</strong>
                    </div>
                    {item.returnDate && (
                      <div style={{ color: '#166534', marginTop: '2px' }}>
                        Returned: <strong>{formatDateTime(item.returnDate)}</strong>
                      </div>
                    )}
                    {item.transferReason && (
                      <div style={{ marginTop: '4px', color: '#475569', fontStyle: 'italic' }}>
                        Reason: {item.transferReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 4: CLINICAL DISCHARGE REQUEST HISTORY
          ===================================================================== */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📝</span> Clinical Discharge Requests ({clinicalRequests.length})
        </h3>

        {clinicalRequests.length === 0 ? (
          <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
            No clinical discharge requests recorded for this patient.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clinicalRequests.map((reqItem) => (
              <div
                key={reqItem.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {reqItem.requestType === 'discharge' ? 'Discharge Request' : reqItem.requestType}
                    </strong>
                    <StatusBadge status={reqItem.requestStatus} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Requested by: <strong>{reqItem.requestedByName || 'Doctor'}</strong> on {formatDateTime(reqItem.createdAt)}
                  </div>
                  {reqItem.requestNotes && (
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                      "{reqItem.requestNotes}"
                    </div>
                  )}
                </div>

                {reqItem.reviewedBy && (
                  <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', textAlign: 'right' }}>
                    <div>Reviewed by: <strong>{reqItem.reviewedByName}</strong></div>
                    <div>Date: {formatDateTime(reqItem.reviewedAt)}</div>
                    {reqItem.reviewNotes && (
                      <div style={{ fontStyle: 'italic', marginTop: '3px', color: '#64748b' }}>
                        Note: "{reqItem.reviewNotes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          EDIT PATIENT MODAL DIALOG
          ===================================================================== */}
      {isEditModalOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                ✏️ Edit Patient Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={editFormData.fullName}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              {/* Date of Birth & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    value={editFormData.dateOfBirth}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Is Minor Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="isMinorCheckbox"
                  name="isMinor"
                  checked={editFormData.isMinor}
                  onChange={handleEditInputChange}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isMinorCheckbox" style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                  This patient is a minor / child (under 18)
                </label>
              </div>

              {/* Conditional NIC or Guardian Fields */}
              {!editFormData.isMinor ? (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Patient NIC (National Identity Card) *
                  </label>
                  <input
                    type="text"
                    name="patientNIC"
                    placeholder="e.g., 199512345678 or 951234567V"
                    value={editFormData.patientNIC}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      required={editFormData.isMinor}
                      value={editFormData.guardianName}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                      Guardian NIC *
                    </label>
                    <input
                      type="text"
                      name="guardianNIC"
                      required={editFormData.isMinor}
                      value={editFormData.guardianNIC}
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {/* Blood Group & Phone Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={editFormData.bloodGroup}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="e.g., 0771234567"
                    value={editFormData.contactNumber}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Residential Address
                </label>
                <textarea
                  name="address"
                  rows="2"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="submit-button"
                  style={{ width: 'auto', marginTop: 0, padding: '8px 20px', fontSize: '13px' }}
                >
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistoryPage;
