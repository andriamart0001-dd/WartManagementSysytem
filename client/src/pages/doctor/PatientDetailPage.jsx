// =============================================================================
// PatientDetailPage.jsx — Attending Doctor Patient Record & Vitals View
// =============================================================================
// Purpose:
//   A comprehensive clinical view of a patient's current admission record.
//   Includes:
//     - Core patient demographics & NIC/Guardian identity
//     - Real-time vitals recording history
//     - Previous hospital stays history across admissions
//     - Direct action to submit a discharge request
// Route: /doctor/patient/:id
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const PatientDetailPage = () => {
  const { id } = useParams(); // The admission ID from the URL
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Main admission record data
  const [admission, setAdmission] = useState(null);

  // Vitals history list for this admission
  const [vitals, setVitals] = useState([]);

  // Prior visits / admissions history for this patient
  const [priorAdmissions, setPriorAdmissions] = useState([]);

  // Loading states
  const [isLoadingAdmission, setIsLoadingAdmission] = useState(true);
  const [isLoadingVitals, setIsLoadingVitals] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch the main admission record by ID
  const fetchAdmission = async () => {
    setIsLoadingAdmission(true);
    try {
      const res = await axiosInstance.get(`/admissions/${id}`);
      const fetchedAdmission = res.data.admission || res.data;
      setAdmission(fetchedAdmission);
      
      if (!fetchedAdmission) {
        addToast('Patient record not found', 'error');
        return;
      }

      // If patient has a permanent patientId, load their prior visits
      if (fetchedAdmission.patientId) {
        fetchPriorAdmissions(fetchedAdmission.patientId);
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

  // Fetch past visits for this patient
  const fetchPriorAdmissions = async (patientId) => {
    setIsLoadingHistory(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/history`);
      const allAdmissions = Array.isArray(res.data.admissions) ? res.data.admissions : [];
      // Filter out the current active admission
      const pastStays = allAdmissions.filter(a => Number(a.admissionId) !== Number(id));
      setPriorAdmissions(pastStays);
    } catch (error) {
      console.error('Error loading patient prior visits:', error);
    } finally {
      setIsLoadingHistory(false);
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

  if (isLoadingAdmission) {
    return (
      <div className="dashboard-page">
        <p style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading patient clinical record...</p>
      </div>
    );
  }

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
        actionLabel={admission.status === 'admitted' ? '📋 Request Discharge' : null}
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

      {/* Patient Demographics & Admission Info Card */}
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
        <InfoField 
          label="NIC / Identity" 
          value={
            admission.isMinor 
              ? `Minor (Guardian: ${admission.guardianName || 'N/A'} - ${admission.guardianNIC || 'N/A'})` 
              : (admission.patientNIC || 'N/A')
          } 
        />
        <InfoField 
          label="Date of Birth" 
          value={admission.dateOfBirth ? new Date(admission.dateOfBirth).toLocaleDateString() : 'N/A'} 
        />
        <InfoField label="Blood Group" value={admission.bloodGroup || 'Unknown'} />
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
          🩸 Vitals Monitoring History ({vitals.length} records)
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

      <div style={{ marginBottom: '32px' }}>
        <DataTable
          columns={['Recorded At', 'Blood Pressure', 'Temperature (°C)', 'Pulse (bpm)', 'Recorded By']}
          isEmpty={!isLoadingVitals && vitals.length === 0}
          emptyMessage="No vitals recorded yet for this stay."
        >
          {isLoadingVitals ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading vitals...</td>
            </tr>
          ) : (
            vitals.map((v) => {
              const highTemp = v.temperature && v.temperature >= 38.0;
              const highPulse = v.pulse && (v.pulse < 50 || v.pulse > 100);

              return (
                <tr key={v.id}>
                  <td>{formatDate(v.recordedAt)}</td>
                  <td style={{ fontWeight: 600 }}>{v.bloodPressure || '—'}</td>
                  <td style={{ color: highTemp ? '#dc2626' : 'inherit', fontWeight: highTemp ? 700 : 'normal' }}>
                    {v.temperature != null ? `${v.temperature}°C` : '—'}
                    {highTemp && ' ⚠️'}
                  </td>
                  <td style={{ color: highPulse ? '#dc2626' : 'inherit', fontWeight: highPulse ? 700 : 'normal' }}>
                    {v.pulse != null ? `${v.pulse} bpm` : '—'}
                    {highPulse && ' ⚠️'}
                  </td>
                  <td>{v.recordedByName}</td>
                </tr>
              );
            })
          )}
        </DataTable>
      </div>

      {/* Previous Hospital Stays History */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
          📜 Prior Hospital Stays History ({priorAdmissions.length})
        </h3>

        {isLoadingHistory ? (
          <p style={{ color: '#64748b' }}>Loading previous visits...</p>
        ) : priorAdmissions.length === 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            color: '#64748b',
            fontSize: '13px'
          }}>
            No prior hospital stays found for this patient. This is their first recorded visit.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {priorAdmissions.map((adm) => (
              <div 
                key={adm.admissionId} 
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    🏥 {adm.wardName} {adm.bedNumber ? `• Bed ${adm.bedNumber}` : ''}
                  </span>
                  <StatusBadge status={adm.status} />
                </div>

                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>📅 <strong>Admitted:</strong> {new Date(adm.admissionDate).toLocaleDateString()}</div>
                  {adm.dischargeDate && (
                    <div>🏁 <strong>Discharged:</strong> {new Date(adm.dischargeDate).toLocaleDateString()}</div>
                  )}
                  {adm.dischargeNotes && (
                    <div style={{ 
                      marginTop: '6px', 
                      padding: '6px 8px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: '#334155'
                    }}>
                      "{adm.dischargeNotes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: InfoField
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
