// =============================================================================
// UnauthorizedPage.jsx — Access Denied View
// =============================================================================
// Rendered when an authenticated user attempts to access a page that their
// assigned role does not have permission to view.
// =============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARDS } from '../../constants';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine user's home dashboard path
  const homePath = user && user.role ? ROLE_DASHBOARDS[user.role] : '/login';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          Access Forbidden
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Your account role (<strong style={{ color: '#0284c7' }}>{user?.role || 'unknown'}</strong>) does not have permission to view this restricted page.
        </p>
        <button
          onClick={() => navigate(homePath, { replace: true })}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Return to My Authorized Dashboard
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
