import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import SlideDrawer from '../../../components/ui/SlideDrawer';
import FormField from '../../../components/ui/FormField';

// =============================================================================
// LogVitalsForm.jsx
// =============================================================================
// Purpose:
//   Form component to log patient vitals (temperature, BP, pulse).
// Props:
//   - isOpen (boolean): Drawer visibility
//   - onClose (function): Close handler
//   - onSuccess (function): Called when vitals are logged
//   - preselectedAdmissionId (string): Optional
// =============================================================================

const LogVitalsForm = ({ isOpen, onClose, onSuccess, preselectedAdmissionId = '' }) => {
  const [admissions, setAdmissions] = useState([]);
  
  const [formData, setFormData] = useState({
    admissionId: '',
    temperature: '',
    bloodPressure: '',
    pulse: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch admissions on mount
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await axiosInstance.get('/admissions');
        setAdmissions(res.data.admissions || res.data);
      } catch (err) {
        console.error('Failed to load admissions', err);
      }
    };
    if (isOpen) {
      fetchAdmissions();
      setFormData(prev => ({ 
        ...prev, 
        admissionId: preselectedAdmissionId ? preselectedAdmissionId.toString() : '' 
      }));
    }
  }, [isOpen, preselectedAdmissionId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.admissionId) {
      setError('Please select a patient.');
      return;
    }

    if (!formData.temperature && !formData.bloodPressure && !formData.pulse) {
      setError('Please provide at least one vital sign measurement.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        bloodPressure: formData.bloodPressure || null,
        pulse: formData.pulse ? parseInt(formData.pulse, 10) : null
      };

      await axiosInstance.post(`/admissions/${formData.admissionId}/vitals`, payload);
      onSuccess(); 
      
      // Reset form
      setFormData({ admissionId: '', temperature: '', bloodPressure: '', pulse: '' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to log vitals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientOptions = admissions.map(a => ({ 
    value: a.id.toString(), 
    label: `${a.patientName} (Ward: ${a.wardName})` 
  }));

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Log Patient Vitals"
      footer={
        <>
          <button className="cancelBtn no-bg" onClick={onClose} disabled={isSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
          <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting} style={{ width: 'auto', marginTop: 0 }}>
            {isSubmitting ? 'Logging...' : 'Save Vitals'}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

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

      <h4 style={{ margin: '24px 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Measurements</h4>
      
      <FormField 
        id="bloodPressure" 
        label="Blood Pressure (e.g. 120/80)" 
        value={formData.bloodPressure} 
        onChange={handleChange} 
        disabled={isSubmitting} 
      />
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <FormField 
            id="temperature" 
            type="number" 
            label="Temperature (°C)" 
            value={formData.temperature} 
            onChange={handleChange} 
            disabled={isSubmitting} 
          />
        </div>
        <div style={{ flex: 1 }}>
          <FormField 
            id="pulse" 
            type="number" 
            label="Pulse (bpm)" 
            value={formData.pulse} 
            onChange={handleChange} 
            disabled={isSubmitting} 
          />
        </div>
      </div>
      
    </SlideDrawer>
  );
};

export default LogVitalsForm;
