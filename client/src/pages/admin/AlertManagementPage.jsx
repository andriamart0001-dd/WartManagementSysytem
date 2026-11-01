// =============================================================================
// AlertManagementPage.jsx — Shortage Alert Management Interface
// =============================================================================
// Purpose:
//   Allows the Admin and Ward Admin to monitor bed and equipment shortage alerts.
//   Users can filter alerts by status (Active, Resolved, All) and mark active
//   alerts as resolved once supplies or beds are restored.
//
// Route: /admin/alerts
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AlertManagementPage = () => {
  const { addToast } = useToast();

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
      // Build the query parameter based on the selected tab
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
      console.error('Error fetching shortage alerts:', error);
      addToast('Failed to load shortage alerts', 'error');
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch data whenever the filter tab changes
  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line
  }, [filterStatus]);

  // ===========================================================================
  // RESOLVE ALERT: Open modal and submit resolve request
  // ===========================================================================
  const openResolveModal = (alert) => {
    setSelectedAlert(alert);
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
      // Send PUT request to mark the alert as resolved in the database
      await axiosInstance.put(`/alerts/${selectedAlert.id}/resolve`);
      addToast('Alert resolved successfully', 'success');
      closeResolveModal();
      // Refresh the table data
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      addToast(error.response?.data?.message || 'Failed to resolve alert', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  // Helper function to format timestamp nicely
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Helper to format alert type label nicely
  const formatAlertType = (alertType) => {
    if (alertType === 'bedShortage') {
      return '🛏️ Bed Shortage';
    }
    if (alertType === 'equipmentShortage') {
      return '🪛 Equipment Shortage';
    }
    return alertType;
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        title="Shortage Alert Management"
        subtitle="Monitor and resolve critical bed and equipment shortage alerts across hospital wards."
        icon="🚨"
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setFilterStatus('active')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            backgroundColor: filterStatus === 'active' ? 'var(--primary)' : '#ffffff',
            color: filterStatus === 'active' ? '#ffffff' : '#475569'
          }}
        >
          🔴 Active Alerts
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('resolved')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            backgroundColor: filterStatus === 'resolved' ? 'var(--primary)' : '#ffffff',
            color: filterStatus === 'resolved' ? '#ffffff' : '#475569'
          }}
        >
          🟢 Resolved Alerts
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            backgroundColor: filterStatus === 'all' ? 'var(--primary)' : '#ffffff',
            color: filterStatus === 'all' ? '#ffffff' : '#475569'
          }}
        >
          📑 All History
        </button>
      </div>

      {/* Alerts Table */}
      <DataTable
        columns={[
          'Alert ID',
          'Type',
          'Resource / Ward',
          'Triggered At',
          'Status',
          'Resolved At',
          'Actions'
        ]}
        isEmpty={!isLoading && alerts.length === 0}
        emptyMessage={
          filterStatus === 'active'
            ? 'No active shortage alerts at this time. All resources are above threshold!'
            : 'No alerts found for this filter.'
        }
      >
        {isLoading ? (
          <tr>
            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Loading shortage alerts...
            </td>
          </tr>
        ) : (
          alerts.map((alertItem) => {
            const isResolved = Boolean(alertItem.resolvedAt);

            return (
              <tr key={alertItem.id}>
                {/* Alert ID */}
                <td style={{ fontWeight: 600, color: '#334155' }}>
                  #{alertItem.id}
                </td>

                {/* Alert Type */}
                <td style={{ fontWeight: 500 }}>
                  {formatAlertType(alertItem.alertType)}
                </td>

                {/* Resource / Ward Name */}
                <td>
                  {alertItem.wardName && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Ward:</span> {alertItem.wardName}
                    </div>
                  )}
                  {alertItem.equipmentName && (
                    <div style={{ color: '#475569', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>Equipment:</span> {alertItem.equipmentName}
                    </div>
                  )}
                  {!alertItem.wardName && !alertItem.equipmentName && (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>

                {/* Triggered At */}
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  {formatDateTime(alertItem.triggeredAt)}
                </td>

                {/* Status Badge */}
                <td>
                  {isResolved ? (
                    <StatusBadge status="available" text="Resolved" />
                  ) : (
                    <StatusBadge status="occupied" text="Active" />
                  )}
                </td>

                {/* Resolved At */}
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  {formatDateTime(alertItem.resolvedAt)}
                </td>

                {/* Actions */}
                <td>
                  {!isResolved ? (
                    <button
                      type="button"
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
                  ) : (
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                      ✓ Closed
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* Confirmation Modal to Resolve Alert */}
      <ConfirmModal
        isOpen={isResolveModalOpen}
        onClose={closeResolveModal}
        onConfirm={handleConfirmResolve}
        title="Resolve Shortage Alert"
        message={`Are you sure you want to mark Alert #${selectedAlert?.id} (${selectedAlert?.wardName || selectedAlert?.equipmentName || 'Resource'}) as resolved?`}
        confirmText="Yes, Mark Resolved"
        isLoading={isResolving}
      />
    </div>
  );
};

export default AlertManagementPage;
