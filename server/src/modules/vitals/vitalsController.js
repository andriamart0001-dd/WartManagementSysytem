// =============================================================================
// vitalsController.js — Patient Vitals Operations
// =============================================================================
// Endpoints provided:
//   POST /api/admissions/:id/vitals — logVitals : Log temperature, BP, pulse
//   GET  /api/admissions/:id/vitals — getVitals : Retrieve vitals history
// =============================================================================

const db = require('../../config/db');

// =============================================================================
// FUNCTION: logVitals
// =============================================================================
const logVitals = async (req, res) => {
  const { id } = req.params; // admissionId
  const { temperature, bloodPressure, pulse } = req.body;
  const userId = req.user.id;

  if (!temperature && !bloodPressure && !pulse) {
    return res.status(400).json({ message: 'At least one vital sign is required' });
  }

  try {
    // 1. Check if admission exists
    const [admissionRows] = await db.query('SELECT id FROM patientAdmission WHERE id = ?', [id]);
    if (admissionRows.length === 0) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const recordedAt = new Date();

    const insertSql = `
      INSERT INTO patientVitals (
        admissionId, temperature, bloodPressure, pulse, recordedBy, recordedAt, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(insertSql, [
      id, temperature || null, bloodPressure || null, pulse || null, 
      userId, recordedAt, userId, userId
    ]);

    return res.status(201).json({
      message: 'Vitals logged successfully'
    });
  } catch (error) {
    console.error('Log vitals error:', error);
    return res.status(500).json({ message: 'Error logging patient vitals' });
  }
};

// =============================================================================
// FUNCTION: getVitals
// =============================================================================
const getVitals = async (req, res) => {
  const { id } = req.params; // admissionId

  try {
    const sql = `
      SELECT v.*, u.fullName as recordedByName
      FROM patientVitals v
      JOIN users u ON v.recordedBy = u.id
      WHERE v.admissionId = ?
      ORDER BY v.recordedAt DESC
    `;
    
    const [vitals] = await db.query(sql, [id]);

    return res.status(200).json({
      message: 'Vitals retrieved successfully',
      count: vitals.length,
      vitals
    });
  } catch (error) {
    console.error('Get vitals error:', error);
    return res.status(500).json({ message: 'Error retrieving patient vitals' });
  }
};

module.exports = {
  logVitals,
  getVitals
};
