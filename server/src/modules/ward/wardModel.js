// =============================================================================
// wardModel.js — Database Queries for Wards and Departments
// =============================================================================

const db = require('../../config/db');

// --- Wards ---

const findAllWards = async () => {
  const sql = `
    SELECT w.*, d.departmentName 
    FROM ward w
    JOIN department d ON w.departmentId = d.id
    ORDER BY w.wardName ASC
  `;
  const [rows] = await db.query(sql);
  return rows;
};

const findWardById = async (id) => {
  const sql = `
    SELECT w.*, d.departmentName 
    FROM ward w
    JOIN department d ON w.departmentId = d.id
    WHERE w.id = ? LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const insertWard = async (insertValues) => {
  const sql = `
    INSERT INTO ward (wardName, wardType, departmentId, totalBeds, minBedThreshold, floorLocation, status, createdBy, updatedBy)
    VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

const updateWard = async (updateSql, updateValues) => {
  await db.query(updateSql, updateValues);
};

const findActiveAdmissionsInWard = async (wardId) => {
  const sql = 'SELECT id FROM patientAdmission WHERE wardId = ? AND status = ? LIMIT 1';
  const [rows] = await db.query(sql, [wardId, 'admitted']);
  return rows;
};

const findBedsInWard = async (wardId) => {
  const sql = 'SELECT id FROM bed WHERE wardId = ? LIMIT 1';
  const [rows] = await db.query(sql, [wardId]);
  return rows;
};

const deleteWardById = async (wardId) => {
  await db.query('DELETE FROM ward WHERE id = ?', [wardId]);
};

// --- Departments ---

const findAllDepartments = async () => {
  const sql = 'SELECT * FROM department ORDER BY departmentName ASC';
  const [rows] = await db.query(sql);
  return rows;
};

const findDepartmentById = async (id) => {
  const sql = 'SELECT id FROM department WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const insertDepartment = async (insertValues) => {
  const sql = `
    INSERT INTO department (departmentName, createdBy, updatedBy)
    VALUES (?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

const updateDepartmentById = async (updateSql, updateValues) => {
  const [result] = await db.query(updateSql, updateValues);
  return result.affectedRows;
};

const findWardsByDepartmentId = async (departmentId) => {
  const sql = 'SELECT id FROM ward WHERE departmentId = ? LIMIT 1';
  const [rows] = await db.query(sql, [departmentId]);
  return rows;
};

const deleteDepartmentById = async (departmentId) => {
  const sql = 'DELETE FROM department WHERE id = ?';
  const [result] = await db.query(sql, [departmentId]);
  return result.affectedRows;
};

module.exports = {
  findAllWards,
  findWardById,
  insertWard,
  updateWard,
  findActiveAdmissionsInWard,
  findBedsInWard,
  deleteWardById,
  findAllDepartments,
  findDepartmentById,
  insertDepartment,
  updateDepartmentById,
  findWardsByDepartmentId,
  deleteDepartmentById
};
