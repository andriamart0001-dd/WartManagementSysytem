// =============================================================================
// bedModel.js — Database Queries for Beds
// =============================================================================

const db = require('../../config/db');

const findAllBeds = async (wardId) => {
  // Query to select all beds, joined with ward name and optional section name
  let sql = `
    SELECT b.*, w.wardName, s.sectionName 
    FROM bed b
    JOIN ward w ON b.wardId = w.id
    LEFT JOIN section s ON b.sectionId = s.id
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
  // Query to select a single bed by ID, with ward name and section name
  const sql = `
    SELECT b.*, w.wardName, s.sectionName 
    FROM bed b
    JOIN ward w ON b.wardId = w.id
    LEFT JOIN section s ON b.sectionId = s.id
    WHERE b.id = ? 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const transactionCreateBed = async (wardId, bedNumber, bedStatus, sectionId, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verify ward exists and lock it
    const [wardRows] = await connection.query('SELECT id FROM ward WHERE id = ? FOR UPDATE', [wardId]);
    if (wardRows.length === 0) {
      throw new Error('Ward not found');
    }

    // If sectionId is specified, verify it exists and belongs to this ward
    if (sectionId) {
      const [sectionRows] = await connection.query(
        'SELECT id FROM section WHERE id = ? AND wardId = ?',
        [sectionId, wardId]
      );
      if (sectionRows.length === 0) {
        throw new Error('Section not found or does not belong to this ward');
      }
    }

    // Check if bedNumber already exists in this ward
    const [existingBed] = await connection.query(
      'SELECT id FROM bed WHERE wardId = ? AND bedNumber = ?', 
      [wardId, bedNumber]
    );
    if (existingBed.length > 0) {
      throw new Error('A bed with this number already exists in this ward');
    }

    // Create the bed with optional sectionId
    const insertSql = `
      INSERT INTO bed (wardId, bedNumber, bedStatus, sectionId, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.query(insertSql, [
      wardId, 
      bedNumber, 
      bedStatus, 
      sectionId || null, 
      userId, 
      userId
    ]);

    // Update totalBeds count in ward
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

const transactionUpdateBed = async (id, wardId, bedNumber, bedStatus, sectionId, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT * FROM bed WHERE id = ?', [id]);
    if (existing.length === 0) throw new Error('Bed not found');
    const oldBed = existing[0];

    // If ward changed, check if new ward exists
    if (wardId !== oldBed.wardId) {
      const [wardRows] = await connection.query('SELECT id FROM ward WHERE id = ? FOR UPDATE', [wardId]);
      if (wardRows.length === 0) throw new Error('New Ward not found');
    }

    // If sectionId is specified, verify it exists and belongs to this ward
    if (sectionId) {
      const [sectionRows] = await connection.query(
        'SELECT id FROM section WHERE id = ? AND wardId = ?',
        [sectionId, wardId]
      );
      if (sectionRows.length === 0) {
        throw new Error('Section not found or does not belong to this ward');
      }
    }

    // Check if new bedNumber conflicts
    if (wardId !== oldBed.wardId || bedNumber !== oldBed.bedNumber) {
      const [conflict] = await connection.query(
        'SELECT id FROM bed WHERE wardId = ? AND bedNumber = ? AND id != ?',
        [wardId, bedNumber, id]
      );
      if (conflict.length > 0) throw new Error('A bed with this number already exists in this ward');
    }

    // Update the bed with optional sectionId
    await connection.query(
      'UPDATE bed SET wardId = ?, bedNumber = ?, bedStatus = ?, sectionId = ?, updatedBy = ? WHERE id = ?',
      [wardId, bedNumber, bedStatus, sectionId || null, userId, id]
    );

    // If ward changed, update totalBeds
    if (wardId !== oldBed.wardId) {
      await connection.query('UPDATE ward SET totalBeds = totalBeds - 1 WHERE id = ?', [oldBed.wardId]);
      await connection.query('UPDATE ward SET totalBeds = totalBeds + 1 WHERE id = ?', [wardId]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findAllBeds,
  findBedById,
  transactionCreateBed,
  updateBedStatusById,
  transactionUpdateBed
};
