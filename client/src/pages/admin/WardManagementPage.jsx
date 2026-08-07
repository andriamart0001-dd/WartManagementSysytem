import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';

// =============================================================================
// WardManagementPage.jsx
// =============================================================================
// Purpose:
//   Admin interface to list and delete wards.
//   Integrates with GET /wards, DELETE /wards/:id
//   Also fetches /departments for display names.
// =============================================================================

const WardManagementPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirm Modal state (for deletion)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [wardToDelete, setWardToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      addToast(`${wardToDelete.wardName || wardToDelete.name} deleted`, 'success');
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
        onAction={() => navigate('/admin/wards/new')}
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
                  <button className="action-btn" title="Edit Ward" onClick={() => navigate(`/admin/wards/${w.id}/edit`)}>✏️</button>
                  <button className="action-btn" title="Delete Ward" onClick={() => initiateDelete(w)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Ward?"
        message={`Are you sure you want to delete ${wardToDelete?.wardName || wardToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WardManagementPage;

