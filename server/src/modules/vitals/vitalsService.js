// =============================================================================
// vitalsService.js — Business Logic for Vitals
// =============================================================================

const vitalsModel = require('./vitalsModel');

const logVitals = async (admissionId, vitalsData, userId) => {
  const { temperature, bloodPressure, pulse } = vitalsData;

  if (!temperature && !bloodPressure && !pulse) {
    throw new Error('At least one vital sign is required');
  }

  const admissionExists = await vitalsModel.checkAdmissionExists(admissionId);
  if (!admissionExists) {
    throw new Error('Admission record not found');
  }

  const recordedAt = new Date();

  const insertValues = [
    admissionId, 
    temperature || null, 
    bloodPressure || null, 
    pulse || null, 
    userId, 
    recordedAt, 
    userId, 
    userId
  ];

  await vitalsModel.insertVitals(insertValues);
};

const getVitals = async (admissionId) => {
  return await vitalsModel.findVitalsByAdmissionId(admissionId);
};

module.exports = {
  logVitals,
  getVitals
};
