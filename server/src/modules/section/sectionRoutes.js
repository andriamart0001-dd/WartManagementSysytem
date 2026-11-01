// =============================================================================
// sectionRoutes.js — Route Definitions for Ward Sections
// =============================================================================
// This file registers API endpoints for ward sections and attaches the
// authentication and role authorization middleware to protect them.
// =============================================================================

const express = require('express');
const router = express.Router();

// Import auth middleware and system roles
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../constants');

// Import the section controller functions
const sectionController = require('./sectionController');

// GET /api/sections — View all sections (all authenticated staff can view)
router.get(
  '/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  sectionController.getSections
);

// GET /api/sections/:id — View a specific section by ID
router.get(
  '/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN, ROLES.ADMISSION_DOCTOR, ROLES.NURSE, ROLES.DOCTOR), 
  sectionController.getSectionById
);

// POST /api/sections — Create a new section (Admin and Ward Admin only)
router.post(
  '/', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  sectionController.createSection
);

// PUT /api/sections/:id — Update a section's name (Admin and Ward Admin only)
router.put(
  '/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  sectionController.updateSection
);

// DELETE /api/sections/:id — Delete a section (Admin and Ward Admin only)
router.delete(
  '/:id', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN), 
  sectionController.deleteSection
);

module.exports = router;
