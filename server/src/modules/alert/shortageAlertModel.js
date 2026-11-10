// =============================================================================
// shortageAlertModel.js — Database Queries for Shortage Alerts
// =============================================================================

const db = require('../../config/db');

// Find alerts by status, with optional ward filtering
const findAlertsByStatus = async (status, wardId = null) => {
  // Query to select all shortage alerts joined with ward and equipment tables
  let sql = `
    SELECT s.*, w.wardName, e.equipmentName, COALESCE(s.wardId, e.wardId) as effectiveWardId
    FROM shortageAlertLog s
    LEFT JOIN ward w ON s.wardId = w.id
    LEFT JOIN equipment e ON s.equipmentId = e.id
  `;
  const values = [];
  const whereClauses = [];

  if (status === 'active') {
    whereClauses.push('s.resolvedAt IS NULL');
  } else if (status === 'resolved') {
    whereClauses.push('s.resolvedAt IS NOT NULL');
  }

  if (wardId) {
    whereClauses.push('(s.wardId = ? OR e.wardId = ?)');
    values.push(wardId, wardId);
  }

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  sql += ' ORDER BY s.triggeredAt DESC';

  const [rows] = await db.query(sql, values);
  return rows;
};

const findActiveAlert = async (alertType, wardId, equipmentId) => {
  let sql = 'SELECT id FROM shortageAlertLog WHERE alertType = ? AND resolvedAt IS NULL';
  const values = [alertType];

  if (wardId) {
    sql += ' AND wardId = ?';
    values.push(wardId);
  } else if (equipmentId) {
    sql += ' AND equipmentId = ?';
    values.push(equipmentId);
  }

  const [rows] = await db.query(sql, values);
  return rows;
};

const insertAlert = async (insertValues) => {
  const sql = `
    INSERT INTO shortageAlertLog (wardId, equipmentId, alertType, triggeredAt, createdBy, updatedBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

const findAlertById = async (id) => {
  const sql = 'SELECT * FROM shortageAlertLog WHERE id = ?';
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const updateAlertResolved = async (id, resolvedAt, userId) => {
  const sql = `
    UPDATE shortageAlertLog 
    SET resolvedAt = ?, updatedBy = ? 
    WHERE id = ?
  `;
  await db.query(sql, [resolvedAt, userId, id]);
};

module.exports = {
  findAlertsByStatus,
  findActiveAlert,
  insertAlert,
  findAlertById,
  updateAlertResolved
};
