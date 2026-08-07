import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// AddBedPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to add a new bed to a ward.
//   Route: GET /ward-admin/beds/new
// =============================================================================

const AddBedPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ bedNumber: '', wardId: '' });
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await axiosInstance.get('/wards');
        const wardList = Array.isArray(response.data.wards) 
          ? response.data.wards 
          : (Array.isArray(response.data) ? response.data : []);
        setWards(wardList);
        
        if (wardList.length > 0) {
          setFormData(prev => ({ ...prev, wardId: wardList[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error fetching wards:', err);
        setError('Failed to load wards');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWards();
  }, []);

  const wardOptions = wards.map(w => ({ 
    value: w.id.toString(), 
    label: w.wardName || w.name 
  }));

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bedNumber.trim() || !formData.wardId) {
      setError('Bed Number and Ward are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { 
        bedNumber: formData.bedNumber, 
        wardId: parseInt(formData.wardId, 10) 
      };
      await axiosInstance.post('/beds', payload);
      addToast('Bed created successfully', 'success');
      navigate('/ward-admin/beds');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to create bed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Add New Bed" backTo="/ward-admin/beds" backLabel="Back to Beds">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Add New Bed"
      subtitle="Register a new bed in a specific ward."
      icon="🛏️"
      backTo="/ward-admin/beds"
      backLabel="Back to Beds"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="bedNumber" 
          label="Bed Number / Identifier (e.g. A-12)" 
          value={formData.bedNumber} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
        <FormField 
          id="wardId" 
          type="select" 
          label="Assigned Ward" 
          value={formData.wardId} 
          onChange={handleChange} 
          options={wardOptions}
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
            {isSubmitting ? 'Saving...' : 'Save Bed'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default AddBedPage;
