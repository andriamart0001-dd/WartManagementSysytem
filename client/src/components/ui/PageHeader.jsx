import React from 'react';

// =============================================================================
// PageHeader.jsx
// =============================================================================
// Purpose:
//   A standardized header for all dashboard and feature pages.
//   Provides a consistent title, subtitle, and optional primary action button.
// Props:
//   - title (string): The main page title.
//   - subtitle (string): A short description below the title.
//   - icon (string): Optional emoji or icon for the title.
//   - actionLabel (string): Optional text for a primary action button on the right.
//   - onAction (function): Optional click handler for the action button.
// =============================================================================

const PageHeader = ({ title, subtitle, icon, actionLabel, onAction }) => {
  return (
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">
          {icon && <span style={{ marginRight: '10px' }}>{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
      </div>
      
      {actionLabel && onAction && (
        <div>
          <button 
            className="submit-button" 
            style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
