// =============================================================================
// equipmentModel.js — Database Queries for Equipment
// =============================================================================

const db = require('../../config/db');
const { EQUIPMENT_STATUS } = require('../../constants');

const findAllEquipment = async (wardId) => {
  let sql = `
    SELECT e.*, w.wardName 
    FROM equipment e
    JOIN ward w ON e.wardId = w.id
  `;
  const values = [];

  if (wardId) {
    sql += ' WHERE e.wardId = ?';
    values.push(wardId);
  }
  
  sql += ' ORDER BY e.wardId ASC, e.equipmentName ASC';
  const [rows] = await db.query(sql, values);
  return rows;
};

const findWardById = async (id) => {
  const [rows] = await db.query('SELECT id FROM ward WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0 ? rows[0] : null;
};

const insertEquipment = async (insertValues) => {
  const sql = `
    INSERT INTO equipment (equipmentName, quantity, status, minQuantityThreshold, wardId, createdBy, updatedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, insertValues);
  return result.insertId;
};

const findEquipmentById = async (id) => {
  const [rows] = await db.query('SELECT * FROM equipment WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0 ? rows[0] : null;
};

const updateEquipmentById = async (updateSql, updateValues) => {
  await db.query(updateSql, updateValues);
};

const transactionLogMaintenance = async (equipmentId, notes, nextScheduledDate, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT id FROM equipment WHERE id = ? FOR UPDATE', [equipmentId]);
    if (existingRows.length === 0) {
      throw new Error('Equipment not found');
    }

    const maintenanceDate = new Date();
    const insertSql = `
      INSERT INTO equipmentMaintenanceLog (
        equipmentId, maintenanceDate, performedBy, notes, nextScheduledDate, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertSql, [
      equipmentId, maintenanceDate, userId, notes, nextScheduledDate || null, userId, userId
    ]);

    await connection.query('UPDATE equipment SET status = ?, updatedBy = ? WHERE id = ?', [
      EQUIPMENT_STATUS.MAINTENANCE, userId, equipmentId
    ]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const findMaintenanceLogs = async (equipmentId) => {
  const sql = `
    SELECT m.*, u.fullName as performedByName
    FROM equipmentMaintenanceLog m
    JOIN users u ON m.performedBy = u.id
    WHERE m.equipmentId = ?
    ORDER BY m.maintenanceDate DESC
  `;
  const [rows] = await db.query(sql, [equipmentId]);
  return rows;
};

module.exports = {
  findAllEquipment,
  findWardById,
  insertEquipment,
  findEquipmentById,
  updateEquipmentById,
  transactionLogMaintenance,
  findMaintenanceLogs
};
