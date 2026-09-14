// =============================================================================
// hospitalModel.js — Database Queries for Hospitals
// =============================================================================

const db = require('../../config/db');

const findAllHospitals = async () => {
  const sql = 'SELECT * FROM hospital ORDER BY hospitalName ASC';
  const [rows] = await db.query(sql);
  return rows;
};

const insertHospital = async (insertValues) => {
  const sql = `
    INSERT INTO hospital (hospitalName, address, contactNumber, createdBy, updatedBy)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

const findHospitalById = async (id) => {
  const sql = 'SELECT * FROM hospital WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const updateHospitalById = async (updateSql, updateValues) => {
  const [result] = await db.query(updateSql, updateValues);
  return result.affectedRows;
};

const findTransfersByHospitalId = async (hospitalId) => {
  const sql = 'SELECT id FROM hospitalTransfer WHERE hospitalId = ? LIMIT 1';
  const [rows] = await db.query(sql, [hospitalId]);
  return rows;
};

const deleteHospitalById = async (hospitalId) => {
  const sql = 'DELETE FROM hospital WHERE id = ?';
  const [result] = await db.query(sql, [hospitalId]);
  return result.affectedRows;
};

module.exports = {
  findAllHospitals,
  insertHospital,
  findHospitalById,
  updateHospitalById,
  findTransfersByHospitalId,
  deleteHospitalById
};
