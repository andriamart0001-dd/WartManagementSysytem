// =============================================================================
// transferRoutes.js — Transfer Management Route Definitions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

const transferController = require('./transferController');

// All staff roles can initiate transfers
const allowedTransferRoles = [ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.STAFF, ROLES.DOCTOR];

// GET /api/transfers/hospitals - View reference hospitals
router.get('/hospitals', 
  authenticateJWT, 
  authorizeRoles(...allowedTransferRoles), 
  transferController.getHospitals
);

// POST /api/transfers/internal - Internal hospital transfer
router.post('/internal', 
  authenticateJWT, 
  authorizeRoles(...allowedTransferRoles), 
  transferController.internalTransfer
);

// POST /api/transfers/external - External hospital transfer
router.post('/external', 
  authenticateJWT, 
  authorizeRoles(...allowedTransferRoles), 
  transferController.externalTransfer
);

// POST /api/transfers/external/:id/return - Return from external hospital
router.post('/external/:id/return', 
  authenticateJWT, 
  authorizeRoles(...allowedTransferRoles), 
  transferController.returnExternalTransfer
);

module.exports = router;
