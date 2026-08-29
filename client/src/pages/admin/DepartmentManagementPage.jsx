// =============================================================================
// DepartmentManagementPage.jsx — Admin Interface for Departments
// =============================================================================
// Purpose:
//   Allows the Admin to view, add, edit, and delete hospital departments.
//   Uses inline editing for a simple, beginner-friendly UX.
//
// Route: /admin/departments
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';

const DepartmentManagementPage = () => {
  const { addToast } = useToast();

  // Data states
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Add states
  const [isAdding, setIsAdding] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Inline Edit states
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');

  // Delete Confirm Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/departments');
      const deptList = Array.isArray(response.data.departments) 
        ? response.data.departments 
        : (Array.isArray(response.data) ? response.data : []);
      
      setDepartments(deptList);
    } catch (error) {
      console.error('Error fetching departments:', error);
      addToast('Failed to load departments', 'error');
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line
  }, []);

  // ===========================================================================
  // ADD DEPARTMENT
  // ===========================================================================
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;

    try {
      await axiosInstance.post('/departments', {
        departmentName: newDepartmentName.trim()
      });
      
      addToast('Department added successfully', 'success');
      setNewDepartmentName('');
      setIsAdding(false);
      fetchDepartments(); // Refresh the list
    } catch (error) {
      console.error('Add department error:', error);
      addToast(error.response?.data?.message || 'Failed to add department', 'error');
    }
  };

  // ===========================================================================
  // EDIT DEPARTMENT
  // ===========================================================================
  const startEditing = (dept) => {
    setEditingDeptId(dept.id);
    setEditDepartmentName(dept.departmentName || dept.name);
  };

  const cancelEditing = () => {
    setEditingDeptId(null);
    setEditDepartmentName('');
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    if (!editDepartmentName.trim()) return;

    try {
      await axiosInstance.put(`/departments/${id}`, {
        departmentName: editDepartmentName.trim()
      });
      
      addToast('Department updated successfully', 'success');
      cancelEditing();
      fetchDepartments(); // Refresh the list
    } catch (error) {
      console.error('Edit department error:', error);
      addToast(error.response?.data?.message || 'Failed to update department', 'error');
    }
  };

  // ===========================================================================
  // DELETE DEPARTMENT
  // ===========================================================================
  const initiateDelete = (dept) => {
    setDeptToDelete(dept);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/departments/${deptToDelete.id}`);
      addToast(`${deptToDelete.departmentName || deptToDelete.name} deleted successfully`, 'success');
      setIsConfirmOpen(false);
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      addToast(error.response?.data?.message || 'Failed to delete department', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ===========================================================================
  // RENDER UI
  // ===========================================================================
  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Department Management" 
        subtitle="Manage hospital departments (e.g., Cardiology, Oncology)."
        icon="🏢"
        actionLabel={isAdding ? "Cancel Adding" : "+ Add Department"}
        onAction={() => {
          setIsAdding(!isAdding);
          setNewDepartmentName('');
        }}
      />

      {/* INLINE ADD FORM (Only shows when isAdding is true) */}
      {isAdding && (
        <div style={styles.addCard}>
          <form onSubmit={handleAddSubmit} style={styles.addForm}>
            <input
              type="text"
              style={styles.input}
              placeholder="Enter new department name..."
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              autoFocus
            />
            <button type="submit" style={styles.saveBtn} disabled={!newDepartmentName.trim()}>
              Save Department
            </button>
          </form>
        </div>
      )}

      {/* DEPARTMENT LIST TABLE */}
      <DataTable 
        columns={['ID', 'Department Name', 'Created Date', 'Actions']} 
        isEmpty={!isLoading && departments.length === 0}
        emptyMessage="No departments found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading departments...</td>
          </tr>
        ) : (
          departments.map((dept) => {
            const isEditingThis = editingDeptId === dept.id;
            
            return (
              <tr key={dept.id}>
                <td className="mono-data">#{dept.id}</td>
                
                {/* Name Column: Shows input if editing, otherwise plain text */}
                <td>
                  {isEditingThis ? (
                    <form onSubmit={(e) => handleEditSubmit(e, dept.id)} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        style={{ ...styles.input, padding: '4px 8px', width: '100%' }}
                        value={editDepartmentName}
                        onChange={(e) => setEditDepartmentName(e.target.value)}
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{dept.departmentName || dept.name}</span>
                  )}
                </td>
                
                <td>{new Date(dept.createdAt).toLocaleDateString()}</td>
                
                {/* Actions Column: Edit/Delete or Save/Cancel */}
                <td>
                  {isEditingThis ? (
                    <div className="table-actions">
                      <button className="action-btn" title="Save" onClick={(e) => handleEditSubmit(e, dept.id)}>💾</button>
                      <button className="action-btn" title="Cancel" onClick={cancelEditing}>❌</button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button className="action-btn" title="Edit" onClick={() => startEditing(dept)}>✏️</button>
                      <button className="action-btn" title="Delete" onClick={() => initiateDelete(dept)}>🗑️</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department?"
        message={`Are you sure you want to delete ${deptToDelete?.departmentName || deptToDelete?.name}? This cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />

    </div>
  );
};

// Inline styles for simple presentation
const styles = {
  addCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  addForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer'
  }
};

export default DepartmentManagementPage;
