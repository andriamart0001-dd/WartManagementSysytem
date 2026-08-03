import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SlideDrawer from '../../components/ui/SlideDrawer';
import FormField from '../../components/ui/FormField';
import ConfirmModal from '../../components/ui/ConfirmModal';

// =============================================================================
// WardManagementPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to list, create, edit, and delete wards.
//   Integrates with GET /wards, POST /wards, PUT /wards/:id, DELETE /wards/:id
//   Also fetches /departments for dropdowns.
// =============================================================================

const WardManagementPage = () => {
  const { addToast } = useToast();

  // Data state
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer (Form) state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  
  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    type: 'General',
    departmentId: '',
    minBedThreshold: 5
  });
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirm Modal state (for deletion)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [wardToDelete, setWardToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ward Type options
  const wardTypeOptions = [
    { value: 'General', label: 'General' },
    { value: 'ICU', label: 'ICU' },
    { value: 'Maternity', label: 'Maternity' },
    { value: 'Pediatric', label: 'Pediatric' },
    { value: 'Surgical', label: 'Surgical' },
    { value: 'Emergency', label: 'Emergency' }
  ];

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wardsRes, deptsRes] = await Promise.all([
        axiosInstance.get('/wards'),
        axiosInstance.get('/departments')
      ]);
      const wardList = Array.isArray(wardsRes.data.wards) 
        ? wardsRes.data.wards 
        : (Array.isArray(wardsRes.data) ? wardsRes.data : []);
      const deptList = Array.isArray(deptsRes.data.departments) 
        ? deptsRes.data.departments 
        : (Array.isArray(deptsRes.data) ? deptsRes.data : []);
      
      setWards(wardList);
      setDepartments(deptList);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load wards and departments', 'error');
      setWards([]);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map departments to standard { value, label } options for the dropdown
  const departmentOptions = (Array.isArray(departments) ? departments : []).map((d) => ({
    value: d.id,
    label: d.departmentName || d.name
  }));

  // ===========================================================================
  // DRAWER & FORM HANDLING
  // ===========================================================================
  const openAddDrawer = () => {
    setEditingWard(null);
    setFormData({ 
      name: '', 
      type: 'General', 
      departmentId: departments.length > 0 ? departments[0].id : '', 
      minBedThreshold: 5 
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (ward) => {
    setEditingWard(ward);
    setFormData({ 
      name: ward.name, 
      type: ward.type, 
      departmentId: ward.departmentId, 
      minBedThreshold: ward.minBedThreshold 
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.departmentId) {
      setFormError('Ward Name and Department are required.');
      return;
    }

    setFormIsSubmitting(true);
    setFormError('');

    try {
      const payload = { 
        name: formData.name, 
        type: formData.type, 
        departmentId: parseInt(formData.departmentId, 10),
        minBedThreshold: parseInt(formData.minBedThreshold, 10)
      };

      if (editingWard) {
        await axiosInstance.put(`/wards/${editingWard.id}`, payload);
        addToast('Ward updated successfully', 'success');
      } else {
        await axiosInstance.post('/wards', payload);
        addToast('Ward created successfully', 'success');
      }
      
      closeDrawer();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      setFormError(error.response?.data?.message || 'Failed to save ward.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // ===========================================================================
  // DELETION HANDLING
  // ===========================================================================
  const initiateDelete = (ward) => {
    setWardToDelete(ward);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!wardToDelete) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/wards/${wardToDelete.id}`);
      addToast(`${wardToDelete.name} deleted`, 'success');
      setIsConfirmOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      addToast(error.response?.data?.message || 'Failed to delete ward', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to find department name
  const getDeptName = (deptId) => {
    const deptList = Array.isArray(departments) ? departments : [];
    const dept = deptList.find(d => d.id === deptId || d.id === parseInt(deptId));
    return dept ? (dept.departmentName || dept.name) : 'Unknown';
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Ward Management" 
        subtitle="Manage hospital wards, capacities, and departments."
        icon="🏥"
        actionLabel="+ Add New Ward"
        onAction={openAddDrawer}
      />

      <DataTable 
        columns={['Ward Name', 'Type', 'Department', 'Threshold', 'Status', 'Actions']} 
        isEmpty={!isLoading && (!Array.isArray(wards) || wards.length === 0)}
        emptyMessage="No wards found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading wards...</td>
          </tr>
        ) : (
          (Array.isArray(wards) ? wards : []).map((w) => (
            <tr key={w.id}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.wardName || w.name}</td>
              <td>{w.wardType || w.type}</td>
              <td>{getDeptName(w.departmentId)}</td>
              <td>{w.minBedThreshold} beds</td>
              <td>
                <StatusBadge status={w.status} />
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn" title="Edit Ward" onClick={() => openEditDrawer(w)}>✏️</button>
                  <button className="action-btn" title="Delete Ward" onClick={() => initiateDelete(w)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Add / Edit Form Drawer */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingWard ? 'Edit Ward' : 'Add New Ward'}
        footer={
          <>
            <button className="cancelBtn no-bg" onClick={closeDrawer} disabled={formIsSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
            <button className="submit-button" onClick={handleFormSubmit} disabled={formIsSubmitting} style={{ width: 'auto', marginTop: 0 }}>
              {formIsSubmitting ? 'Saving...' : 'Save Ward'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {formError}
          </div>
        )}

        <FormField 
          id="name" 
          label="Ward Name" 
          value={formData.name} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
        />
        <FormField 
          id="type" 
          type="select" 
          label="Ward Type" 
          value={formData.type} 
          onChange={handleFormChange} 
          options={wardTypeOptions}
          disabled={formIsSubmitting}
        />
        <FormField 
          id="departmentId" 
          type="select" 
          label="Department" 
          value={formData.departmentId} 
          onChange={handleFormChange} 
          options={departmentOptions}
          disabled={formIsSubmitting}
        />
        <FormField 
          id="minBedThreshold" 
          type="number" 
          label="Minimum Bed Threshold" 
          value={formData.minBedThreshold} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
        />
      </SlideDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Ward?"
        message={`Are you sure you want to delete ${wardToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WardManagementPage;
