import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';

// =============================================================================
// InternalTransferPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to transfer a patient internally between wards/beds.
//   Route: GET /transfers/internal/new
// =============================================================================

const InternalTransferPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const preselectedAdmissionId = searchParams.get('admissionId') || '';

  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  
  const [formData, setFormData] = useState({
    admissionId: preselectedAdmissionId,
    toWardId: '',
    toBedId: '',
    reason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch admissions and wards on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [admRes, wardsRes] = await Promise.all([
          axiosInstance.get('/admissions'),
          axiosInstance.get('/wards')
        ]);
        const admList = Array.isArray(admRes.data.admissions) 
          ? admRes.data.admissions 
          : (Array.isArray(admRes.data) ? admRes.data : []);
        const wardList = Array.isArray(wardsRes.data.wards) 
          ? wardsRes.data.wards 
          : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

        setAdmissions(admList);
        setWards(wardList);
      } catch (err) {
        console.error('Failed to load initial data', err);
        setAdmissions([]);
        setWards([]);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch beds when target ward changes
  useEffect(() => {
    const fetchBeds = async () => {
      if (!formData.toWardId) {
        setBeds([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/beds?wardId=${formData.toWardId}`);
        const rawBeds = Array.isArray(res.data.beds) 
          ? res.data.beds 
          : (Array.isArray(res.data) ? res.data : []);
        const availableBeds = rawBeds.filter(b => b.bedStatus === 'available' || b.status === 'available');
        setBeds(availableBeds);
        
        if (availableBeds.length > 0) {
          setFormData(prev => ({ ...prev, toBedId: availableBeds[0].id.toString() }));
        } else {
          setFormData(prev => ({ ...prev, toBedId: '' }));
        }
      } catch (err) {
        console.error('Failed to load beds', err);
        setBeds([]);
      }
    };
    if (formData.toWardId) fetchBeds();
  }, [formData.toWardId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.admissionId || !formData.toWardId || !formData.reason) {
      setError('Please select a patient, target ward, and provide a reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        admissionId: parseInt(formData.admissionId, 10),
        toWardId: parseInt(formData.toWardId, 10),
        toBedId: formData.toBedId ? parseInt(formData.toBedId, 10) : null,
        reason: formData.reason
      };

      await axiosInstance.post('/transfers/internal', payload);
      addToast('Internal transfer complete', 'success');
      navigate('/staff');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to transfer patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientOptions = admissions.map(a => ({ 
    value: a.id.toString(), 
    label: `${a.patientName} (Current: ${a.wardName}${a.bedNumber ? ` - Bed ${a.bedNumber}` : ''})` 
  }));
  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }));
  const bedOptions = beds.map(b => ({ value: b.id.toString(), label: `Bed ${b.bedNumber}` }));

  return (
    <FormPageLayout
      title="Internal Ward Transfer"
      subtitle="Transfer an admitted patient to a different ward or bed."
      icon="🔄"
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

        <h4 style={{ margin: '24px 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Target Location</h4>
        <FormField 
          id="toWardId" 
          type="select" 
          label="Target Ward" 
          value={formData.toWardId} 
          onChange={handleChange} 
          options={wardOptions} 
          required 
          disabled={isSubmitting} 
        />
        
        {formData.toWardId && (
          <FormField 
            id="toBedId" 
            type="select" 
            label="Target Bed (Optional)" 
            value={formData.toBedId} 
            onChange={handleChange} 
            options={bedOptions} 
            disabled={isSubmitting} 
          />
        )}
        {formData.toWardId && beds.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--status-occupied)', marginTop: '-10px' }}>No available beds in this ward.</p>
        )}

        <FormField 
          id="reason" 
          type="textarea" 
          label="Transfer Reason" 
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
            {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default InternalTransferPage;
