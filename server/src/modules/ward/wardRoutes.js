// =============================================================================
// wardRoutes.js — Department and Ward Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const deptController = require('./departmentController');
const wardController = require('./wardController');

// =============================================================================
// DEPARTMENT ROUTES (/api/departments) - Mounted in index.js
// =============================================================================

// GET /api/departments - Accessible by admin and wardAdmin
router.get('/departments', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  deptController.getAllDepartments
);

// Admin-only department routes
router.post('/departments', authenticateJWT, authorizeRoles(ROLES.ADMIN), deptController.createDepartment);
router.put('/departments/:id', authenticateJWT, authorizeRoles(ROLES.ADMIN), deptController.updateDepartment);
router.delete('/departments/:id', authenticateJWT, authorizeRoles(ROLES.ADMIN), deptController.deleteDepartment);

// =============================================================================
// WARD ROUTES (/api/wards) - Mounted in index.js
// =============================================================================

// Everyone can view wards
router.get('/wards', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  wardController.getAllWards
);
router.get('/wards/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR), 
  wardController.getWardById
);

// Admin creates wards
router.post('/wards', authenticateJWT, authorizeRoles(ROLES.ADMIN), wardController.createWard);

// PUT /api/wards/:id - Update an existing ward
router.put('/wards/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  wardController.updateWard
);

// DELETE /api/wards/:id - Delete a ward
router.delete('/wards/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN), 
  wardController.deleteWard
);

module.exports = router;
