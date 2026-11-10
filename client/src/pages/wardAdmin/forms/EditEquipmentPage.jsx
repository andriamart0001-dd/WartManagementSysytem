import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { EQUIPMENT_STATUS } from '../../../constants';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// EditEquipmentPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to update details, quantities, and status of existing equipment.
//   Route: GET /ward-admin/equipment/:id/edit
// =============================================================================

const EditEquipmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    equipmentName: '',
    quantity: 1,
    status: EQUIPMENT_STATUS.AVAILABLE,
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
          // Security check: ensure equipment belongs to Ward Admin's assigned ward
          if (user?.assignedWardId && Number(equipToEdit.wardId) !== Number(user.assignedWardId)) {
            addToast('Access denied. You can only edit equipment in your assigned ward.', 'error');
            navigate('/ward-admin/equipment');
            return;
          }

          setFormData({
            equipmentName: equipToEdit.equipmentName || equipToEdit.name || '',
            quantity: equipToEdit.quantity || equipToEdit.availableQuantity || 0,
            status: equipToEdit.status || EQUIPMENT_STATUS.AVAILABLE,
            minQuantityThreshold: equipToEdit.minQuantityThreshold || 0
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
  }, [id, user?.assignedWardId, addToast, navigate]);

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
        equipmentName: formData.equipmentName.trim(),
        quantity: parseInt(formData.quantity, 10),
        status: formData.status,
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

  const statusOptions = [
    { value: EQUIPMENT_STATUS.AVAILABLE, label: 'Available (Operational)' },
    { value: EQUIPMENT_STATUS.IN_USE, label: 'In Use (Active Patient)' },
    { value: EQUIPMENT_STATUS.MAINTENANCE, label: 'Maintenance (Under Repair / Calibration)' }
  ];

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
      subtitle={`Modify inventory levels and status for ${formData.equipmentName}`}
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
          id="equipmentName" 
          label="Equipment Name" 
          value={formData.equipmentName} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <FormField 
          id="quantity" 
          type="number" 
          label="Total Quantity in Ward" 
          value={formData.quantity} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <FormField 
          id="status" 
          type="select" 
          label="Operating Status" 
          value={formData.status} 
          onChange={handleChange} 
          options={statusOptions}
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
