import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// AddEquipmentPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to register new equipment to a ward.
//   Route: GET /ward-admin/equipment/new
// =============================================================================

const AddEquipmentPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    wardId: '',
    availableQuantity: 1,
    minQuantityThreshold: 1
  });
  
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
    if (!formData.name.trim() || !formData.wardId) {
      setError('Equipment Name and Ward are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { 
        name: formData.name, 
        wardId: parseInt(formData.wardId, 10),
        availableQuantity: parseInt(formData.availableQuantity, 10),
        minQuantityThreshold: parseInt(formData.minQuantityThreshold, 10)
      };

      await axiosInstance.post('/equipment', payload);
      addToast('Equipment created successfully', 'success');
      navigate('/ward-admin/equipment');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to register equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Register Equipment" backTo="/ward-admin/equipment" backLabel="Back to Equipment">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Register Equipment"
      subtitle="Add new medical equipment to a ward's inventory."
      icon="🪛"
      backTo="/ward-admin/equipment"
      backLabel="Back to Equipment"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="name" 
          label="Equipment Name" 
          value={formData.name} 
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
        <FormField 
          id="availableQuantity" 
          type="number" 
          label="Available Quantity" 
          value={formData.availableQuantity} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
        <FormField 
          id="minQuantityThreshold" 
          type="number" 
          label="Minimum Safe Threshold (Triggers Alert)" 
          value={formData.minQuantityThreshold} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/ward-admin/equipment')} 
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
            {isSubmitting ? 'Saving...' : 'Register Equipment'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default AddEquipmentPage;
