import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

// =============================================================================
// PatientDetailPage.jsx
// =============================================================================
// Purpose:
//   A full read-only view of a specific patient's admission record.
//   Includes their vitals history table and transfer history.
// Route: /doctor/patient/:id
// =============================================================================

const PatientDetailPage = () => {
  const { id } = useParams(); // The admission ID from the URL
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Main admission record data
  const [admission, setAdmission] = useState(null);

  // Vitals history list for this patient
  const [vitals, setVitals] = useState([]);

  // Loading states for the two API calls
  const [isLoadingAdmission, setIsLoadingAdmission] = useState(true);
  const [isLoadingVitals, setIsLoadingVitals] = useState(true);

  // Fetch the main admission record by ID
  const fetchAdmission = async () => {
    setIsLoadingAdmission(true);
    try {
      const res = await axiosInstance.get(`/admissions/${id}`);
      const fetchedAdmission = res.data.admission || res.data;
      setAdmission(fetchedAdmission);
      
      // If admission doesn't exist, this handles the error gracefully
      if (!fetchedAdmission) {
        addToast('Patient record not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching admission record:', error);
      addToast('Failed to load patient record', 'error');
    } finally {
      setIsLoadingAdmission(false);
    }
  };

  // Fetch vitals history for this admission
  const fetchVitals = async () => {
    setIsLoadingVitals(true);
    try {
      const res = await axiosInstance.get(`/admissions/${id}/vitals`);
      const vitalsList = Array.isArray(res.data.vitals) 
        ? res.data.vitals 
        : (Array.isArray(res.data) ? res.data : []);
      setVitals(vitalsList);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      addToast('Failed to load vitals history', 'error');
      setVitals([]);
    } finally {
      setIsLoadingVitals(false);
    }
  };

  // Load data when the component mounts
  useEffect(() => {
    fetchAdmission();
    fetchVitals();
    // eslint-disable-next-line
  }, [id]);

  // Helper to format a date string into readable form
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // If still loading admission, show a loading state
  if (isLoadingAdmission) {
    return (
      <div className="dashboard-page">
        <p style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading patient record...</p>
      </div>
    );
  }

  // If the record wasn't found, show an error state
  if (!admission) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'var(--status-occupied)', padding: '40px', textAlign: 'center' }}>
          Patient record not found.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title={admission.patientName}
        subtitle={`Admission #${admission.id} — ${admission.wardName}${admission.bedNumber ? `, Bed ${admission.bedNumber}` : ''}`}
        icon="🩺"
        actionLabel={admission.status === 'admitted' ? '🏠 Discharge Patient' : null}
        onAction={() => navigate(`/doctor/discharge/new?admissionId=${id}`)}
      />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        ← Back to Patient List
      </button>

      {/* Patient Info Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <InfoField label="Full Name" value={admission.patientName} />
        <InfoField label="Age" value={`${admission.age} years`} />
        <InfoField label="Gender" value={admission.gender} />
        <InfoField label="Contact" value={admission.contactNumber || 'N/A'} />
        <InfoField label="Ward" value={admission.wardName} />
        <InfoField label="Bed" value={admission.bedNumber ? `Bed ${admission.bedNumber}` : 'Not assigned'} />
        <InfoField label="Admitted On" value={formatDate(admission.admissionDate)} />
        <InfoField label="Admitted By" value={admission.admittedByName || 'N/A'} />
        <InfoField label="Status" value={<StatusBadge status={admission.status} />} />
        {admission.dischargeDate && (
          <InfoField label="Discharged On" value={formatDate(admission.dischargeDate)} />
        )}
        {admission.dischargeNotes && (
          <InfoField label="Discharge Notes" value={admission.dischargeNotes} />
        )}
      </div>

      {/* Vitals History Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          🩸 Vitals History
        </h3>
        {admission.status === 'admitted' && (
          <button
            className="action-btn"
            style={{ padding: '8px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
            onClick={() => navigate(`/staff/vitals/new?admissionId=${id}`)}
          >
            + Log Vitals
          </button>
        )}
      </div>
      <DataTable
        columns={['Recorded At', 'Blood Pressure', 'Temperature (°C)', 'Pulse (bpm)', 'Recorded By']}
        isEmpty={!isLoadingVitals && vitals.length === 0}
        emptyMessage="No vitals recorded yet."
      >
        {isLoadingVitals ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading vitals...</td>
          </tr>
        ) : (
          (Array.isArray(vitals) ? vitals : []).map((v) => (
            <tr key={v.id}>
              <td>{formatDate(v.recordedAt)}</td>
              <td>{v.bloodPressure || '—'}</td>
              <td>{v.temperature != null ? `${v.temperature}°C` : '—'}</td>
              <td>{v.pulse != null ? `${v.pulse} bpm` : '—'}</td>
              <td>{v.recordedByName}</td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
};

// ===========================================================================
// Helper: InfoField
// ===========================================================================
// Purpose: Small display component for the patient info card key-value fields.
const InfoField = ({ label, value }) => (
  <div>
    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </p>
    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
      {value || '—'}
    </p>
  </div>
);

export default PatientDetailPage;
