import React from 'react';
import { Link } from 'react-router-dom';

// =============================================================================
// StatCard.jsx
// =============================================================================
// Purpose:
//   A reusable KPI summary card for dashboards.
//   Presents key hospital metrics (users, beds, patients, alerts) in a clean,
//   color-coded card with optional drill-down navigation.
//
// Props:
//   - title (string): The title/label of the metric (e.g., "Total Beds")
//   - value (number|string): The main metric value to display prominently
//   - icon (string): Emoji or icon text (e.g. "👥", "🏥", "🛏️")
//   - type (string): Visual color style. Options:
//                    'available' (green), 'occupied' (blue),
//                    'maintenance' (amber), 'shortage' (red), 'default' (blue)
//   - description (string): Short descriptive subtitle at the bottom
//   - breakdown (array): Optional array of sub-metrics [{ icon, label, value }]
//   - to (string): Optional route link. If supplied, the card becomes a clickable Link.
//   - onClick (function): Optional click event handler.
// =============================================================================

const StatCard = ({
  title,
  value,
  icon,
  type = 'default',
  description = '',
  breakdown = [],
  to = null,
  onClick = null
}) => {
  // Check if this card represents an active alert requiring staff attention
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const hasActiveAlert = (type === 'shortage' || type === 'maintenance') && (!isNaN(numericValue) && numericValue > 0);

  // Build the CSS class string based on the card properties
  const getCardClasses = () => {
    const classes = ['dash-card'];

    // Apply color accent based on type
    if (type === 'available') classes.push('card-available');
    else if (type === 'occupied') classes.push('card-occupied');
    else if (type === 'maintenance') classes.push('card-maintenance');
    else if (type === 'shortage') classes.push('card-shortage');

    // Highlight card if there is an active shortage or maintenance alert
    if (hasActiveAlert) {
      classes.push('has-alert');
    }

    // Add clickable class for hover cursor and subtle lift effect
    if (to || onClick) {
      classes.push('is-clickable');
    }

    return classes.join(' ');
  };

  // The inner content rendered inside the card
  const cardContent = (
    <>
      {/* Top Header: Title on left, styled icon on right */}
      <div className="card-header">
        <h3>{title}</h3>
        <span className="card-icon">{icon}</span>
      </div>

      {/* Main KPI metric number */}
      <div className="card-number">
        {value}
      </div>

      {/* Optional breakdown items */}
      {Array.isArray(breakdown) && breakdown.length > 0 && (
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

      {/* Bottom Footer: Subtitle description and navigation arrow */}
      {(description || to || onClick) && (
        <div className="card-footer">
          <div className="card-description-sub">
            {hasActiveAlert && <span style={{ marginRight: '4px' }}>⚠️</span>}
            {description}
          </div>
          {(to || onClick) && (
            <span className="card-link-arrow" title="View details">→</span>
          )}
        </div>
      )}
    </>
  );

  // If a destination URL is passed, wrap cleanly in React Router Link
  if (to) {
    return (
      <Link to={to} className={getCardClasses()}>
        {cardContent}
      </Link>
    );
  }

  // If a custom click handler is passed, make the div clickable
  if (onClick) {
    return (
      <div className={getCardClasses()} onClick={onClick} role="button" tabIndex={0}>
        {cardContent}
      </div>
    );
  }

  // Otherwise, render as a regular card container
  return (
    <div className={getCardClasses()}>
      {cardContent}
    </div>
  );
};

export default StatCard;
