// =============================================================================
// dashboardModel.js — Database Queries for Dashboard Summary
// =============================================================================

const db = require('../../config/db');
const { ADMISSION_STATUS, BED_STATUS, WARD_STATUS } = require('../../constants');

// Count active admissions (optionally filtered by ward)
const countActiveAdmissions = async (wardId = null) => {
  let sql = 'SELECT COUNT(id) as count FROM patientAdmission WHERE status = ?';
  const values = [ADMISSION_STATUS.ADMITTED];

  if (wardId) {
    sql += ' AND wardId = ?';
    values.push(wardId);
  }

  const [rows] = await db.query(sql, values);
  return rows[0].count;
};

// Count total patients (optionally filtered by admissions to this ward)
const countTotalPatients = async (wardId = null) => {
  if (wardId) {
    const sql = 'SELECT COUNT(DISTINCT patientId) as count FROM patientAdmission WHERE wardId = ?';
    const [rows] = await db.query(sql, [wardId]);
    return rows[0].count;
  }

  const [rows] = await db.query('SELECT COUNT(id) as count FROM patient');
  return rows[0].count;
};

// Count total users (optionally staff assigned to this ward)
const countTotalUsers = async (wardId = null) => {
  if (wardId) {
    const sql = 'SELECT COUNT(DISTINCT userId) as count FROM user_ward_assignments WHERE wardId = ?';
    const [rows] = await db.query(sql, [wardId]);
    return rows[0].count;
  }

  const [rows] = await db.query('SELECT COUNT(id) as count FROM users');
  return rows[0].count;
};

// Count active wards (1 if scoped to a ward, or total hospital wards)
const countTotalWards = async (wardId = null) => {
  if (wardId) {
    return 1;
  }
  const [rows] = await db.query('SELECT COUNT(id) as count FROM ward WHERE status = ?', [WARD_STATUS.ACTIVE]);
  return rows[0].count;
};

// Aggregate bed counts (optionally filtered by ward)
const getBedStats = async (wardId = null) => {
  let sql = `
    SELECT 
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as availableBeds,
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as occupiedBeds,
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as maintenanceBeds,
      COUNT(id) as totalBeds
    FROM bed
  `;
  const values = [BED_STATUS.AVAILABLE, BED_STATUS.OCCUPIED, BED_STATUS.MAINTENANCE];

  if (wardId) {
    sql += ' WHERE wardId = ?';
    values.push(wardId);
  }

  const [rows] = await db.query(sql, values);
  return rows[0];
};

// Find wards below their minimum bed threshold (optionally for a specific ward)
const getWardShortages = async (wardId = null) => {
  let sql = `
    SELECT w.id, w.wardName, w.minBedThreshold, 
           COUNT(b.id) as availableBeds
    FROM ward w
    LEFT JOIN bed b ON w.id = b.wardId AND b.bedStatus = ?
  `;
  const values = [BED_STATUS.AVAILABLE];

  if (wardId) {
    sql += ' WHERE w.id = ?';
    values.push(wardId);
  }

  sql += `
    GROUP BY w.id
    HAVING availableBeds < w.minBedThreshold
  `;

  const [rows] = await db.query(sql, values);
  return rows;
};

// Find equipment below minimum quantity threshold (optionally for a specific ward)
const getEquipmentShortages = async (wardId = null) => {
  let sql = `
    SELECT e.id, e.equipmentName, e.quantity, e.minQuantityThreshold, w.wardName
    FROM equipment e
    JOIN ward w ON e.wardId = w.id
    WHERE e.quantity < e.minQuantityThreshold
  `;
  const values = [];

  if (wardId) {
    sql += ' AND e.wardId = ?';
    values.push(wardId);
  }

  const [rows] = await db.query(sql, values);
  return rows;
};

module.exports = {
  countActiveAdmissions,
  countTotalPatients,
  countTotalUsers,
  countTotalWards,
  getBedStats,
  getWardShortages,
  getEquipmentShortages
};
