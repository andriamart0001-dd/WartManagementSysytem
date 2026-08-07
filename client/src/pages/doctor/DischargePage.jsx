import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';
import ConfirmModal from '../../components/ui/ConfirmModal';

// =============================================================================
// DischargePage.jsx
// =============================================================================
// Purpose:
//   Form used by doctors to discharge a patient.
//   Shows a ConfirmModal before actually submitting to prevent accidents.
//   Route: GET /doctor/discharge/new
// =============================================================================

const DischargePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // User clicks "Discharge Patient" — show confirm modal first
  const handleDischargeClick = (e) => {
    e.preventDefault();
    if (!formData.admissionId) {
      setError('Please select a patient to discharge.');
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  // User clicks "Confirm" inside the confirm modal — do the actual API call
  const handleConfirmedDischarge = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/admissions/${formData.admissionId}/discharge`, {
        dischargeNotes: formData.dischargeNotes || null
      });

      setIsConfirmOpen(false);
      addToast('Patient discharged successfully', 'success');
      navigate('/doctor');
    } catch (err) {
      console.error('Discharge error:', err);
      setError(err.response?.data?.message || 'Failed to discharge patient.');
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

  return (
    <>
      <FormPageLayout
        title="Discharge Patient"
        subtitle="Process a patient for discharge and free their assigned bed."
        icon="🏠"
        backTo="/doctor"
        backLabel="Back to Dashboard"
      >
        <form onSubmit={handleDischargeClick}>
          {/* Error alert */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Warning notice */}
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#fff7ed',
            borderRadius: '8px',
            border: '1px solid #fdba74'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#c2410c', fontWeight: 600 }}>
              ⚠️ This action will permanently discharge the patient and free their assigned bed.
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

          {/* Discharge Notes */}
          <FormField
            id="dischargeNotes"
            type="textarea"
            label="Discharge Notes (Optional)"
            value={formData.dischargeNotes}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Patient recovered fully. Prescribed medication for follow-up."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button 
              type="button" 
              className="cancelBtn no-bg" 
              onClick={() => navigate('/doctor')} 
              disabled={isSubmitting} 
              style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting} 
              style={{ width: 'auto', marginTop: 0, backgroundColor: 'var(--status-occupied)' }}
            >
              {isSubmitting ? 'Processing...' : '🏠 Discharge Patient'}
            </button>
          </div>
        </form>
      </FormPageLayout>

      {/* Confirm Modal — requires explicit click to proceed */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmedDischarge}
        title="Confirm Patient Discharge"
        message={`Are you sure you want to discharge ${selectedPatientName}? This will free their bed and cannot be undone.`}
        confirmText="Yes, Discharge"
        isDanger={true}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default DischargePage;
