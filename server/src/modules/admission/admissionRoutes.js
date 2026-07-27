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
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  admissionController.getAdmissions
);

// GET /api/admissions/history - View all admission history (filtered by query)
router.get('/history', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  admissionController.getAllAdmissions
);

// GET /api/admissions/:id - View details of a specific admission
router.get('/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  admissionController.getAdmissionById
);

// POST /api/admissions - Admit a new patient (Admin, WardAdmin, Staff)
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF), 
  admissionController.createAdmission
);

// POST /api/admissions/:id/discharge - Discharge patient (Admin, WardAdmin, Doctor)
router.post('/:id/discharge', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.DOCTOR), 
  admissionController.dischargePatient
);

// =============================================================================
// VITALS ROUTES (/api/admissions/:id/vitals)
// =============================================================================
const vitalsController = require('../vitals/vitalsController');

// POST /api/admissions/:id/vitals - Log vitals
router.post('/:id/vitals',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR),
  vitalsController.logVitals
);

// GET /api/admissions/:id/vitals - View vitals
router.get('/:id/vitals',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR),
  vitalsController.getVitals
);

module.exports = router;

