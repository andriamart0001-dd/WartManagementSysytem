// =============================================================================
// bedController.js — Bed Allocation and Management
// =============================================================================
// Endpoints provided:
//   GET    /api/beds              — getBeds         : List beds (optionally filter by ?wardId=)
//   POST   /api/beds              — createBed       : Create a new bed in a ward
//   PUT    /api/beds/:id/status   — updateBedStatus : Change status (available, occupied, maintenance)
// =============================================================================

const db = require('../../config/db');
const { BED_STATUS } = require('../../constants');

// =============================================================================
// FUNCTION: getBeds
// =============================================================================
const getBeds = async (req, res) => {
  const { wardId } = req.query;

  try {
    let sql = `
      SELECT b.*, w.wardName 
      FROM bed b
      JOIN ward w ON b.wardId = w.id
    `;
    const values = [];

    // Filter by ward if wardId is provided in query params
    if (wardId) {
      sql += ' WHERE b.wardId = ?';
      values.push(wardId);
    }
    
    sql += ' ORDER BY b.wardId ASC, b.bedNumber ASC';

    const [beds] = await db.query(sql, values);

    return res.status(200).json({
      message: 'Beds retrieved successfully',
      count: beds.length,
      beds
    });
  } catch (error) {
    console.error('Get beds error:', error);
    return res.status(500).json({ message: 'Error retrieving beds' });
  }
};

// =============================================================================
// FUNCTION: createBed
// =============================================================================
const createBed = async (req, res) => {
  const { wardId, bedNumber } = req.body;
  const userId = req.user.id;

  if (!wardId || !bedNumber) {
    return res.status(400).json({ message: 'wardId and bedNumber are required' });
  }

  const connection = await db.getConnection();

  try {
    // Start a transaction since we are modifying two tables (bed and ward)
    await connection.beginTransaction();

    // 1. Verify ward exists
    const [wardRows] = await connection.query('SELECT id FROM ward WHERE id = ? FOR UPDATE', [wardId]);
    if (wardRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ward not found' });
    }

    // 2. Check if bedNumber already exists in this ward
    const [existingBed] = await connection.query(
      'SELECT id FROM bed WHERE wardId = ? AND bedNumber = ?', 
      [wardId, bedNumber]
    );
    if (existingBed.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'A bed with this number already exists in this ward' });
    }

    // 3. Create the bed
    const insertSql = `
      INSERT INTO bed (wardId, bedNumber, bedStatus, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await connection.query(insertSql, [wardId, bedNumber, BED_STATUS.AVAILABLE, userId, userId]);

    // 4. Update the totalBeds count on the ward table
    await connection.query('UPDATE ward SET totalBeds = totalBeds + 1, updatedBy = ? WHERE id = ?', [userId, wardId]);

    // Commit the transaction
    await connection.commit();

    const [newBedRows] = await db.query('SELECT * FROM bed WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Bed created successfully',
      bed: newBedRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create bed error:', error);
    return res.status(500).json({ message: 'Error creating bed' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: updateBedStatus
// =============================================================================
const updateBedStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }

  if (!Object.values(BED_STATUS).includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Allowed: ${Object.values(BED_STATUS).join(', ')}` 
    });
  }

  try {
    const updateSql = 'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?';
    const [result] = await db.query(updateSql, [status, userId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    const [updatedRows] = await db.query('SELECT * FROM bed WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Bed status updated successfully',
      bed: updatedRows[0]
    });
  } catch (error) {
    console.error('Update bed status error:', error);
    return res.status(500).json({ message: 'Error updating bed status' });
  }
};

module.exports = {
  getBeds,
  createBed,
  updateBedStatus
};
