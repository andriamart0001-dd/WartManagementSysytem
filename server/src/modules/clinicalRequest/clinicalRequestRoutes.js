// =============================================================================
// clinicalRequestRoutes.js — Route Definitions for Clinical Requests
// =============================================================================
// This file registers API endpoints for clinical requests and applies JWT
// authentication and role-based access control.
// =============================================================================

const express = require('express');
const router = express.Router();

const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');
const clinicalRequestController = require('./clinicalRequestController');

// GET /api/requests — List clinical requests (all staff roles can view)
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMISSION_DOCTOR),
  clinicalRequestController.getRequests
);

// GET /api/requests/pending-count — Total pending count for badges
router.get(
  '/pending-count',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  clinicalRequestController.getPendingCount
);

// GET /api/requests/:id — View single request details
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMISSION_DOCTOR),
  clinicalRequestController.getRequestById
);

// POST /api/requests — Doctor submits a discharge request
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN, ROLES.WARD_ADMIN),
  clinicalRequestController.createDischargeRequest
);

// PUT /api/requests/:id/approve — Ward Admin / Nurse approves request (triggers discharge)
router.put(
  '/:id/approve',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.NURSE),
  clinicalRequestController.approveRequest
);

// PUT /api/requests/:id/reject — Ward Admin / Nurse rejects request
router.put(
  '/:id/reject',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.NURSE),
  clinicalRequestController.rejectRequest
);

module.exports = router;
