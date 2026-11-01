// =============================================================================
// admissionService.js — Business Logic for Admissions
// =============================================================================
// This service coordinates patient hospital admissions:
//   - Verifies the patient exists in the master `patient` table
//   - Prevents duplicate active admissions for the same patient
//   - Creates the admission row and marks the bed occupied
//   - Generates and embeds the patient QR code Data URL
// =============================================================================

const admissionModel = require('./admissionModel');
const patientModel = require('../patient/patientModel');
const qrcode = require('qrcode');
const { ADMISSION_STATUS } = require('../../constants');

// Retrieve all currently admitted patients
const getActiveAdmissions = async () => {
  return await admissionModel.findAllAdmissionsByStatus(ADMISSION_STATUS.ADMITTED);
};

// Retrieve a specific admission by ID
const getAdmissionById = async (id) => {
  const admission = await admissionModel.findAdmissionById(id);
  if (!admission) {
    throw new Error('Admission record not found');
  }
  return admission;
};

// Create a new patient admission
const createAdmission = async (admissionData, userId) => {
  const {
    patientId,
    wardId,
    bedId,
    admissionNotes,
    emergencyContactName,
    emergencyContactNumber
  } = admissionData;

  // Step 1: Validate mandatory fields
  if (!patientId || !wardId) {
    throw new Error('patientId and wardId are required');
  }

  // Step 2: Verify that the patient exists in the master directory
  const patient = await patientModel.findPatientById(patientId);
  if (!patient) {
    throw new Error('Patient record not found. Please register the patient first.');
  }

  // Step 3: Ensure patient is not already admitted in any ward
  const activeStay = await patientModel.findActiveAdmissionByPatientId(patientId);
  if (activeStay) {
    throw new Error(
      `Patient '${patient.fullName}' is currently already admitted in ${activeStay.wardName || 'a ward'} (Bed: ${activeStay.bedNumber || 'Unassigned'}). Please discharge or transfer first.`
    );
  }

  const admissionDate = new Date();

  const fullData = {
    patientId,
    wardId,
    bedId: bedId || null,
    admissionNotes: admissionNotes || null,
    emergencyContactName: emergencyContactName || null,
    emergencyContactNumber: emergencyContactNumber || null,
    admissionDate,
    status: ADMISSION_STATUS.ADMITTED
  };

  // Step 4: Perform admission transaction
  const admissionId = await admissionModel.transactionCreateAdmission(fullData, userId);

  // Step 5: Generate QR Code for the admission
  const qrPayload = JSON.stringify({
    admissionId: admissionId,
    patientId: patient.id,
    patientName: patient.fullName,
    patientNIC: patient.patientNIC || patient.guardianNIC || 'Minor',
    wardId: wardId,
    admissionDate: admissionDate.toISOString()
  });

  const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

  // Step 6: Store QR code on admission record
  await admissionModel.updateAdmissionQR(admissionId, qrCodeDataUrl);

  // Step 7: Return full admission details
  return await admissionModel.findAdmissionById(admissionId);
};

// Discharge a patient from the hospital
const dischargePatient = async (id, dischargeNotes, userId) => {
  await admissionModel.transactionDischargePatient(id, dischargeNotes, userId);
  return await admissionModel.findAdmissionById(id);
};

// Retrieve historical admissions with optional search and status filters
const getAllAdmissionsHistory = async (status, search) => {
  return await admissionModel.searchAdmissions(status, search);
};

module.exports = {
  getActiveAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  getAllAdmissionsHistory
};
