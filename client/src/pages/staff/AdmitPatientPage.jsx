import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';
import QRPrintModal from '../../components/ui/QRPrintModal';

// =============================================================================
// AdmitPatientPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to admit a new patient.
//   Route: GET /admissions/new
// =============================================================================

const AdmitPatientPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

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
  
  // State for success QR Modal
  const [qrModalData, setQrModalData] = useState(null);

  // Fetch wards on mount
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await axiosInstance.get('/wards');
        const list = Array.isArray(res.data.wards) 
          ? res.data.wards 
          : (Array.isArray(res.data) ? res.data : []);
        setWards(list);
      } catch (err) {
        console.error('Failed to load wards', err);
        setWards([]);
      }
    };
    fetchWards();
  }, []);

  // Fetch beds when ward changes
  useEffect(() => {
    const fetchBeds = async () => {
      if (!formData.wardId) {
        setBeds([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/beds?wardId=${formData.wardId}`);
        const rawBeds = Array.isArray(res.data.beds) 
          ? res.data.beds 
          : (Array.isArray(res.data) ? res.data : []);
        // Only show available beds
        const availableBeds = rawBeds.filter(b => b.bedStatus === 'available' || b.status === 'available');
        setBeds(availableBeds);
        
        // Auto-select first available bed if none selected
        if (availableBeds.length > 0) {
          setFormData(prev => ({ ...prev, bedId: availableBeds[0].id.toString() }));
        } else {
          setFormData(prev => ({ ...prev, bedId: '' }));
        }
      } catch (err) {
        console.error('Failed to load beds', err);
        setBeds([]);
      }
    };

    fetchBeds();
  }, [formData.wardId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.age || !formData.gender || !formData.wardId || !formData.bedId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axiosInstance.post('/admissions', {
        patientName: formData.patientName,
        age: parseInt(formData.age),
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        wardId: parseInt(formData.wardId),
        bedId: parseInt(formData.bedId)
      });

      const newAdmission = response.data.admission || response.data;
      
      addToast('Patient admitted successfully', 'success');
      
      // Show QR modal instead of navigating immediately
      if (newAdmission && newAdmission.id) {
        setQrModalData({
          admissionId: newAdmission.id,
          patientName: newAdmission.patientName,
          wardName: newAdmission.wardName || `Ward ID: ${newAdmission.wardId}`,
          bedNumber: newAdmission.bedNumber || 'N/A',
          admissionDate: new Date(newAdmission.admissionDate || new Date()).toLocaleDateString()
        });
      } else {
        // Fallback if API response structure doesn't include the full object
        navigate('/staff');
      }
      
    } catch (err) {
      console.error('Admit error', err);
      setError(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRModalClose = () => {
    setQrModalData(null);
    navigate('/staff');
  };

  const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardName || w.name }));
  const bedOptions = beds.map(b => ({ value: b.id.toString(), label: `Bed ${b.bedNumber}` }));

  return (
    <>
      <FormPageLayout
        title="Admit New Patient"
        subtitle="Register a new patient and assign them to a ward."
        icon="📋"
        backTo="/staff"
        backLabel="Back to Dashboard"
      >
        <form onSubmit={handleSubmit}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button 
              type="button" 
              className="cancelBtn no-bg" 
              onClick={() => navigate('/staff')} 
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
              {isSubmitting ? 'Admitting...' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </FormPageLayout>

      {/* QR Print Modal overlay shown on success */}
      {qrModalData && (
        <QRPrintModal
          isOpen={!!qrModalData}
          onClose={handleQRModalClose}
          admissionId={qrModalData.admissionId}
          patientName={qrModalData.patientName}
          wardName={qrModalData.wardName}
          bedNumber={qrModalData.bedNumber}
          admissionDate={qrModalData.admissionDate}
        />
      )}
    </>
  );
};

export default AdmitPatientPage;
