import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';

// =============================================================================
// FormPageLayout.jsx
// =============================================================================
// Purpose:
//   Standardized layout for full-page forms. Replaces SlideDrawer.
//   Provides a back button, a PageHeader, and a centered card for form fields.
// Props:
//   - title (string): Header title of the form page.
//   - subtitle (string): Header subtitle.
//   - icon (string): Icon for the header.
//   - backTo (string): The route to navigate back to (e.g. '/admin/users').
//   - backLabel (string): Text for the back button (e.g. 'Back to Users').
//   - children (node): Form content inside the centered card.
// =============================================================================

const FormPageLayout = ({ title, subtitle, icon, backTo, backLabel, children }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      {/* Back Button */}
      <button
        onClick={() => navigate(backTo)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        ← {backLabel || 'Back'}
      </button>

      {/* Standard Page Header */}
      <PageHeader 
        title={title} 
        subtitle={subtitle}
        icon={icon}
      />

      {/* Centered Form Card */}
      <div style={{
        maxWidth: '700px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {children}
      </div>
    </div>
  );
};

export default FormPageLayout;
