import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';

// =============================================================================
// UserManagementPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to list and deactivate hospital staff users.
//   Integrates with GET /users, PATCH /users/:id/deactivate
// =============================================================================

const UserManagementPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirm Modal state (for deactivation)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Reset Password Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

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
  // RESET PASSWORD HANDLING
  // ===========================================================================
  const initiateReset = (user) => {
    setUserToReset(user);
    setTempPassword('');
    setResetError('');
    setIsResetModalOpen(true);
  };

  const handleResetConfirm = async () => {
    if (!tempPassword || tempPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    setIsResetting(true);
    setResetError('');
    try {
      await axiosInstance.patch(`/users/${userToReset.id}/reset-password`, {
        temporaryPassword: tempPassword
      });
      addToast(`Password for ${userToReset.fullName} has been reset.`, 'success');
      setIsResetModalOpen(false);
      setUserToReset(null);
    } catch (error) {
      setResetError(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
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
        onAction={() => navigate('/admin/users/new')}
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
                      <button className="action-btn" title="Edit User" onClick={() => navigate(`/admin/users/${u.id}/edit`)}>✏️</button>
                      {isActive && (
                        <>
                          <button className="action-btn" title="Reset Password" onClick={() => initiateReset(u)}>🔑</button>
                          <button className="action-btn" title="Deactivate" onClick={() => initiateDeactivate(u)}>🚫</button>
                        </>
                      )}
                    </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

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

      {/* Reset Password Confirmation Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '8px' }}>Reset Password</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter a new temporary password for <strong>{userToReset?.fullName}</strong>. They will be forced to change it on their next login.
            </p>
            
            {resetError && (
              <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '14px', padding: '10px' }}>
                ⚠️ {resetError}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Enter temporary password (min 6 chars)"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              disabled={isResetting}
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginBottom: '20px', 
                borderRadius: '6px', 
                border: '1px solid var(--border-color)',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setIsResetModalOpen(false)} 
                disabled={isResetting}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleResetConfirm} 
                disabled={isResetting}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: 'var(--primary)', color: 'white' }}
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;

