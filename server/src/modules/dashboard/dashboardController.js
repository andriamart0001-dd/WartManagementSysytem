// =============================================================================
// dashboardController.js — Dashboard Summary & Analytics
// =============================================================================
// Endpoints provided:
//   GET /api/dashboard/summary : Returns overall system summary
// =============================================================================

const db = require('../../config/db');
const { ADMISSION_STATUS, BED_STATUS } = require('../../constants');

// =============================================================================
// FUNCTION: getSummary
// =============================================================================
const getSummary = async (req, res) => {
  try {
    // 1. Total Active Admissions
    const [admissionsResult] = await db.query(
      'SELECT COUNT(id) as count FROM patientAdmission WHERE status = ?', 
      [ADMISSION_STATUS.ADMITTED]
    );
    const totalActiveAdmissions = admissionsResult[0].count;

    // 2. Bed Occupancy (Total Available vs Occupied)
    const [bedsResult] = await db.query(`
      SELECT 
        SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as availableBeds,
        SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as occupiedBeds,
        SUM(CASE WHEN bedStatus = ? THEN 1 ELSE 0 END) as maintenanceBeds,
        COUNT(id) as totalBeds
      FROM bed
    `, [BED_STATUS.AVAILABLE, BED_STATUS.OCCUPIED, BED_STATUS.MAINTENANCE]);
    
    const bedStats = bedsResult[0];

    // 3. Wards with Shortages
    // A ward has a shortage if its total available beds + occupied beds < minBedThreshold?
    // Wait, requirement says: Monitor minBedThreshold (wards). 
    // "minBedThreshold triggers shortage badge." -> typically this means if total available beds < threshold, or totalbeds < threshold.
    // Let's use total available beds for the threshold logic.
    const [wardShortagesResult] = await db.query(`
      SELECT w.id, w.wardName, w.minBedThreshold, 
             COUNT(b.id) as availableBeds
      FROM ward w
      LEFT JOIN bed b ON w.id = b.wardId AND b.bedStatus = ?
      GROUP BY w.id
      HAVING availableBeds < w.minBedThreshold
    `, [BED_STATUS.AVAILABLE]);

    // 4. Equipment with Shortages
    const [eqShortagesResult] = await db.query(`
      SELECT e.id, e.equipmentName, e.quantity, e.minQuantityThreshold, w.wardName
      FROM equipment e
      JOIN ward w ON e.wardId = w.id
      WHERE e.quantity < e.minQuantityThreshold
    `);

    return res.status(200).json({
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalActiveAdmissions,
        bedStats: {
          available: parseInt(bedStats.availableBeds) || 0,
          occupied: parseInt(bedStats.occupiedBeds) || 0,
          maintenance: parseInt(bedStats.maintenanceBeds) || 0,
          total: parseInt(bedStats.totalBeds) || 0
        },
        shortages: {
          wards: wardShortagesResult,
          equipment: eqShortagesResult
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard summary' });
  }
};

module.exports = {
  getSummary
};
