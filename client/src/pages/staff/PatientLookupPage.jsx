// =============================================================================
// PatientLookupPage.jsx — Staff QR Scanner & Patient Lookup
// =============================================================================
// Purpose:
//   Allows staff to find patient admission records quickly.
//   Supports 3 search modes:
//   1. Search by Admission ID
//   2. Search by Patient Name (partial match)
//   3. Paste/Scan QR Code JSON data
//
// Route: /staff/lookup
// =============================================================================

import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import QRPrintModal from '../../components/ui/QRPrintModal';

// Drawer Forms for quick actions (Temporarily commented out as user created full route pages)
// import LogVitalsForm from './forms/LogVitalsForm';
// import WardTransferForm from './forms/WardTransferForm';

const PatientLookupPage = () => {
  const { addToast } = useToast();

  // Search input states
  const [searchMode, setSearchMode] = useState('ID'); // 'ID', 'NAME', or 'QR'
  const [searchValue, setSearchValue] = useState('');
  
  // Results and loading states
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal / Drawer visibility states
  const [activeForm, setActiveForm] = useState(null); // 'VITALS' or 'TRANSFER_WARD'
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
  const [qrModalData, setQrModalData] = useState(null);

  // ===========================================================================
  // SEARCH HANDLERS
  // ===========================================================================

  // This function decides which API to call based on the selected search mode
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit

    if (!searchValue.trim()) {
      addToast('Please enter a search value', 'error');
      return;
    }

    setIsLoading(true);
    setSearchResults([]); // Clear previous results

    try {
      if (searchMode === 'ID') {
        // Find a single admission by its exact ID
        await searchById(searchValue.trim());
      } else if (searchMode === 'NAME') {
        // Find admissions matching the patient name
        await searchByName(searchValue.trim());
      } else if (searchMode === 'QR') {
        // Parse the pasted QR JSON and search by the extracted ID
        await searchByQrData(searchValue.trim());
      }
    } catch (error) {
      console.error('Search error:', error);
      // Detailed error messages are handled inside the individual functions
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Search by exact Admission ID
  const searchById = async (id) => {
    try {
      const response = await axiosInstance.get(`/admissions/${id}`);
      // The API returns { message, admission } for a single record
      if (response.data && response.data.admission) {
        setSearchResults([response.data.admission]);
      } else {
        setSearchResults([]);
        addToast('No admission found with that ID', 'error');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        addToast('No admission found with that ID', 'error');
      } else {
        addToast('Error fetching patient data', 'error');
      }
    }
  };

  // Helper: Search by partial Patient Name
  const searchByName = async (name) => {
    try {
      const response = await axiosInstance.get(`/admissions/history?search=${name}`);
      // The API returns { message, count, admissions }
      const admissionsList = Array.isArray(response.data.admissions) 
        ? response.data.admissions 
        : (Array.isArray(response.data) ? response.data : []);
      
      setSearchResults(admissionsList);
      
      if (admissionsList.length === 0) {
        addToast('No patients found matching that name', 'info');
      }
    } catch (error) {
      addToast('Error searching by name', 'error');
    }
  };

  // Helper: Decode pasted QR JSON and lookup by ID
  const searchByQrData = async (qrDataString) => {
    try {
      // Parse the text into a JSON object
      const parsedData = JSON.parse(qrDataString);
      
      // Check if it contains the expected admissionId field
      if (!parsedData.admissionId) {
        addToast('Invalid QR Code: Missing admissionId', 'error');
        return;
      }
      
      // Perform a normal ID search using the extracted ID
      await searchById(parsedData.admissionId);
      
      addToast('QR Code decoded successfully', 'success');
      
      // Clear the input so it's ready for the next scan
      setSearchValue('');
      
    } catch (error) {
      addToast('Invalid QR Code data format. Make sure it is valid JSON.', 'error');
    }
  };

  // ===========================================================================
  // ACTION HANDLERS
  // ===========================================================================

  const openForm = (formType, admissionId) => {
    setSelectedAdmissionId(admissionId);
    setActiveForm(formType);
  };

  const closeForm = () => {
    setActiveForm(null);
    setSelectedAdmissionId('');
  };

  // This runs when a drawer form successfully saves data
  const handleFormSuccess = (message) => {
    closeForm();
    addToast(message, 'success');
    // We don't automatically refresh search results here to avoid losing the context,
    // but the user can click 'Search' again if they want to see updated status.
  };

  const openQrModal = (admission) => {
    setQrModalData({
      admissionId: admission.id,
      patientName: admission.patientName,
      wardName: admission.wardName,
      bedNumber: admission.bedNumber || 'N/A',
      admissionDate: new Date(admission.admissionDate).toLocaleDateString()
    });
  };

  // ===========================================================================
  // RENDER UI
  // ===========================================================================

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Patient Lookup & QR Scanner" 
        subtitle="Search for patients or scan QR badges."
        icon="🔍"
      />

      {/* SEARCH CONTROLS SECTION */}
      <div style={styles.searchCard}>
        <div style={styles.tabContainer}>
          <button 
            type="button"
            style={searchMode === 'ID' ? styles.activeTab : styles.tab} 
            onClick={() => { setSearchMode('ID'); setSearchValue(''); }}
          >
            Search by ID
          </button>
          <button 
            type="button"
            style={searchMode === 'NAME' ? styles.activeTab : styles.tab} 
            onClick={() => { setSearchMode('NAME'); setSearchValue(''); }}
          >
            Search by Name
          </button>
          <button 
            type="button"
            style={searchMode === 'QR' ? styles.activeTab : styles.tab} 
            onClick={() => { setSearchMode('QR'); setSearchValue(''); }}
          >
            Scan QR Code
          </button>
        </div>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          
          {searchMode === 'QR' ? (
            // Larger textarea for pasting JSON data from a QR code
            <textarea
              style={styles.textArea}
              placeholder='Click here and scan badge (or paste JSON like {"admissionId":123})'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              rows={4}
              autoFocus
            />
          ) : (
            // Standard input for ID or Name
            <input
              type={searchMode === 'ID' ? 'number' : 'text'}
              style={styles.searchInput}
              placeholder={searchMode === 'ID' ? 'Enter Admission ID (e.g. 1)' : 'Enter Patient Name'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
          )}

          <button type="submit" style={styles.searchBtn} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* SEARCH RESULTS SECTION */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 12px', color: '#0f172a' }}>
        Search Results
      </h3>
      
      <DataTable 
        columns={['ID', 'Patient Name', 'Location', 'Admitted Date', 'Status', 'Actions']} 
        isEmpty={searchResults.length === 0}
        emptyMessage="No results found. Perform a search above."
      >
        {searchResults.map((adm) => (
          <tr key={adm.id}>
            <td className="mono-data">#{adm.id}</td>
            <td style={{ fontWeight: 600 }}>{adm.patientName}</td>
            <td>{adm.wardName} {adm.bedNumber ? `(Bed ${adm.bedNumber})` : ''}</td>
            <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>
            <td>
              <StatusBadge status={adm.status} />
            </td>
            <td>
              {/* Only show action buttons if the admission is active (not discharged) */}
              {adm.status === 'admitted' ? (
                <div className="table-actions">
                  <button className="action-btn" title="Log Vitals" onClick={() => openForm('VITALS', adm.id)}>🩸</button>
                  <button className="action-btn" title="Transfer" onClick={() => openForm('TRANSFER_WARD', adm.id)}>🔄</button>
                  <button className="action-btn" title="Print QR" onClick={() => openQrModal(adm)}>🖨️</button>
                </div>
              ) : (
                <button className="action-btn" title="Print QR" onClick={() => openQrModal(adm)}>🖨️</button>
              )}
            </td>
          </tr>
        ))}
      </DataTable>

      {/* SLIDE DRAWERS FOR ACTIONS (Commented out as user converted these to standalone pages)
      <LogVitalsForm 
        isOpen={activeForm === 'VITALS'} 
        onClose={closeForm} 
        onSuccess={() => handleFormSuccess('Vitals logged successfully')}
        preselectedAdmissionId={selectedAdmissionId}
      />

      <WardTransferForm 
        isOpen={activeForm === 'TRANSFER_WARD'} 
        onClose={closeForm} 
        onSuccess={() => handleFormSuccess('Internal transfer complete')}
        preselectedAdmissionId={selectedAdmissionId}
      /> */}

      {/* QR PRINT MODAL */}
      {qrModalData && (
        <QRPrintModal
          isOpen={!!qrModalData}
          onClose={() => setQrModalData(null)}
          admissionId={qrModalData.admissionId}
          patientName={qrModalData.patientName}
          wardName={qrModalData.wardName}
          bedNumber={qrModalData.bedNumber}
          admissionDate={qrModalData.admissionDate}
        />
      )}

    </div>
  );
};

// Inline styles for simple presentation (keeping it beginner friendly without massive CSS files)
const styles = {
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px'
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: 500
  },
  activeTab: {
    padding: '8px 16px',
    backgroundColor: 'var(--primary)',
    border: '1px solid var(--primary)',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#ffffff',
    fontWeight: 600
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  textArea: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'monospace'
  },
  searchBtn: {
    padding: '10px 20px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
    height: '40px'
  }
};

export default PatientLookupPage;
