import React, { createContext, useContext, useState, useCallback } from 'react';

// =============================================================================
// ToastContext.jsx
// =============================================================================
// Purpose:
//   Global context for displaying slide-in Toast notifications (success/error).
//   Strictly adheres to beginner-friendly principles by keeping state simple.
// =============================================================================

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // ===========================================================================
  // ADD TOAST
  // ===========================================================================
  // Types: 'success', 'error', 'warning'
  // Success/warning auto-dismiss after 3s. Error stays until dismissed.
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove success/warning toasts after 3.5 seconds
    if (type !== 'error') {
      setTimeout(() => {
        removeToast(id);
      }, 3500);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* 
        Render the Toast Container 
        Placed top-right via inline styles (could also move to index.css)
      */}
      <div style={toastStyles.container}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{...toastStyles.toast, ...toastStyles[toast.type]}}>
            <span style={toastStyles.icon}>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
            </span>
            <span style={toastStyles.message}>{toast.message}</span>
            {toast.type === 'error' && (
              <button 
                onClick={() => removeToast(toast.id)} 
                style={toastStyles.closeBtn}
                aria-label="Close notification"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// =============================================================================
// INLINE STYLES FOR TOASTS
// =============================================================================
const toastStyles = {
  container: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    animation: 'slideInRight 0.3s ease-out',
    maxWidth: '400px',
    minWidth: '280px',
  },
  success: {
    backgroundColor: '#ffffff',
    borderLeft: '4px solid #10b981',
    color: '#0f172a'
  },
  error: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    border: '1px solid #fca5a5',
    color: '#991b1b'
  },
  warning: {
    backgroundColor: '#ffffff',
    borderLeft: '4px solid #f59e0b',
    color: '#0f172a'
  },
  icon: {
    fontSize: '18px'
  },
  message: {
    fontSize: '14px',
    fontWeight: 500,
    flex: 1
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.6,
    fontSize: '14px',
    padding: '4px'
  }
};
