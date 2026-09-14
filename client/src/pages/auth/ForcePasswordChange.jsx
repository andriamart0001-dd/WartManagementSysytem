import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

// =============================================================================
// ForcePasswordChange.jsx
// =============================================================================
// Purpose:
//   Forces users to change their temporary password upon first login.
// =============================================================================

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { logout, checkAuth } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the temporary password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      addToast('Password updated successfully! Welcome to the system.', 'success');
      
      // Remove temporary storage block and re-check auth to go to normal dashboard
      sessionStorage.removeItem('force_password_change');
      await checkAuth(); // Re-fetch the user to get updated data without the flag
      
      // Wait a moment then redirect to root, the App logic will route correctly
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('force_password_change');
    logout();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2>Update Required</h2>
          <p>For your security, you must change your temporary password before accessing the system.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Temporary Password</label>
            <input
              type="password"
              style={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>New Permanent Password</label>
            <input
              type="password"
              style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password & Continue'}
          </button>
        </form>
        
        <button type="button" onClick={handleLogout} style={styles.logoutBtn} disabled={isSubmitting}>
          Cancel & Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9'
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '32px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginBottom: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '15px'
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#64748b',
    padding: '12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    marginTop: '12px',
    textDecoration: 'underline'
  }
};

export default ForcePasswordChange;
