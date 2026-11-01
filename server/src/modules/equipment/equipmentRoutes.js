// =============================================================================
// equipmentRoutes.js — Equipment Management Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const equipmentController = require('./equipmentController');

// All staff can view equipment
router.get('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  equipmentController.getEquipment
);

// Admin and WardAdmin can register and update equipment
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  equipmentController.createEquipment
);

router.put('/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  equipmentController.updateEquipment
);

// Admin, WardAdmin, and Nurses can log maintenance
router.post('/:id/maintenance', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE), 
  equipmentController.logMaintenance
);

// View maintenance logs
router.get('/:id/maintenance', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  equipmentController.getMaintenanceLogs
);

module.exports = router;
