import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';

// =============================================================================
// ExternalTransferPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to transfer a patient to an external hospital.
//   Route: GET /transfers/external/new
// =============================================================================

const ExternalTransferPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const preselectedAdmissionId = searchParams.get('admissionId') || '';

  const [admissions, setAdmissions] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  
  const [formData, setFormData] = useState({
    admissionId: preselectedAdmissionId,
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
    
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      addToast('Patient transferred to external hospital', 'success');
      navigate('/staff');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to transfer patient externally');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientOptions = admissions.map(a => ({ 
    value: a.id.toString(), 
    label: `${a.patientName} (Current: ${a.wardName}${a.bedNumber ? ` - Bed ${a.bedNumber}` : ''})` 
  }));
  const hospitalOptions = hospitals.map(h => ({ value: h.id.toString(), label: h.hospitalName || h.name }));

  return (
    <FormPageLayout
      title="External Hospital Transfer"
      subtitle="Transfer an admitted patient to an external facility."
      icon="🚑"
      backTo="/staff"
      backLabel="Back to Dashboard"
    >
      <form onSubmit={handleSubmit}>
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
            {isSubmitting ? 'Transferring...' : 'Execute External Transfer'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default ExternalTransferPage;
