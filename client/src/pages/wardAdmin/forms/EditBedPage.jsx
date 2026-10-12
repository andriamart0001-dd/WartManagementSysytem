import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';
import { BED_STATUS } from '../../../constants';

// =============================================================================
// EditBedPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to edit an existing bed (change its number, ward, or status).
//   Route: GET /ward-admin/beds/:id/edit
// =============================================================================

const EditBedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [wards, setWards] = useState([]);
  const [formData, setFormData] = useState({
    wardId: '',
    bedNumber: '',
    bedStatus: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wardsRes, bedsRes] = await Promise.all([
          axiosInstance.get('/wards'),
          axiosInstance.get('/beds')
        ]);

        const wardList = Array.isArray(wardsRes.data.wards) 
          ? wardsRes.data.wards 
          : (Array.isArray(wardsRes.data) ? wardsRes.data : []);
        setWards(wardList);

        // Find the bed we're editing
        const bedList = Array.isArray(bedsRes.data.beds) 
          ? bedsRes.data.beds 
          : (Array.isArray(bedsRes.data) ? bedsRes.data : []);
        
        const targetBed = bedList.find(b => b.id.toString() === id);
        
        if (!targetBed) {
          addToast('Bed not found', 'error');
          navigate('/ward-admin/beds');
          return;
        }

        setFormData({
          wardId: targetBed.wardId?.toString() || '',
          bedNumber: targetBed.bedNumber || '',
          bedStatus: targetBed.status || targetBed.bedStatus || BED_STATUS.AVAILABLE
        });

      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load bed details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, addToast, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.wardId || !formData.bedNumber || !formData.bedStatus) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        wardId: parseInt(formData.wardId, 10),
        bedNumber: formData.bedNumber,
        bedStatus: formData.bedStatus
      };

      await axiosInstance.put(`/beds/${id}`, payload);
      addToast('Bed updated successfully', 'success');
      navigate('/ward-admin/beds');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }));
  
  const statusOptions = [
    { value: BED_STATUS.AVAILABLE, label: 'Available' },
    { value: BED_STATUS.OCCUPIED, label: 'Occupied' },
    { value: BED_STATUS.MAINTENANCE, label: 'Maintenance' }
  ];

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <FormPageLayout
      title="Edit Bed"
      subtitle={`Update details for bed #${formData.bedNumber}`}
      icon="✏️"
      backTo="/ward-admin/beds"
      backLabel="Back to Bed Management"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="wardId" 
          type="select" 
          label="Assign to Ward" 
          value={formData.wardId} 
          onChange={handleChange} 
          options={wardOptions} 
          required 
          disabled={isSubmitting} 
        />
        
        <FormField 
          id="bedNumber" 
          type="text" 
          label="Bed Number / Identifier" 
          value={formData.bedNumber} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting} 
          placeholder="e.g., A-101, ICU-12"
        />

        <FormField 
          id="bedStatus" 
          type="select" 
          label="Bed Status" 
          value={formData.bedStatus} 
          onChange={handleChange} 
          options={statusOptions} 
          required 
          disabled={isSubmitting} 
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/ward-admin/beds')} 
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default EditBedPage;
