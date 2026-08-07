import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SlideDrawer from '../../components/ui/SlideDrawer';
import FormField from '../../components/ui/FormField';

// =============================================================================
// EquipmentManagementPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to list equipment, and log maintenance events.
//   Integrates with GET /equipment, POST /equipment/:id/maintenance
// =============================================================================

const EquipmentManagementPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [equipment, setEquipment] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer states (Only for Maintenance now)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  
  // Form input state
  const [formData, setFormData] = useState({
    maintenanceNotes: ''
  });
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [equipRes, wardsRes] = await Promise.all([
        axiosInstance.get('/equipment'),
        axiosInstance.get('/wards')
      ]);
      const equipList = Array.isArray(equipRes.data.equipment) 
        ? equipRes.data.equipment 
        : (Array.isArray(equipRes.data) ? equipRes.data : []);
      const wardList = Array.isArray(wardsRes.data.wards) 
        ? wardsRes.data.wards 
        : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

      setEquipment(equipList);
      setWards(wardList);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load equipment data', 'error');
      setEquipment([]);
      setWards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // ===========================================================================
  // MAINTENANCE FORM HANDLING
  // ===========================================================================
  const openMaintenanceDrawer = (equip) => {
    setEditingEquipment(equip);
    setFormData({
      maintenanceNotes: ''
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async () => {
    if (!formData.maintenanceNotes.trim()) {
      setFormError('Maintenance notes are required.');
      return;
    }

    setFormIsSubmitting(true);
    setFormError('');

    try {
      await axiosInstance.post(`/equipment/${editingEquipment.id}/maintenance`, {
        notes: formData.maintenanceNotes
      });
      addToast('Maintenance logged successfully', 'success');
      
      closeDrawer();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      setFormError(error.response?.data?.message || 'Failed to log maintenance.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  const getDeptName = (wardId) => {
    const ward = wards.find(w => w.id.toString() === wardId.toString());
    return ward ? (ward.wardName || ward.name) : 'Unknown';
  };

  const determineStatus = (available, min) => {
    if (available < min) return 'Shortage';
    return 'Available';
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Equipment Management" 
        subtitle="Manage hospital medical equipment inventory and maintenance."
        icon="🪛"
        actionLabel="+ Register Equipment"
        onAction={() => navigate('/ward-admin/equipment/new')}
      />

      <DataTable 
        columns={['Equipment Name', 'Ward', 'Available Qty', 'In Use', 'Maintenance', 'Threshold', 'Status', 'Actions']} 
        isEmpty={!isLoading && equipment.length === 0}
        emptyMessage="No equipment records found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading inventory...</td>
          </tr>
        ) : (
          equipment.map((eq) => (
            <tr key={eq.id}>
              <td style={{ fontWeight: 600 }}>{eq.name}</td>
              <td>{getDeptName(eq.wardId)}</td>
              <td style={{ color: eq.availableQuantity < eq.minQuantityThreshold ? 'var(--status-occupied)' : 'inherit', fontWeight: 'bold' }}>
                {eq.availableQuantity}
              </td>
              <td>{eq.inUseQuantity}</td>
              <td>{eq.maintenanceQuantity}</td>
              <td>{eq.minQuantityThreshold}</td>
              <td>
                <StatusBadge status={determineStatus(eq.availableQuantity, eq.minQuantityThreshold)} />
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn" title="Edit Inventory" onClick={() => navigate(`/ward-admin/equipment/${eq.id}/edit`)}>✏️ Update</button>
                  <button className="action-btn" title="Log Maintenance" onClick={() => openMaintenanceDrawer(eq)}>🔧 Log</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Slide Drawer for Maintenance Form */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title="Log Maintenance Event"
        footer={
          <>
            <button className="cancelBtn no-bg" onClick={closeDrawer} disabled={formIsSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
            <button className="submit-button" onClick={handleFormSubmit} disabled={formIsSubmitting} style={{ width: 'auto', marginTop: 0 }}>
              {formIsSubmitting ? 'Processing...' : 'Confirm'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {formError}
          </div>
        )}

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
            Logging maintenance for: <strong style={{ color: '#0f172a' }}>{editingEquipment?.name}</strong>
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            This logs an event. To move items to maintenance status, update the quantities in the Edit page.
          </p>
        </div>
        <FormField 
          id="maintenanceNotes" 
          type="textarea"
          label="Maintenance Notes / Reason" 
          value={formData.maintenanceNotes} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
          placeholder="e.g. Sent for monthly calibration"
        />
      </SlideDrawer>
    </div>
  );
};

export default EquipmentManagementPage;

