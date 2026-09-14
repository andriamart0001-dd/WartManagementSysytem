// =============================================================================
// authModel.js — Database Queries for Auth
// =============================================================================
// This file ONLY talks to the database. No HTTP, no business rules.
// =============================================================================

const db = require('../../config/db');

// Find a user by email for login
const findUserByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  const [rows] = await db.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
};

// Find a user by ID and return their password hash (for password changes)
const getPasswordHashById = async (userId) => {
  const sql = 'SELECT passwordHash FROM users WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [userId]);
  return rows.length > 0 ? rows[0].passwordHash : null;
};

// Update a user's password and remove temporary flag
const updatePassword = async (userId, newHashedPassword) => {
  const sql = `
    UPDATE users 
    SET passwordHash = ?, isTemporaryPassword = false, updatedBy = ? 
    WHERE id = ?
  `;
  await db.query(sql, [newHashedPassword, userId, userId]);
};

// Fetch user profile details (omitting password hash)
const findUserProfileById = async (userId) => {
  const sql = `
    SELECT id, fullName, email, role, contactNumber, status, isTemporaryPassword, createdAt, updatedAt
    FROM users
    WHERE id = ? LIMIT 1
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
