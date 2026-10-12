// =============================================================================
// dashboardModel.js — Database Queries for Dashboard Summary
// =============================================================================

const db = require('../../config/db');
const { ADMISSION_STATUS, BED_STATUS } = require('../../constants');

const countActiveAdmissions = async () => {
  const [rows] = await db.query(
    'SELECT COUNT(id) as count FROM patientAdmission WHERE status = ?', 
    [ADMISSION_STATUS.ADMITTED]
  );
  return rows[0].count;
};

const countTotalUsers = async () => {
  const [rows] = await db.query('SELECT COUNT(id) as count FROM users');
  return rows[0].count;
};

const countTotalWards = async () => {
  const [rows] = await db.query('SELECT COUNT(id) as count FROM ward WHERE status = "active"');
  return rows[0].count;
};

const getBedStats = async () => {
  const [rows] = await db.query(`
    SELECT 
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as availableBeds,
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as occupiedBeds,
      SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as maintenanceBeds,
      COUNT(id) as totalBeds
    FROM bed
  `, [BED_STATUS.AVAILABLE, BED_STATUS.OCCUPIED, BED_STATUS.MAINTENANCE]);
  return rows[0];
};

const getWardShortages = async () => {
  const [rows] = await db.query(`
    SELECT w.id, w.wardName, w.minBedThreshold, 
           COUNT(b.id) as availableBeds
    FROM ward w
    LEFT JOIN bed b ON w.id = b.wardId AND b.bedStatus = ?
    GROUP BY w.id
    HAVING availableBeds < w.minBedThreshold
  `, [BED_STATUS.AVAILABLE]);
  return rows;
};

const getEquipmentShortages = async () => {
  const [rows] = await db.query(`
    SELECT e.id, e.equipmentName, e.quantity, e.minQuantityThreshold, w.wardName
    FROM equipment e
    JOIN ward w ON e.wardId = w.id
    WHERE e.quantity < e.minQuantityThreshold
  `);
  return rows;
};

module.exports = {
  countActiveAdmissions,
  countTotalUsers,
  countTotalWards,
  getBedStats,
  getWardShortages,
  getEquipmentShortages
};
