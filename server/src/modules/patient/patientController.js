// =============================================================================
// patientController.js — HTTP Handlers for Patient Management
// =============================================================================
// This controller handles incoming HTTP requests for patient operations:
//   - GET /api/patients -> list / search patients
//   - GET /api/patients/:id -> get single patient
//   - GET /api/patients/nic/:nic -> search by NIC for admission auto-fill
//   - GET /api/patients/:id/history -> get patient admission history
//   - POST /api/patients -> register a new patient
//   - PUT /api/patients/:id -> update patient details
// =============================================================================

const patientService = require('./patientService');

// Get all patients, with optional search filter (?search=...)
const getPatients = async (req, res) => {
  try {
    const searchTerm = req.query.search || req.query.q || '';
    const patients = await patientService.getAllPatients(searchTerm);

    return res.status(200).json({
      message: 'Patients retrieved successfully',
      count: patients.length,
      patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({
      message: 'Error retrieving patients'
    });
  }
};

// Get single patient by ID
const getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await patientService.getPatientById(patientId);

    return res.status(200).json({
      message: 'Patient retrieved successfully',
      patient
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error fetching patient by ID:', error);
    return res.status(500).json({
      message: 'Error retrieving patient details'
    });
  }
};

// Search patient by NIC (used for admission auto-fill)
const getPatientByNIC = async (req, res) => {
  try {
    const nic = req.params.nic;
    const patient = await patientService.getPatientByNIC(nic);

    return res.status(200).json({
      message: 'Patient found with this NIC',
      found: true,
      patient
    });
  } catch (error) {
    if (error.message.includes('No patient found')) {
      return res.status(404).json({
        message: error.message,
        found: false
      });
    }
    console.error('Error searching patient by NIC:', error);
    return res.status(500).json({
      message: 'Error searching patient by NIC'
    });
  }
};

// Get complete admission history for a patient
const getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    const historyData = await patientService.getPatientHistory(patientId);

    return res.status(200).json({
      message: 'Patient admission history retrieved successfully',
      ...historyData
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error fetching patient history:', error);
    return res.status(500).json({
      message: 'Error retrieving patient history'
    });
  }
};

// Register a new patient
const registerPatient = async (req, res) => {
  try {
    const userId = req.user.id;
    const newPatient = await patientService.registerPatient(req.body, userId);

    return res.status(201).json({
      message: 'Patient registered successfully',
      patient: newPatient
    });
  } catch (error) {
    // If patient already exists with this NIC, send 409 Conflict with details
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        message: error.message,
        existingPatient: error.existingPatient || null
      });
    }

    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error registering patient:', error);
    return res.status(500).json({
      message: 'Error registering patient'
    });
  }
};

// Update an existing patient
const updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.id;
    const updatedPatient = await patientService.updatePatient(patientId, req.body, userId);

    return res.status(200).json({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already registered')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error updating patient:', error);
    return res.status(500).json({
      message: 'Error updating patient'
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getPatientByNIC,
  getPatientHistory,
  registerPatient,
  updatePatient
};
