import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';
import FormField from '../../../components/ui/FormField';
import FormPageLayout from '../../../components/ui/FormPageLayout';

// =============================================================================
// AddBedPage.jsx
// =============================================================================
// Purpose:
//   Ward Admin interface to add a new bed to a ward.
//   Supports assigning the bed to an optional Ward Section.
//   Route: GET /ward-admin/beds/new
// =============================================================================

const AddBedPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ bedNumber: '', wardId: '', sectionId: '' });
  const [wards, setWards] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wardsRes, sectionsRes] = await Promise.all([
          axiosInstance.get('/wards'),
          axiosInstance.get('/sections')
        ]);

        const wardList = Array.isArray(wardsRes.data.wards) 
          ? wardsRes.data.wards 
          : (Array.isArray(wardsRes.data) ? wardsRes.data : []);

        const sectionList = Array.isArray(sectionsRes.data.sections)
          ? sectionsRes.data.sections
          : (Array.isArray(sectionsRes.data) ? sectionsRes.data : []);

        setWards(wardList);
        setSections(sectionList);
        
        if (wardList.length > 0) {
          setFormData(prev => ({ ...prev, wardId: wardList[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error fetching wards and sections:', err);
        setError('Failed to load wards and sections');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const wardOptions = wards.map(w => ({ 
    value: w.id.toString(), 
    label: w.wardName || w.name 
  }));

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

  const handleChange = (e) => {
    const { id, value } = e.target;
    // If ward changes, reset sectionId
    if (id === 'wardId') {
      setFormData(prev => ({ ...prev, wardId: value, sectionId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bedNumber.trim() || !formData.wardId) {
      setError('Bed Number and Ward are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { 
        bedNumber: formData.bedNumber.trim(), 
        wardId: parseInt(formData.wardId, 10),
        sectionId: formData.sectionId ? parseInt(formData.sectionId, 10) : null
      };
      await axiosInstance.post('/beds', payload);
      addToast('Bed created successfully', 'success');
      navigate('/ward-admin/beds');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to create bed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <FormPageLayout title="Add New Bed" backTo="/ward-admin/beds" backLabel="Back to Beds">
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Add New Bed"
      subtitle="Register a new bed in a specific ward and optional section."
      icon="🛏️"
      backTo="/ward-admin/beds"
      backLabel="Back to Beds"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <FormField 
          id="bedNumber" 
          label="Bed Number / Identifier (e.g. A-12)" 
          value={formData.bedNumber} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <FormField 
          id="wardId" 
          type="select" 
          label="Assigned Ward" 
          value={formData.wardId} 
          onChange={handleChange} 
          options={wardOptions}
          required
          disabled={isSubmitting}
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
            {isSubmitting ? 'Saving...' : 'Save Bed'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default AddBedPage;
