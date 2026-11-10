// =============================================================================
// ProfilePage.jsx — User Account Profile & Security Settings
// =============================================================================
// Purpose:
//   Allows any logged-in hospital staff member (Admin, Ward Admin, Doctor,
//   Admission Doctor, Nurse) to view their profile details and change their password.
//
// Beginner-Friendly Standard:
//   - Clear plain-English comments for every function.
//   - Clean async/await with try/catch blocks.
//   - No magic strings; uses shared constants.
// =============================================================================

import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';

const ProfilePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Password change form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle password form input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({ ...prev, [id]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Submit password change
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation 1: Check required fields
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('Please fill out all password fields.');
      return;
    }

    // Validation 2: Check password length
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    // Validation 3: Check matching passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    // Validation 4: Don't allow old and new to be identical
    if (passwordData.currentPassword === passwordData.newPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Call backend POST /api/auth/change-password
      await axiosInstance.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccessMessage('Your password has been changed successfully!');
      addToast('Password updated successfully', 'success');

      // Clear the input fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      const serverMessage = error.response?.data?.message || 'Failed to change password. Please verify your current password.';
      setErrorMessage(serverMessage);
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format role name for display
  const formatRole = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'System Administrator';
      case ROLES.WARD_ADMIN:
        return 'Ward Administrator';
      case ROLES.ADMISSION_DOCTOR:
        return 'Admission Doctor';
      case ROLES.NURSE:
        return 'Staff Nurse';
      case ROLES.DOCTOR:
        return 'Medical Doctor';
      default:
        return role;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <PageHeader
        title="My Profile & Security"
        subtitle="Manage your staff account details and login credentials."
        icon="👤"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Card 1: Account Information */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{user?.fullName}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                System Role
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                {formatRole(user?.role)}
              </div>
            </div>

            {user?.assignedWardName && (
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Ward
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#047857', marginTop: '2px' }}>
                  🏥 {user.assignedWardName}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Account Status
              </span>
              <div style={{ marginTop: '2px' }}>
                <span style={{
                  fontSize: '12px',
                  backgroundColor: '#d1fae5',
                  color: '#047857',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  ● Active Staff Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Change Password Form */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
            🔒 Change Password
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
            Update your account password. Choose a secure password of at least 6 characters.
          </p>

          {/* Success Banner */}
          {successMessage && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#065f46',
              marginBottom: '16px'
            }}>
              ✓ {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <span>⚠️</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FormField
              id="currentPassword"
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Enter your current password"
            />

            <FormField
              id="newPassword"
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="At least 6 characters"
            />

            <FormField
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Re-enter your new password"
            />

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
