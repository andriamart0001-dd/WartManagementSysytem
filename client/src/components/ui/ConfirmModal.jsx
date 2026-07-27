import React from 'react';

// =============================================================================
// ConfirmModal.jsx
// =============================================================================
// Purpose:
//   A generic confirmation modal for destructive or critical actions (e.g., delete, discharge).
// Props:
//   - isOpen (boolean): Controls visibility.
//   - onClose (function): Handler for the cancel button and overlay click.
//   - onConfirm (function): Handler for the primary confirmation button.
//   - title (string): Modal title.
//   - message (string): Modal description body text.
//   - confirmText (string): Text for the confirm button (default: "Confirm").
//   - isDanger (boolean): If true, styles the confirm button red (default: false).
//   - isLoading (boolean): Disables buttons while processing.
// =============================================================================

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  isDanger = false,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div style={styles.header}>
          <div style={styles.iconContainer(isDanger)}>
            {isDanger ? '⚠️' : '❓'}
          </div>
          <h2 style={styles.title}>{title}</h2>
        </div>
        
        <div style={styles.body}>
          <p>{message}</p>
        </div>

        <div style={styles.footer}>
          <button 
            style={styles.cancelBtn} 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button 
            style={isDanger ? styles.dangerBtn : styles.primaryBtn} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

// Inline styles specific to the modal (avoids cluttering global css)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeInScale 0.2s ease-out'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  header: {
    padding: '24px 24px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  iconContainer: (isDanger) => ({
    fontSize: '32px',
    marginBottom: '16px',
    backgroundColor: isDanger ? '#fef2f2' : '#f0f4f8',
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  }),
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  body: {
    padding: '16px 24px 24px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    lineHeight: 1.5
  },
  footer: {
    backgroundColor: '#f8fafc',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #e2e8f0'
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    color: '#475569',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px'
  },
  primaryBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--primary)',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px'
  },
  dangerBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--status-occupied)',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default ConfirmModal;
