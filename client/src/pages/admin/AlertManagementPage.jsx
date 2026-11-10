// =============================================================================
// AlertManagementPage.jsx — Hospital Shortage Alert & Notification Center
// =============================================================================
// Purpose:
//   Centralized notification interface for all hospital staff to monitor active
//   and historical bed and equipment shortage alerts.
//   System Admins and Ward Admins can mark alerts as resolved once resources
//   are replenished. Other staff (Doctors, Nurses) have a real-time advisory view.
//
// Route: /alerts (and /admin/alerts)
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AlertManagementPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Check if current user has permission to resolve shortage alerts
  const canResolve = user?.role === ROLES.ADMIN || user?.role === ROLES.WARD_ADMIN;

  // Alert list data and loading status
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tab state: 'active', 'resolved', or 'all'
  const [filterStatus, setFilterStatus] = useState('active');

  // Confirmation modal state for resolving an alert
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  // ===========================================================================
  // DATA FETCHING: Load alerts from backend API
  // ===========================================================================
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // Build query parameter based on the selected tab
      let endpoint = '/alerts';
      if (filterStatus === 'active') {
        endpoint = '/alerts?status=active';
      } else if (filterStatus === 'resolved') {
        endpoint = '/alerts?status=resolved';
      }

      // Fetch the alerts list from the server
      const response = await axiosInstance.get(endpoint);
      const alertList = Array.isArray(response.data.alerts)
        ? response.data.alerts
        : [];

      setAlerts(alertList);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      addToast('Failed to load shortage alerts', 'error');
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch alerts whenever filterStatus changes
  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line
  }, [filterStatus]);

  // ===========================================================================
  // HANDLERS: Modal open/close & resolving an alert
  // ===========================================================================
  const openResolveModal = (alertItem) => {
    setSelectedAlert(alertItem);
    setIsResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setSelectedAlert(null);
    setIsResolveModalOpen(false);
  };

  const handleConfirmResolve = async () => {
    if (!selectedAlert) return;

    setIsResolving(true);
    try {
      // Send resolve request to the server
      await axiosInstance.put(`/alerts/${selectedAlert.id}/resolve`);

      addToast('Alert marked as resolved successfully', 'success');
      closeResolveModal();

      // Refresh the alerts list
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      addToast(error.response?.data?.message || 'Failed to resolve alert', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  // Helper function to format alert type into clean text
  const formatAlertType = (type) => {
    if (type === 'bedShortage') {
      return '🛏️ Bed Shortage';
    }
    if (type === 'equipmentShortage') {
      return '🪛 Equipment Shortage';
    }
    return type;
  };

  // Helper function to format date/time strings
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        title="Shortage Alerts & Notifications"
        subtitle={
          canResolve
            ? "Monitor real-time bed and medical equipment shortages. Mark alerts resolved when resolved."
            : "Hospital-wide operational shortage alerts and advisory notices for medical staff."
        }
        icon="🚨"
      />

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className="action-btn"
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatus === 'active' ? '#fee2e2' : '#ffffff',
            borderColor: filterStatus === 'active' ? '#dc2626' : '#cbd5e1',
            color: filterStatus === 'active' ? '#b91c1c' : '#475569',
            fontWeight: filterStatus === 'active' ? 700 : 500
          }}
          onClick={() => setFilterStatus('active')}
        >
          🚨 Active Shortages
        </button>

        <button
          type="button"
          className="action-btn"
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatus === 'resolved' ? '#d1fae5' : '#ffffff',
            borderColor: filterStatus === 'resolved' ? '#059669' : '#cbd5e1',
            color: filterStatus === 'resolved' ? '#047857' : '#475569',
            fontWeight: filterStatus === 'resolved' ? 700 : 500
          }}
          onClick={() => setFilterStatus('resolved')}
        >
          ✅ Resolved History
        </button>

        <button
          type="button"
          className="action-btn"
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatus === 'all' ? '#e2e8f0' : '#ffffff',
            borderColor: filterStatus === 'all' ? '#64748b' : '#cbd5e1',
            color: filterStatus === 'all' ? '#0f172a' : '#475569',
            fontWeight: filterStatus === 'all' ? 700 : 500
          }}
          onClick={() => setFilterStatus('all')}
        >
          📋 All Alerts
        </button>
      </div>

      {/* Alert Data Table */}
      <DataTable
        columns={[
          'Alert ID',
          'Type',
          'Affected Ward / Resource',
          'Threshold Notice',
          'Triggered At',
          'Status',
          'Resolved At',
          'Actions'
        ]}
        isEmpty={!isLoading && alerts.length === 0}
        emptyMessage={
          filterStatus === 'active'
            ? '✅ No active shortage alerts! All ward beds and equipment levels are optimal.'
            : 'No shortage alerts found for the selected filter.'
        }
      >
        {isLoading ? (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
              Loading alerts...
            </td>
          </tr>
        ) : (
          alerts.map((alertItem) => {
            const isResolved = Boolean(alertItem.resolvedAt);

            return (
              <tr key={alertItem.id}>
                {/* Alert ID */}
                <td className="mono-data">
                  #{alertItem.id}
                </td>

                {/* Alert Type */}
                <td style={{ fontWeight: 600 }}>
                  {formatAlertType(alertItem.alertType)}
                </td>

                {/* Resource / Ward Name */}
                <td>
                  {alertItem.wardName && (
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      🏥 {alertItem.wardName}
                    </div>
                  )}
                  {alertItem.equipmentName && (
                    <div style={{ color: '#0369a1', fontSize: '13px', fontWeight: 500 }}>
                      🪛 {alertItem.equipmentName}
                    </div>
                  )}
                  {!alertItem.wardName && !alertItem.equipmentName && (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>

                {/* Threshold Notice Message */}
                <td style={{ fontSize: '13px', color: '#334155', maxWidth: '250px' }}>
                  {alertItem.alertType === 'bedShortage' && (
                    <span>Available beds fell below minimum safety threshold.</span>
                  )}
                  {alertItem.alertType === 'equipmentShortage' && (
                    <span>Operational equipment quantity fell below ward threshold.</span>
                  )}
                  {!alertItem.alertType && 'Resource shortage detected.'}
                </td>

                {/* Triggered At */}
                <td style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                  {formatDateTime(alertItem.triggeredAt)}
                </td>

                {/* Status Badge */}
                <td>
                  {isResolved ? (
                    <StatusBadge status="available" />
                  ) : (
                    <StatusBadge status="shortage" />
                  )}
                </td>

                {/* Resolved At */}
                <td style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                  {formatDateTime(alertItem.resolvedAt)}
                </td>

                {/* Actions */}
                <td>
                  {!isResolved && canResolve ? (
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => openResolveModal(alertItem)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      ✓ Mark Resolved
                    </button>
                  ) : !isResolved && !canResolve ? (
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Active Shortage
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                      ✓ Resolved
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* Confirmation Modal for Resolving an Alert */}
      <ConfirmModal
        isOpen={isResolveModalOpen}
        onClose={closeResolveModal}
        onConfirm={handleConfirmResolve}
        title="Resolve Shortage Alert"
        message={`Are you sure you want to resolve alert #${selectedAlert?.id}? This indicates that supplies or bed capacities have been restored.`}
        confirmText="Confirm Resolution"
        isDanger={false}
        isLoading={isResolving}
      />
    </div>
  );
};

export default AlertManagementPage;
