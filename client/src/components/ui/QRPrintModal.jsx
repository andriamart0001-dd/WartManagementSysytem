import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';

// =============================================================================
// QRPrintModal.jsx
// =============================================================================
// Purpose:
//   Popup that generates and displays a QR code for a patient admission record.
//   Provides a 'Print' button which triggers the browser print dialog.
// Props:
//   - isOpen (boolean): Controls visibility.
//   - onClose (function): Handler to close the modal.
//   - admissionId (string/number): The primary ID of the admission.
//   - patientName (string): Full name of the patient.
//   - wardName (string): Name of the assigned ward.
//   - bedNumber (string): The assigned bed identifier.
//   - admissionDate (string): Formatted admission date.
// =============================================================================

const QRPrintModal = ({
  isOpen,
  onClose,
  admissionId,
  patientName,
  wardName,
  bedNumber,
  admissionDate
}) => {
  const [qrSrc, setQrSrc] = useState('');
  
  // We wrap the printable content in a ref to potentially use a specialized print package,
  // but for simplicity per requirements, we'll use window.print() + CSS media queries.
  const printRef = useRef(null);

  // Generate QR code data URL whenever the modal opens or data changes
  useEffect(() => {
    if (isOpen && admissionId) {
      // The payload structure defined in backend requirements
      const payload = JSON.stringify({
        admissionId,
        patientName,
        wardName,
        bedNumber
      });

      QRCode.toDataURL(payload, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a', // Dark slate
          light: '#ffffff' // White bg
        }
      })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, admissionId, patientName, wardName, bedNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.overlay} onClick={onClose} className="no-print">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div style={styles.header} className="no-print">
          <h2 style={styles.title}>Patient QR Code</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Printable Area Container */}
        <div ref={printRef} style={styles.printArea} className="print-area-container">
          <div style={styles.qrCard}>
            
            {qrSrc ? (
              <img src={qrSrc} alt={`QR Code for ${patientName}`} style={styles.qrImage} />
            ) : (
              <div style={styles.qrPlaceholder}>Generating...</div>
            )}
            
            <div style={styles.details}>
              <h3 style={styles.patientName}>{patientName}</h3>
              <p style={styles.dataRow}>
                <span style={styles.label}>Admission ID:</span> 
                <span className="mono-data">{admissionId}</span>
              </p>
              <p style={styles.dataRow}>
                <span style={styles.label}>Location:</span> 
                <span>{wardName} — Bed {bedNumber}</span>
              </p>
              <p style={styles.dataRow}>
                <span style={styles.label}>Admitted:</span> 
                <span>{admissionDate}</span>
              </p>
            </div>

          </div>
        </div>

        <div style={styles.footer} className="no-print">
          <button style={styles.cancelBtn} onClick={onClose}>Close</button>
          <button style={styles.primaryBtn} onClick={handlePrint}>🖨️ Print Label</button>
        </div>

      </div>
    </div>
  );
};

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
    maxWidth: '420px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer'
  },
  printArea: {
    padding: '32px 24px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  qrCard: {
    backgroundColor: '#ffffff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '300px'
  },
  qrImage: {
    width: '200px',
    height: '200px',
    marginBottom: '16px'
  },
  qrPlaceholder: {
    width: '200px',
    height: '200px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '8px'
  },
  details: {
    textAlign: 'center'
  },
  patientName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 12px 0'
  },
  dataRow: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    color: '#334155',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px'
  },
  label: {
    fontWeight: 600,
    color: '#64748b'
  },
  footer: {
    backgroundColor: '#ffffff',
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
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};

export default QRPrintModal;
