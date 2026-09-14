// =============================================================================
// admissionService.js — Business Logic for Admissions
// =============================================================================

const admissionModel = require('./admissionModel');
const qrcode = require('qrcode');
const { ADMISSION_STATUS, GENDER } = require('../../constants');

const getActiveAdmissions = async () => {
  return await admissionModel.findAllAdmissionsByStatus(ADMISSION_STATUS.ADMITTED);
};

const getAdmissionById = async (id) => {
  const admission = await admissionModel.findAdmissionById(id);
  if (!admission) throw new Error('Admission record not found');
  return admission;
};

const createAdmission = async (admissionData, userId) => {
  const { patientName, age, gender, wardId } = admissionData;

  if (!patientName || !age || !gender || !wardId) {
    throw new Error('patientName, age, gender, and wardId are required');
  }

  if (!GENDER.includes(gender)) {
    throw new Error(`Invalid gender. Allowed: ${GENDER.join(', ')}`);
  }

  const admissionDate = new Date();
  
  const fullData = {
    ...admissionData,
    admissionDate,
    status: ADMISSION_STATUS.ADMITTED
  };

  const admissionId = await admissionModel.transactionCreateAdmission(fullData, userId);

  // Generate QR Code
  const qrPayload = JSON.stringify({
    admissionId: admissionId,
    patientName: patientName,
    admissionDate: admissionDate.toISOString()
  });
  
  const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);
  
  // Update record with QR code
  await admissionModel.updateAdmissionQR(admissionId, qrCodeDataUrl);

  return await admissionModel.findSimpleAdmissionById(admissionId);
};

const dischargePatient = async (id, dischargeNotes, userId) => {
  await admissionModel.transactionDischargePatient(id, dischargeNotes, userId);
  return await admissionModel.findSimpleAdmissionById(id);
};

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
