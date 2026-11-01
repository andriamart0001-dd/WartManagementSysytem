// =============================================================================
// admissionController.js — HTTP Handler for Admissions
// =============================================================================

const admissionService = require('./admissionService');

// Retrieve all active admissions
const getAdmissions = async (req, res) => {
  try {
    const admissions = await admissionService.getActiveAdmissions();
    return res.status(200).json({
      message: 'Active admissions retrieved successfully',
      count: admissions.length,
      admissions
    });
  } catch (error) {
    console.error('Get admissions error:', error);
    return res.status(500).json({ message: 'Error retrieving admissions' });
  }
};

// Retrieve single admission by ID
const getAdmissionById = async (req, res) => {
  try {
    const admission = await admissionService.getAdmissionById(req.params.id);
    return res.status(200).json({
      message: 'Admission record retrieved successfully',
      admission
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Get admission by id error:', error);
    return res.status(500).json({ message: 'Error retrieving admission record' });
  }
};

// Admit a patient to a ward and bed
const createAdmission = async (req, res) => {
  try {
    const admission = await admissionService.createAdmission(req.body, req.user.id);
    return res.status(201).json({
      message: 'Patient admitted successfully',
      admission
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes('required') || 
      error.message.includes('already admitted') ||
      error.message.includes('not available')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create admission error:', error);
    return res.status(500).json({ message: 'Error admitting patient' });
  }
};

// Discharge a patient
const dischargePatient = async (req, res) => {
  try {
    const admission = await admissionService.dischargePatient(req.params.id, req.body.dischargeNotes, req.user.id);
    return res.status(200).json({
      message: 'Patient discharged successfully',
      admission
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already discharged')) {
      return res.status(400).json({ message: error.message });
    }
    
    console.error('Discharge patient error:', error);
    return res.status(500).json({ message: 'Error discharging patient' });
  }
};

// Get admissions history with optional search
const getAllAdmissions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const admissions = await admissionService.getAllAdmissionsHistory(status, search);
    return res.status(200).json({
      message: 'Admission history retrieved successfully',
      count: admissions.length,
      admissions
    });
  } catch (error) {
    console.error('Get all admissions error:', error);
    return res.status(500).json({ message: 'Error retrieving admission history' });
  }
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  getAllAdmissions
};
