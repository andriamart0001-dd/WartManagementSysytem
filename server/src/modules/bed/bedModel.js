// =============================================================================
// bedModel.js — Database Queries for Beds
// =============================================================================

const db = require('../../config/db');

const findAllBeds = async (wardId) => {
  let sql = `
    SELECT b.*, w.wardName 
    FROM bed b
    JOIN ward w ON b.wardId = w.id
  `;
  const values = [];

  if (wardId) {
    sql += ' WHERE b.wardId = ?';
    values.push(wardId);
  }
  
  sql += ' ORDER BY b.wardId ASC, b.bedNumber ASC';

  const [rows] = await db.query(sql, values);
  return rows;
};

const findBedById = async (id) => {
  const sql = 'SELECT * FROM bed WHERE id = ? LIMIT 1';
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const transactionCreateBed = async (wardId, bedNumber, bedStatus, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verify ward exists and lock it
    const [wardRows] = await connection.query('SELECT id FROM ward WHERE id = ? FOR UPDATE', [wardId]);
    if (wardRows.length === 0) {
      throw new Error('Ward not found');
    }

    // Check if bedNumber already exists
    const [existingBed] = await connection.query(
      'SELECT id FROM bed WHERE wardId = ? AND bedNumber = ?', 
      [wardId, bedNumber]
    );
    if (existingBed.length > 0) {
      throw new Error('A bed with this number already exists in this ward');
    }

    // Create the bed
    const insertSql = `
      INSERT INTO bed (wardId, bedNumber, bedStatus, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await connection.query(insertSql, [wardId, bedNumber, bedStatus, userId, userId]);

    // Update totalBeds count
    await connection.query('UPDATE ward SET totalBeds = totalBeds + 1, updatedBy = ? WHERE id = ?', [userId, wardId]);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateBedStatusById = async (id, status, userId) => {
  const sql = 'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?';
  const [result] = await db.query(sql, [status, userId, id]);
  return result.affectedRows;
};

module.exports = {
  findAllBeds,
  findBedById,
  transactionCreateBed,
  updateBedStatusById
};
