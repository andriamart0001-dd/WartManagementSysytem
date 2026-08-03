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
// BedManagementPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to view bed grid, list beds, and mark them for maintenance.
//   Integrates with GET /beds, POST /beds, PUT /beds/:id/status, GET /wards
// =============================================================================

const BedManagementPage = () => {
  const { addToast } = useToast();

  // Data state
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState('');

  // Drawer (Form) state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ bedNumber: '', wardId: '' });
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bedsRes, wardsRes] = await Promise.all([
        axiosInstance.get('/beds'),
        axiosInstance.get('/wards')
      ]);
      setBeds(bedsRes.data);
      setWards(wardsRes.data);
      
      // Select first ward by default if available
      if (wardsRes.data.length > 0 && !selectedWardId) {
        setSelectedWardId(wardsRes.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load beds and wards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Filter beds based on selected ward
  const filteredBeds = selectedWardId 
    ? beds.filter(b => b.wardId.toString() === selectedWardId)
    : beds;

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.name }));

  // ===========================================================================
  // DRAWER & FORM HANDLING (Add Bed)
  // ===========================================================================
  const openAddDrawer = () => {
    setFormData({ 
      bedNumber: '', 
      wardId: selectedWardId || (wards.length > 0 ? wards[0].id.toString() : '') 
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
    if (!formData.bedNumber.trim() || !formData.wardId) {
      setFormError('Bed Number and Ward are required.');
      return;
    }

    setFormIsSubmitting(true);
    setFormError('');

    try {
      const payload = { 
        bedNumber: formData.bedNumber, 
        wardId: parseInt(formData.wardId, 10) 
      };
      await axiosInstance.post('/beds', payload);
      addToast('Bed created successfully', 'success');
      
      closeDrawer();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      setFormError(error.response?.data?.message || 'Failed to save bed.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // ===========================================================================
  // BED STATUS HANDLING
  // ===========================================================================
  const handleStatusChange = async (bedId, newStatus) => {
    try {
      await axiosInstance.put(`/beds/${bedId}/status`, { status: newStatus });
      addToast(`Bed marked as ${newStatus}`, 'success');
      fetchData(); // Refresh list to get updated status
    } catch (error) {
      console.error('Status update error:', error);
      addToast(error.response?.data?.message || 'Failed to update bed status', 'error');
    }
  };

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  // Color code bed square based on status
  const getBedSquareStyle = (status) => {
    switch (status) {
      case 'available': return { backgroundColor: '#dcfce7', borderColor: '#22c55e', color: '#166534' };
      case 'occupied': return { backgroundColor: '#fee2e2', borderColor: '#ef4444', color: '#991b1b' };
      case 'maintenance': return { backgroundColor: '#fef9c3', borderColor: '#eab308', color: '#854d0e' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#94a3b8', color: '#334155' };
    }
  };

  const getDeptName = (wardId) => {
    const ward = wards.find(w => w.id.toString() === wardId.toString());
    return ward ? ward.name : 'Unknown';
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Bed Management" 
        subtitle="Manage bed availability and maintenance schedules."
        icon="🛏️"
        actionLabel="+ Add New Bed"
        onAction={openAddDrawer}
      />

      {/* Ward Filter */}
      <div style={{ marginBottom: '24px', maxWidth: '300px' }}>
        <FormField 
          id="wardFilter"
          type="select"
          label="Select Ward to View"
          value={selectedWardId}
          onChange={(e) => setSelectedWardId(e.target.value)}
          options={wardOptions}
        />
      </div>

      {/* Bed Grid View */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>Bed Grid Overview</h3>
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px', 
        backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' 
      }}>
        {isLoading ? (
          <p>Loading grid...</p>
        ) : filteredBeds.length === 0 ? (
          <p style={{ color: '#64748b' }}>No beds found for this ward.</p>
        ) : (
          filteredBeds.map(bed => (
            <div 
              key={`grid-${bed.id}`}
              style={{
                width: '64px', height: '64px', borderRadius: '8px', border: '2px solid',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                ...getBedSquareStyle(bed.status)
              }}
              title={`Bed ${bed.bedNumber} - ${bed.status}`}
            >
              {bed.bedNumber}
            </div>
          ))
        )}
      </div>

      {/* Data Table View */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>Bed Details</h3>
      <DataTable 
        columns={['Bed Number', 'Ward', 'Status', 'Actions']} 
        isEmpty={!isLoading && filteredBeds.length === 0}
        emptyMessage="No beds found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading beds...</td>
          </tr>
        ) : (
          filteredBeds.map((bed) => (
            <tr key={`table-${bed.id}`}>
              <td style={{ fontWeight: 600 }}>{bed.bedNumber}</td>
              <td>{getDeptName(bed.wardId)}</td>
              <td>
                <StatusBadge status={bed.status} />
              </td>
              <td>
                <div className="table-actions">
                  {bed.status === 'available' && (
                    <button 
                      className="action-btn" 
                      title="Mark as Maintenance" 
                      onClick={() => handleStatusChange(bed.id, 'maintenance')}
                    >
                      🔧 Fix
                    </button>
                  )}
                  {bed.status === 'maintenance' && (
                    <button 
                      className="action-btn" 
                      title="Mark as Available" 
                      onClick={() => handleStatusChange(bed.id, 'available')}
                    >
                      ✅ Ready
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Add Form Drawer */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title="Add New Bed"
        footer={
          <>
            <button className="cancelBtn no-bg" onClick={closeDrawer} disabled={formIsSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
            <button className="submit-button" onClick={handleFormSubmit} disabled={formIsSubmitting} style={{ width: 'auto', marginTop: 0 }}>
              {formIsSubmitting ? 'Saving...' : 'Save Bed'}
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
          id="bedNumber" 
          label="Bed Number / Identifier (e.g. A-12)" 
          value={formData.bedNumber} 
          onChange={handleFormChange} 
          required 
          disabled={formIsSubmitting}
        />
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
      </SlideDrawer>
    </div>
  );
};

export default BedManagementPage;
