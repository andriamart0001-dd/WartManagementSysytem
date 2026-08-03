import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import SlideDrawer from '../../../components/ui/SlideDrawer';
import FormField from '../../../components/ui/FormField';
import ConfirmModal from '../../../components/ui/ConfirmModal';

// =============================================================================
// DischargePatientForm.jsx
// =============================================================================
// Purpose:
//   Form used by doctors to discharge a patient.
//   Shows a ConfirmModal before actually submitting to prevent accidents.
// Props:
//   - isOpen (boolean): Drawer visibility
//   - onClose (function): Close handler
//   - onSuccess (function): Called when discharge succeeds
//   - preselectedAdmissionId (string/number): Optional - the patient to pre-select
// =============================================================================

const DischargePatientForm = ({ isOpen, onClose, onSuccess, preselectedAdmissionId = '' }) => {
  const [admissions, setAdmissions] = useState([]);

  // Form field values
  const [formData, setFormData] = useState({
    admissionId: '',
    dischargeNotes: ''
  });

  // Show confirm modal before actually submitting
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch the list of admitted patients when the drawer opens
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

    if (isOpen) {
      fetchAdmissions();
      // Pre-select the patient if provided from outside
      setFormData(prev => ({
        ...prev,
        admissionId: preselectedAdmissionId ? preselectedAdmissionId.toString() : ''
      }));
    }
  }, [isOpen, preselectedAdmissionId]);

  // Update form fields as the user types
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // User clicks "Discharge Patient" — show confirm modal first
  const handleDischargeClick = () => {
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

      // Reset form state
      setFormData({ admissionId: '', dischargeNotes: '' });
      setIsConfirmOpen(false);
      onSuccess(); // Notify parent to refresh data and show success toast
    } catch (err) {
      console.error('Discharge error:', err);
      setError(err.response?.data?.message || 'Failed to discharge patient.');
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the name of the currently selected patient (for confirm modal message)
  const admissionsList = Array.isArray(admissions) ? admissions : [];
  const selectedPatientName = admissionsList.find(
    a => a.id.toString() === formData.admissionId
  )?.patientName || 'this patient';

  // Map admissions to { value, label } for the FormField select
  const patientOptions = admissionsList.map(a => ({
    value: a.id.toString(),
    label: `${a.patientName} — Ward: ${a.wardName}${a.bedNumber ? ` (Bed ${a.bedNumber})` : ''}`
  }));

  return (
    <>
      <SlideDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Discharge Patient"
        footer={
          <>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: 'transparent'
              }}
            >
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleDischargeClick}
              disabled={isSubmitting}
              style={{ width: 'auto', marginTop: 0, backgroundColor: 'var(--status-occupied)' }}
            >
              {isSubmitting ? 'Processing...' : '🏠 Discharge Patient'}
            </button>
          </>
        }
      >
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
      </SlideDrawer>

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

export default DischargePatientForm;
