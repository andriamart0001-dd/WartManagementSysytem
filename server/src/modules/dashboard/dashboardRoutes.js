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
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  dashboardController.getSummary
);

module.exports = router;
