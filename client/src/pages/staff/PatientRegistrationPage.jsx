// =============================================================================
// PatientRegistrationPage.jsx — Register New Patient Directory Profile
// =============================================================================
// Purpose:
//   Allows hospital staff to register a patient in the master `patient` table.
//   Supports automatic age calculation from date of birth:
//   - Under 16 (Minor): Guardian details are required; NIC is optional.
//   - 16 or older (Adult): Patient NIC is required.
//   - Supports returnTo parameter (e.g. returnTo=admit) to proceed directly to admission.
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GENDER, BLOOD_GROUPS, ROLES } from '../../constants';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';

const PatientRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const initialNIC = searchParams.get('nic') || '';

  const { user } = useAuth();
  const { addToast } = useToast();
  const admitPath = user?.role === ROLES.ADMISSION_DOCTOR ? '/admission-doctor/admit' : '/staff/admit';

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    patientNIC: initialNIC,
    guardianName: '',
    guardianNIC: '',
    contactNumber: '',
    address: '',
    bloodGroup: 'Unknown'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingPatientFound, setExistingPatientFound] = useState(null);

  // Helper to calculate age and minor status from date of birth
  const calculateAgeInfo = (dobString) => {
    if (!dobString) return { age: null, isMinor: false };
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return { age, isMinor: age < 16 };
  };

  const { age, isMinor } = calculateAgeInfo(formData.dateOfBirth);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError('');
    setExistingPatientFound(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.fullName.trim() || !formData.dateOfBirth) {
      setError('Patient Full Name and Date of Birth are required.');
      return;
    }

    if (isMinor) {
      if (!formData.guardianName.trim() || !formData.guardianNIC.trim()) {
        setError('Guardian Name and Guardian NIC are required for patients under 16 years of age.');
        return;
      }
    } else {
      if (!formData.patientNIC.trim()) {
        setError('Patient NIC is required for patients 16 years of age or older.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setExistingPatientFound(null);

    try {
      const response = await axiosInstance.post('/patients', formData);
      const createdPatient = response.data.patient;

      addToast('Patient registered successfully in directory', 'success');

      if (returnTo === 'admit') {
        // Return to Admit Patient page with this patient pre-selected
        navigate(`${admitPath}?patientId=${createdPatient.id}`);
      } else {
        navigate('/admin/patients');
      }
    } catch (err) {
      console.error('Patient registration error:', err);
      if (err.response?.status === 409) {
        setError(err.response?.data?.message || 'Patient already exists with this NIC');
        if (err.response?.data?.existingPatient) {
          setExistingPatientFound(err.response.data.existingPatient);
        }
      } else {
        setError(err.response?.data?.message || 'Failed to register patient.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions = GENDER.map((g) => ({
    value: g,
    label: g.charAt(0).toUpperCase() + g.slice(1)
  }));

  const bloodGroupOptions = BLOOD_GROUPS.map((bg) => ({
    value: bg,
    label: bg
  }));

  return (
    <FormPageLayout
      title="Register New Patient"
      subtitle="Create a permanent patient profile with identity details and blood group."
      icon="🧑‍⚕️"
      backTo={returnTo === 'admit' ? admitPath : '/admin/patients'}
      backLabel={returnTo === 'admit' ? 'Back to Admission' : 'Back to Patients'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* If duplicate patient found, offer immediate navigation */}
        {existingPatientFound && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
              Existing Patient Record Found
            </h4>
            <p style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>
              <strong>{existingPatientFound.fullName}</strong> is already registered with NIC{' '}
              <strong>{existingPatientFound.patientNIC}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="submit-button"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                onClick={() => navigate(`${admitPath}?patientId=${existingPatientFound.id}`)}
              >
                Proceed to Admit This Patient
              </button>
              <button
                type="button"
                className="cancelBtn"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => navigate(`/admin/patients`)}
              >
                View Patient Profile
              </button>
            </div>
          </div>
        )}

        {/* Basic Demographics */}
        <FormField
          id="fullName"
          label="Patient Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="e.g. Kasun Kalhara Perera"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FormField
            id="dateOfBirth"
            type="date"
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />

          <FormField
            id="gender"
            type="select"
            label="Gender"
            value={formData.gender}
            onChange={handleChange}
            options={genderOptions}
            required
            disabled={isSubmitting}
          />

          <FormField
            id="bloodGroup"
            type="select"
            label="Blood Group"
            value={formData.bloodGroup}
            onChange={handleChange}
            options={bloodGroupOptions}
            disabled={isSubmitting}
          />
        </div>

        {/* Age Indicator Banner */}
        {age !== null && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: isMinor ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${isMinor ? '#fcd34d' : '#bbf7d0'}`,
              color: isMinor ? '#92400e' : '#166534',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {isMinor ? (
              <span>👶 Patient is <strong>{age} years old (Minor)</strong>. Guardian information is mandatory.</span>
            ) : (
              <span>🧑 Patient is <strong>{age} years old (Adult)</strong>. Patient NIC is required.</span>
            )}
          </div>
        )}

        {/* Adult NIC Section */}
        {!isMinor ? (
          <FormField
            id="patientNIC"
            label="Patient NIC Number"
            value={formData.patientNIC}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="e.g. 199512345678 or 951234567V"
          />
        ) : (
          /* Minor Guardian Section */
          <div
            style={{
              backgroundColor: '#fffbeb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #fef3c7',
              marginBottom: '16px'
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#b45309' }}>
              Guardian Information (Mandatory for Minors)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FormField
                id="guardianName"
                label="Guardian Full Name"
                value={formData.guardianName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                placeholder="Parent or Legal Guardian Name"
              />
              <FormField
                id="guardianNIC"
                label="Guardian NIC Number"
                value={formData.guardianNIC}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                placeholder="Guardian NIC"
              />
            </div>
            <FormField
              id="patientNIC"
              label="Patient Child NIC / Postal ID (Optional)"
              value={formData.patientNIC}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Leave blank if child does not have an ID"
            />
          </div>
        )}

        {/* Contact & Address */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FormField
            id="contactNumber"
            label="Contact Phone Number"
            value={formData.contactNumber}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. 0771234567"
          />
          <FormField
            id="address"
            label="Home Address"
            value={formData.address}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Street address, city"
          />
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            className="cancelBtn no-bg"
            onClick={() => navigate(returnTo === 'admit' ? '/staff/admit' : '/admin/patients')}
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
            {isSubmitting ? 'Registering...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
};

export default PatientRegistrationPage;
