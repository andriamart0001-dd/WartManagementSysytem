// =============================================================================
// TransferHistoryPage.jsx — Hospital Patient Transfer Logs & Audit History
// =============================================================================
// Purpose:
//   Allows Administrators, Ward Admins, Admission Doctors, and Nurses to view,
//   search, and audit historical internal transfers (ward-to-ward / bed-to-bed)
//   and external transfers (to other hospitals and returns).
//
// Beginner-Friendly Standard:
//   - Clear plain-English comments for every function.
//   - Clean async/await with try/catch blocks.
//   - No magic strings; uses shared constants.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const TransferHistoryPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Active view tab: 'internal' or 'external'
  const [activeTab, setActiveTab] = useState('internal');

  // Transfer data arrays
  const [internalTransfers, setInternalTransfers] = useState([]);
  const [externalTransfers, setExternalTransfers] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [wardsList, setWardsList] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('all');
  const [selectedHospitalId, setSelectedHospitalId] = useState('all');
  const [externalStatusFilter, setExternalStatusFilter] = useState('all'); // 'all', 'away', 'returned'

  // ===========================================================================
  // DATA FETCHING: Load both internal and external transfer records
  // ===========================================================================
  const fetchAllTransferData = async () => {
    setIsLoading(true);
    try {
      // Execute parallel requests to load internal history, external history, wards, and hospitals
      const [internalRes, externalRes, wardsRes, hospitalsRes] = await Promise.allSettled([
        axiosInstance.get('/transfers/internal'),
        axiosInstance.get('/transfers/external'),
        axiosInstance.get('/wards'),
        axiosInstance.get('/transfers/hospitals')
      ]);

      // 1. Process Internal Transfers
      if (internalRes.status === 'fulfilled') {
        const list = Array.isArray(internalRes.value.data.transfers)
          ? internalRes.value.data.transfers
          : [];
        setInternalTransfers(list);
      }

      // 2. Process External Transfers
      if (externalRes.status === 'fulfilled') {
        const list = Array.isArray(externalRes.value.data.transfers)
          ? externalRes.value.data.transfers
          : [];
        setExternalTransfers(list);
      }

      // 3. Process Wards for filters
      if (wardsRes.status === 'fulfilled') {
        const wards = Array.isArray(wardsRes.value.data.wards)
          ? wardsRes.value.data.wards
          : (Array.isArray(wardsRes.value.data) ? wardsRes.value.data : []);
        setWardsList(wards);
      }

      // 4. Process Hospitals for filters
      if (hospitalsRes.status === 'fulfilled') {
        const hospitals = Array.isArray(hospitalsRes.value.data.hospitals)
          ? hospitalsRes.value.data.hospitals
          : (Array.isArray(hospitalsRes.value.data) ? hospitalsRes.value.data : []);
        setHospitalsList(hospitals);
      }
    } catch (error) {
      console.error('Error fetching transfer records:', error);
      addToast('Failed to load transfer history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load all transfer data on component mount
  useEffect(() => {
    fetchAllTransferData();
    // eslint-disable-next-line
  }, []);

  // Format date and time helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // ===========================================================================
  // FILTERING LOGIC: Internal Transfers
  // ===========================================================================
  const filteredInternalTransfers = useMemo(() => {
    return internalTransfers.filter((item) => {
      // Filter 1: Ward Filter (matches origin OR destination ward)
      if (selectedWardId !== 'all') {
        const matchesOrigin = String(item.fromWardId) === String(selectedWardId);
        const matchesDest = String(item.toWardId) === String(selectedWardId);
        if (!matchesOrigin && !matchesDest) return false;
      }

      // Filter 2: Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const patientMatch = item.patientName?.toLowerCase().includes(q);
        const nicMatch = item.patientNIC?.toLowerCase().includes(q);
        const staffMatch = item.transferredByName?.toLowerCase().includes(q);
        const reasonMatch = item.transferReason?.toLowerCase().includes(q);

        return patientMatch || nicMatch || staffMatch || reasonMatch;
      }

      return true;
    });
  }, [internalTransfers, selectedWardId, searchQuery]);

  // ===========================================================================
  // FILTERING LOGIC: External Transfers
  // ===========================================================================
  const filteredExternalTransfers = useMemo(() => {
    return externalTransfers.filter((item) => {
      // Filter 1: Hospital Filter
      if (selectedHospitalId !== 'all' && String(item.hospitalId) !== String(selectedHospitalId)) {
        return false;
      }

      // Filter 2: Status Filter (Currently away vs Returned)
      if (externalStatusFilter === 'away' && item.returnDate !== null) {
        return false;
      }
      if (externalStatusFilter === 'returned' && item.returnDate === null) {
        return false;
      }

      // Filter 3: Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const patientMatch = item.patientName?.toLowerCase().includes(q);
        const nicMatch = item.patientNIC?.toLowerCase().includes(q);
        const hospitalMatch = item.hospitalName?.toLowerCase().includes(q);
        const staffMatch = item.transferredByName?.toLowerCase().includes(q);
        const reasonMatch = item.transferReason?.toLowerCase().includes(q);

        return patientMatch || nicMatch || hospitalMatch || staffMatch || reasonMatch;
      }

      return true;
    });
  }, [externalTransfers, selectedHospitalId, externalStatusFilter, searchQuery]);

  // Calculate summary counts
  const totalInternalCount = internalTransfers.length;
  const totalExternalCount = externalTransfers.length;
  const currentlyAwayCount = externalTransfers.filter(t => t.returnDate === null).length;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <PageHeader
        title="Patient Transfer History"
        subtitle="Complete audit log of all internal ward-to-ward movements and external hospital transfers."
        icon="🔄"
      />

      {/* KPI Cards */}
      <div className="dashboard-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="dash-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="card-header">
            <span className="card-icon">🔄</span>
            <h3>Internal Transfers</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>
            {isLoading ? '...' : totalInternalCount}
          </div>
          <p className="card-description">Total ward-to-ward & bed relocations</p>
        </div>

        <div className="dash-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div className="card-header">
            <span className="card-icon">🚑</span>
            <h3>External Transfers</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c2410c' }}>
            {isLoading ? '...' : totalExternalCount}
          </div>
          <p className="card-description">Total transfers to partner hospitals</p>
        </div>

        <div className="dash-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-header">
            <span className="card-icon">🏥</span>
            <h3>Currently Away</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b91c1c' }}>
            {isLoading ? '...' : currentlyAwayCount}
          </div>
          <p className="card-description">Patients currently at external facilities</p>
        </div>
      </div>

      {/* Tab Switcher & Filter Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="action-btn"
            style={{
              padding: '8px 18px',
              backgroundColor: activeTab === 'internal' ? '#dbeafe' : '#ffffff',
              borderColor: activeTab === 'internal' ? '#3b82f6' : '#cbd5e1',
              color: activeTab === 'internal' ? '#1d4ed8' : '#475569',
              fontWeight: activeTab === 'internal' ? 700 : 500
            }}
            onClick={() => {
              setActiveTab('internal');
              setSearchQuery('');
            }}
          >
            🔄 Internal Ward Transfers ({totalInternalCount})
          </button>

          <button
            className="action-btn"
            style={{
              padding: '8px 18px',
              backgroundColor: activeTab === 'external' ? '#ffedd5' : '#ffffff',
              borderColor: activeTab === 'external' ? '#ea580c' : '#cbd5e1',
              color: activeTab === 'external' ? '#c2410c' : '#475569',
              fontWeight: activeTab === 'external' ? 700 : 500
            }}
            onClick={() => {
              setActiveTab('external');
              setSearchQuery('');
            }}
          >
            🚑 External Hospital Transfers ({totalExternalCount})
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Internal: Ward Filter */}
          {activeTab === 'internal' && (
            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All Wards</option>
              {wardsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wardName}
                </option>
              ))}
            </select>
          )}

          {/* External: Hospital Filter */}
          {activeTab === 'external' && (
            <>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">All Hospitals</option>
                {hospitalsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hospitalName}
                  </option>
                ))}
              </select>

              <select
                value={externalStatusFilter}
                onChange={(e) => setExternalStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="away">Away (Pending Return)</option>
                <option value="returned">Returned to Ward</option>
              </select>
            </>
          )}

          {/* Search Input */}
          <input
            type="text"
            placeholder={
              activeTab === 'internal'
                ? "🔍 Search patient, NIC, staff..."
                : "🔍 Search patient, hospital..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '230px'
            }}
          />

          {/* Refresh Button */}
          <button
            className="action-btn"
            onClick={fetchAllTransferData}
            title="Refresh transfer history"
            style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: INTERNAL TRANSFERS TABLE                                      */}
      {/* ===================================================================== */}
      {activeTab === 'internal' && (
        <DataTable
          columns={[
            'ID',
            'Patient Name',
            'From (Origin)',
            'To (Destination)',
            'Transfer Reason',
            'Transferred By',
            'Date & Time'
          ]}
          isEmpty={!isLoading && filteredInternalTransfers.length === 0}
          emptyMessage="No internal transfer records found."
        >
          {isLoading ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                Loading internal transfer history...
              </td>
            </tr>
          ) : (
            filteredInternalTransfers.map((item) => (
              <tr key={`internal-${item.id}`}>
                <td className="mono-data">#{item.id}</td>

                {/* Patient Information */}
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {item.patientName}
                  </div>
                  {item.patientNIC && (
                    <div style={{ fontSize: '11px', color: '#0369a1', fontFamily: 'monospace' }}>
                      🆔 {item.patientNIC}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Adm #{item.admissionId}
                  </div>
                </td>

                {/* From Ward & Bed */}
                <td>
                  <div style={{ fontWeight: 500, color: '#b91c1c' }}>
                    {item.fromWardName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {item.fromBedNumber ? `Bed ${item.fromBedNumber}` : `Bed ID: ${item.fromBedId || 'N/A'}`}
                  </div>
                </td>

                {/* To Ward & Bed */}
                <td>
                  <div style={{ fontWeight: 600, color: '#047857' }}>
                    {item.toWardName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {item.toBedNumber ? `Bed ${item.toBedNumber}` : `Bed ID: ${item.toBedId || 'N/A'}`}
                  </div>
                </td>

                {/* Reason */}
                <td style={{ maxWidth: '240px' }}>
                  {item.transferReason ? (
                    <span style={{ fontSize: '13px', color: '#334155' }}>
                      {item.transferReason}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                      No reason specified
                    </span>
                  )}
                </td>

                {/* Transferred By */}
                <td>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>
                    {item.transferredByName || 'Staff Member'}
                  </div>
                </td>

                {/* Date & Time */}
                <td style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                  {formatDateTime(item.transferDate)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: EXTERNAL TRANSFERS TABLE                                      */}
      {/* ===================================================================== */}
      {activeTab === 'external' && (
        <DataTable
          columns={[
            'ID',
            'Patient Name',
            'Destination Hospital',
            'Reason for Transfer',
            'Transfer Out Date',
            'Current Status',
            'Return Date',
            'Logged By'
          ]}
          isEmpty={!isLoading && filteredExternalTransfers.length === 0}
          emptyMessage="No external transfer records found."
        >
          {isLoading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
                Loading external transfer history...
              </td>
            </tr>
          ) : (
            filteredExternalTransfers.map((item) => {
              const isAway = item.returnDate === null;

              return (
                <tr key={`external-${item.id}`}>
                  <td className="mono-data">#{item.id}</td>

                  {/* Patient Name */}
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.patientName}
                    </div>
                    {item.patientNIC && (
                      <div style={{ fontSize: '11px', color: '#0369a1', fontFamily: 'monospace' }}>
                        🆔 {item.patientNIC}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Adm #{item.admissionId}
                    </div>
                  </td>

                  {/* Destination Hospital */}
                  <td>
                    <div style={{ fontWeight: 600, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🏥</span> {item.hospitalName}
                    </div>
                  </td>

                  {/* Transfer Reason */}
                  <td style={{ maxWidth: '220px' }}>
                    {item.transferReason ? (
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {item.transferReason}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                        No reason specified
                      </span>
                    )}
                  </td>

                  {/* Transfer Out Date */}
                  <td style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatDateTime(item.transferOutDate)}
                  </td>

                  {/* Current Status Badge */}
                  <td>
                    <span 
                      className={`status-badge ${isAway ? 'status-transferred' : 'status-available'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {isAway ? 'Away at External Hospital' : 'Returned to Ward'}
                    </span>
                  </td>

                  {/* Return Date */}
                  <td style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {item.returnDate ? (
                      <div style={{ color: '#047857', fontWeight: 500 }}>
                        {formatDateTime(item.returnDate)}
                      </div>
                    ) : (
                      <span style={{ color: '#ea580c', fontWeight: 600, fontSize: '12px' }}>
                        ⏳ Pending Return
                      </span>
                    )}
                  </td>

                  {/* Logged By */}
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>
                      {item.transferredByName || 'Staff Member'}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </DataTable>
      )}
    </div>
  );
};

export default TransferHistoryPage;
