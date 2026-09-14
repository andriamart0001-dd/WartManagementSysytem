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
    role: ROLES.NURSE,
    assignedWardId: ''
  });
  
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'System Admin' },
    { value: ROLES.WARD_ADMIN, label: 'Ward Administrator' },
    { value: ROLES.ADMISSION_DOCTOR, label: 'Admission Doctor' },
    { value: ROLES.NURSE, label: 'Nurse' },
    { value: ROLES.DOCTOR, label: 'Doctor' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, wardsRes] = await Promise.all([
          axiosInstance.get('/users'),
          axiosInstance.get('/wards')
        ]);
        
        const userList = Array.isArray(usersRes.data.users) 
          ? usersRes.data.users 
          : (Array.isArray(usersRes.data) ? usersRes.data : []);
          
        const wardList = Array.isArray(wardsRes.data.wards) ? wardsRes.data.wards : [];
        setWards(wardList.map(w => ({ value: w.id, label: w.wardName })));
        
        const userToEdit = userList.find(u => u.id.toString() === id);
        
        if (userToEdit) {
          setFormData({
            fullName: userToEdit.fullName,
            email: userToEdit.email,
            password: '', // Blank by default, only update if typed
            role: userToEdit.role,
            assignedWardId: userToEdit.assignedWardId || ''
          });
        } else {
          setError('User not found.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

    if ((formData.role === ROLES.NURSE || formData.role === ROLES.WARD_ADMIN) && !formData.assignedWardId) {
      setError(`Assigning a Ward is mandatory for the ${formData.role} role.`);
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
      
      if (formData.role === ROLES.NURSE || formData.role === ROLES.WARD_ADMIN) {
        payload.assignedWardId = formData.assignedWardId;
      } else {
        payload.assignedWardId = null; // Clear if role changed to one that doesn't need it
      }

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
  
  const requiresWardAssignment = formData.role === ROLES.NURSE || formData.role === ROLES.WARD_ADMIN;

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
          type="text" 
          label="Reset Temporary Password (leave blank to keep current)" 
          value={formData.password} 
          onChange={handleChange} 
          disabled={isSubmitting}
          placeholder="If filled, user will be forced to change this on next login"
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default EditUserPage;
