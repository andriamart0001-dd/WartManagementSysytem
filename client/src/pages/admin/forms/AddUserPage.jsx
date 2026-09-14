import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import { ROLES } from '../../../constants';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// AddUserPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to create a new hospital staff user.
//   Route: GET /admin/users/new
// =============================================================================

const AddUserPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES.NURSE,
    assignedWardId: ''
  });
  
  const [wards, setWards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'System Admin' },
    { value: ROLES.WARD_ADMIN, label: 'Ward Administrator' },
    { value: ROLES.ADMISSION_DOCTOR, label: 'Admission Doctor' },
    { value: ROLES.NURSE, label: 'Nurse' },
    { value: ROLES.DOCTOR, label: 'Doctor' }
  ];

  // Fetch wards for the assignment dropdown
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await axiosInstance.get('/wards');
        const list = Array.isArray(response.data.wards) ? response.data.wards : [];
        setWards(list.map(w => ({ value: w.id, label: w.wardName })));
      } catch (err) {
        console.error('Failed to fetch wards', err);
      }
    };
    fetchWards();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError('Name, Email, and Temporary Password are required.');
      return;
    }

    if ((formData.role === ROLES.NURSE || formData.role === ROLES.WARD_ADMIN) && !formData.assignedWardId) {
      setError(`Assigning a Ward is mandatory for the ${formData.role} role.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/users', formData);
      addToast('User created successfully. They will be forced to change their password on first login.', 'success');
      navigate('/admin/users');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresWardAssignment = formData.role === ROLES.NURSE || formData.role === ROLES.WARD_ADMIN;

  return (
    <FormPageLayout
      title="Add New User"
      subtitle="Create a new hospital staff account."
      icon="👤"
      backTo="/admin/users"
      backLabel="Back to Users"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="fullName" 
          label="Full Name" 
          value={formData.fullName} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
        <FormField 
          id="email" 
          type="email" 
          label="Email Address" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
        <FormField 
          id="password" 
          type="text" 
          label="Temporary Password" 
          value={formData.password} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
          placeholder="e.g. TempPass123! (User must change this on first login)"
        />
        <FormField 
          id="role" 
          type="select" 
          label="System Role" 
          value={formData.role} 
          onChange={handleChange} 
          options={roleOptions}
          disabled={isSubmitting}
        />

        {requiresWardAssignment && (
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>
              <strong>Note:</strong> The {formData.role} role must be strictly assigned to a specific ward.
            </p>
            <FormField 
              id="assignedWardId" 
              type="select" 
              label="Assign to Ward" 
              value={formData.assignedWardId} 
              onChange={handleChange} 
              options={[{ value: '', label: 'Select a Ward...' }, ...wards]}
              disabled={isSubmitting}
              required
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/admin/users')} 
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
            {isSubmitting ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default AddUserPage;
