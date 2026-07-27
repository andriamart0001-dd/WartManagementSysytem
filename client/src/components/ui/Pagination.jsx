import React from 'react';

// =============================================================================
// Pagination.jsx
// =============================================================================
// Purpose:
//   A simple pagination control bar used below DataTables.
// Props:
//   - currentPage (number): The currently active page (1-indexed).
//   - totalPages (number): Total number of pages available.
//   - onPageChange (function): Handler called with the new page number when a button is clicked.
// =============================================================================

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Hide pagination if there is 1 or fewer pages
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div style={styles.container}>
      <span style={styles.pageInfo}>
        Page <strong style={{color: '#0f172a'}}>{currentPage}</strong> of <strong style={{color: '#0f172a'}}>{totalPages}</strong>
      </span>
      
      <div style={styles.buttonGroup}>
        <button 
          style={{ ...styles.button, ...(currentPage <= 1 ? styles.disabledBtn : {}) }} 
          onClick={handlePrev} 
          disabled={currentPage <= 1}
        >
          ← Previous
        </button>
        <button 
          style={{ ...styles.button, ...(currentPage >= totalPages ? styles.disabledBtn : {}) }} 
          onClick={handleNext} 
          disabled={currentPage >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  pageInfo: {
    fontSize: '13px',
    color: '#64748b'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f8fafc'
  }
};

export default Pagination;
