// =============================================================================
// DischargePage.jsx — Doctor Patient Discharge Request Form
// =============================================================================
// Purpose:
//   Form used by doctors to request discharge for an admitted patient.
//   Submits a clinical discharge request to /api/requests so that Ward Admins
//   and Staff Nurses can complete nursing discharge steps and release the bed.
//   Route: GET /doctor/discharge/new
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';
import ConfirmModal from '../../components/ui/ConfirmModal';

const DischargePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const preselectedAdmissionId = searchParams.get('admissionId') || '';

  const [admissions, setAdmissions] = useState([]);

  // Form field values
  const [formData, setFormData] = useState({
    admissionId: preselectedAdmissionId,
    dischargeNotes: ''
  });

  // Show confirm modal before actually submitting
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch the list of admitted patients on mount
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await axiosInstance.get('/admissions');
        const admissionList = Array.isArray(res.data.admissions) 
          ? res.data.admissions 
          : (Array.isArray(res.data) ? res.data : []);
        setAdmissions(admissionList);
      } catch (err) {
        console.error('Failed to load admissions for discharge', err);
        setAdmissions([]);
      }
    };

    fetchAdmissions();
  }, []);

  // Update form fields as the user types
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // User clicks "Discharge Patient" / "Submit Discharge Request"
  const handleDischargeClick = (e) => {
    e.preventDefault();
    if (!formData.admissionId) {
      setError('Please select a patient to discharge.');
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  // User clicks "Confirm" inside the confirm modal
  const handleConfirmedDischarge = async () => {
    setIsSubmitting(true);
    try {
      // If user is a Doctor, submit a clinical discharge request to /api/requests
      if (user?.role === ROLES.DOCTOR) {
        await axiosInstance.post('/requests', {
          admissionId: Number(formData.admissionId),
          requestNotes: formData.dischargeNotes || null
        });

        setIsConfirmOpen(false);
        addToast('Discharge request submitted! Ward staff will review and complete bed release.', 'success');
        navigate('/doctor/requests');
      } else {
        // System Admin or Ward Admin can directly discharge
        await axiosInstance.post(`/admissions/${formData.admissionId}/discharge`, {
          dischargeNotes: formData.dischargeNotes || null
        });

        setIsConfirmOpen(false);
        addToast('Patient discharged successfully', 'success');
        navigate(user?.role === ROLES.ADMIN ? '/admin/admissions' : '/ward-admin');
      }
    } catch (err) {
      console.error('Discharge error:', err);
      setError(err.response?.data?.message || 'Failed to submit discharge request.');
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the name of the currently selected patient (for confirm modal message)
  const selectedPatientName = admissions.find(
    a => a.id.toString() === formData.admissionId
  )?.patientName || 'this patient';

  // Map admissions to { value, label } for the FormField select
  const patientOptions = admissions.map(a => ({
    value: a.id.toString(),
    label: `${a.patientName} — Ward: ${a.wardName}${a.bedNumber ? ` (Bed ${a.bedNumber})` : ''}`
  }));

  const isDoctorRole = user?.role === ROLES.DOCTOR;

  return (
    <>
      <FormPageLayout
        title={isDoctorRole ? 'Submit Discharge Request' : 'Discharge Patient'}
        subtitle={
          isDoctorRole
            ? 'Request patient discharge. Ward Admin or Staff Nurse will review and complete bed release.'
            : 'Process patient discharge and free their assigned bed.'
        }
        icon="🏠"
        backTo={isDoctorRole ? '/doctor' : '/ward-admin'}
        backLabel="Back to Dashboard"
      >
        <form onSubmit={handleDischargeClick}>
          {/* Error alert */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Workflow notice */}
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: isDoctorRole ? '#eff6ff' : '#fff7ed',
            borderRadius: '8px',
            border: isDoctorRole ? '1px solid #bfdbfe' : '1px solid #fdba74'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: isDoctorRole ? '#1d4ed8' : '#c2410c', fontWeight: 600 }}>
              {isDoctorRole 
                ? 'ℹ️ Submitting this form creates a pending discharge request. Ward Admin or Staff Nurse will verify medications/paperwork and release the bed.' 
                : '⚠️ This action will permanently discharge the patient and immediately free their assigned bed.'}
            </p>
          </div>

          {/* Patient Selection */}
          <FormField
            id="admissionId"
            type="select"
            label="Select Patient to Discharge"
            value={formData.admissionId}
            onChange={handleChange}
            options={patientOptions}
            required
            disabled={isSubmitting || !!preselectedAdmissionId}
          />

          {/* Discharge Clinical Notes */}
          <FormField
            id="dischargeNotes"
            type="textarea"
            label="Clinical Discharge Notes & Instructions"
            value={formData.dischargeNotes}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Condition stabilized. Prescribed amoxicillin 500mg for 5 days. Follow-up clinic in 2 weeks."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button 
              type="button" 
              className="cancelBtn no-bg" 
              onClick={() => navigate(isDoctorRole ? '/doctor' : '/ward-admin')} 
              disabled={isSubmitting} 
              style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting} 
              style={{ width: 'auto', marginTop: 0, backgroundColor: isDoctorRole ? '#2563eb' : 'var(--status-occupied)' }}
            >
              {isSubmitting 
                ? 'Processing...' 
                : (isDoctorRole ? '📋 Submit Discharge Request' : '🏠 Discharge Patient')}
            </button>
          </div>
        </form>
      </FormPageLayout>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmedDischarge}
        title={isDoctorRole ? 'Confirm Discharge Request' : 'Confirm Patient Discharge'}
        message={
          isDoctorRole
            ? `Submit discharge request for ${selectedPatientName}? Ward nursing staff will be notified to review and release the bed.`
            : `Are you sure you want to discharge ${selectedPatientName}? This will free their bed immediately.`
        }
        confirmText={isDoctorRole ? 'Yes, Submit Request' : 'Yes, Discharge'}
        isDanger={!isDoctorRole}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default DischargePage;
