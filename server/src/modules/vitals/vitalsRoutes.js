// =============================================================================
// vitalsRoutes.js — Patient Vitals API Routes
// =============================================================================
// Defines the HTTP routes for logging and retrieving patient vitals.
// These routes are mounted under /api/admissions in index.js.
// =============================================================================

const express = require('express');

// Create a new Express router for vitals routes
const router = express.Router({ mergeParams: true });

// Import the auth middleware to protect all routes
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');

// Import the vitals controller functions
const { logVitals, getVitals } = require('./vitalsController');

// Import role constants so we don't use magic strings
const { ROLES } = require('../../constants');

// =============================================================================
// ROUTE: POST /api/admissions/:id/vitals
// Purpose: Log new vitals (temperature, blood pressure, pulse) for a patient
// Access: Doctors and Staff can log vitals
// =============================================================================
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.DOCTOR, ROLES.STAFF, ROLES.WARD_ADMIN),
  logVitals
);

// =============================================================================
// ROUTE: GET /api/admissions/:id/vitals
// Purpose: Retrieve the full vitals history for an admission record
// Access: Doctors, Ward Admins, and Staff can view vitals
// =============================================================================
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.DOCTOR, ROLES.STAFF, ROLES.WARD_ADMIN, ROLES.ADMIN),
  getVitals
);

module.exports = router;
