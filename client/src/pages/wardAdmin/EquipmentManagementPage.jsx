// =============================================================================
// EquipmentManagementPage.jsx — Ward Medical Equipment & Maintenance Management
// =============================================================================
// Purpose:
//   Ward Admin interface to list equipment, log maintenance servicing events,
//   view maintenance history logs, and return serviced equipment back to available.
//   Strictly scoped to the Ward Admin's assigned ward.
//
// Beginner-Friendly Standard:
//   - Clear plain-English comments for every function.
//   - Clean async/await with try/catch blocks.
//   - No magic strings; uses shared constants.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EQUIPMENT_STATUS } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SlideDrawer from '../../components/ui/SlideDrawer';
import FormField from '../../components/ui/FormField';

const EquipmentManagementPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data states
  const [equipmentList, setEquipmentList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer 1: Log Maintenance State
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [selectedEquipForLog, setSelectedEquipForLog] = useState(null);
  const [logFormData, setLogFormData] = useState({
    notes: '',
    nextScheduledDate: ''
  });
  const [isLoggingSubmitting, setIsLoggingSubmitting] = useState(false);
  const [logError, setLogError] = useState('');

  // Drawer 2: View Maintenance History State
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedEquipForHistory, setSelectedEquipForHistory] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ===========================================================================
  // DATA FETCHING: Load Equipment & Wards
  // ===========================================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [equipRes, wardsRes] = await Promise.all([
        axiosInstance.get('/equipment'),
        axiosInstance.get('/wards')
      ]);

      const rawEquipment = Array.isArray(equipRes.data.equipment)
        ? equipRes.data.equipment
        : (Array.isArray(equipRes.data) ? equipRes.data : []);

      const rawWards = Array.isArray(wardsRes.data.wards)
        ? wardsRes.data.wards
        : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

      // If user is a Ward Admin, filter to their assigned ward
      const filtered = user?.assignedWardId
        ? rawEquipment.filter(eq => Number(eq.wardId) === Number(user.assignedWardId))
        : rawEquipment;

      setEquipmentList(filtered);
      setWardsList(rawWards);
    } catch (error) {
      console.error('Error fetching equipment inventory:', error);
      addToast('Failed to load equipment data', 'error');
      setEquipmentList([]);
      setWardsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [user?.assignedWardId]);

  // ===========================================================================
  // HANDLER: Open Log Maintenance Drawer
  // ===========================================================================
  const handleOpenLogDrawer = (item) => {
    setSelectedEquipForLog(item);
    setLogFormData({
      notes: '',
      nextScheduledDate: ''
    });
    setLogError('');
    setIsLogDrawerOpen(true);
  };

  // Submit new maintenance log
  const handleSaveMaintenanceLog = async () => {
    if (!logFormData.notes.trim()) {
      setLogError('Maintenance notes are required.');
      return;
    }

    setIsLoggingSubmitting(true);
    setLogError('');

    try {
      await axiosInstance.post(`/equipment/${selectedEquipForLog.id}/maintenance`, {
        notes: logFormData.notes.trim(),
        nextScheduledDate: logFormData.nextScheduledDate || null
      });

      addToast(`Maintenance logged! ${selectedEquipForLog.equipmentName} marked for maintenance.`, 'success');
      setIsLogDrawerOpen(false);
      fetchData(); // Refresh list to reflect maintenance status
    } catch (error) {
      console.error('Failed to log maintenance:', error);
      setLogError(error.response?.data?.message || 'Failed to log maintenance event');
    } finally {
      setIsLoggingSubmitting(false);
    }
  };

  // ===========================================================================
  // HANDLER: Open Maintenance History Drawer
  // ===========================================================================
  const handleOpenHistoryDrawer = async (item) => {
    setSelectedEquipForHistory(item);
    setIsHistoryDrawerOpen(true);
    setIsLoadingHistory(true);

    try {
      const res = await axiosInstance.get(`/equipment/${item.id}/maintenance`);
      const logs = Array.isArray(res.data.logs) ? res.data.logs : [];
      setHistoryLogs(logs);
    } catch (error) {
      console.error('Failed to load maintenance logs:', error);
      addToast('Failed to load maintenance history logs', 'error');
      setHistoryLogs([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ===========================================================================
  // HANDLER: Return Equipment from Maintenance to Available
  // ===========================================================================
  const handleReturnToAvailable = async (item) => {
    try {
      await axiosInstance.put(`/equipment/${item.id}`, {
        status: EQUIPMENT_STATUS.AVAILABLE
      });

      addToast(`${item.equipmentName} returned to available inventory!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to update equipment status:', error);
      addToast(error.response?.data?.message || 'Failed to update equipment status', 'error');
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Helper to resolve ward name
  const getWardName = (wardId) => {
    const found = wardsList.find(w => String(w.id) === String(wardId));
    return found ? found.wardName : (user?.assignedWardName || 'Ward');
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader 
        title="Equipment Management" 
        subtitle={
          user?.assignedWardName
            ? `Manage medical equipment inventory and maintenance records for ${user.assignedWardName}.`
            : "Manage hospital medical equipment inventory and maintenance."
        }
        icon="🪛"
        actionLabel="+ Register Equipment"
        onAction={() => navigate('/ward-admin/equipment/new')}
      />

      {/* Equipment Inventory Table */}
      <DataTable 
        columns={[
          'ID',
          'Equipment Name',
          'Ward',
          'Total Quantity',
          'Current Status',
          'Min Threshold',
          'Shortage Alert',
          'Actions'
        ]} 
        isEmpty={!isLoading && equipmentList.length === 0}
        emptyMessage="No equipment records found for this ward."
      >
        {isLoading ? (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
              Loading equipment inventory...
            </td>
          </tr>
        ) : (
          equipmentList.map((eq) => {
            const hasShortage = eq.quantity < eq.minQuantityThreshold;
            const isMaintenance = eq.status === EQUIPMENT_STATUS.MAINTENANCE;

            return (
              <tr key={eq.id}>
                {/* ID */}
                <td className="mono-data">#{eq.id}</td>

                {/* Equipment Name */}
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {eq.equipmentName}
                </td>

                {/* Ward */}
                <td>{getWardName(eq.wardId)}</td>

                {/* Quantity */}
                <td style={{ fontWeight: 700, color: hasShortage ? '#dc2626' : '#0f172a' }}>
                  {eq.quantity}
                </td>

                {/* Current Status */}
                <td>
                  <StatusBadge status={eq.status} />
                </td>

                {/* Min Quantity Threshold */}
                <td>{eq.minQuantityThreshold} units</td>

                {/* Shortage Alert */}
                <td>
                  {hasShortage ? (
                    <span 
                      className="status-badge status-shortage"
                      title={`Below minimum threshold of ${eq.minQuantityThreshold}`}
                    >
                      ⚠️ Shortage
                    </span>
                  ) : (
                    <span style={{ color: '#059669', fontSize: '12px', fontWeight: 500 }}>
                      ✓ Optimal
                    </span>
                  )}
                </td>

                {/* Action Buttons */}
                <td>
                  <div className="table-actions" style={{ flexWrap: 'wrap', gap: '4px' }}>
                    {/* Return to Available (if in maintenance) */}
                    {isMaintenance && (
                      <button 
                        className="action-btn" 
                        title="Mark Maintenance Complete and Return to Service" 
                        onClick={() => handleReturnToAvailable(eq)}
                        style={{
                          backgroundColor: '#d1fae5',
                          borderColor: '#a7f3d0',
                          color: '#047857',
                          fontWeight: 600,
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Restore
                      </button>
                    )}

                    {/* Log Maintenance */}
                    <button 
                      className="action-btn" 
                      title="Log a Maintenance / Service Event" 
                      onClick={() => handleOpenLogDrawer(eq)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      🔧 Log
                    </button>

                    {/* View Service History */}
                    <button 
                      className="action-btn" 
                      title="View Past Maintenance Logs" 
                      onClick={() => handleOpenHistoryDrawer(eq)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      📜 History
                    </button>

                    {/* Edit Details */}
                    <button 
                      className="action-btn" 
                      title="Edit Equipment Details" 
                      onClick={() => navigate(`/ward-admin/equipment/${eq.id}/edit`)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* ===================================================================== */}
      {/* DRAWER 1: Log Maintenance Event                                       */}
      {/* ===================================================================== */}
      <SlideDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        title="Log Maintenance Event"
        footer={
          <>
            <button 
              type="button" 
              className="cancelBtn no-bg" 
              onClick={() => setIsLogDrawerOpen(false)} 
              disabled={isLoggingSubmitting} 
              style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="submit-button" 
              onClick={handleSaveMaintenanceLog} 
              disabled={isLoggingSubmitting} 
              style={{ width: 'auto', marginTop: 0, padding: '8px 18px' }}
            >
              {isLoggingSubmitting ? 'Saving Log...' : 'Confirm & Mark Maintenance'}
            </button>
          </>
        }
      >
        {logError && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {logError}
          </div>
        )}

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
            Logging maintenance for: <strong style={{ color: '#0f172a' }}>{selectedEquipForLog?.equipmentName}</strong>
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Recording this log will set the equipment status to <strong>Maintenance</strong> until servicing is completed.
          </p>
        </div>

        <FormField 
          id="notes" 
          type="textarea"
          label="Maintenance Reason / Service Notes (Required)" 
          value={logFormData.notes} 
          onChange={(e) => setLogFormData(prev => ({ ...prev, notes: e.target.value }))} 
          required 
          disabled={isLoggingSubmitting}
          placeholder="e.g. Sent to biomedical engineering for quarterly sensor calibration and battery replacement."
        />

        <FormField 
          id="nextScheduledDate" 
          type="date"
          label="Next Scheduled Service Date (Optional)" 
          value={logFormData.nextScheduledDate} 
          onChange={(e) => setLogFormData(prev => ({ ...prev, nextScheduledDate: e.target.value }))} 
          disabled={isLoggingSubmitting}
        />
      </SlideDrawer>

      {/* ===================================================================== */}
      {/* DRAWER 2: View Maintenance History Logs                               */}
      {/* ===================================================================== */}
      <SlideDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        title={`Maintenance History: ${selectedEquipForHistory?.equipmentName || ''}`}
        footer={
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => setIsHistoryDrawerOpen(false)} 
            style={{ padding: '8px 18px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          >
            Close
          </button>
        }
      >
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
          Audit trail of past maintenance, calibrations, and repairs for this item.
        </div>

        {isLoadingHistory ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
            Loading service history logs...
          </p>
        ) : historyLogs.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            No previous maintenance records logged for this equipment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyLogs.map((log) => (
              <div 
                key={log.id} 
                style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                    Service Log #{log.id}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDate(log.maintenanceDate)}
                  </span>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {log.notes}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '11px', 
                  color: '#64748b', 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '6px' 
                }}>
                  <span>Performed by: <strong>{log.performedByName || 'Staff Member'}</strong></span>
                  {log.nextScheduledDate && (
                    <span>Next Due: <strong>{new Date(log.nextScheduledDate).toLocaleDateString()}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SlideDrawer>
    </div>
  );
};

export default EquipmentManagementPage;
