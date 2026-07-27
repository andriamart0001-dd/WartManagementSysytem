import React from 'react';

// =============================================================================
// StatusBadge.jsx
// =============================================================================
// Purpose:
//   Displays a color-coded status pill with a dot. 
//   Follows strict accessibility rule: NEVER color-only. Always includes text.
// Props:
//   - status (string): The status text (e.g., 'Available', 'Occupied', 'Maintenance')
// =============================================================================

const StatusBadge = ({ status }) => {
  // Helper to map a raw status string to its CSS class
  const getStatusClass = (statusStr) => {
    if (!statusStr) return 'status-badge';
    
    // Normalize string for matching
    const normalized = statusStr.toLowerCase().trim();
    
    switch (normalized) {
      case 'available':
      case 'active':
        return 'status-badge status-available';
      case 'occupied':
      case 'in use':
      case 'in-use':
        return 'status-badge status-occupied';
      case 'maintenance':
      case 'warning':
        return 'status-badge status-maintenance';
      case 'admitted':
        return 'status-badge status-admitted';
      case 'discharged':
        return 'status-badge status-discharged';
      case 'transferred':
      case 'transferred out':
        return 'status-badge status-transferred';
      case 'shortage':
      case 'alert':
        return 'status-badge status-shortage';
      default:
        // Default grey badge for unknown statuses
        return 'status-badge status-discharged';
    }
  };

  return (
    <span className={getStatusClass(status)}>
      {status}
    </span>
  );
};

export default StatusBadge;
