// =============================================================================
// authModel.js — Database Queries for Auth
// =============================================================================
// This file ONLY talks to the database. No HTTP, no business rules.
// =============================================================================

const db = require('../../config/db');

// Find a user by email for login (also fetches their assigned ward if one exists)
const findUserByEmail = async (email) => {
  // Query users and join user_ward_assignments and ward to get assigned ward information
  const sql = `
    SELECT u.*, uwa.wardId AS assignedWardId, w.wardName AS assignedWardName
    FROM users u
    LEFT JOIN user_ward_assignments uwa ON u.id = uwa.userId
    LEFT JOIN ward w ON uwa.wardId = w.id
    WHERE u.email = ? 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
};

// Find a user by ID and return their password hash (for password changes)
const getPasswordHashById = async (userId) => {
  const sql = 'SELECT passwordHash FROM users WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [userId]);
  return rows.length > 0 ? rows[0].passwordHash : null;
};

// Update a user's password and clear the temporary password flag (set to 0)
const updatePassword = async (userId, newHashedPassword) => {
  // Clear isTemporaryPassword to 0 so the user is not prompted again
  const sql = `
    UPDATE users 
    SET passwordHash = ?, isTemporaryPassword = 0, updatedBy = ? 
    WHERE id = ?
  `;
  await db.query(sql, [newHashedPassword, userId, userId]);
};

// Fetch user profile details (omitting password hash, including assigned ward details)
const findUserProfileById = async (userId) => {
  // Query user profile information along with assigned ward id and name
  const sql = `
    SELECT 
      u.id, 
      u.fullName, 
      u.email, 
      u.role, 
      u.contactNumber, 
      u.status, 
      u.isTemporaryPassword, 
      u.createdAt, 
      u.updatedAt,
      uwa.wardId AS assignedWardId,
      w.wardName AS assignedWardName
    FROM users u
    LEFT JOIN user_ward_assignments uwa ON u.id = uwa.userId
    LEFT JOIN ward w ON uwa.wardId = w.id
    WHERE u.id = ? 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  findUserByEmail,
  getPasswordHashById,
  updatePassword,
  findUserProfileById
};
