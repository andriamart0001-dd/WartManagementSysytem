// =============================================================================
// AdmissionHistoryPage.jsx — Patient Admission History Log
// =============================================================================
// Purpose:
//   Allows the Admin, Ward Admin, and Doctors to search, filter, and review
//   the complete history of all patient admissions, including discharged
//   and transferred patients.
//
// Route: /admin/admissions
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const AdmissionHistoryPage = () => {
  const { addToast } = useToast();

  // Admission records list and loading state
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected admission for viewing details modal/popup
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // ===========================================================================
  // DATA FETCHING: Load admissions history from backend API
  // ===========================================================================
  const fetchAdmissionHistory = async () => {
    setIsLoading(true);
    try {
      // Build query string based on filters
      const queryParams = new URLSearchParams();
      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admissions/history?${queryString}` : '/admissions/history';

      const response = await axiosInstance.get(endpoint);
      const admissionList = Array.isArray(response.data.admissions)
        ? response.data.admissions
        : [];

      setAdmissions(admissionList);
    } catch (error) {
      console.error('Error fetching admission history:', error);
      addToast('Failed to load admission history', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial component mount and when statusFilter changes
  useEffect(() => {
    fetchAdmissionHistory();
    // eslint-disable-next-line
  }, [statusFilter]);

  // Handle manual search form submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchAdmissionHistory();
  };

  // Helper function to format timestamp nicely
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        title="Patient Admission History"
        subtitle="Search and review records of all patient admissions, discharges, and transfers."
        icon="📋"
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}
      >
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            🔍 Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                // Fetch immediately with cleared search
                setIsLoading(true);
                const query = statusFilter ? `?status=${statusFilter}` : '';
                axiosInstance.get(`/admissions/history${query}`)
                  .then(res => setAdmissions(res.data.admissions || []))
                  .catch(() => addToast('Failed to load', 'error'))
                  .finally(() => setIsLoading(false));
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Status Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="admitted">Admitted (Active)</option>
            <option value="discharged">Discharged</option>
            <option value="transferredOut">Transferred Out</option>
          </select>
        </div>
      </div>

      {/* Admissions Table */}
      <DataTable
        columns={[
          'ID',
          'Patient Name',
          'Age / Gender',
          'Ward & Bed',
          'Admission Date',
          'Status',
          'Discharge Info',
          'Details'
        ]}
        isEmpty={!isLoading && admissions.length === 0}
        emptyMessage="No admission records found matching your filters."
      >
        {isLoading ? (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Loading admission history...
            </td>
          </tr>
        ) : (
          admissions.map((admissionItem) => (
            <tr key={admissionItem.id}>
              {/* ID */}
              <td style={{ fontWeight: 600, color: '#334155' }}>
                #{admissionItem.id}
              </td>

              {/* Patient Name */}
              <td>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {admissionItem.patientName}
                </span>
                {admissionItem.contactNumber && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    📞 {admissionItem.contactNumber}
                  </div>
                )}
              </td>

              {/* Age / Gender */}
              <td style={{ fontSize: '13px', color: '#475569' }}>
                {admissionItem.age} yrs • {admissionItem.gender}
              </td>

              {/* Ward & Bed */}
              <td>
                <div style={{ fontWeight: 500 }}>
                  {admissionItem.wardName || 'Ward N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {admissionItem.bedNumber ? `Bed ${admissionItem.bedNumber}` : 'No bed assigned'}
                </div>
              </td>

              {/* Admission Date */}
              <td style={{ fontSize: '13px', color: '#475569' }}>
                {formatDateTime(admissionItem.admissionDate)}
              </td>

              {/* Status */}
              <td>
                <StatusBadge status={admissionItem.status} />
              </td>

              {/* Discharge Info */}
              <td style={{ fontSize: '13px' }}>
                {admissionItem.dischargeDate ? (
                  <div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>
                      {formatDateTime(admissionItem.dischargeDate)}
                    </div>
                    {admissionItem.dischargeNotes && (
                      <div style={{ color: '#64748b', fontSize: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Note: {admissionItem.dischargeNotes}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </td>

              {/* Details Action Button */}
              <td>
                <button
                  type="button"
                  onClick={() => setSelectedAdmission(admissionItem)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  👁️ View
                </button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Patient Details Modal */}
      {selectedAdmission && (
        <div
          style={{
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
            padding: '20px'
          }}
          onClick={() => setSelectedAdmission(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Admission Details #{selectedAdmission.id}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Patient Name</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0f172a' }}>{selectedAdmission.patientName}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedAdmission.status} />
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Age & Gender</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{selectedAdmission.age} yrs, {selectedAdmission.gender}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Phone</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{selectedAdmission.contactNumber || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Ward</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{selectedAdmission.wardName || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Bed</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{selectedAdmission.bedNumber ? `Bed ${selectedAdmission.bedNumber}` : 'None'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Admitted On</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{formatDateTime(selectedAdmission.admissionDate)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Discharged On</p>
                <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>{formatDateTime(selectedAdmission.dischargeDate)}</p>
              </div>
            </div>

            {selectedAdmission.dischargeNotes && (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Discharge Notes</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{selectedAdmission.dischargeNotes}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e2e8f0',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionHistoryPage;
