// =============================================================================
// BedManagementPage.jsx — Ward Bed Availability Floor Map & Management
// =============================================================================
// Purpose:
//   Ward Admin & Staff interface to view ward bed availability in an interactive
//   visual floor plan grid or tabular format.
//   Features:
//     - Top KPI occupancy summary cards and percentage bar
//     - Live visual bed tiles color-coded by status (Available, Occupied, Maintenance)
//     - Real-time patient occupant names and admission dates on occupied beds
//     - Filter by ward section / bay and bed status
//     - Seamless toggle between Visual Grid View and Table View
//     - Quick Bed Detail popup modal with direct status toggling
//
// Beginner-Friendly Standard:
//   - Clear plain-English comments for every function and section.
//   - Multi-line try/catch blocks with human-readable error messages.
//   - Descriptive variable names throughout.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BED_STATUS } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import FormField from '../../components/ui/FormField';

const BedManagementPage = () => {
  // Grab authenticated user and toast notification helpers
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  // Data lists fetched from backend
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected ward filter (strictly locked to assigned ward for Ward Admins)
  const [selectedWardId, setSelectedWardId] = useState(
    user?.assignedWardId ? user.assignedWardId.toString() : ''
  );

  // Active view mode: 'grid' (visual floor map) or 'table' (data table)
  const [viewMode, setViewMode] = useState('grid');

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected bed object for the detail popup modal (null when closed)
  const [selectedBedModal, setSelectedBedModal] = useState(null);

  // ===========================================================================
  // DATA FETCHING
  // Fetches beds, wards, and sections concurrently from the backend
  // ===========================================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Run requests in parallel for better performance
      const [bedsRes, wardsRes, sectionsRes] = await Promise.all([
        axiosInstance.get('/beds'),
        axiosInstance.get('/wards'),
        axiosInstance.get('/sections')
      ]);

      const bedList = Array.isArray(bedsRes.data.beds)
        ? bedsRes.data.beds
        : (Array.isArray(bedsRes.data) ? bedsRes.data : []);

      const wardList = Array.isArray(wardsRes.data.wards)
        ? wardsRes.data.wards
        : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

      const sectionList = Array.isArray(sectionsRes.data.sections)
        ? sectionsRes.data.sections
        : (Array.isArray(sectionsRes.data) ? sectionsRes.data : []);

      setBeds(bedList);
      setWards(wardList);
      setSections(sectionList);

      // Lock to assigned ward if present, otherwise default to first available ward
      if (user?.assignedWardId) {
        setSelectedWardId(user.assignedWardId.toString());
      } else if (wardList.length > 0 && !selectedWardId) {
        setSelectedWardId(wardList[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading bed management data:', error);
      addToast('Failed to load beds, wards, or sections', 'error');
      setBeds([]);
      setWards([]);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [user?.assignedWardId]);

  // ===========================================================================
  // BED STATUS TOGGLING (Available <-> Maintenance)
  // ===========================================================================
  const handleStatusChange = async (bedId, newStatus) => {
    try {
      await axiosInstance.put(`/beds/${bedId}/status`, { status: newStatus });
      addToast(`Bed status updated to ${newStatus}`, 'success');

      // If the detail modal is open for this bed, update its local status too
      if (selectedBedModal && selectedBedModal.id === bedId) {
        setSelectedBedModal(prev => ({
          ...prev,
          bedStatus: newStatus,
          status: newStatus
        }));
      }

      // Refresh list to update all metrics and tiles
      fetchData();
    } catch (error) {
      console.error('Status update error:', error);
      addToast(error.response?.data?.message || 'Failed to update bed status', 'error');
    }
  };

  // ===========================================================================
  // COMPUTED METRICS & FILTERED DATA
  // ===========================================================================

  // All beds belonging to the currently selected ward
  const currentWardBeds = useMemo(() => {
    if (!selectedWardId) return beds;
    return beds.filter(bed => bed.wardId && bed.wardId.toString() === selectedWardId.toString());
  }, [beds, selectedWardId]);

  // Sections that belong to the currently selected ward
  const currentWardSections = useMemo(() => {
    if (!selectedWardId) return sections;
    return sections.filter(sec => sec.wardId && sec.wardId.toString() === selectedWardId.toString());
  }, [sections, selectedWardId]);

  // Calculate live occupancy KPI figures for the selected ward
  const totalBedsCount = currentWardBeds.length;

  const availableBedsCount = currentWardBeds.filter(
    b => (b.bedStatus || b.status) === BED_STATUS.AVAILABLE
  ).length;

  const occupiedBedsCount = currentWardBeds.filter(
    b => (b.bedStatus || b.status) === BED_STATUS.OCCUPIED
  ).length;

  const maintenanceBedsCount = currentWardBeds.filter(
    b => (b.bedStatus || b.status) === BED_STATUS.MAINTENANCE
  ).length;

  // Percentage of beds currently occupied
  const occupancyPercentage = totalBedsCount > 0 
    ? Math.round((occupiedBedsCount / totalBedsCount) * 100) 
    : 0;

  // Filtered beds list matching the search term, section, and status filters
  const filteredBeds = useMemo(() => {
    return currentWardBeds.filter(bed => {
      const currentStatus = bed.bedStatus || bed.status;

      // 1. Status Filter Check
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      // 2. Section Filter Check
      if (sectionFilter !== 'all') {
        if (!bed.sectionId || bed.sectionId.toString() !== sectionFilter.toString()) {
          return false;
        }
      }

      // 3. Search Term Check (matches bed number or patient name)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesBed = bed.bedNumber && bed.bedNumber.toString().toLowerCase().includes(query);
        const matchesPatient = bed.patientName && bed.patientName.toLowerCase().includes(query);
        const matchesSection = bed.sectionName && bed.sectionName.toLowerCase().includes(query);

        if (!matchesBed && !matchesPatient && !matchesSection) {
          return false;
        }
      }

      return true;
    });
  }, [currentWardBeds, statusFilter, sectionFilter, searchTerm]);

  // Options for ward select dropdown
  const wardSelectOptions = wards.map(w => ({
    value: w.id.toString(),
    label: w.wardName || w.name
  }));

  // Helper to retrieve ward display name
  const getWardName = (wardId) => {
    const ward = wards.find(w => w.id.toString() === (wardId || '').toString());
    return ward ? (ward.wardName || ward.name) : (user?.assignedWardName || 'Ward');
  };

  return (
    <div className="dashboard-page">
      {/* Page Header with Add New Bed primary action button */}
      <PageHeader
        title="Bed Management & Availability Map"
        subtitle={
          user?.assignedWardName
            ? `Live bed availability floor map and maintenance for ${user.assignedWardName}.`
            : "Live hospital bed occupancy floor plan and maintenance control."
        }
        icon="🛏️"
        actionLabel="+ Add New Bed"
        onAction={() => navigate('/ward-admin/beds/new')}
      />

      {/* Ward Selection Row (Only enabled for hospital Admins with multi-ward access) */}
      <div style={{ marginBottom: '20px', maxWidth: '340px' }}>
        <FormField
          id="wardFilter"
          type="select"
          label={user?.assignedWardName ? `Ward: ${user.assignedWardName}` : "Select Ward to View"}
          value={selectedWardId}
          onChange={(e) => {
            setSelectedWardId(e.target.value);
            setSectionFilter('all'); // Reset section filter when switching wards
          }}
          options={wardSelectOptions}
          disabled={Boolean(user?.assignedWardId)}
          helperText={user?.assignedWardName ? "You are locked to your assigned ward." : undefined}
        />
      </div>

      {/* =======================================================================
          TOP KPI SUMMARY BANNER
          ======================================================================= */}
      <div className="bed-kpi-summary">
        {/* Metric counts */}
        <div className="bed-kpi-metrics">
          <div className="bed-kpi-item">
            <span className="bed-kpi-label">🛏️ Total Beds</span>
            <span className="bed-kpi-value">{isLoading ? '...' : totalBedsCount}</span>
          </div>

          <div className="bed-kpi-item">
            <span className="bed-kpi-label" style={{ color: '#059669' }}>🟢 Available</span>
            <span className="bed-kpi-value" style={{ color: '#059669' }}>
              {isLoading ? '...' : availableBedsCount}
            </span>
          </div>

          <div className="bed-kpi-item">
            <span className="bed-kpi-label" style={{ color: '#dc2626' }}>🔴 Occupied</span>
            <span className="bed-kpi-value" style={{ color: '#dc2626' }}>
              {isLoading ? '...' : occupiedBedsCount}
            </span>
          </div>

          <div className="bed-kpi-item">
            <span className="bed-kpi-label" style={{ color: '#d97706' }}>🟡 Maintenance</span>
            <span className="bed-kpi-value" style={{ color: '#d97706' }}>
              {isLoading ? '...' : maintenanceBedsCount}
            </span>
          </div>
        </div>

        {/* Occupancy progress bar */}
        <div className="bed-kpi-occupancy">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Occupancy Rate</span>
            <span style={{ fontWeight: 700, color: occupancyPercentage > 85 ? '#dc2626' : '#0f172a' }}>
              {occupancyPercentage}%
            </span>
          </div>
          <div className="occupancy-bar-bg">
            <div
              className="occupancy-bar-fill"
              style={{
                width: `${occupancyPercentage}%`,
                backgroundColor: occupancyPercentage > 85 ? '#ef4444' : occupancyPercentage > 60 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>
      </div>

      {/* =======================================================================
          INTERACTIVE TOOLBAR (SEARCH, SECTION FILTER, STATUS PILLS, VIEW TOGGLE)
          ======================================================================= */}
      <div className="bed-toolbar">
        {/* Left Side: Search & Section Dropdown */}
        <div className="bed-toolbar-left">
          {/* Quick Search */}
          <input
            type="text"
            className="bed-search-input"
            placeholder="🔍 Search bed or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Section Filter */}
          <select
            className="bed-section-select"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="all">All Sections / Bays</option>
            {currentWardSections.map(sec => (
              <option key={sec.id} value={sec.id.toString()}>
                {sec.sectionName}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: Status Filter Pills + View Switcher */}
        <div className="bed-toolbar-right">
          {/* Status Pills */}
          <div className="bed-status-pills">
            <button
              type="button"
              className={`bed-status-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({totalBedsCount})
            </button>
            <button
              type="button"
              className={`bed-status-btn ${statusFilter === BED_STATUS.AVAILABLE ? 'active available' : ''}`}
              onClick={() => setStatusFilter(BED_STATUS.AVAILABLE)}
            >
              🟢 Free ({availableBedsCount})
            </button>
            <button
              type="button"
              className={`bed-status-btn ${statusFilter === BED_STATUS.OCCUPIED ? 'active occupied' : ''}`}
              onClick={() => setStatusFilter(BED_STATUS.OCCUPIED)}
            >
              🔴 Busy ({occupiedBedsCount})
            </button>
            <button
              type="button"
              className={`bed-status-btn ${statusFilter === BED_STATUS.MAINTENANCE ? 'active maintenance' : ''}`}
              onClick={() => setStatusFilter(BED_STATUS.MAINTENANCE)}
            >
              🟡 Maint. ({maintenanceBedsCount})
            </button>
          </div>

          {/* View Toggle: Grid vs Table */}
          <div className="bed-view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visual Floor Plan Grid"
            >
              🔲 Grid View
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tabular Data View"
            >
              📄 Table View
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================================
          VIEW MODE 1: VISUAL FLOOR PLAN BED TILES GRID
          ======================================================================= */}
      {viewMode === 'grid' && (
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading ward bed grid...
            </div>
          ) : filteredBeds.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              color: '#64748b'
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🛏️</span>
              <p style={{ margin: 0, fontWeight: 500 }}>No beds found matching the selected filters.</p>
            </div>
          ) : (
            <div className="bed-tiles-grid">
              {filteredBeds.map(bed => {
                const status = bed.bedStatus || bed.status;
                const isOccupied = status === BED_STATUS.OCCUPIED;
                const isAvailable = status === BED_STATUS.AVAILABLE;
                const isMaintenance = status === BED_STATUS.MAINTENANCE;

                // Determine CSS modifier class
                let tileClass = 'bed-tile';
                if (isAvailable) tileClass += ' bed-tile-available';
                else if (isOccupied) tileClass += ' bed-tile-occupied';
                else if (isMaintenance) tileClass += ' bed-tile-maintenance';

                return (
                  <div
                    key={`tile-${bed.id}`}
                    className={tileClass}
                    onClick={() => setSelectedBedModal(bed)}
                  >
                    {/* Tile Header: Bed Number & Section */}
                    <div className="bed-tile-header">
                      <span className="bed-tile-number">
                        🛏️ Bed {bed.bedNumber}
                      </span>
                      {bed.sectionName ? (
                        <span className="bed-tile-section" title={`Section: ${bed.sectionName}`}>
                          📂 {bed.sectionName}
                        </span>
                      ) : (
                        <span className="bed-tile-section" style={{ color: '#94a3b8' }}>
                          General
                        </span>
                      )}
                    </div>

                    {/* Tile Body: Status & Occupant Details */}
                    <div className="bed-tile-body">
                      <div>
                        <StatusBadge status={status} />
                      </div>

                      {/* Display Occupying Patient info if occupied */}
                      {isOccupied && (
                        <div className="bed-occupant-box">
                          <div className="bed-occupant-name" title={bed.patientName || 'Admitted Patient'}>
                            👤 {bed.patientName || 'Inpatient'}
                          </div>
                          {bed.admissionDate && (
                            <div className="bed-occupant-sub">
                              📅 Since {new Date(bed.admissionDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display friendly status text if available */}
                      {isAvailable && (
                        <div className="bed-available-msg">
                          ✓ Ready for Admission
                        </div>
                      )}

                      {/* Display maintenance indicator */}
                      {isMaintenance && (
                        <div className="bed-maintenance-msg">
                          ⚠️ Under Service / Repair
                        </div>
                      )}
                    </div>

                    {/* Tile Footer: Quick Actions */}
                    <div className="bed-tile-footer" onClick={(e) => e.stopPropagation()}>
                      {/* Maintenance Toggle Buttons */}
                      {isAvailable && (
                        <button
                          type="button"
                          className="action-btn"
                          style={{ fontSize: '11px', padding: '3px 8px', borderColor: '#f59e0b', color: '#b45309' }}
                          onClick={() => handleStatusChange(bed.id, BED_STATUS.MAINTENANCE)}
                          title="Flag bed for maintenance"
                        >
                          🔧 Maintenance
                        </button>
                      )}

                      {isMaintenance && (
                        <button
                          type="button"
                          className="action-btn"
                          style={{ fontSize: '11px', padding: '3px 8px', borderColor: '#10b981', color: '#047857' }}
                          onClick={() => handleStatusChange(bed.id, BED_STATUS.AVAILABLE)}
                          title="Mark bed clean and ready for patients"
                        >
                          ✓ Make Available
                        </button>
                      )}

                      {isOccupied && (
                        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                          In-Use
                        </span>
                      )}

                      {/* Edit Bed link */}
                      <button
                        type="button"
                        className="action-btn"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => navigate(`/ward-admin/beds/${bed.id}/edit`)}
                        title="Edit bed details"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =======================================================================
          VIEW MODE 2: ENHANCED TABULAR DATA TABLE
          ======================================================================= */}
      {viewMode === 'table' && (
        <DataTable
          columns={['Bed Number', 'Ward', 'Section / Bay', 'Status', 'Current Occupant', 'Actions']}
          isEmpty={!isLoading && filteredBeds.length === 0}
          emptyMessage="No beds found matching the selected filters."
        >
          {isLoading ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                Loading beds list...
              </td>
            </tr>
          ) : (
            filteredBeds.map((bed) => {
              const status = bed.bedStatus || bed.status;
              const isOccupied = status === BED_STATUS.OCCUPIED;
              const isAvailable = status === BED_STATUS.AVAILABLE;
              const isMaintenance = status === BED_STATUS.MAINTENANCE;

              return (
                <tr key={`table-${bed.id}`}>
                  <td style={{ fontWeight: 600 }}>
                    🛏️ {bed.bedNumber}
                  </td>
                  <td>{getWardName(bed.wardId)}</td>
                  <td>
                    <span style={{
                      color: bed.sectionName ? '#0f172a' : '#94a3b8',
                      fontStyle: bed.sectionName ? 'normal' : 'italic'
                    }}>
                      {bed.sectionName ? `📂 ${bed.sectionName}` : 'General Bay'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>
                    {isOccupied ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          👤 {bed.patientName || 'Admitted Patient'}
                        </div>
                        {bed.admissionDate && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Admitted: {new Date(bed.admissionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : isMaintenance ? (
                      <span style={{ fontSize: '12px', color: '#b45309' }}>Under Maintenance</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#059669' }}>Available for patient</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="action-btn"
                        onClick={() => navigate(`/ward-admin/beds/${bed.id}/edit`)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Edit
                      </button>

                      {isAvailable && (
                        <button
                          className="action-btn"
                          onClick={() => handleStatusChange(bed.id, BED_STATUS.MAINTENANCE)}
                          style={{ fontSize: '12px', padding: '4px 8px', color: '#854d0e', borderColor: '#eab308' }}
                        >
                          Maintenance
                        </button>
                      )}

                      {isMaintenance && (
                        <button
                          className="action-btn"
                          onClick={() => handleStatusChange(bed.id, BED_STATUS.AVAILABLE)}
                          style={{ fontSize: '12px', padding: '4px 8px', color: '#166534', borderColor: '#22c55e' }}
                        >
                          Available
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </DataTable>
      )}

      {/* =======================================================================
          BED DETAIL & QUICK ACTIONS MODAL
          ======================================================================= */}
      {selectedBedModal && (
        <div
          className="bed-modal-backdrop"
          onClick={() => setSelectedBedModal(null)}
        >
          <div
            className="bed-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bed-modal-header">
              <h3>🛏️ Bed {selectedBedModal.bedNumber} Details</h3>
              <button
                type="button"
                className="bed-modal-close"
                onClick={() => setSelectedBedModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="bed-modal-body">
              <div className="bed-modal-row">
                <span className="bed-modal-row-label">Ward</span>
                <span className="bed-modal-row-value">{getWardName(selectedBedModal.wardId)}</span>
              </div>

              <div className="bed-modal-row">
                <span className="bed-modal-row-label">Section / Bay</span>
                <span className="bed-modal-row-value">
                  {selectedBedModal.sectionName ? `📂 ${selectedBedModal.sectionName}` : 'General Ward Area'}
                </span>
              </div>

              <div className="bed-modal-row">
                <span className="bed-modal-row-label">Current Status</span>
                <span className="bed-modal-row-value">
                  <StatusBadge status={selectedBedModal.bedStatus || selectedBedModal.status} />
                </span>
              </div>

              {/* Occupant Details if Occupied */}
              {(selectedBedModal.bedStatus || selectedBedModal.status) === BED_STATUS.OCCUPIED && (
                <>
                  <div className="bed-modal-row">
                    <span className="bed-modal-row-label">Admitted Patient</span>
                    <span className="bed-modal-row-value" style={{ color: '#0369a1' }}>
                      👤 {selectedBedModal.patientName || 'Inpatient'}
                    </span>
                  </div>

                  {selectedBedModal.patientNIC && (
                    <div className="bed-modal-row">
                      <span className="bed-modal-row-label">Patient NIC</span>
                      <span className="bed-modal-row-value mono-data">
                        {selectedBedModal.patientNIC}
                      </span>
                    </div>
                  )}

                  {selectedBedModal.admissionDate && (
                    <div className="bed-modal-row">
                      <span className="bed-modal-row-label">Admission Date</span>
                      <span className="bed-modal-row-value">
                        {new Date(selectedBedModal.admissionDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bed-modal-footer">
              {/* Toggle to Maintenance */}
              {(selectedBedModal.bedStatus || selectedBedModal.status) === BED_STATUS.AVAILABLE && (
                <button
                  type="button"
                  className="action-btn"
                  style={{ color: '#b45309', borderColor: '#f59e0b' }}
                  onClick={() => handleStatusChange(selectedBedModal.id, BED_STATUS.MAINTENANCE)}
                >
                  🔧 Set Maintenance
                </button>
              )}

              {/* Toggle to Available */}
              {(selectedBedModal.bedStatus || selectedBedModal.status) === BED_STATUS.MAINTENANCE && (
                <button
                  type="button"
                  className="action-btn"
                  style={{ color: '#047857', borderColor: '#10b981' }}
                  onClick={() => handleStatusChange(selectedBedModal.id, BED_STATUS.AVAILABLE)}
                >
                  ✓ Mark Available
                </button>
              )}

              {/* Edit Bed Configuration */}
              <button
                type="button"
                className="action-btn"
                onClick={() => {
                  const id = selectedBedModal.id;
                  setSelectedBedModal(null);
                  navigate(`/ward-admin/beds/${id}/edit`);
                }}
              >
                ✏️ Edit Bed
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                className="action-btn"
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                onClick={() => setSelectedBedModal(null)}
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

export default BedManagementPage;
