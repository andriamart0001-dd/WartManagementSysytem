import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// =============================================================================
// QRScannerModal.jsx
// =============================================================================
// Purpose:
//   A modal component that activates the device camera to scan QR codes.
//   Returns the decoded text to the parent component.
// =============================================================================

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Clear previous error
      setError('');
      
      // Initialize the scanner
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const handleSuccess = (decodedText, decodedResult) => {
        // Stop scanning after success
        scanner.clear();
        onScanSuccess(decodedText);
      };

      const handleError = (err) => {
        // We can optionally ignore typical frame errors to prevent console spam
        // console.warn(err);
      };

      scanner.render(handleSuccess, handleError);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>Scan QR Code</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <div style={styles.scannerContainer}>
          <div id="qr-reader" style={{ width: '100%' }}></div>
        </div>
        
        <p style={styles.helperText}>
          Point your camera at a patient or bed QR code to quickly look up their details.
        </p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b'
  },
  scannerContainer: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  helperText: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  }
};

export default QRScannerModal;
