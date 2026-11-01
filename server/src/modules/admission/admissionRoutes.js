// =============================================================================
// admissionRoutes.js — Admission Management Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const admissionController = require('./admissionController');

// GET /api/admissions - View all active admissions (everyone)
router.get('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  admissionController.getAdmissions
);

// GET /api/admissions/history - View all admission history (filtered by query)
router.get('/history', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  admissionController.getAllAdmissions
);

// GET /api/admissions/:id - View details of a specific admission
router.get('/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  admissionController.getAdmissionById
);

// POST /api/admissions - Admit a new patient (Admin, WardAdmin, AdmissionDoctor, Nurse)
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE), 
  admissionController.createAdmission
);

// POST /api/admissions/:id/discharge - Discharge patient (Admin, WardAdmin, Doctor)
router.post('/:id/discharge', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.DOCTOR), 
  admissionController.dischargePatient
);

// =============================================================================
// VITALS SUB-ROUTES (/api/admissions/:id/vitals)
// =============================================================================
// Delegate to vitalsRoutes so all vitals logic stays in its own module
const vitalsRoutes = require('../vitals/vitalsRoutes');
router.use('/:id/vitals', vitalsRoutes);

module.exports = router;

