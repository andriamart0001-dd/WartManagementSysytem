import React from 'react';

// =============================================================================
// AlertBanner.jsx
// =============================================================================
// Purpose:
//   Displays a warning banner for system shortages (beds or equipment).
//   Used on dashboards to quickly alert admins.
//
// Props:
//   - message (string): The warning text to display.
//   - type (string): 'warning' (yellow) or 'error' (red). Default is 'warning'.
// =============================================================================

const AlertBanner = ({ message, type = 'warning' }) => {
  if (!message) return null;

  const isError = type === 'error';
  
  const bannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: isError ? '#fef2f2' : '#fffbeb',
    border: `1px solid ${isError ? '#fecaca' : '#fef08a'}`,
    borderRadius: '8px',
    color: isError ? '#991b1b' : '#92400e',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '16px'
  };

  const iconStyle = {
    fontSize: '18px'
  };

  return (
    <div style={bannerStyle}>
      <span style={iconStyle}>{isError ? '🚨' : '⚠️'}</span>
      <span>{message}</span>
    </div>
  );
};

export default AlertBanner;
