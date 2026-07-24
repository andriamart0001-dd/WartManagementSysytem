// =============================================================================
// authController.js — Handles Login Authentication
// =============================================================================
// This controller contains the logic for the login endpoint.
// It does the following steps:
//   1. Receives the email and password from the request body.
//   2. Looks up the user in the database by their email address.
//   3. Uses bcrypt to safely compare the submitted password with the stored hash.
//   4. If correct, generates a JWT (JSON Web Token) that the frontend will store
//      and send with every future request to prove who they are.
// =============================================================================

// Import the database connection pool
const db = require('../../config/db');

// Import bcryptjs for comparing hashed passwords
const bcrypt = require('bcryptjs');

// Import jsonwebtoken for creating the JWT after a successful login
const jwt = require('jsonwebtoken');

// Import the USER_STATUS constant so we do not use a "magic string" 'active'
const { USER_STATUS } = require('../../constants');

// -----------------------------------------------------------------------------
// loginUser — POST /api/auth/login
// -----------------------------------------------------------------------------
// Accepts: { email, password } in the request body
// Returns: { token } on success, or an error message on failure
// -----------------------------------------------------------------------------
const loginUser = async (req, res) => {
  // Destructure the email and password from the incoming request body
  const { email, password } = req.body;

  // --- Step 1: Basic Input Validation ---
  // Make sure both email and password were actually sent in the request
  if (!email || !password) {
    return res.status(400).json({
      message: 'Please provide both email and password'
    });
  }

  try {
    // --- Step 2: Look up the user in the database ---
    // We search by email only — we will check the password separately with bcrypt
    // Using parameterized query (?) to prevent SQL injection
    const findUserSql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [rows] = await db.query(findUserSql, [email]);

    // If no user was found with that email, return a 401 Unauthorized error
    // We use a vague message on purpose so attackers cannot tell if the email exists
    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // The user was found — grab the first (and only) row
    const userRecord = rows[0];

    // --- Step 3: Check if the account is active ---
    // We do not allow inactive (deactivated) accounts to log in
    if (userRecord.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // --- Step 4: Compare the submitted password against the stored hash ---
    // bcrypt.compare() safely checks the plaintext password against the hash
    // It returns true if they match, false if they do not
    const isPasswordCorrect = await bcrypt.compare(password, userRecord.passwordHash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // --- Step 5: Build the JWT payload ---
    // The payload is the data we embed inside the token.
    // We only include non-sensitive information — never include the password hash!
    const tokenPayload = {
      id: userRecord.id,
      role: userRecord.role,
      fullName: userRecord.fullName
    };

    // --- Step 6: Sign and create the token ---
    // jwt.sign() creates the token using:
    //   - The payload (user data)
    //   - A secret key from our .env file (JWT_SECRET) — this keeps it tamper-proof
    //   - An expiration time from our .env file (JWT_EXPIRES_IN) e.g. "8h"
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // --- Step 7: Return the token to the client ---
    // The frontend will store this token and send it in the Authorization header
    // for all future protected requests
    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: userRecord.id,
        fullName: userRecord.fullName,
        email: userRecord.email,
        role: userRecord.role
      }
    });

  } catch (error) {
    // If anything unexpected goes wrong, log it on the server and send a
    // generic 500 error to the client (never expose internal error details)
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

// -----------------------------------------------------------------------------
// getMe — GET /api/auth/me
// -----------------------------------------------------------------------------
// Requires: authenticateJWT middleware (populates req.user)
// Returns: Profile information of the currently authenticated staff user
// -----------------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    // req.user.id is populated by authenticateJWT middleware
    const userId = req.user.id;

    // Fetch user details from database, omitting passwordHash
    const findUserSql = `
      SELECT id, fullName, email, role, contactNumber, status, createdAt, updatedAt
      FROM users
      WHERE id = ? LIMIT 1
    `;
    const [rows] = await db.query(findUserSql, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user: rows[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while retrieving user profile.'
    });
  }
};

// Export the controller functions so the route file can use them
module.exports = {
  loginUser,
  getMe
};

