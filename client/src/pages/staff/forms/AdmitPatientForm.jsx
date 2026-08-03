import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import SlideDrawer from '../../../components/ui/SlideDrawer';
import FormField from '../../../components/ui/FormField';

// =============================================================================
// AdmitPatientForm.jsx
// =============================================================================
// Purpose:
//   Form component to admit a new patient. Handles ward and bed selection.
// Props:
//   - isOpen (boolean): Drawer visibility
//   - onClose (function): Close handler
//   - onSuccess (function): Called with the new admission data on success (for QR)
// =============================================================================

const AdmitPatientForm = ({ isOpen, onClose, onSuccess }) => {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    address: '',
    wardId: '',
    bedId: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch wards on mount
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await axiosInstance.get('/wards');
        setWards(res.data);
      } catch (err) {
        console.error('Failed to load wards', err);
      }
    };
    if (isOpen) fetchWards();
  }, [isOpen]);

  // Fetch beds when ward changes
  useEffect(() => {
    const fetchBeds = async () => {
      if (!formData.wardId) {
        setBeds([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/beds?wardId=${formData.wardId}`);
        // Only show available beds
        const availableBeds = res.data.filter(b => b.status === 'available');
        setBeds(availableBeds);
        
        // Auto-select first available bed if none selected
        if (availableBeds.length > 0) {
          setFormData(prev => ({ ...prev, bedId: availableBeds[0].id.toString() }));
        } else {
          setFormData(prev => ({ ...prev, bedId: '' }));
        }
      } catch (err) {
        console.error('Failed to load beds', err);
      }
    };
    if (isOpen && formData.wardId) fetchBeds();
  }, [formData.wardId, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.patientName || !formData.age || !formData.gender || !formData.wardId) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        wardId: parseInt(formData.wardId, 10),
        bedId: formData.bedId ? parseInt(formData.bedId, 10) : null
      };

      const res = await axiosInstance.post('/admissions', payload);
      onSuccess(res.data.admission); // Pass admission data back so parent can show QR modal
      
      // Reset form
      setFormData({
        patientName: '', age: '', gender: 'Male', contactNumber: '',
        emergencyContactName: '', emergencyContactNumber: '', address: '',
        wardId: '', bedId: ''
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.name }));
  const bedOptions = beds.map(b => ({ value: b.id.toString(), label: `Bed ${b.bedNumber}` }));

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Admit New Patient"
      footer={
        <>
          <button className="cancelBtn no-bg" onClick={onClose} disabled={isSubmitting} style={{ padding: '10px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px' }}>Cancel</button>
          <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting} style={{ width: 'auto', marginTop: 0 }}>
            {isSubmitting ? 'Admitting...' : 'Admit Patient'}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Personal Information</h4>
      <FormField id="patientName" label="Full Name" value={formData.patientName} onChange={handleChange} required disabled={isSubmitting} />
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <FormField id="age" type="number" label="Age" value={formData.age} onChange={handleChange} required disabled={isSubmitting} />
        </div>
        <div style={{ flex: 1 }}>
          <FormField id="gender" type="select" label="Gender" value={formData.gender} onChange={handleChange} options={[{value:'Male', label:'Male'}, {value:'Female', label:'Female'}, {value:'Other', label:'Other'}]} required disabled={isSubmitting} />
        </div>
      </div>

      <FormField id="contactNumber" label="Contact Number" value={formData.contactNumber} onChange={handleChange} disabled={isSubmitting} />

      <h4 style={{ margin: '24px 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Location Assignment</h4>
      <FormField id="wardId" type="select" label="Assign to Ward" value={formData.wardId} onChange={handleChange} options={wardOptions} required disabled={isSubmitting} />
      
      {formData.wardId && (
        <FormField 
          id="bedId" 
          type="select" 
          label="Assign Bed (Optional)" 
          value={formData.bedId} 
          onChange={handleChange} 
          options={bedOptions} 
          disabled={isSubmitting} 
        />
      )}
      {formData.wardId && beds.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--status-occupied)', marginTop: '-10px' }}>No available beds in this ward.</p>
      )}

    </SlideDrawer>
  );
};

export default AdmitPatientForm;
