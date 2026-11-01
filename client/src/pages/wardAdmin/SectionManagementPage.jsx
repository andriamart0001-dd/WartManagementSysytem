// =============================================================================
// SectionManagementPage.jsx — Ward Sections Interface
// =============================================================================
// Purpose:
//   Allows Ward Admins and Hospital Admins to manage sections within wards.
//   Beds can be grouped into sections (e.g., Pre-Op, Post-Op, Bay 1, Bay 2).
//   Provides inline creation, inline renaming, and safe deletion.
//
// Route: /ward-admin/sections
// =============================================================================

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Reusable UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import FormField from '../../components/ui/FormField';

const SectionManagementPage = () => {
  const { addToast } = useToast();

  // Data states
  const [sections, setSections] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Section states
  const [isAdding, setIsAdding] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionWardId, setNewSectionWardId] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Section states
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Section states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  // Fetch both wards and sections
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch wards and sections concurrently
      const [wardsResponse, sectionsResponse] = await Promise.all([
        axiosInstance.get('/wards'),
        axiosInstance.get('/sections')
      ]);

      const wardList = Array.isArray(wardsResponse.data.wards)
        ? wardsResponse.data.wards
        : (Array.isArray(wardsResponse.data) ? wardsResponse.data : []);

      const sectionList = Array.isArray(sectionsResponse.data.sections)
        ? sectionsResponse.data.sections
        : (Array.isArray(sectionsResponse.data) ? sectionsResponse.data : []);

      setWards(wardList);
      setSections(sectionList);

      // Pre-select first ward in add form if available
      if (wardList.length > 0 && !newSectionWardId) {
        setNewSectionWardId(wardList[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching sections and wards:', error);
      addToast('Failed to load sections and wards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Filter sections based on selected ward dropdown
  const filteredSections = selectedWardId
    ? sections.filter(s => s.wardId && s.wardId.toString() === selectedWardId)
    : sections;

  // Options for ward filter and add forms
  const wardFilterOptions = [
    { value: '', label: 'All Wards' },
    ...wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }))
  ];

  const wardFormOptions = wards.map(w => ({
    value: w.id.toString(),
    label: w.wardName || w.name
  }));

  // ===========================================================================
  // ADD SECTION
  // ===========================================================================
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      addToast('Please enter a section name', 'error');
      return;
    }
    if (!newSectionWardId) {
      addToast('Please select a ward for the section', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await axiosInstance.post('/sections', {
        sectionName: newSectionName.trim(),
        wardId: parseInt(newSectionWardId, 10)
      });

      addToast('Section created successfully', 'success');
      setNewSectionName('');
      setIsAdding(false);
      fetchData(); // Refresh table
    } catch (error) {
      console.error('Add section error:', error);
      addToast(error.response?.data?.message || 'Failed to create section', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // ===========================================================================
  // EDIT SECTION
  // ===========================================================================
  const startEditing = (section) => {
    setEditingSectionId(section.id);
    setEditSectionName(section.sectionName);
  };

  const cancelEditing = () => {
    setEditingSectionId(null);
    setEditSectionName('');
  };

  const handleEditSubmit = async (e, sectionId) => {
    e.preventDefault();
    if (!editSectionName.trim()) {
      addToast('Section name cannot be empty', 'error');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await axiosInstance.put(`/sections/${sectionId}`, {
        sectionName: editSectionName.trim()
      });

      addToast('Section renamed successfully', 'success');
      cancelEditing();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Edit section error:', error);
      addToast(error.response?.data?.message || 'Failed to update section', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ===========================================================================
  // DELETE SECTION
  // ===========================================================================
  const initiateDelete = (section) => {
    setSectionToDelete(section);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sectionToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/sections/${sectionToDelete.id}`);
      addToast(`Section "${sectionToDelete.sectionName}" deleted successfully`, 'success');
      setIsConfirmOpen(false);
      setSectionToDelete(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Delete section error:', error);
      addToast(error.response?.data?.message || 'Failed to delete section', 'error');
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
        title="Ward Sections"
        subtitle="Group beds into distinct sections within wards (e.g. ICU Bay A, Pre-Op, Post-Op)."
        icon="📂"
        actionLabel={isAdding ? 'Cancel Adding' : '+ Add New Section'}
        onAction={() => {
          setIsAdding(!isAdding);
          setNewSectionName('');
        }}
      />

      {/* INLINE ADD FORM */}
      {isAdding && (
        <div style={styles.addCard}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
            Create New Ward Section
          </h4>
          <form onSubmit={handleAddSubmit} style={styles.addForm}>
            <div style={{ flex: '1 1 200px' }}>
              <FormField
                id="newWardSelect"
                type="select"
                label="Select Ward"
                value={newSectionWardId}
                onChange={(e) => setNewSectionWardId(e.target.value)}
                options={wardFormOptions}
                required
              />
            </div>
            <div style={{ flex: '2 1 250px' }}>
              <FormField
                id="newSectionName"
                label="Section Name (e.g. Bay A, Pre-Op)"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Enter section name..."
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '16px' }}>
              <button
                type="submit"
                style={styles.saveBtn}
                disabled={isSubmittingAdd || !newSectionName.trim()}
              >
                {isSubmittingAdd ? 'Saving...' : 'Save Section'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
        <FormField
          id="wardFilter"
          type="select"
          label="Filter by Ward"
          value={selectedWardId}
          onChange={(e) => setSelectedWardId(e.target.value)}
          options={wardFilterOptions}
        />
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={['Section Name', 'Ward', 'Assigned Beds', 'Actions']}
        isEmpty={!isLoading && filteredSections.length === 0}
        emptyMessage="No sections found. Create a section to organize beds."
      >
        {isLoading ? (
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
              Loading sections...
            </td>
          </tr>
        ) : (
          filteredSections.map((sec) => {
            const isEditing = editingSectionId === sec.id;
            const hasBeds = parseInt(sec.bedCount, 10) > 0;

            return (
              <tr key={sec.id}>
                {/* Section Name: Input when editing, plain text otherwise */}
                <td>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleEditSubmit(e, sec.id)}
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        style={styles.inlineInput}
                        value={editSectionName}
                        onChange={(e) => setEditSectionName(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="action-btn"
                        style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none' }}
                        disabled={isSubmittingEdit}
                        title="Save Changes"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={cancelEditing}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {sec.sectionName}
                    </span>
                  )}
                </td>

                {/* Ward Name */}
                <td>
                  <span style={{ color: '#475569' }}>
                    {sec.wardName || 'Unknown Ward'}
                  </span>
                </td>

                {/* Bed Count */}
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: hasBeds ? '#eff6ff' : '#f1f5f9',
                      color: hasBeds ? '#1d4ed8' : '#64748b'
                    }}
                  >
                    🛏️ {sec.bedCount || 0} Beds
                  </span>
                </td>

                {/* Action Buttons */}
                <td>
                  <div className="table-actions">
                    {!isEditing && (
                      <>
                        <button
                          className="action-btn"
                          title="Rename Section"
                          onClick={() => startEditing(sec)}
                        >
                          ✏️ Rename
                        </button>
                        <button
                          className="action-btn"
                          style={{
                            color: hasBeds ? '#94a3b8' : '#ef4444',
                            cursor: hasBeds ? 'not-allowed' : 'pointer'
                          }}
                          title={
                            hasBeds
                              ? 'Cannot delete section while beds are assigned'
                              : 'Delete Section'
                          }
                          disabled={hasBeds}
                          onClick={() => initiateDelete(sec)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Ward Section"
        message={`Are you sure you want to delete section "${sectionToDelete?.sectionName}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Section'}
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

// Inline helper styles
const styles = {
  addCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px'
  },
  addForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-start'
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    height: '42px',
    display: 'inline-flex',
    alignItems: 'center'
  },
  inlineInput: {
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    minWidth: '180px'
  }
};

export default SectionManagementPage;
