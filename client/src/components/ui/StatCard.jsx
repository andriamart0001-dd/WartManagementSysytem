import React from 'react';

// =============================================================================
// StatCard.jsx
// =============================================================================
// Purpose:
//   A reusable KPI summary card for dashboards.
// Props:
//   - title (string): The title of the metric (e.g., "Total Beds")
//   - value (number|string): The main big number to display
//   - icon (string): Emoji or icon text for the top left
//   - type (string): Optional. 'available', 'occupied', 'maintenance', 'shortage' 
//                    This applies the left-border color accent.
//   - breakdown (array): Optional. Array of objects { label, value, type } 
//                        for smaller text below the main number.
// =============================================================================

const StatCard = ({ title, value, icon, type = 'default', breakdown = [] }) => {
  // Determine card CSS class based on the type prop
  const getCardClass = () => {
    switch (type) {
      case 'available': return 'dash-card card-available';
      case 'occupied': return 'dash-card card-occupied';
      case 'maintenance': return 'dash-card card-maintenance';
      case 'shortage': return 'dash-card card-shortage';
      default: return 'dash-card';
    }
  };

  return (
    <div className={getCardClass()}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      
      <div className="card-number">
        {value}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="card-breakdown">
          {breakdown.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <span>{item.icon}</span>
               <span style={{ fontWeight: 600 }}>{item.value}</span>
               <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatCard;
