// =============================================================================
// authRoutes.js — Auth Module Route Definitions
// =============================================================================
// This file maps HTTP methods + URL paths to controller functions.
// Routes are "dumb" — they only connect a URL to a function.
// All actual logic lives in authController.js.
// =============================================================================

// Import Express and create a mini-router for auth routes
const express = require('express');
const router = express.Router();

// Import controller functions that handle auth endpoints
const { loginUser, getMe } = require('./authController');

// Import authentication middleware
const { authenticateJWT } = require('../../middleware/authMiddleware');

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
// Public route — no JWT required.
// The client sends { email, password } and receives a JWT token in return.
// -----------------------------------------------------------------------------
router.post('/login', loginUser);

// -----------------------------------------------------------------------------
// GET /api/auth/me
// -----------------------------------------------------------------------------
// Protected route — requires valid JWT token.
// Returns the profile of the currently logged-in user.
// -----------------------------------------------------------------------------
router.get('/me', authenticateJWT, getMe);

// Export the router so the main app.js can mount it at /api/auth
module.exports = router;

