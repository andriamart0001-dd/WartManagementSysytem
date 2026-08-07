import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import { ROLES } from '../../../constants';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// EditUserPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to edit an existing hospital staff user.
//   Route: GET /admin/users/:id/edit
// =============================================================================

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES.STAFF
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'System Admin' },
    { value: ROLES.WARD_ADMIN, label: 'Ward Admin' },
    { value: ROLES.STAFF, label: 'Staff Nurse' },
    { value: ROLES.DOCTOR, label: 'Medical Doctor' }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/users');
        const userList = Array.isArray(response.data.users) 
          ? response.data.users 
          : (Array.isArray(response.data) ? response.data : []);
        
        const userToEdit = userList.find(u => u.id.toString() === id);
        
        if (userToEdit) {
          setFormData({
            fullName: userToEdit.fullName,
            email: userToEdit.email,
            password: '', // Blank by default, only update if typed
            role: userToEdit.role
          });
        } else {
          setError('User not found.');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { 
        fullName: formData.fullName, 
        email: formData.email, 
        role: formData.role 
      };
      if (formData.password) payload.password = formData.password;

      await axiosInstance.put(`/users/${id}`, payload);
      addToast('User updated successfully', 'success');
      navigate('/admin/users');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Edit User" backTo="/admin/users" backLabel="Back to Users">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading user data...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Edit User"
      subtitle={`Editing details for ${formData.fullName}`}
      icon="✏️"
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
          label="New Password (leave blank to keep current)" 
          value={formData.password} 
          onChange={handleChange} 
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default EditUserPage;
