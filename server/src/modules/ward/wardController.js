// =============================================================================
// wardController.js — Ward Management Operations
// =============================================================================
// Endpoints provided:
//   GET    /api/wards        — getAllWards   : List all wards with department details
//   GET    /api/wards/:id    — getWardById   : Get specific ward details
//   POST   /api/wards        — createWard    : Create a new ward
//   PUT    /api/wards/:id    — updateWard    : Update an existing ward
// =============================================================================

const db = require('../../config/db');
const { WARD_TYPES, WARD_STATUS } = require('../../constants');

// =============================================================================
// FUNCTION: getAllWards
// =============================================================================
const getAllWards = async (req, res) => {
  try {
    // Join with department table to get departmentName
    const sql = `
      SELECT w.*, d.departmentName 
      FROM ward w
      JOIN department d ON w.departmentId = d.id
      ORDER BY w.wardName ASC
    `;
    const [wards] = await db.query(sql);

    // Calculate shortage flag for frontend convenience
    const enrichedWards = wards.map(ward => ({
      ...ward,
      hasShortage: ward.totalBeds < ward.minBedThreshold
    }));

    return res.status(200).json({
      message: 'Wards retrieved successfully',
      wards: enrichedWards
    });
  } catch (error) {
    console.error('Get all wards error:', error);
    return res.status(500).json({ message: 'Error retrieving wards' });
  }
};

// =============================================================================
// FUNCTION: getWardById
// =============================================================================
const getWardById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT w.*, d.departmentName 
      FROM ward w
      JOIN department d ON w.departmentId = d.id
      WHERE w.id = ? LIMIT 1
    `;
    const [wards] = await db.query(sql, [id]);

    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    const ward = wards[0];
    ward.hasShortage = ward.totalBeds < ward.minBedThreshold;

    return res.status(200).json({
      message: 'Ward retrieved successfully',
      ward
    });
  } catch (error) {
    console.error('Get ward by id error:', error);
    return res.status(500).json({ message: 'Error retrieving ward' });
  }
};

// =============================================================================
// FUNCTION: createWard
// =============================================================================
const createWard = async (req, res) => {
  const { wardName, wardType, departmentId, minBedThreshold, floorLocation } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!wardName || !wardType || !departmentId) {
    return res.status(400).json({ message: 'wardName, wardType, and departmentId are required' });
  }

  if (!WARD_TYPES.includes(wardType)) {
    return res.status(400).json({ 
      message: `Invalid wardType. Allowed types: ${WARD_TYPES.join(', ')}`
    });
  }

  try {
    // Check if department exists
    const [deptRows] = await db.query('SELECT id FROM department WHERE id = ? LIMIT 1', [departmentId]);
    if (deptRows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const insertSql = `
      INSERT INTO ward (wardName, wardType, departmentId, totalBeds, minBedThreshold, floorLocation, status, createdBy, updatedBy)
      VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
    `;
    
    // totalBeds defaults to 0 upon creation. Beds are added via the beds module.
    const insertValues = [
      wardName,
      wardType,
      departmentId,
      minBedThreshold || 0,
      floorLocation || null,
      WARD_STATUS.ACTIVE,
      adminId,
      adminId
    ];

    const [result] = await db.query(insertSql, insertValues);
    const [newWardRows] = await db.query('SELECT * FROM ward WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Ward created successfully',
      ward: newWardRows[0]
    });
  } catch (error) {
    console.error('Create ward error:', error);
    return res.status(500).json({ message: 'Error creating ward' });
  }
};

// =============================================================================
// FUNCTION: updateWard
// =============================================================================
const updateWard = async (req, res) => {
  const { id } = req.params;
  const { wardName, wardType, departmentId, minBedThreshold, floorLocation, status } = req.body;
  const userId = req.user.id;

  try {
    // Check if ward exists
    const [existingWards] = await db.query('SELECT * FROM ward WHERE id = ? LIMIT 1', [id]);
    if (existingWards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    // Build update query dynamically
    const fieldsToUpdate = [];
    const updateValues = [];

    if (wardName !== undefined) {
      fieldsToUpdate.push('wardName = ?');
      updateValues.push(wardName);
    }

    if (wardType !== undefined) {
      if (!WARD_TYPES.includes(wardType)) {
        return res.status(400).json({ message: `Invalid wardType. Allowed: ${WARD_TYPES.join(', ')}` });
      }
      fieldsToUpdate.push('wardType = ?');
      updateValues.push(wardType);
    }

    if (departmentId !== undefined) {
      const [deptRows] = await db.query('SELECT id FROM department WHERE id = ? LIMIT 1', [departmentId]);
      if (deptRows.length === 0) {
        return res.status(404).json({ message: 'Department not found' });
      }
      fieldsToUpdate.push('departmentId = ?');
      updateValues.push(departmentId);
    }

    if (minBedThreshold !== undefined) {
      fieldsToUpdate.push('minBedThreshold = ?');
      updateValues.push(minBedThreshold);
    }

    if (floorLocation !== undefined) {
      fieldsToUpdate.push('floorLocation = ?');
      updateValues.push(floorLocation);
    }

    if (status !== undefined) {
      if (!Object.values(WARD_STATUS).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      fieldsToUpdate.push('status = ?');
      updateValues.push(status);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    fieldsToUpdate.push('updatedBy = ?');
    updateValues.push(userId);

    const updateSql = `UPDATE ward SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    updateValues.push(id);

    await db.query(updateSql, updateValues);

    const [updatedRows] = await db.query('SELECT * FROM ward WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Ward updated successfully',
      ward: updatedRows[0]
    });
  } catch (error) {
    console.error('Update ward error:', error);
    return res.status(500).json({ message: 'Error updating ward' });
  }
};

// =============================================================================
// FUNCTION: deleteWard
// =============================================================================
const deleteWard = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Check if ward exists
    const [existingWards] = await db.query('SELECT * FROM ward WHERE id = ? LIMIT 1', [id]);
    if (existingWards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    // 2. Check if there are any active admissions in this ward
    const [activeAdmissions] = await db.query(
      'SELECT id FROM patientAdmission WHERE wardId = ? AND status = ? LIMIT 1', 
      [id, 'admitted']
    );
    if (activeAdmissions.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete ward. There are currently admitted patients in this ward.' 
      });
    }

    // 3. Check if there are any beds in this ward
    const [beds] = await db.query('SELECT id FROM bed WHERE wardId = ? LIMIT 1', [id]);
    if (beds.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete ward. There are beds assigned to this ward. Please remove or reassign the beds first.' 
      });
    }

    // 4. Safe to delete
    await db.query('DELETE FROM ward WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Ward deleted successfully' });
  } catch (error) {
    console.error('Delete ward error:', error);
    return res.status(500).json({ message: 'Error deleting ward' });
  }
};

module.exports = {
  getAllWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard
};
