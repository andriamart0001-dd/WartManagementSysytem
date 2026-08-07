import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';

// =============================================================================
// LogVitalsPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to log patient vitals (temperature, BP, pulse).
//   Route: GET /vitals/new
// =============================================================================

const LogVitalsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const preselectedAdmissionId = searchParams.get('admissionId') || '';

  const [admissions, setAdmissions] = useState([]);
  
  const [formData, setFormData] = useState({
    admissionId: preselectedAdmissionId,
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
        const list = Array.isArray(res.data.admissions) 
          ? res.data.admissions 
          : (Array.isArray(res.data) ? res.data : []);
        setAdmissions(list);
      } catch (err) {
        console.error('Failed to load admissions', err);
        setAdmissions([]);
      }
    };
    
    fetchAdmissions();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      addToast('Vitals logged successfully', 'success');
      navigate('/staff');
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
    <FormPageLayout
      title="Log Patient Vitals"
      subtitle="Record temperature, blood pressure, and pulse for an admitted patient."
      icon="🩸"
      backTo="/staff"
      backLabel="Back to Dashboard"
    >
      <form onSubmit={handleSubmit}>
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/staff')} 
            disabled={isSubmitting} 
            style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting} 
            style={{ width: 'auto', marginTop: 0 }}
          >
            {isSubmitting ? 'Logging...' : 'Save Vitals'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default LogVitalsPage;
