import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../constants';
import FormField from '../../components/ui/FormField';
import FormPageLayout from '../../components/ui/FormPageLayout';
import QRPrintModal from '../../components/ui/QRPrintModal';

// =============================================================================
// AdmitPatientPage.jsx
// =============================================================================
// Purpose:
//   Staff interface to admit a patient.
//   Step 1: Patient Identity Verification (by NIC lookup or pre-selected patient).
//           If patient exists, details auto-fill.
//           If patient does not exist, provides one-click path to registration.
//   Step 2: Assign Ward, optional Bed, and Admission Notes.
//   Step 3: Generates and displays Admission QR code on completion.
//
// Route: /staff/admit
// =============================================================================

const AdmitPatientPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');

  const { user } = useAuth();
  const { addToast } = useToast();
  const defaultDashboard = user?.role === ROLES.ADMISSION_DOCTOR ? '/admission-doctor' : '/staff';

  // Selected Patient State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nicQuery, setNicQuery] = useState('');
  const [isSearchingNIC, setIsSearchingNIC] = useState(false);
  const [nicSearchError, setNicSearchError] = useState('');

  // Location and Admission form states
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [formData, setFormData] = useState({
    wardId: '',
    bedId: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    admissionNotes: ''
  });

  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // State for success QR Modal
  const [qrModalData, setQrModalData] = useState(null);

  // If patientId is in query params (e.g. from Directory or Registration), fetch details
  useEffect(() => {
    if (!preSelectedPatientId) return;

    const fetchPreSelectedPatient = async () => {
      setIsLoadingPatient(true);
      try {
        const response = await axiosInstance.get(`/patients/${preSelectedPatientId}`);
        setSelectedPatient(response.data.patient);
        setNicQuery(response.data.patient.patientNIC || response.data.patient.guardianNIC || '');
      } catch (err) {
        console.error('Error fetching pre-selected patient:', err);
        addToast('Failed to load selected patient', 'error');
      } finally {
        setIsLoadingPatient(false);
      }
    };

    fetchPreSelectedPatient();
  }, [preSelectedPatientId, addToast]);

  // Fetch wards on mount
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await axiosInstance.get('/wards');
        const list = Array.isArray(res.data.wards)
          ? res.data.wards
          : Array.isArray(res.data)
          ? res.data
          : [];
        setWards(list);
      } catch (err) {
        console.error('Failed to load wards', err);
        setWards([]);
      }
    };
    fetchWards();
  }, []);

  // Fetch beds when selected ward changes
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
          : Array.isArray(res.data)
          ? res.data
          : [];

        // Only show available beds
        const availableBeds = rawBeds.filter(
          (b) => b.bedStatus === 'available' || b.status === 'available'
        );
        setBeds(availableBeds);

        // Reset bed selection when ward changes
        setFormData((prev) => ({ ...prev, bedId: '' }));
      } catch (err) {
        console.error('Failed to load beds', err);
        setBeds([]);
      }
    };

    fetchBeds();
  }, [formData.wardId]);

  // NIC Search Handler for Auto-Fill
  const handleNICSearch = async (e) => {
    if (e) e.preventDefault();
    if (!nicQuery.trim()) {
      setNicSearchError('Please enter a NIC number to search.');
      return;
    }

    setIsSearchingNIC(true);
    setNicSearchError('');
    setError('');

    try {
      const response = await axiosInstance.get(`/patients/nic/${encodeURIComponent(nicQuery.trim())}`);
      if (response.data.found && response.data.patient) {
        setSelectedPatient(response.data.patient);
        addToast(`Patient found: ${response.data.patient.fullName}`, 'success');
      }
    } catch (err) {
      console.warn('NIC lookup:', err);
      setSelectedPatient(null);
      setNicSearchError(
        `No patient found with NIC "${nicQuery.trim()}". You can register them now.`
      );
    } finally {
      setIsSearchingNIC(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError('Please search and select a patient first.');
      return;
    }

    if (!formData.wardId) {
      setError('Please assign a ward for this admission.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        patientId: selectedPatient.id,
        wardId: parseInt(formData.wardId, 10),
        bedId: formData.bedId ? parseInt(formData.bedId, 10) : null,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        admissionNotes: formData.admissionNotes
      };

      const response = await axiosInstance.post('/admissions', payload);
      const newAdmission = response.data.admission || response.data;

      addToast('Patient admitted successfully', 'success');

      // Show QR modal upon successful admission
      if (newAdmission && newAdmission.id) {
        setQrModalData({
          admissionId: newAdmission.id,
          patientName: selectedPatient.fullName,
          wardName: newAdmission.wardName || `Ward ID: ${newAdmission.wardId}`,
          bedNumber: newAdmission.bedNumber || 'Unassigned',
          admissionDate: new Date(newAdmission.admissionDate || new Date()).toLocaleDateString()
        });
      } else {
        navigate(defaultDashboard);
      }
    } catch (err) {
      console.error('Admit error:', err);
      setError(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRModalClose = () => {
    setQrModalData(null);
    navigate(defaultDashboard);
  };

  const wardOptions = wards.map((w) => ({
    value: w.id.toString(),
    label: w.wardName || w.name
  }));

  const bedOptions = [
    { value: '', label: '-- No Bed (Pre-Admission / Waiting) --' },
    ...beds.map((b) => ({
      value: b.id.toString(),
      label: `Bed ${b.bedNumber}${b.sectionName ? ` (${b.sectionName})` : ''}`
    }))
  ];

  return (
    <>
      <FormPageLayout
        title="Admit Patient"
        subtitle="Verify patient identity using NIC auto-fill, then assign to a ward."
        icon="📋"
        backTo={defaultDashboard}
        backLabel="Back to Dashboard"
      >
        {/* =================================================================== */}
        {/* SECTION 1: PATIENT IDENTITY LOOKUP / AUTO-FILL                     */}
        {/* =================================================================== */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
              Step 1: Patient Identity Verification
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="action-btn"
                onClick={() => navigate('/admin/patients')}
                style={{ fontSize: '12px' }}
              >
                🗂️ Browse Directory
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => navigate(`/staff/patients/new?returnTo=admit${nicQuery ? `&nic=${encodeURIComponent(nicQuery)}` : ''}`)}
                style={{ fontSize: '12px', color: '#0284c7', borderColor: '#bae6fd' }}
              >
                + Register New
              </button>
            </div>
          </div>

          {/* NIC Lookup Input */}
          {!selectedPatient ? (
            <div>
              <form onSubmit={handleNICSearch} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    id="nicQuery"
                    label="Enter Patient NIC / Guardian NIC"
                    value={nicQuery}
                    onChange={(e) => {
                      setNicQuery(e.target.value);
                      setNicSearchError('');
                    }}
                    placeholder="e.g. 199512345678 or 951234567V"
                    disabled={isSearchingNIC}
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  style={{ width: 'auto', marginBottom: '16px', height: '42px', padding: '0 20px', fontSize: '14px' }}
                  disabled={isSearchingNIC || !nicQuery.trim()}
                >
                  {isSearchingNIC ? 'Searching...' : '🔍 Search NIC'}
                </button>
              </form>

              {nicSearchError && (
                <div
                  style={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #ffedd5',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '8px',
                    color: '#c2410c',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>⚠️ {nicSearchError}</span>
                  <button
                    type="button"
                    className="submit-button"
                    style={{
                      width: 'auto',
                      marginTop: 0,
                      padding: '6px 14px',
                      fontSize: '13px',
                      backgroundColor: '#ea580c'
                    }}
                    onClick={() =>
                      navigate(
                        `/staff/patients/new?returnTo=admit&nic=${encodeURIComponent(
                          nicQuery.trim()
                        )}`
                      )
                    }
                  >
                    + Register Patient Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Selected Patient Preview Card */
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>✅</span>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#166534' }}>
                      {selectedPatient.fullName}
                    </h3>
                    {selectedPatient.isMinor && (
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600
                        }}
                      >
                        MINOR
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '13px',
                      color: '#475569',
                      marginTop: '8px'
                    }}
                  >
                    <span>
                      🆔 NIC: <strong>{selectedPatient.patientNIC || 'N/A (Minor)'}</strong>
                    </span>
                    {selectedPatient.guardianNIC && (
                      <span>
                        🛡️ Guardian: <strong>{selectedPatient.guardianName} ({selectedPatient.guardianNIC})</strong>
                      </span>
                    )}
                    <span>
                      🩸 Blood: <strong>{selectedPatient.bloodGroup || 'Unknown'}</strong>
                    </span>
                    <span>
                      🎂 DOB: <strong>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</strong>
                    </span>
                    {selectedPatient.contactNumber && (
                      <span>
                        📞 Phone: <strong>{selectedPatient.contactNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="cancelBtn"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => {
                    setSelectedPatient(null);
                    setNicQuery('');
                  }}
                  title="Select a different patient"
                >
                  Change Patient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: ADMISSION DETAILS & LOCATION                             */}
        {/* =================================================================== */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
            Step 2: Ward & Bed Assignment
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FormField
              id="wardId"
              type="select"
              label="Assigned Ward"
              value={formData.wardId}
              onChange={handleChange}
              options={wardOptions}
              required
              disabled={isSubmitting || !selectedPatient}
            />

            {formData.wardId && (
              <FormField
                id="bedId"
                type="select"
                label="Assign Bed (Optional)"
                value={formData.bedId}
                onChange={handleChange}
                options={bedOptions}
                disabled={isSubmitting || !selectedPatient}
              />
            )}
          </div>

          {formData.wardId && beds.length === 0 && (
            <p style={{ fontSize: '13px', color: '#b45309', marginTop: '-8px', marginBottom: '16px' }}>
              ⚠️ No beds currently available in this ward. Patient will be admitted without a bed assigned.
            </p>
          )}

          <h4 style={{ margin: '20px 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
            Step 3: Emergency Contact & Notes
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FormField
              id="emergencyContactName"
              label="Emergency Contact Name"
              value={formData.emergencyContactName}
              onChange={handleChange}
              disabled={isSubmitting || !selectedPatient}
              placeholder="e.g. Spouse, Parent, or Sibling"
            />

            <FormField
              id="emergencyContactNumber"
              label="Emergency Contact Phone"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              disabled={isSubmitting || !selectedPatient}
              placeholder="e.g. 0771234567"
            />
          </div>

          <FormField
            id="admissionNotes"
            label="Initial Admission / Medical Notes (Optional)"
            value={formData.admissionNotes}
            onChange={handleChange}
            disabled={isSubmitting || !selectedPatient}
            placeholder="Reason for admission, preliminary symptoms, allergies..."
          />

          {/* Form Submit Actions */}
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
              disabled={isSubmitting || !selectedPatient}
              style={{ width: 'auto', marginTop: 0 }}
            >
              {isSubmitting ? 'Admitting Patient...' : 'Confirm & Admit Patient'}
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
