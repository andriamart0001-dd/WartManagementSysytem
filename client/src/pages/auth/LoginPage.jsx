// =============================================================================
// LoginPage.jsx — Internal Staff Portal Authentication View
// =============================================================================
// Purpose:
//   Provides a clean, secure authentication form for hospital staff members.
//   Supports login for Admin, Ward Admin, Staff, and Doctor accounts.
//
// Rules Enforced (GEMINI.md & Requirements):
//   - STRICTLY NO patient login, patient registration, or forgot password links.
//   - Clear visual feedback for validation and backend errors.
//   - Beginner-friendly multi-step try/catch logic.
//   - Automatic routing to role-specific dashboard upon login.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARDS } from '../../constants';

const LoginPage = () => {
  // Form input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect them to their dashboard
  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      const targetDashboard = ROLE_DASHBOARDS[user.role] || '/admin';
      navigate(targetDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ===========================================================================
  // FORM VALIDATION
  // Validates email and password inputs before making an API call.
  // ===========================================================================
  const validateForm = () => {
    const errors = {};

    // Validate Email
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else {
      // Basic email syntax regex check
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate Password
    if (!password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);

    // Return true if no validation errors exist
    return Object.keys(errors).length === 0;
  };

  // ===========================================================================
  // HANDLER: Form Submit
  // ===========================================================================
  const handleSubmit = async (event) => {
    // Prevent standard browser form submission re-load
    event.preventDefault();

    // Clear existing API error
    setApiError('');

    // Step 1: Run inline client-side validation
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Step 2: Set submitting loading state
    setIsSubmitting(true);

    try {
      // Step 3: Call login function from AuthContext
      const result = await login(email.trim(), password);

      if (result.success) {
        // Step 4: Navigate to the user's role-based dashboard
        const userRole = result.user.role;
        const dashboardPath = ROLE_DASHBOARDS[userRole] || '/admin';
        navigate(dashboardPath, { replace: true });
      } else {
        // Step 5: Display error message returned by backend
        setApiError(result.message);
      }

    } catch (error) {
      console.error('Unexpected error during login execution:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      // Step 6: Reset submitting state
      setIsSubmitting(false);
    }
  };

  // ===========================================================================
  // HANDLER: Quick Fill Credentials Button Click
  // ===========================================================================
  // Fills form input fields with pre-configured test account credentials.
  // ===========================================================================
  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setFormErrors({});
    setApiError('');
  };


  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header Branding */}
        <div className="login-header">
          <div className="hospital-badge">
            <span className="hospital-icon">🏥</span>
            <span>HOSPITAL WARD SYSTEM</span>
          </div>
          <h1 className="login-title">Staff Portal Login</h1>
          <p className="login-subtitle">
            Restricted access portal for authorized hospital personnel only.
          </p>
        </div>

        {/* Global API Error Alert Banner */}
        {apiError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Input Group */}
          <div className="form-group">
            <label htmlFor="staff-email" className="form-label">
              Staff Email Address
            </label>
            <input
              id="staff-email"
              type="email"
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. nurse@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {formErrors.email && (
              <span className="field-error-text">{formErrors.email}</span>
            )}
          </div>

          {/* Password Input Group */}
          <div className="form-group">
            <label htmlFor="staff-password" className="form-label">
              Account Password
            </label>
            <input
              id="staff-password"
              type="password"
              className={`form-input ${formErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {formErrors.password && (
              <span className="field-error-text">{formErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="button-flex">
                <span className="button-spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              'Sign In to Staff Portal'
            )}
          </button>
        </form>

        {/* Quick Demo Fill Credentials Section */}
        <div className="quick-login-section">
          <div className="quick-login-divider">
            <span>QUICK DEMO FILL</span>
          </div>
          <p className="quick-login-hint">Click a role to fill login credentials:</p>

          <div className="quick-login-grid">
            <button
              type="button"
              className="quick-btn btn-admin"
              onClick={() => handleQuickLogin('admin@hospital.com', 'Admin@1234')}
              disabled={isSubmitting}
            >
              <span className="quick-role-title">👑 Admin</span>
              <span className="quick-access-desc">System Overview (/admin)</span>
            </button>

            <button
              type="button"
              className="quick-btn btn-ward-admin"
              onClick={() => handleQuickLogin('wardadmin@hospital.com', 'WardAdmin@1234')}
              disabled={isSubmitting}
            >
              <span className="quick-role-title">🛌 Ward Admin</span>
              <span className="quick-access-desc">Ward Operations (/ward-admin)</span>
            </button>

            <button
              type="button"
              className="quick-btn btn-staff"
              onClick={() => handleQuickLogin('staff@hospital.com', 'Staff@1234')}
              disabled={isSubmitting}
            >
              <span className="quick-role-title">📋 Staff Nurse</span>
              <span className="quick-access-desc">Patient Ops (/staff)</span>
            </button>

            <button
              type="button"
              className="quick-btn btn-doctor"
              onClick={() => handleQuickLogin('doctor@hospital.com', 'Doctor@1234')}
              disabled={isSubmitting}
            >
              <span className="quick-role-title">🩺 Doctor</span>
              <span className="quick-access-desc">Medical Portal (/doctor)</span>
            </button>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="login-footer">
          <p className="security-note">
            🔒 Protected by End-to-End JWT Authentication & RBAC Access Control.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

