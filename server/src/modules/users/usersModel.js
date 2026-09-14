// =============================================================================
// usersModel.js — Database Queries for Users
// =============================================================================
// This file ONLY talks to the database. No HTTP, no business rules.
// =============================================================================

const db = require('../../config/db');

// Find all users (with their assigned ward if any)
const findAllUsers = async () => {
  const sql = `
    SELECT u.*, uwa.wardId AS assignedWardId 
    FROM users u
    LEFT JOIN user_ward_assignments uwa ON u.id = uwa.userId
    ORDER BY u.createdAt DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
};

// Find user by ID (with assigned ward)
const findUserById = async (userId) => {
  const sql = `
    SELECT u.*, uwa.wardId AS assignedWardId 
    FROM users u
    LEFT JOIN user_ward_assignments uwa ON u.id = uwa.userId
    WHERE u.id = ? 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

// Find user by email
const findUserByEmail = async (email) => {
  const sql = 'SELECT id FROM users WHERE email = ? LIMIT 1';
  const [rows] = await db.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
};

// Insert a new user
const insertUser = async (insertValues) => {
  const sql = `
    INSERT INTO users (fullName, email, passwordHash, role, contactNumber, status, isTemporaryPassword, createdBy, updatedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

// Assign ward to user
const assignWardToUser = async (userId, wardId) => {
  const sql = `INSERT INTO user_ward_assignments (userId, wardId) VALUES (?, ?)`;
  await db.query(sql, [userId, wardId]);
};

// Delete user's ward assignment
const deleteUserWardAssignment = async (userId) => {
  const sql = 'DELETE FROM user_ward_assignments WHERE userId = ?';
  await db.query(sql, [userId]);
};

// Update existing user details
const updateUser = async (updateSql, updateValues) => {
  await db.query(updateSql, updateValues);
};

// Get minimal user status info
const findUserStatus = async (userId) => {
  const sql = 'SELECT id, status FROM users WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

// Deactivate user
const deactivateUserStatus = async (userId, status, updatedBy) => {
  const sql = `
    UPDATE users
    SET status = ?, updatedBy = ?
    WHERE id = ?
  `;
  await db.query(sql, [status, updatedBy, userId]);
};

module.exports = {
  findAllUsers,
  findUserById,
  findUserByEmail,
  insertUser,
  assignWardToUser,
  deleteUserWardAssignment,
  updateUser,
  findUserStatus,
  deactivateUserStatus
};
