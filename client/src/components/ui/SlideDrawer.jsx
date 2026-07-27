import React, { useEffect } from 'react';

// =============================================================================
// SlideDrawer.jsx
// =============================================================================
// Purpose:
//   A slide-in drawer panel from the right side, typically used for forms.
// Props:
//   - isOpen (boolean): Whether the drawer is visible.
//   - onClose (function): Function to call when clicking the overlay or close button.
//   - title (string): Header title of the drawer.
//   - children (node): Form content inside the drawer.
//   - footer (node): Buttons at the bottom (e.g. Save / Cancel).
// =============================================================================

const SlideDrawer = ({ isOpen, onClose, title, children, footer }) => {
  
  // Close drawer when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // If not open, do not render anything
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.drawer} 
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside drawer from closing it
      >
        <div style={styles.header}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </div>
        
        <div style={styles.content}>
          {children}
        </div>

        {footer && (
          <div style={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Inline styles for the drawer (keeps index.css clean from one-off structural positioning)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'fadeInScale 0.2s ease-out'
  },
  drawer: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-10px 0 25px rgba(0, 0, 0, 0.1)',
    animation: 'slideInRight 0.2s ease-out'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer'
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  }
};

export default SlideDrawer;
