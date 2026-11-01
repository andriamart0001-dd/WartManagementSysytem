// =============================================================================
// sectionModel.js — Database Queries for Ward Sections
// =============================================================================
// This file handles all direct SQL queries for the "section" table in MySQL.
// It follows the project standard: raw mysql2 parameterized queries only.
// Each section belongs to a ward and can have multiple beds assigned to it.
// =============================================================================

const db = require('../../config/db');

// This function gets all sections from the database.
// If a wardId is provided, it filters sections by that specific ward.
// It also joins the ward table to get the ward name, and counts how many beds are in each section.
const findAllSections = async (wardId) => {
  // Query to select all sections along with their ward name and total assigned beds count
  let sql = `
    SELECT 
      s.id,
      s.sectionName,
      s.wardId,
      s.createdAt,
      s.updatedAt,
      s.createdBy,
      s.updatedBy,
      w.wardName,
      COUNT(b.id) AS bedCount
    FROM section s
    JOIN ward w ON s.wardId = w.id
    LEFT JOIN bed b ON b.sectionId = s.id
  `;
  const queryParams = [];

  // If a specific wardId was passed in the query string, filter by it
  if (wardId) {
    sql += ' WHERE s.wardId = ?';
    queryParams.push(wardId);
  }

  // Group by section id because we are using COUNT(b.id)
  sql += ' GROUP BY s.id ORDER BY s.wardId ASC, s.sectionName ASC';

  // Execute the parameterized query
  const [rows] = await db.query(sql, queryParams);
  return rows;
};

// This function finds a single section by its primary key ID
const findSectionById = async (id) => {
  // Query to fetch a section by ID, including its ward name and current bed count
  const sql = `
    SELECT 
      s.id,
      s.sectionName,
      s.wardId,
      s.createdAt,
      s.updatedAt,
      s.createdBy,
      s.updatedBy,
      w.wardName,
      COUNT(b.id) AS bedCount
    FROM section s
    JOIN ward w ON s.wardId = w.id
    LEFT JOIN bed b ON b.sectionId = s.id
    WHERE s.id = ?
    GROUP BY s.id
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [id]);
  // Return the single section object or null if not found
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function checks if a section with the given name already exists in the specified ward.
// excludeId is optional (used during update so we don't conflict with our own record).
const findSectionByNameInWard = async (sectionName, wardId, excludeId = null) => {
  let sql = 'SELECT id FROM section WHERE sectionName = ? AND wardId = ?';
  const queryParams = [sectionName, wardId];

  if (excludeId) {
    sql += ' AND id != ?';
    queryParams.push(excludeId);
  }

  const [rows] = await db.query(sql, queryParams);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function checks if a ward exists by ID
const checkWardExists = async (wardId) => {
  const sql = 'SELECT id FROM ward WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [wardId]);
  return rows.length > 0;
};

// This function counts how many beds are currently assigned to a section
const countBedsBySectionId = async (sectionId) => {
  const sql = 'SELECT COUNT(*) AS total FROM bed WHERE sectionId = ?';
  const [rows] = await db.query(sql, [sectionId]);
  return rows[0].total;
};

// This function inserts a new section record into the database
const createSection = async (sectionName, wardId, userId) => {
  // Query to insert a new section row with audit fields
  const sql = `
    INSERT INTO section (sectionName, wardId, createdBy, updatedBy)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [sectionName, wardId, userId, userId]);
  return result.insertId;
};

// This function updates the name of an existing section
const updateSectionName = async (id, sectionName, userId) => {
  // Query to update the section name and audit column updatedBy
  const sql = `
    UPDATE section 
    SET sectionName = ?, updatedBy = ? 
    WHERE id = ?
  `;

  const [result] = await db.query(sql, [sectionName, userId, id]);
  return result.affectedRows;
};

// This function deletes a section from the database by ID
const deleteSectionById = async (id) => {
  // Query to permanently delete a section row
  const sql = 'DELETE FROM section WHERE id = ?';
  const [result] = await db.query(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  findAllSections,
  findSectionById,
  findSectionByNameInWard,
  checkWardExists,
  countBedsBySectionId,
  createSection,
  updateSectionName,
  deleteSectionById
};
