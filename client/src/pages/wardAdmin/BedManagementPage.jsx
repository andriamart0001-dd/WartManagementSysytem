import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import FormField from '../../components/ui/FormField';

// =============================================================================
// BedManagementPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to view bed grid, list beds, and mark them for maintenance.
//   Strictly scoped to the Ward Admin's assigned ward.
// =============================================================================

const BedManagementPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState(
    user?.assignedWardId ? user.assignedWardId.toString() : ''
  );

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
      const bedList = Array.isArray(bedsRes.data.beds) 
        ? bedsRes.data.beds 
        : (Array.isArray(bedsRes.data) ? bedsRes.data : []);
      const wardList = Array.isArray(wardsRes.data.wards) 
        ? wardsRes.data.wards 
        : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

      setBeds(bedList);
      setWards(wardList);
      
      // If user has an assigned ward, strictly enforce it
      if (user?.assignedWardId) {
        setSelectedWardId(user.assignedWardId.toString());
      } else if (wardList.length > 0 && !selectedWardId) {
        setSelectedWardId(wardList[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load beds and wards', 'error');
      setBeds([]);
      setWards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [user?.assignedWardId]);

  const bedsArray = Array.isArray(beds) ? beds : [];
  const wardsArray = Array.isArray(wards) ? wards : [];

  // Filter beds based on selected ward
  const filteredBeds = selectedWardId 
    ? bedsArray.filter(b => b.wardId && b.wardId.toString() === selectedWardId)
    : bedsArray;

  const wardOptions = wardsArray.map(w => ({ 
    value: w.id.toString(), 
    label: w.wardName || w.name 
  }));

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
    return ward ? (ward.wardName || ward.name) : (user?.assignedWardName || 'Assigned Ward');
  };

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Bed Management" 
        subtitle={
          user?.assignedWardName 
            ? `Manage bed availability and maintenance for ${user.assignedWardName}.`
            : "Manage bed availability and maintenance schedules."
        }
        icon="🛏️"
        actionLabel="+ Add New Bed"
        onAction={() => navigate('/ward-admin/beds/new')}
      />

      {/* Ward Filter (Disabled for Ward Admin to enforce assigned ward) */}
      <div style={{ marginBottom: '24px', maxWidth: '340px' }}>
        <FormField 
          id="wardFilter"
          type="select"
          label={user?.assignedWardName ? `Ward: ${user.assignedWardName}` : "Select Ward to View"}
          value={selectedWardId}
          onChange={(e) => setSelectedWardId(e.target.value)}
          options={wardOptions}
          disabled={Boolean(user?.assignedWardId)}
          helperText={user?.assignedWardName ? "You are locked to your assigned ward." : undefined}
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
                ...getBedSquareStyle(bed.bedStatus || bed.status)
              }}
              title={`Bed ${bed.bedNumber}${bed.sectionName ? ` (${bed.sectionName})` : ''} - ${bed.bedStatus || bed.status}`}
            >
              {bed.bedNumber}
            </div>
          ))
        )}
      </div>

      {/* Data Table View */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>Bed Details</h3>
      <DataTable 
        columns={['Bed Number', 'Ward', 'Section', 'Status', 'Actions']} 
        isEmpty={!isLoading && filteredBeds.length === 0}
        emptyMessage="No beds found."
      >
        {isLoading ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading beds...</td>
          </tr>
        ) : (
          filteredBeds.map((bed) => (
            <tr key={`table-${bed.id}`}>
              <td style={{ fontWeight: 600 }}>{bed.bedNumber}</td>
              <td>{getDeptName(bed.wardId)}</td>
              <td>
                <span style={{ color: bed.sectionName ? '#0f172a' : '#94a3b8', fontStyle: bed.sectionName ? 'normal' : 'italic' }}>
                  {bed.sectionName || 'None'}
                </span>
              </td>
              <td>
                <StatusBadge status={bed.bedStatus || bed.status} />
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="action-btn"
                    onClick={() => navigate(`/ward-admin/beds/${bed.id}/edit`)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Edit
                  </button>
                  {bed.bedStatus === 'available' || bed.status === 'available' ? (
                    <button 
                      className="action-btn"
                      onClick={() => handleStatusChange(bed.id, 'maintenance')}
                      style={{ fontSize: '12px', padding: '4px 8px', color: '#854d0e', borderColor: '#eab308' }}
                    >
                      Maintenance
                    </button>
                  ) : bed.bedStatus === 'maintenance' || bed.status === 'maintenance' ? (
                    <button 
                      className="action-btn"
                      onClick={() => handleStatusChange(bed.id, 'available')}
                      style={{ fontSize: '12px', padding: '4px 8px', color: '#166534', borderColor: '#22c55e' }}
                    >
                      Mark Available
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
};

export default BedManagementPage;
