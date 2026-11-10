import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';
import { BED_STATUS } from '../../../constants';

// =============================================================================
// EditBedPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to edit an existing bed in their assigned ward.
//   Guarantees the Ward Admin can only edit beds within their assigned ward.
//   Route: GET /ward-admin/beds/:id/edit
// =============================================================================

const EditBedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [wards, setWards] = useState([]);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    wardId: '',
    bedNumber: '',
    bedStatus: '',
    sectionId: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wardsRes, bedsRes, sectionsRes] = await Promise.all([
          axiosInstance.get('/wards'),
          axiosInstance.get('/beds'),
          axiosInstance.get('/sections')
        ]);

        const wardList = Array.isArray(wardsRes.data.wards) 
          ? wardsRes.data.wards 
          : (Array.isArray(wardsRes.data) ? wardsRes.data : []);
        setWards(wardList);

        const sectionList = Array.isArray(sectionsRes.data.sections)
          ? sectionsRes.data.sections
          : (Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setSections(sectionList);

        // Find the bed we're editing
        const bedList = Array.isArray(bedsRes.data.beds) 
          ? bedsRes.data.beds 
          : (Array.isArray(bedsRes.data) ? bedsRes.data : []);
        
        const targetBed = bedList.find(b => b.id.toString() === id);
        
        if (!targetBed) {
          addToast('Bed not found', 'error');
          navigate('/ward-admin/beds');
          return;
        }

        // Security check: Ward Admin can only edit beds in their assigned ward
        if (user?.assignedWardId && Number(targetBed.wardId) !== Number(user.assignedWardId)) {
          addToast('Access denied. You can only edit beds in your assigned ward.', 'error');
          navigate('/ward-admin/beds');
          return;
        }

        setFormData({
          wardId: targetBed.wardId?.toString() || (user?.assignedWardId ? user.assignedWardId.toString() : ''),
          bedNumber: targetBed.bedNumber || '',
          bedStatus: targetBed.status || targetBed.bedStatus || BED_STATUS.AVAILABLE,
          sectionId: targetBed.sectionId ? targetBed.sectionId.toString() : ''
        });

      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load bed details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, addToast, navigate, user?.assignedWardId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'wardId') {
      // If ward changes, clear the sectionId selection
      setFormData(prev => ({ ...prev, wardId: value, sectionId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.wardId || !formData.bedNumber || !formData.bedStatus) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        wardId: parseInt(formData.wardId, 10),
        bedNumber: formData.bedNumber.trim(),
        bedStatus: formData.bedStatus,
        sectionId: formData.sectionId ? parseInt(formData.sectionId, 10) : null
      };

      await axiosInstance.put(`/beds/${id}`, payload);
      addToast('Bed updated successfully', 'success');
      navigate('/ward-admin/beds');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }));
  
  // Available sections for the currently selected ward
  const availableSections = sections.filter(
    s => s.wardId && s.wardId.toString() === formData.wardId.toString()
  );

  const sectionOptions = [
    { value: '', label: '-- None (No Section) --' },
    ...availableSections.map(s => ({
      value: s.id.toString(),
      label: s.sectionName
    }))
  ];

  const statusOptions = [
    { value: BED_STATUS.AVAILABLE, label: 'Available' },
    { value: BED_STATUS.OCCUPIED, label: 'Occupied' },
    { value: BED_STATUS.MAINTENANCE, label: 'Maintenance' }
  ];

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <FormPageLayout
      title="Edit Bed"
      subtitle={`Update details for bed #${formData.bedNumber}`}
      icon="✏️"
      backTo="/ward-admin/beds"
      backLabel="Back to Bed Management"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="wardId" 
          type="select" 
          label="Assigned Ward" 
          value={formData.wardId} 
          onChange={handleChange} 
          options={wardOptions} 
          required 
          disabled={isSubmitting || Boolean(user?.assignedWardId)}
          helperText={user?.assignedWardName ? `Locked to ${user.assignedWardName}.` : undefined}
        />

        <FormField 
          id="sectionId" 
          type="select" 
          label="Assigned Section (Optional)" 
          value={formData.sectionId} 
          onChange={handleChange} 
          options={sectionOptions} 
          disabled={isSubmitting} 
        />
        
        <FormField 
          id="bedNumber" 
          type="text" 
          label="Bed Number / Identifier" 
          value={formData.bedNumber} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting} 
          placeholder="e.g., A-101, ICU-12"
        />

        <FormField 
          id="bedStatus" 
          type="select" 
          label="Bed Status" 
          value={formData.bedStatus} 
          onChange={handleChange} 
          options={statusOptions} 
          required 
          disabled={isSubmitting} 
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            type="button" 
            className="cancelBtn no-bg" 
            onClick={() => navigate('/ward-admin/beds')} 
            disabled={isSubmitting} 
            style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting} 
            style={{ width: 'auto', marginTop: 0 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default EditBedPage;
