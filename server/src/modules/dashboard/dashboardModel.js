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

// Get bed counts (available, occupied, maintenance, total) grouped by each active ward
const getBedsBreakdownByWard = async () => {
  // Query to fetch every active ward with its bed counts broken down by bed status
  const sql = `
    SELECT
      w.id AS wardId,
      w.wardName,
      w.wardType,
      w.minBedThreshold,
      SUM(CASE WHEN b.bedStatus = ? THEN 1 ELSE 0 END) AS availableBeds,
      SUM(CASE WHEN b.bedStatus = ? THEN 1 ELSE 0 END) AS occupiedBeds,
      SUM(CASE WHEN b.bedStatus = ? THEN 1 ELSE 0 END) AS maintenanceBeds,
      COUNT(b.id) AS totalBeds
    FROM ward w
    LEFT JOIN bed b ON w.id = b.wardId
    WHERE w.status = ?
    GROUP BY w.id
    ORDER BY w.wardName ASC
  `;

  const values = [
    BED_STATUS.AVAILABLE,
    BED_STATUS.OCCUPIED,
    BED_STATUS.MAINTENANCE,
    WARD_STATUS.ACTIVE
  ];

  const [rows] = await db.query(sql, values);
  return rows;
};

// Get all medical equipment items across every ward for the system report
const getEquipmentBreakdownByWard = async () => {
  // Query to fetch equipment quantities, status, threshold, and ward name
  const sql = `
    SELECT
      e.id,
      e.equipmentName,
      e.quantity,
      e.status,
      e.minQuantityThreshold,
      w.wardName
    FROM equipment e
    JOIN ward w ON e.wardId = w.id
    ORDER BY w.wardName ASC, e.equipmentName ASC
  `;

  const [rows] = await db.query(sql);
  return rows;
};

// Count patient admissions, discharges, and external transfers for the current month
const getMonthlyAdmissionSummary = async () => {
  // Query to summarize admissions created in the current calendar month and year
  const sql = `
    SELECT
      COUNT(*) AS totalThisMonth,
      SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS currentlyAdmitted,
      SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS dischargedThisMonth,
      SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS transferredThisMonth
    FROM patientAdmission
    WHERE MONTH(admissionDate) = MONTH(CURDATE())
      AND YEAR(admissionDate) = YEAR(CURDATE())
  `;

  const values = [
    ADMISSION_STATUS.ADMITTED,
    ADMISSION_STATUS.DISCHARGED,
    ADMISSION_STATUS.TRANSFERRED_OUT
  ];

  const [rows] = await db.query(sql, values);
  return rows[0];
};

// Get the top 5 busiest active wards ranked by bed occupancy percentage
const getTopFiveBusiestWards = async () => {
  // Query to find the 5 active wards with the highest occupied-to-total bed ratio
  const sql = `
    SELECT
      w.id AS wardId,
      w.wardName,
      w.wardType,
      SUM(CASE WHEN b.bedStatus = ? THEN 1 ELSE 0 END) AS occupiedBeds,
      COUNT(b.id) AS totalBeds
    FROM ward w
    LEFT JOIN bed b ON w.id = b.wardId
    WHERE w.status = ?
    GROUP BY w.id
    HAVING totalBeds > 0
    ORDER BY (SUM(CASE WHEN b.bedStatus = ? THEN 1 ELSE 0 END) / COUNT(b.id)) DESC, w.wardName ASC
    LIMIT 5
  `;

  const values = [
    BED_STATUS.OCCUPIED,
    WARD_STATUS.ACTIVE,
    BED_STATUS.OCCUPIED
  ];

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
  getEquipmentShortages,
  getBedsBreakdownByWard,
  getEquipmentBreakdownByWard,
  getMonthlyAdmissionSummary,
  getTopFiveBusiestWards
};
