import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';

// =============================================================================
// ReturnPatientPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to return a patient from an external hospital transfer.
//   Route: GET /transfers/external/return
// =============================================================================

const ReturnPatientPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [transfers, setTransfers] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  
  const [formData, setFormData] = useState({
    transferId: '',
    toWardId: '',
    toBedId: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch pending transfers and wards on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [transfersRes, wardsRes] = await Promise.all([
          axiosInstance.get('/transfers/external?pending=true'),
          axiosInstance.get('/wards')
        ]);
        
        const transfersList = Array.isArray(transfersRes.data.transfers) 
          ? transfersRes.data.transfers 
          : (Array.isArray(transfersRes.data) ? transfersRes.data : []);
          
        const wardList = Array.isArray(wardsRes.data.wards) 
          ? wardsRes.data.wards 
          : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

        setTransfers(transfersList.filter(t => !t.returnDate)); // ensure pending
        setWards(wardList);
      } catch (err) {
        console.error('Failed to load initial data', err);
        setTransfers([]);
        setWards([]);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch beds when ward changes
  useEffect(() => {
    const fetchBeds = async () => {
      if (!formData.toWardId) {
        setBeds([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/beds?wardId=${formData.toWardId}`);
        const bedList = Array.isArray(res.data.beds) ? res.data.beds : (Array.isArray(res.data) ? res.data : []);
        // Only allow available beds
        setBeds(bedList.filter(b => b.status === 'available'));
      } catch (error) {
        console.error('Error fetching beds', error);
        setBeds([]);
      }
    };
    fetchBeds();
  }, [formData.toWardId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [id]: value,
      // reset bed when ward changes
      ...(id === 'toWardId' ? { toBedId: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transferId || !formData.toWardId || !formData.toBedId) {
      setError('Please select a pending transfer, ward, and available bed.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        toWardId: parseInt(formData.toWardId, 10),
        toBedId: parseInt(formData.toBedId, 10)
      };

      await axiosInstance.post(`/transfers/external/${formData.transferId}/return`, payload);
      addToast('Patient successfully returned to hospital', 'success');
      navigate('/staff');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to return patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferOptions = transfers.map(t => ({ 
    value: t.id.toString(), 
    label: `${t.patientName} (At: ${t.hospitalName || 'External Hospital'})` 
  }));
  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }));
  const bedOptions = beds.map(b => ({ value: b.id.toString(), label: `Bed ${b.bedNumber}` }));

  return (
    <FormPageLayout
      title="Return Patient"
      subtitle="Mark an externally transferred patient as returned and assign them a bed."
      icon="🔙"
      backTo="/staff"
      backLabel="Back to Dashboard"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {transfers.length === 0 && !error && (
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            There are currently no patients pending return from an external hospital.
          </div>
        )}

        <FormField 
          id="transferId" 
          type="select" 
          label="Select Patient to Return" 
          value={formData.transferId} 
          onChange={handleChange} 
          options={transferOptions} 
          required 
          disabled={isSubmitting || transfers.length === 0} 
        />

        <FormField 
          id="toWardId" 
          type="select" 
          label="Return to Ward" 
          value={formData.toWardId} 
          onChange={handleChange} 
          options={wardOptions} 
          required 
          disabled={isSubmitting || !formData.transferId} 
        />
        
        <FormField 
          id="toBedId" 
          type="select" 
          label="Assign Available Bed" 
          value={formData.toBedId} 
          onChange={handleChange} 
          options={bedOptions} 
          required 
          disabled={isSubmitting || !formData.toWardId || beds.length === 0} 
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
            disabled={isSubmitting || transfers.length === 0} 
            style={{ width: 'auto', marginTop: 0 }}
          >
            {isSubmitting ? 'Returning...' : 'Return Patient'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default ReturnPatientPage;
