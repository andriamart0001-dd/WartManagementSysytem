// =============================================================================
// dashboardRoutes.js — Dashboard Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const dashboardController = require('./dashboardController');

// GET /api/dashboard/summary - View overall dashboard statistics (Everyone can view)
router.get('/summary', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  dashboardController.getSummary
);

// GET /api/dashboard/report - View full hospital system report (Admin only)
router.get('/report',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  dashboardController.getReport
);

module.exports = router;
