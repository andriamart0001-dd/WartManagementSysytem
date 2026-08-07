import React, { useState } from 'react';
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
    role: ROLES.STAFF
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'System Admin' },
    { value: ROLES.WARD_ADMIN, label: 'Ward Admin' },
    { value: ROLES.STAFF, label: 'Staff Nurse' },
    { value: ROLES.DOCTOR, label: 'Medical Doctor' }
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError('Name, Email, and Password are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/users', formData);
      addToast('User created successfully', 'success');
      navigate('/admin/users');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          type="password" 
          label="Password" 
          value={formData.password} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
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
