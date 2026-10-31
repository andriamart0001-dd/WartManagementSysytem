// =============================================================================
// patientService.js — Business Logic for Patient Identity & Records
// =============================================================================
// This service implements all business validation for patient registrations:
//   - Age calculation from date of birth (Under 16 = Minor)
//   - If minor: guardianName and guardianNIC are mandatory; patientNIC optional
//   - If adult (>= 16): patientNIC is mandatory and must be unique
//   - Querying patient admission histories and active admission status
// =============================================================================

const patientModel = require('./patientModel');
const { GENDER } = require('../../constants');

// Helper function: Calculate age in full years from date of birth
const calculateAge = (dateOfBirthString) => {
  const birthDate = new Date(dateOfBirthString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // If birth month hasn't occurred yet this year, or birth day hasn't occurred in this month
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Retrieve all patients, optionally filtered by name or NIC
const getAllPatients = async (searchTerm) => {
  return await patientModel.findAllPatients(searchTerm);
};

// Retrieve a single patient by their ID
const getPatientById = async (id) => {
  const patient = await patientModel.findPatientById(id);
  if (!patient) {
    throw new Error('Patient record not found');
  }
  return patient;
};

// Retrieve a patient by their National Identity Card (NIC) number
const getPatientByNIC = async (nic) => {
  if (!nic || !nic.trim()) {
    throw new Error('NIC number is required');
  }

  const patient = await patientModel.findPatientByNIC(nic.trim());
  if (!patient) {
    throw new Error('No patient found with this NIC');
  }
  return patient;
};

// Retrieve complete admission history for a specific patient
const getPatientHistory = async (id) => {
  const patient = await patientModel.findPatientById(id);
  if (!patient) {
    throw new Error('Patient record not found');
  }

  const history = await patientModel.findAdmissionHistoryByPatientId(id);
  const activeAdmission = await patientModel.findActiveAdmissionByPatientId(id);

  return {
    patient,
    activeAdmission,
    admissions: history
  };
};

// Register a new patient in the hospital directory
const registerPatient = async (patientData, userId) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    patientNIC,
    guardianName,
    guardianNIC,
    contactNumber,
    address,
    bloodGroup
  } = patientData;

  // Step 1: Validate mandatory core fields
  if (!fullName || !fullName.trim()) {
    throw new Error('Patient full name is required');
  }

  if (!dateOfBirth) {
    throw new Error('Date of birth is required');
  }

  if (!gender || !GENDER.includes(gender)) {
    throw new Error(`Invalid gender. Allowed values: ${GENDER.join(', ')}`);
  }

  // Step 2: Determine if patient is a minor (under 16 years old)
  const age = calculateAge(dateOfBirth);
  const isMinor = age < 16;

  // Step 3: Validate NIC requirements based on minor status
  let cleanNIC = patientNIC ? patientNIC.trim() : null;
  let cleanGuardianName = guardianName ? guardianName.trim() : null;
  let cleanGuardianNIC = guardianNIC ? guardianNIC.trim() : null;

  if (isMinor) {
    // For children under 16: guardian details are compulsory
    if (!cleanGuardianName || !cleanGuardianNIC) {
      throw new Error('Guardian Name and Guardian NIC are required for patients under 16 years of age');
    }
  } else {
    // For adults: patient's own NIC is compulsory
    if (!cleanNIC) {
      throw new Error('Patient NIC is required for patients 16 years of age or older');
    }

    // Check if an existing patient already has this NIC
    const existingPatient = await patientModel.findPatientByNIC(cleanNIC);
    if (existingPatient) {
      const error = new Error(`A patient is already registered with NIC '${cleanNIC}' (${existingPatient.fullName})`);
      error.existingPatient = existingPatient;
      throw error;
    }
  }

  // Step 4: Insert the new patient into the database
  const insertData = {
    fullName: fullName.trim(),
    dateOfBirth,
    gender,
    patientNIC: cleanNIC,
    isMinor,
    guardianName: cleanGuardianName,
    guardianNIC: cleanGuardianNIC,
    contactNumber: contactNumber ? contactNumber.trim() : null,
    address: address ? address.trim() : null,
    bloodGroup: bloodGroup || 'Unknown'
  };

  const newPatientId = await patientModel.createPatient(insertData, userId);
  return await patientModel.findPatientById(newPatientId);
};

// Update an existing patient's profile
const updatePatient = async (id, patientData, userId) => {
  const existingPatient = await patientModel.findPatientById(id);
  if (!existingPatient) {
    throw new Error('Patient record not found');
  }

  const {
    fullName,
    dateOfBirth,
    gender,
    patientNIC,
    guardianName,
    guardianNIC,
    contactNumber,
    address,
    bloodGroup
  } = patientData;

  if (!fullName || !fullName.trim()) {
    throw new Error('Patient full name is required');
  }

  if (!dateOfBirth) {
    throw new Error('Date of birth is required');
  }

  if (!gender || !GENDER.includes(gender)) {
    throw new Error(`Invalid gender. Allowed values: ${GENDER.join(', ')}`);
  }

  const age = calculateAge(dateOfBirth);
  const isMinor = age < 16;

  let cleanNIC = patientNIC ? patientNIC.trim() : null;
  let cleanGuardianName = guardianName ? guardianName.trim() : null;
  let cleanGuardianNIC = guardianNIC ? guardianNIC.trim() : null;

  if (isMinor) {
    if (!cleanGuardianName || !cleanGuardianNIC) {
      throw new Error('Guardian Name and Guardian NIC are required for patients under 16 years of age');
    }
  } else {
    if (!cleanNIC) {
      throw new Error('Patient NIC is required for patients 16 years of age or older');
    }

    // If NIC changed, ensure it's not taken by another patient
    if (cleanNIC !== existingPatient.patientNIC) {
      const duplicate = await patientModel.findPatientByNIC(cleanNIC);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new Error(`A patient is already registered with NIC '${cleanNIC}'`);
      }
    }
  }

  const updateData = {
    fullName: fullName.trim(),
    dateOfBirth,
    gender,
    patientNIC: cleanNIC,
    isMinor,
    guardianName: cleanGuardianName,
    guardianNIC: cleanGuardianNIC,
    contactNumber: contactNumber ? contactNumber.trim() : null,
    address: address ? address.trim() : null,
    bloodGroup: bloodGroup || existingPatient.bloodGroup || 'Unknown'
  };

  await patientModel.updatePatient(id, updateData, userId);
  return await patientModel.findPatientById(id);
};

module.exports = {
  calculateAge,
  getAllPatients,
  getPatientById,
  getPatientByNIC,
  getPatientHistory,
  registerPatient,
  updatePatient
};
