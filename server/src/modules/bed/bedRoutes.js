// =============================================================================
// bedRoutes.js — Bed Management Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const bedController = require('./bedController');

// GET /api/beds - View beds (everyone can view)
router.get('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  bedController.getBeds
);

// POST /api/beds - Add bed (Admin and WardAdmin)
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  bedController.createBed
);

// PUT /api/beds/:id/status - Update bed status (Admin, WardAdmin, Staff)
router.put('/:id/status', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF), 
  bedController.updateBedStatus
);

module.exports = router;
