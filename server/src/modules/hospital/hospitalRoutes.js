// =============================================================================
// hospitalRoutes.js — External Hospital Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const hospitalController = require('./hospitalController');

// GET /api/hospitals - View hospitals (all clinical and admin staff)
router.get('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  hospitalController.getAllHospitals
);

// POST /api/hospitals - Add hospital (Admin)
router.post('/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN), 
  hospitalController.createHospital
);

// PUT /api/hospitals/:id - Update hospital (Admin)
router.put('/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN), 
  hospitalController.updateHospital
);

// DELETE /api/hospitals/:id - Delete hospital (Admin)
router.delete('/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN), 
  hospitalController.deleteHospital
);

module.exports = router;
