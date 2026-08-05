import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SlideDrawer from '../../components/ui/SlideDrawer';
import FormField from '../../components/ui/FormField';
import ConfirmModal from '../../components/ui/ConfirmModal';

// =============================================================================
// UserManagementPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to list, create, edit, and deactivate hospital staff users.
//   Integrates with GET /users, POST /users, PUT /users/:id, PATCH /users/:id/deactivate
// =============================================================================

const UserManagementPage = () => {
  const { addToast } = useToast();

  // Data state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer (Form) state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form input state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES.STAFF
  });
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirm Modal state (for deactivation)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Role options for select dropdown
  const roleOptions = [
    { value: ROLES.ADMIN, label: 'System Admin' },
    { value: ROLES.WARD_ADMIN, label: 'Ward Admin' },
    { value: ROLES.STAFF, label: 'Staff Nurse' },
    { value: ROLES.DOCTOR, label: 'Medical Doctor' }
  ];

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/users');
      const userList = Array.isArray(response.data.users) 
        ? response.data.users 
        : (Array.isArray(response.data) ? response.data : []);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===========================================================================
  // DRAWER & FORM HANDLING
  // ===========================================================================
  const openAddDrawer = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', password: '', role: ROLES.STAFF });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (user) => {
    setEditingUser(user);
    setFormData({ 
      fullName: user.fullName, 
      email: user.email, 
      password: '', // Password left blank when editing unless changing it
      role: user.role 
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async () => {
    // Basic validation
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }
    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users.');
      return;
    }

    setFormIsSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        // Prepare payload (exclude password if blank)
        const payload = { 
          fullName: formData.fullName, 
          email: formData.email, 
          role: formData.role 
        };
        if (formData.password) payload.password = formData.password;

        await axiosInstance.put(`/users/${editingUser.id}`, payload);
        addToast('User updated successfully', 'success');
      } else {
        await axiosInstance.post('/users', formData);
        addToast('User created successfully', 'success');
      }
      
      closeDrawer();
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      setFormError(error.response?.data?.message || 'Failed to save user.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // ===========================================================================
  // DEACTIVATION HANDLING
  // ===========================================================================
  const initiateDeactivate = (user) => {
    setUserToDeactivate(user);
    setIsConfirmOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;
    
    setIsDeactivating(true);
    try {
      await axiosInstance.patch(`/users/${userToDeactivate.id}/deactivate`);
      addToast(`${userToDeactivate.fullName} deactivated`, 'success');
      setIsConfirmOpen(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Deactivate error:', error);
      addToast('Failed to deactivate user', 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  const getRoleBadge = (role) => {
    switch(role) {
      case ROLES.ADMIN: return <span className="role-badge badge-admin">Admin</span>;
      case ROLES.WARD_ADMIN: return <span className="role-badge badge-ward-admin">Ward Admin</span>;
      case ROLES.STAFF: return <span className="role-badge badge-staff">Staff</span>;
      case ROLES.DOCTOR: return <span className="role-badge badge-doctor">Doctor</span>;
      default: return <span className="role-badge badge-default">{role}</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="User Management" 
        subtitle="Manage hospital staff accounts and roles."
        icon="👥"
        actionLabel="+ Add New User"
        onAction={openAddDrawer}
      />

      <DataTable 
        columns={['Name', 'Email', 'Role', 'Status', 'Actions']} 
        isEmpty={!isLoading && (!Array.isArray(users) || users.length === 0)}
        emptyMessage="No users found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading users...</td>
          </tr>
        ) : (
          (Array.isArray(users) ? users : []).map((u) => {
            const isActive = u.status === 'active' || u.isActive === true;
            return (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{getRoleBadge(u.role)}</td>
                <td>
                  <StatusBadge status={isActive ? 'Available' : 'Discharged'} />
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn" title="Edit User" onClick={() => openEditDrawer(u)}>✏️</button>
                    {isActive && (
                      <button className="action-btn" title="Deactivate" onClick={() => initiateDeactivate(u)}>🚫</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* Add / Edit Form Drawer */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingUser ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <button className="cancelBtn no-bg" onClick={closeDrawer} disabled={formIsSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
            <button className="submit-button" onClick={handleFormSubmit} disabled={formIsSubmitting} style={{ width: 'auto', marginTop: 0 }}>
              {formIsSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {formError}
          </div>
        )}

        <FormField 
          id="fullName" 
          label="Full Name" 
          value={formData.fullName} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
        />
        <FormField 
          id="email" 
          type="email" 
          label="Email Address" 
          value={formData.email} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
        />
        <FormField 
          id="password" 
          type="password" 
          label={editingUser ? "New Password (leave blank to keep current)" : "Password"} 
          value={formData.password} 
          onChange={handleFormChange} 
          required={!editingUser} 
          disabled={formIsSubmitting}
        />
        <FormField 
          id="role" 
          type="select" 
          label="System Role" 
          value={formData.role} 
          onChange={handleFormChange} 
          options={roleOptions}
          disabled={formIsSubmitting}
        />
      </SlideDrawer>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate User?"
        message={`Are you sure you want to deactivate ${userToDeactivate?.fullName}? They will immediately lose access to the system.`}
        confirmText="Deactivate"
        isDanger={true}
        isLoading={isDeactivating}
      />
    </div>
  );
};

export default UserManagementPage;
