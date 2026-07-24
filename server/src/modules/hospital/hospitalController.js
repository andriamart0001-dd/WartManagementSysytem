// =============================================================================
// hospitalController.js — External Hospital Management
// =============================================================================
// Endpoints provided:
//   GET    /api/hospitals     — getAllHospitals : List all external hospitals
//   POST   /api/hospitals     — createHospital  : Add a new external hospital
//   PUT    /api/hospitals/:id — updateHospital  : Update external hospital details
//   DELETE /api/hospitals/:id — deleteHospital  : Remove an external hospital
// =============================================================================

const db = require('../../config/db');

// =============================================================================
// FUNCTION: getAllHospitals
// =============================================================================
const getAllHospitals = async (req, res) => {
  try {
    const sql = 'SELECT * FROM hospital ORDER BY hospitalName ASC';
    const [hospitals] = await db.query(sql);

    return res.status(200).json({
      message: 'Hospitals retrieved successfully',
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Error retrieving hospitals' });
  }
};

// =============================================================================
// FUNCTION: createHospital
// =============================================================================
const createHospital = async (req, res) => {
  const { hospitalName, address, contactNumber } = req.body;
  const adminId = req.user.id;

  if (!hospitalName) {
    return res.status(400).json({ message: 'Hospital name is required' });
  }

  try {
    const insertSql = `
      INSERT INTO hospital (hospitalName, address, contactNumber, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertSql, [hospitalName, address || null, contactNumber || null, adminId, adminId]);

    const [newHospitalRows] = await db.query('SELECT * FROM hospital WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Hospital added successfully',
      hospital: newHospitalRows[0]
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    return res.status(500).json({ message: 'Error adding hospital' });
  }
};

// =============================================================================
// FUNCTION: updateHospital
// =============================================================================
const updateHospital = async (req, res) => {
  const { id } = req.params;
  const { hospitalName, address, contactNumber } = req.body;
  const adminId = req.user.id;

  if (!hospitalName) {
    return res.status(400).json({ message: 'Hospital name is required' });
  }

  try {
    const updateSql = `
      UPDATE hospital 
      SET hospitalName = ?, address = ?, contactNumber = ?, updatedBy = ?
      WHERE id = ?
    `;
    const [result] = await db.query(updateSql, [hospitalName, address || null, contactNumber || null, adminId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const [updatedRows] = await db.query('SELECT * FROM hospital WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Hospital updated successfully',
      hospital: updatedRows[0]
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    return res.status(500).json({ message: 'Error updating hospital' });
  }
};

// =============================================================================
// FUNCTION: deleteHospital
// =============================================================================
const deleteHospital = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deletion if transfers exist for this hospital
    const checkTransfersSql = 'SELECT id FROM hospitalTransfer WHERE hospitalId = ? LIMIT 1';
    const [transfers] = await db.query(checkTransfersSql, [id]);

    if (transfers.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete hospital because there are transfer records associated with it.' 
      });
    }

    const deleteSql = 'DELETE FROM hospital WHERE id = ?';
    const [result] = await db.query(deleteSql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    return res.status(200).json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return res.status(500).json({ message: 'Error deleting hospital' });
  }
};

module.exports = {
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital
};
