// =============================================================================
// shortageAlertRoutes.js — Shortage Alert Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const alertController = require('./shortageAlertController');

// All staff can view alerts
router.get('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  alertController.getAlerts
);

// System/Admin/WardAdmin can log alerts
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  alertController.logAlert
);

// Resolve alerts
router.put('/:id/resolve', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  alertController.resolveAlert
);

module.exports = router;
