import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import SlideDrawer from '../../../components/ui/SlideDrawer';
import FormField from '../../../components/ui/FormField';

// =============================================================================
// HospitalTransferForm.jsx
// =============================================================================
// Purpose:
//   Form component to transfer a patient to an external hospital.
// Props:
//   - isOpen (boolean): Drawer visibility
//   - onClose (function): Close handler
//   - onSuccess (function): Called when transfer completes
//   - preselectedAdmissionId (string): Optional
// =============================================================================

const HospitalTransferForm = ({ isOpen, onClose, onSuccess, preselectedAdmissionId = '' }) => {
  const [admissions, setAdmissions] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  
  const [formData, setFormData] = useState({
    admissionId: '',
    toHospitalId: '',
    reason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch admissions and hospitals on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [admRes, hospRes] = await Promise.all([
          axiosInstance.get('/admissions'),
          axiosInstance.get('/transfers/hospitals')
        ]);
        const admList = Array.isArray(admRes.data.admissions) 
          ? admRes.data.admissions 
          : (Array.isArray(admRes.data) ? admRes.data : []);
        const hospList = Array.isArray(hospRes.data.hospitals) 
          ? hospRes.data.hospitals 
          : (Array.isArray(hospRes.data) ? hospRes.data : []);

        setAdmissions(admList);
        setHospitals(hospList);
      } catch (err) {
        console.error('Failed to load initial data', err);
        setAdmissions([]);
        setHospitals([]);
      }
    };
    if (isOpen) {
      fetchInitialData();
      setFormData(prev => ({ ...prev, admissionId: preselectedAdmissionId ? preselectedAdmissionId.toString() : '' }));
    }
  }, [isOpen, preselectedAdmissionId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.admissionId || !formData.toHospitalId || !formData.reason) {
      setError('Please select a patient, destination hospital, and provide a reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        admissionId: parseInt(formData.admissionId, 10),
        toHospitalId: parseInt(formData.toHospitalId, 10),
        reason: formData.reason
      };

      await axiosInstance.post('/transfers/external', payload);
      onSuccess(); 
      
      // Reset form
      setFormData({ admissionId: '', toHospitalId: '', reason: '' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to transfer patient externally');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientOptions = (Array.isArray(admissions) ? admissions : []).map(a => ({ 
    value: a.id.toString(), 
    label: `${a.patientName} (Current: ${a.wardName}${a.bedNumber ? ` - Bed ${a.bedNumber}` : ''})` 
  }));
  const hospitalOptions = (Array.isArray(hospitals) ? hospitals : []).map(h => ({ value: h.id.toString(), label: h.hospitalName || h.name }));

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="External Hospital Transfer"
      footer={
        <>
          <button className="cancelBtn no-bg" onClick={onClose} disabled={isSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
          <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting} style={{ width: 'auto', marginTop: 0 }}>
            {isSubmitting ? 'Transferring...' : 'Execute External Transfer'}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fdba74' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#c2410c', fontWeight: 600 }}>
          Notice: This will free up the patient's current bed.
        </p>
      </div>

      <FormField 
        id="admissionId" 
        type="select" 
        label="Select Patient" 
        value={formData.admissionId} 
        onChange={handleChange} 
        options={patientOptions} 
        required 
        disabled={isSubmitting || !!preselectedAdmissionId} 
      />

      <FormField 
        id="toHospitalId" 
        type="select" 
        label="Destination Hospital" 
        value={formData.toHospitalId} 
        onChange={handleChange} 
        options={hospitalOptions} 
        required 
        disabled={isSubmitting} 
      />
      
      <FormField 
        id="reason" 
        type="textarea" 
        label="Transfer Reason & Medical Notes" 
        value={formData.reason} 
        onChange={handleChange} 
        required 
        disabled={isSubmitting} 
      />
    </SlideDrawer>
  );
};

export default HospitalTransferForm;
