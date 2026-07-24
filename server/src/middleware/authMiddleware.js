// =============================================================================
// authMiddleware.js — JWT Authentication & Role-Based Access Control
// =============================================================================
// This file exports two middleware functions:
//
//   1. authenticateJWT  — Verifies the JWT on every protected route.
//                         If valid, it attaches the decoded user info to
//                         req.user so controllers can read it (e.g. req.user.id).
//
//   2. authorizeRoles   — A "role guard" that you wrap around a route to say
//                         "only these roles are allowed to use this endpoint."
//                         Must be used AFTER authenticateJWT.
//
// Usage in a route file:
//   const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
//   const { ROLES } = require('../constants');
//
//   // Only admins can access this:
//   router.get('/', authenticateJWT, authorizeRoles(ROLES.ADMIN), controller.getAll);
// =============================================================================

// Import jsonwebtoken so we can verify the token signature
const jwt = require('jsonwebtoken');

// Import the ROLES constant so we do not use magic strings
const { ROLES } = require('../constants');

// =============================================================================
// MIDDLEWARE 1: authenticateJWT
// =============================================================================
// This function runs before any protected controller.
// It checks the Authorization header for a Bearer token, verifies it,
// and if valid, stores the decoded user info in req.user for the next function.
// =============================================================================
const authenticateJWT = (req, res, next) => {
  // Read the Authorization header — it should look like: "Bearer <token>"
  const authorizationHeader = req.headers['authorization'];

  // If no Authorization header was sent at all, reject the request
  if (!authorizationHeader) {
    return res.status(401).json({
      message: 'Access denied. No authorization token was provided.'
    });
  }

  // The header format is "Bearer <token>", so we split by space to get just the token
  // Example: "Bearer eyJhbGciOiJ..." → parts[1] = "eyJhbGciOiJ..."
  const parts = authorizationHeader.split(' ');
  const token = parts[1];

  // If the format is wrong (missing the word "Bearer" or the token itself), reject
  if (!token || parts[0] !== 'Bearer') {
    return res.status(401).json({
      message: 'Access denied. Token format must be: Bearer <token>'
    });
  }

  try {
    // Verify the token using our secret key from the .env file.
    // jwt.verify() will throw an error if the token is expired or tampered with.
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user data to req.user so controllers can access it.
    // The decoded payload will contain: { id, role, fullName }
    req.user = decodedPayload;

    // Call next() to pass control to the next middleware or controller function
    next();

  } catch (error) {
    // If jwt.verify() fails (expired, bad signature, etc.), tell the client
    return res.status(401).json({
      message: 'Access denied. Your token is invalid or has expired. Please log in again.'
    });
  }
};

// =============================================================================
// MIDDLEWARE 2: authorizeRoles
// =============================================================================
// This is a "middleware factory" — it RETURNS a middleware function.
// You call it with the roles that are allowed: authorizeRoles(ROLES.ADMIN, ROLES.WARD_ADMIN)
// It returns a function that checks if the logged-in user's role is in that list.
//
// IMPORTANT: Always use authenticateJWT BEFORE authorizeRoles, because
//            authorizeRoles reads from req.user which authenticateJWT populates.
// =============================================================================
const authorizeRoles = (...allowedRoles) => {
  // Return the actual middleware function
  return (req, res, next) => {
    // req.user was set by authenticateJWT — it contains the role from the JWT
    const userRole = req.user.role;

    // Check if the user's role is included in the list of allowed roles
    const isAllowed = allowedRoles.includes(userRole);

    if (!isAllowed) {
      // The user is authenticated but does not have the right role for this route
      return res.status(403).json({
        message: `Access forbidden. Your role ('${userRole}') does not have permission to access this resource.`
      });
    }

    // Role is valid — allow the request to continue to the controller
    next();
  };
};

// Export both middleware functions for use in route files
module.exports = {
  authenticateJWT,
  authorizeRoles
};
