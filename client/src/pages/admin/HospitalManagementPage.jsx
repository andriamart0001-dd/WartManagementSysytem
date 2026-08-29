// =============================================================================
// HospitalManagementPage.jsx — Admin Interface for External Hospitals
// =============================================================================
// Purpose:
//   Allows the Admin to view, add, edit, and delete external hospitals
//   used for external patient transfers.
//   Uses inline editing for a simple, beginner-friendly UX.
//
// Route: /admin/hospitals
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';

const HospitalManagementPage = () => {
  const { addToast } = useToast();

  // Data states
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Add states
  const [isAdding, setIsAdding] = useState(false);
  const [newHospital, setNewHospital] = useState({ hospitalName: '', address: '', contactNumber: '' });

  // Inline Edit states
  const [editingId, setEditingId] = useState(null);
  const [editHospital, setEditHospital] = useState({ hospitalName: '', address: '', contactNumber: '' });

  // Delete Confirm Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchHospitals = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/hospitals');
      const list = Array.isArray(response.data.hospitals) 
        ? response.data.hospitals 
        : (Array.isArray(response.data) ? response.data : []);
      
      setHospitals(list);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      addToast('Failed to load hospitals', 'error');
      setHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
    // eslint-disable-next-line
  }, []);

  // ===========================================================================
  // ADD HOSPITAL
  // ===========================================================================
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newHospital.hospitalName.trim()) {
      addToast('Hospital name is required', 'error');
      return;
    }

    try {
      await axiosInstance.post('/hospitals', newHospital);
      addToast('Hospital added successfully', 'success');
      setNewHospital({ hospitalName: '', address: '', contactNumber: '' });
      setIsAdding(false);
      fetchHospitals(); // Refresh the list
    } catch (error) {
      console.error('Add hospital error:', error);
      addToast(error.response?.data?.message || 'Failed to add hospital', 'error');
    }
  };

  // ===========================================================================
  // EDIT HOSPITAL
  // ===========================================================================
  const startEditing = (hospital) => {
    setEditingId(hospital.id);
    setEditHospital({
      hospitalName: hospital.hospitalName || '',
      address: hospital.address || '',
      contactNumber: hospital.contactNumber || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditHospital({ hospitalName: '', address: '', contactNumber: '' });
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    if (!editHospital.hospitalName.trim()) {
      addToast('Hospital name is required', 'error');
      return;
    }

    try {
      await axiosInstance.put(`/hospitals/${id}`, editHospital);
      addToast('Hospital updated successfully', 'success');
      cancelEditing();
      fetchHospitals(); // Refresh the list
    } catch (error) {
      console.error('Edit hospital error:', error);
      addToast(error.response?.data?.message || 'Failed to update hospital', 'error');
    }
  };

  // ===========================================================================
  // DELETE HOSPITAL
  // ===========================================================================
  const initiateDelete = (hospital) => {
    setHospitalToDelete(hospital);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hospitalToDelete) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/hospitals/${hospitalToDelete.id}`);
      addToast(`${hospitalToDelete.hospitalName} deleted successfully`, 'success');
      setIsConfirmOpen(false);
      fetchHospitals(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      addToast(error.response?.data?.message || 'Failed to delete hospital', 'error');
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
        title="External Hospitals" 
        subtitle="Manage external hospitals used for patient transfers."
        icon="🏥"
        actionLabel={isAdding ? "Cancel Adding" : "+ Add Hospital"}
        onAction={() => {
          setIsAdding(!isAdding);
          setNewHospital({ hospitalName: '', address: '', contactNumber: '' });
        }}
      />

      {/* INLINE ADD FORM (Only shows when isAdding is true) */}
      {isAdding && (
        <div style={styles.addCard}>
          <form onSubmit={handleAddSubmit} style={styles.addForm}>
            <input
              type="text"
              style={styles.input}
              placeholder="Hospital Name *"
              value={newHospital.hospitalName}
              onChange={(e) => setNewHospital({ ...newHospital, hospitalName: e.target.value })}
              autoFocus
              required
            />
            <input
              type="text"
              style={styles.input}
              placeholder="Contact Number"
              value={newHospital.contactNumber}
              onChange={(e) => setNewHospital({ ...newHospital, contactNumber: e.target.value })}
            />
            <input
              type="text"
              style={styles.input}
              placeholder="Address"
              value={newHospital.address}
              onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
            />
            <button type="submit" style={styles.saveBtn} disabled={!newHospital.hospitalName.trim()}>
              Save
            </button>
          </form>
        </div>
      )}

      {/* HOSPITAL LIST TABLE */}
      <DataTable 
        columns={['ID', 'Hospital Name', 'Contact', 'Address', 'Actions']} 
        isEmpty={!isLoading && hospitals.length === 0}
        emptyMessage="No hospitals found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading hospitals...</td>
          </tr>
        ) : (
          hospitals.map((hospital) => {
            const isEditingThis = editingId === hospital.id;
            
            return (
              <tr key={hospital.id}>
                <td className="mono-data">#{hospital.id}</td>
                
                {/* Editable Columns */}
                <td>
                  {isEditingThis ? (
                    <input
                      type="text"
                      style={styles.inlineInput}
                      value={editHospital.hospitalName}
                      onChange={(e) => setEditHospital({ ...editHospital, hospitalName: e.target.value })}
                    />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{hospital.hospitalName}</span>
                  )}
                </td>
                
                <td>
                  {isEditingThis ? (
                    <input
                      type="text"
                      style={styles.inlineInput}
                      value={editHospital.contactNumber}
                      onChange={(e) => setEditHospital({ ...editHospital, contactNumber: e.target.value })}
                    />
                  ) : (
                    hospital.contactNumber || '-'
                  )}
                </td>

                <td>
                  {isEditingThis ? (
                    <input
                      type="text"
                      style={styles.inlineInput}
                      value={editHospital.address}
                      onChange={(e) => setEditHospital({ ...editHospital, address: e.target.value })}
                    />
                  ) : (
                    hospital.address || '-'
                  )}
                </td>
                
                {/* Actions Column: Edit/Delete or Save/Cancel */}
                <td>
                  {isEditingThis ? (
                    <div className="table-actions">
                      <button className="action-btn" title="Save" onClick={(e) => handleEditSubmit(e, hospital.id)}>💾</button>
                      <button className="action-btn" title="Cancel" onClick={cancelEditing}>❌</button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button className="action-btn" title="Edit" onClick={() => startEditing(hospital)}>✏️</button>
                      <button className="action-btn" title="Delete" onClick={() => initiateDelete(hospital)}>🗑️</button>
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
        title="Delete Hospital?"
        message={`Are you sure you want to delete ${hospitalToDelete?.hospitalName}? This cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />

    </div>
  );
};

// Inline styles
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
  inlineInput: {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '14px'
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

export default HospitalManagementPage;
