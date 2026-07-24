// =============================================================================
// shortageAlertController.js — Shortage Alert Logging & Resolution
// =============================================================================
// Endpoints provided:
//   GET  /api/alerts           — getAlerts      : List active/all shortage alerts
//   POST /api/alerts           — logAlert       : Log a new shortage alert
//   PUT  /api/alerts/:id/resolve — resolveAlert : Mark an alert as resolved
// =============================================================================

const db = require('../../config/db');
const { ALERT_TYPES } = require('../../constants');

// =============================================================================
// FUNCTION: getAlerts
// =============================================================================
const getAlerts = async (req, res) => {
  const { status } = req.query; // e.g. ?status=active

  try {
    let sql = `
      SELECT s.*, w.wardName, e.equipmentName 
      FROM shortageAlertLog s
      LEFT JOIN ward w ON s.wardId = w.id
      LEFT JOIN equipment e ON s.equipmentId = e.id
    `;
    const values = [];

    if (status === 'active') {
      sql += ' WHERE s.resolvedAt IS NULL';
    } else if (status === 'resolved') {
      sql += ' WHERE s.resolvedAt IS NOT NULL';
    }

    sql += ' ORDER BY s.triggeredAt DESC';

    const [alerts] = await db.query(sql, values);

    return res.status(200).json({
      message: 'Shortage alerts retrieved successfully',
      alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return res.status(500).json({ message: 'Error retrieving alerts' });
  }
};

// =============================================================================
// FUNCTION: logAlert
// =============================================================================
const logAlert = async (req, res) => {
  const { wardId, equipmentId, alertType } = req.body;
  const userId = req.user.id;

  if (!alertType || !Object.values(ALERT_TYPES).includes(alertType)) {
    return res.status(400).json({ message: 'Valid alertType is required' });
  }

  if (alertType === ALERT_TYPES.BED_SHORTAGE && !wardId) {
    return res.status(400).json({ message: 'wardId is required for bed shortage alerts' });
  }

  if (alertType === ALERT_TYPES.EQUIPMENT_SHORTAGE && !equipmentId) {
    return res.status(400).json({ message: 'equipmentId is required for equipment shortage alerts' });
  }

  try {
    // Check if there is already an active alert for this specific entity
    let checkSql = 'SELECT id FROM shortageAlertLog WHERE alertType = ? AND resolvedAt IS NULL';
    const checkValues = [alertType];

    if (wardId) {
      checkSql += ' AND wardId = ?';
      checkValues.push(wardId);
    } else if (equipmentId) {
      checkSql += ' AND equipmentId = ?';
      checkValues.push(equipmentId);
    }

    const [existingAlerts] = await db.query(checkSql, checkValues);

    if (existingAlerts.length > 0) {
      return res.status(400).json({ message: 'An active alert already exists for this resource' });
    }

    const triggeredAt = new Date();
    const insertSql = `
      INSERT INTO shortageAlertLog (wardId, equipmentId, alertType, triggeredAt, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertSql, [
      wardId || null, equipmentId || null, alertType, triggeredAt, userId, userId
    ]);

    const [newAlertRows] = await db.query('SELECT * FROM shortageAlertLog WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Alert logged successfully',
      alert: newAlertRows[0]
    });
  } catch (error) {
    console.error('Log alert error:', error);
    return res.status(500).json({ message: 'Error logging alert' });
  }
};

// =============================================================================
// FUNCTION: resolveAlert
// =============================================================================
const resolveAlert = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [existingRows] = await db.query('SELECT id, resolvedAt FROM shortageAlertLog WHERE id = ?', [id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (existingRows[0].resolvedAt) {
      return res.status(400).json({ message: 'Alert is already resolved' });
    }

    const resolvedAt = new Date();
    const updateSql = `
      UPDATE shortageAlertLog 
      SET resolvedAt = ?, updatedBy = ? 
      WHERE id = ?
    `;
    await db.query(updateSql, [resolvedAt, userId, id]);

    const [updatedRows] = await db.query('SELECT * FROM shortageAlertLog WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Alert resolved successfully',
      alert: updatedRows[0]
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    return res.status(500).json({ message: 'Error resolving alert' });
  }
};

module.exports = {
  getAlerts,
  logAlert,
  resolveAlert
};
