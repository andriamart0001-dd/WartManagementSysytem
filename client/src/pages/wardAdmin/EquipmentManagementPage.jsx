import React, { useState, useEffect } from 'react';
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
//   Ward Admin interface to list equipment, register new, update quantities, 
//   and log maintenance events.
//   Integrates with GET /equipment, POST /equipment, PUT /equipment/:id, POST /equipment/:id/maintenance
// =============================================================================

const EquipmentManagementPage = () => {
  const { addToast } = useToast();

  // Data state
  const [equipment, setEquipment] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [drawerMode, setDrawerMode] = useState('ADD'); // ADD, EDIT, MAINTENANCE
  
  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    wardId: '',
    availableQuantity: 1,
    minQuantityThreshold: 1,
    maintenanceNotes: '' // Only used for maintenance mode
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
      setEquipment(equipRes.data);
      setWards(wardsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load equipment data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.name }));

  // ===========================================================================
  // DRAWER & FORM HANDLING
  // ===========================================================================
  const openAddDrawer = () => {
    setDrawerMode('ADD');
    setEditingEquipment(null);
    setFormData({ 
      name: '', 
      wardId: wards.length > 0 ? wards[0].id.toString() : '', 
      availableQuantity: 1,
      minQuantityThreshold: 1,
      maintenanceNotes: ''
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (equip) => {
    setDrawerMode('EDIT');
    setEditingEquipment(equip);
    setFormData({ 
      name: equip.name, 
      wardId: equip.wardId.toString(), 
      availableQuantity: equip.availableQuantity,
      minQuantityThreshold: equip.minQuantityThreshold,
      maintenanceNotes: ''
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openMaintenanceDrawer = (equip) => {
    setDrawerMode('MAINTENANCE');
    setEditingEquipment(equip);
    setFormData({
      name: equip.name,
      wardId: equip.wardId.toString(),
      availableQuantity: equip.availableQuantity,
      minQuantityThreshold: equip.minQuantityThreshold,
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
    if (drawerMode !== 'MAINTENANCE' && (!formData.name.trim() || !formData.wardId)) {
      setFormError('Name and Ward are required.');
      return;
    }
    if (drawerMode === 'MAINTENANCE' && !formData.maintenanceNotes.trim()) {
      setFormError('Maintenance notes are required.');
      return;
    }

    setFormIsSubmitting(true);
    setFormError('');

    try {
      if (drawerMode === 'MAINTENANCE') {
        await axiosInstance.post(`/equipment/${editingEquipment.id}/maintenance`, {
          notes: formData.maintenanceNotes
        });
        addToast('Maintenance logged successfully', 'success');
      } else if (drawerMode === 'EDIT') {
        const payload = {
          name: formData.name,
          availableQuantity: parseInt(formData.availableQuantity, 10),
          minQuantityThreshold: parseInt(formData.minQuantityThreshold, 10)
        };
        await axiosInstance.put(`/equipment/${editingEquipment.id}`, payload);
        addToast('Equipment updated successfully', 'success');
      } else {
        const payload = {
          name: formData.name,
          wardId: parseInt(formData.wardId, 10),
          availableQuantity: parseInt(formData.availableQuantity, 10),
          minQuantityThreshold: parseInt(formData.minQuantityThreshold, 10)
        };
        await axiosInstance.post('/equipment', payload);
        addToast('Equipment created successfully', 'success');
      }
      
      closeDrawer();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      setFormError(error.response?.data?.message || 'Failed to process request.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  const getDeptName = (wardId) => {
    const ward = wards.find(w => w.id.toString() === wardId.toString());
    return ward ? ward.name : 'Unknown';
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
        onAction={openAddDrawer}
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
                  <button className="action-btn" title="Edit Inventory" onClick={() => openEditDrawer(eq)}>✏️ Update</button>
                  <button className="action-btn" title="Log Maintenance" onClick={() => openMaintenanceDrawer(eq)}>🔧 Log</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Slide Drawer for Forms */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={
          drawerMode === 'ADD' ? 'Register Equipment' : 
          drawerMode === 'EDIT' ? 'Update Equipment' : 
          'Log Maintenance Event'
        }
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

        {drawerMode !== 'MAINTENANCE' && (
          <>
            <FormField 
              id="name" 
              label="Equipment Name" 
              value={formData.name} 
              onChange={handleFormChange} 
              required 
              disabled={formIsSubmitting || drawerMode === 'EDIT'} // Can't change name easily once registered
            />
            {drawerMode === 'ADD' && (
              <FormField 
                id="wardId" 
                type="select" 
                label="Assigned Ward" 
                value={formData.wardId} 
                onChange={handleFormChange} 
                options={wardOptions}
                required
                disabled={formIsSubmitting}
              />
            )}
            <FormField 
              id="availableQuantity" 
              type="number"
              label="Available Quantity" 
              value={formData.availableQuantity} 
              onChange={handleFormChange} 
              required 
              disabled={formIsSubmitting}
            />
            <FormField 
              id="minQuantityThreshold" 
              type="number"
              label="Minimum Safe Threshold" 
              value={formData.minQuantityThreshold} 
              onChange={handleFormChange} 
              required 
              disabled={formIsSubmitting}
            />
          </>
        )}

        {drawerMode === 'MAINTENANCE' && (
          <>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                Logging maintenance for: <strong style={{ color: '#0f172a' }}>{formData.name}</strong>
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                This logs an event. To move items to maintenance status, update the quantities in the Edit drawer.
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
          </>
        )}
      </SlideDrawer>
    </div>
  );
};

export default EquipmentManagementPage;
