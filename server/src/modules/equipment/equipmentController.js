// =============================================================================
// equipmentController.js — Equipment Management Operations
// =============================================================================
// Endpoints provided:
//   GET    /api/equipment                — getEquipment    : List equipment (filter by ?wardId=)
//   POST   /api/equipment                — createEquipment : Register new equipment
//   PUT    /api/equipment/:id            — updateEquipment : Update equipment details/status
//   POST   /api/equipment/:id/maintenance— logMaintenance  : Log a maintenance event
// =============================================================================

const db = require('../../config/db');
const { EQUIPMENT_STATUS } = require('../../constants');

// =============================================================================
// FUNCTION: getEquipment
// =============================================================================
const getEquipment = async (req, res) => {
  const { wardId } = req.query;

  try {
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

    const [equipmentList] = await db.query(sql, values);

    // Calculate shortage flag
    const enrichedEquipment = equipmentList.map(eq => ({
      ...eq,
      hasShortage: eq.quantity < eq.minQuantityThreshold
    }));

    return res.status(200).json({
      message: 'Equipment retrieved successfully',
      count: enrichedEquipment.length,
      equipment: enrichedEquipment
    });
  } catch (error) {
    console.error('Get equipment error:', error);
    return res.status(500).json({ message: 'Error retrieving equipment' });
  }
};

// =============================================================================
// FUNCTION: createEquipment
// =============================================================================
const createEquipment = async (req, res) => {
  const { equipmentName, quantity, minQuantityThreshold, wardId } = req.body;
  const userId = req.user.id;

  if (!equipmentName || quantity === undefined || !wardId) {
    return res.status(400).json({ message: 'equipmentName, quantity, and wardId are required' });
  }

  try {
    const [wardRows] = await db.query('SELECT id FROM ward WHERE id = ? LIMIT 1', [wardId]);
    if (wardRows.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    const insertSql = `
      INSERT INTO equipment (equipmentName, quantity, status, minQuantityThreshold, wardId, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      equipmentName, 
      quantity, 
      EQUIPMENT_STATUS.AVAILABLE, // Default status
      minQuantityThreshold || 0, 
      wardId, 
      userId, 
      userId
    ];

    const [result] = await db.query(insertSql, insertValues);
    const [newEqRows] = await db.query('SELECT * FROM equipment WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Equipment registered successfully',
      equipment: newEqRows[0]
    });
  } catch (error) {
    console.error('Create equipment error:', error);
    return res.status(500).json({ message: 'Error registering equipment' });
  }
};

// =============================================================================
// FUNCTION: updateEquipment
// =============================================================================
const updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { equipmentName, quantity, status, minQuantityThreshold } = req.body;
  const userId = req.user.id;

  try {
    const [existingRows] = await db.query('SELECT id FROM equipment WHERE id = ? LIMIT 1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const fieldsToUpdate = [];
    const updateValues = [];

    if (equipmentName !== undefined) {
      fieldsToUpdate.push('equipmentName = ?');
      updateValues.push(equipmentName);
    }
    if (quantity !== undefined) {
      fieldsToUpdate.push('quantity = ?');
      updateValues.push(quantity);
    }
    if (status !== undefined) {
      if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      fieldsToUpdate.push('status = ?');
      updateValues.push(status);
    }
    if (minQuantityThreshold !== undefined) {
      fieldsToUpdate.push('minQuantityThreshold = ?');
      updateValues.push(minQuantityThreshold);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    fieldsToUpdate.push('updatedBy = ?');
    updateValues.push(userId);

    const updateSql = `UPDATE equipment SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    updateValues.push(id);

    await db.query(updateSql, updateValues);

    const [updatedRows] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Equipment updated successfully',
      equipment: updatedRows[0]
    });
  } catch (error) {
    console.error('Update equipment error:', error);
    return res.status(500).json({ message: 'Error updating equipment' });
  }
};

// =============================================================================
// FUNCTION: logMaintenance
// =============================================================================
const logMaintenance = async (req, res) => {
  const { id } = req.params; // equipmentId
  const { notes, nextScheduledDate } = req.body;
  const userId = req.user.id;

  if (!notes) {
    return res.status(400).json({ message: 'Maintenance notes are required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT id FROM equipment WHERE id = ? FOR UPDATE', [id]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const maintenanceDate = new Date();

    const insertSql = `
      INSERT INTO equipmentMaintenanceLog (
        equipmentId, maintenanceDate, performedBy, notes, nextScheduledDate, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.query(insertSql, [
      id, maintenanceDate, userId, notes, nextScheduledDate || null, userId, userId
    ]);

    // Automatically set equipment status to maintenance (optional business logic, but typical)
    await connection.query('UPDATE equipment SET status = ?, updatedBy = ? WHERE id = ?', [
      EQUIPMENT_STATUS.MAINTENANCE, userId, id
    ]);

    await connection.commit();

    return res.status(201).json({
      message: 'Maintenance logged successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Log maintenance error:', error);
    return res.status(500).json({ message: 'Error logging maintenance' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: getMaintenanceLogs
// =============================================================================
const getMaintenanceLogs = async (req, res) => {
  const { id } = req.params; // equipmentId

  try {
    const sql = `
      SELECT m.*, u.fullName as performedByName
      FROM equipmentMaintenanceLog m
      JOIN users u ON m.performedBy = u.id
      WHERE m.equipmentId = ?
      ORDER BY m.maintenanceDate DESC
    `;
    const [logs] = await db.query(sql, [id]);

    return res.status(200).json({
      message: 'Maintenance logs retrieved successfully',
      logs
    });
  } catch (error) {
    console.error('Get maintenance logs error:', error);
    return res.status(500).json({ message: 'Error retrieving maintenance logs' });
  }
};

module.exports = {
  getEquipment,
  createEquipment,
  updateEquipment,
  logMaintenance,
  getMaintenanceLogs
};
