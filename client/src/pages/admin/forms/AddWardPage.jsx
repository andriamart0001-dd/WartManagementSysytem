import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// AddWardPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to create a new hospital ward.
//   Route: GET /admin/wards/new
// =============================================================================

const AddWardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'General',
    departmentId: '',
    minBedThreshold: 5
  });
  
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const wardTypeOptions = [
    { value: 'General', label: 'General' },
    { value: 'ICU', label: 'ICU' },
    { value: 'Maternity', label: 'Maternity' },
    { value: 'Pediatric', label: 'Pediatric' },
    { value: 'Surgical', label: 'Surgical' },
    { value: 'Emergency', label: 'Emergency' }
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get('/departments');
        const deptList = Array.isArray(response.data.departments) 
          ? response.data.departments 
          : (Array.isArray(response.data) ? response.data : []);
        setDepartments(deptList);
        
        if (deptList.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: deptList[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const departmentOptions = departments.map((d) => ({
    value: d.id.toString(),
    label: d.departmentName || d.name
  }));

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId) {
      setError('Ward Name and Department are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { 
        name: formData.name, 
        type: formData.type, 
        departmentId: parseInt(formData.departmentId, 10),
        minBedThreshold: parseInt(formData.minBedThreshold, 10)
      };

      await axiosInstance.post('/wards', payload);
      addToast('Ward created successfully', 'success');
      navigate('/admin/wards');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to create ward.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Add New Ward" backTo="/admin/wards" backLabel="Back to Wards">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Add New Ward"
      subtitle="Register a new ward and set capacity thresholds."
      icon="🏥"
      backTo="/admin/wards"
      backLabel="Back to Wards"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="name" 
          label="Ward Name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
        <FormField 
          id="type" 
          type="select" 
          label="Ward Type" 
          value={formData.type} 
          onChange={handleChange} 
          options={wardTypeOptions}
          disabled={isSubmitting}
        />
        <FormField 
          id="departmentId" 
          type="select" 
          label="Department" 
          value={formData.departmentId} 
          onChange={handleChange} 
          options={departmentOptions}
          disabled={isSubmitting}
        />
        <FormField 
          id="minBedThreshold" 
          type="number" 
          label="Minimum Bed Threshold (Triggers Shortage Alert)" 
          value={formData.minBedThreshold} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/admin/wards')} 
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
            {isSubmitting ? 'Saving...' : 'Save Ward'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default AddWardPage;
