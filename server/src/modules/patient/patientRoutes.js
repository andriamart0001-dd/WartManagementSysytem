// =============================================================================
// patientRoutes.js — Route Definitions for Patient Management
// =============================================================================
// This router mounts endpoints for patient directory, NIC lookup, registration,
// and complete admission history. All endpoints require a valid JWT token.
// =============================================================================

const express = require('express');
const router = express.Router();

const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');
const patientController = require('./patientController');

// All authenticated roles can search and view patients
const ALL_STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.WARD_ADMIN,
  ROLES.ADMISSION_DOCTOR,
  ROLES.NURSE,
  ROLES.DOCTOR
];

// GET /api/patients — List & search patients
router.get('/', authenticateJWT, authorizeRoles(...ALL_STAFF_ROLES), patientController.getPatients);

// GET /api/patients/nic/:nic — Lookup patient by NIC (for admission auto-fill)
router.get('/nic/:nic', authenticateJWT, authorizeRoles(...ALL_STAFF_ROLES), patientController.getPatientByNIC);

// GET /api/patients/:id — View single patient profile
router.get('/:id', authenticateJWT, authorizeRoles(...ALL_STAFF_ROLES), patientController.getPatientById);

// GET /api/patients/:id/history — View complete admission history for a patient
router.get('/:id/history', authenticateJWT, authorizeRoles(...ALL_STAFF_ROLES), patientController.getPatientHistory);

// POST /api/patients — Register a new patient
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE),
  patientController.registerPatient
);

// PUT /api/patients/:id — Update patient profile details
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR),
  patientController.updatePatient
);

module.exports = router;
