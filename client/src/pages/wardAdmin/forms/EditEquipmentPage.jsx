import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// EditEquipmentPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to update quantities of existing equipment.
//   Route: GET /ward-admin/equipment/:id/edit
// =============================================================================

const EditEquipmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    availableQuantity: 1,
    minQuantityThreshold: 1
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axiosInstance.get('/equipment');
        const equipList = Array.isArray(response.data.equipment) 
          ? response.data.equipment 
          : (Array.isArray(response.data) ? response.data : []);
          
        const equipToEdit = equipList.find(eq => eq.id.toString() === id);
        if (equipToEdit) {
          setFormData({
            name: equipToEdit.name,
            availableQuantity: equipToEdit.availableQuantity,
            minQuantityThreshold: equipToEdit.minQuantityThreshold
          });
        } else {
          setError('Equipment not found.');
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipment();
  }, [id]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        availableQuantity: parseInt(formData.availableQuantity, 10),
        minQuantityThreshold: parseInt(formData.minQuantityThreshold, 10)
      };

      await axiosInstance.put(`/equipment/${id}`, payload);
      addToast('Equipment updated successfully', 'success');
      navigate('/ward-admin/equipment');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to update equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Update Equipment" backTo="/ward-admin/equipment" backLabel="Back to Equipment">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Update Equipment"
      subtitle={`Modify inventory levels for ${formData.name}`}
      icon="✏️"
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
          disabled={true} // Cannot rename easily once registered
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default EditEquipmentPage;
