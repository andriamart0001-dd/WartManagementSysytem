// =============================================================================
// vitalsModel.js — Database Queries for Vitals
// =============================================================================

const db = require('../../config/db');

const checkAdmissionExists = async (admissionId) => {
  const [rows] = await db.query('SELECT id FROM patientAdmission WHERE id = ?', [admissionId]);
  return rows.length > 0;
};

const insertVitals = async (insertValues) => {
  const sql = `
    INSERT INTO patientVitals (
      admissionId, temperature, bloodPressure, pulse, recordedBy, recordedAt, createdBy, updatedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await db.query(sql, insertValues);
};

const findVitalsByAdmissionId = async (admissionId) => {
  const sql = `
    SELECT v.*, u.fullName as recordedByName
    FROM patientVitals v
    JOIN users u ON v.recordedBy = u.id
    WHERE v.admissionId = ?
    ORDER BY v.recordedAt DESC
  `;
  const [rows] = await db.query(sql, [admissionId]);
  return rows;
};

module.exports = {
  checkAdmissionExists,
  insertVitals,
  findVitalsByAdmissionId
};
