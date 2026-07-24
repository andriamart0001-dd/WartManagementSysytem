// =============================================================================
// usersRoutes.js — User Management Route Definitions
// =============================================================================
// All routes here are protected by two middleware layers:
//   1. authenticateJWT  — Ensures the request has a valid JWT token
//   2. authorizeRoles   — Ensures the logged-in user is an admin
//
// Route overview:
//   GET    /api/users              — Get all users
//   GET    /api/users/:id          — Get a single user by ID
//   POST   /api/users              — Create a new user
//   PUT    /api/users/:id          — Update a user's information
//   PATCH  /api/users/:id/deactivate — Soft-deactivate a user
// =============================================================================

// Import Express and create a mini-router for user routes
const express = require('express');
const router = express.Router();

// Import the two middleware functions from our auth middleware file
const { authenticateJWT, authorizeRoles } = require('../../middleware/authMiddleware');

// Import the ROLES constant to avoid using magic strings
const { ROLES } = require('../../constants');

// Import all controller functions that handle the actual logic
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser
} = require('./usersController');

// =============================================================================
// ROUTE DEFINITIONS
// Every route uses both middleware to ensure:
//   a) The user is logged in (authenticateJWT)
//   b) The user is an admin (authorizeRoles)
// =============================================================================

// GET /api/users — Retrieve a list of all staff users
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  getAllUsers
);

// GET /api/users/:id — Retrieve a single user by their numeric ID
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  getUserById
);

// POST /api/users — Create a new staff user account
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  createUser
);

// PUT /api/users/:id — Update an existing user's information
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  updateUser
);

// PATCH /api/users/:id/deactivate — Soft-delete: mark user as inactive
router.patch(
  '/:id/deactivate',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  deactivateUser
);

// Export the router so the main app.js can mount it at /api/users
module.exports = router;
