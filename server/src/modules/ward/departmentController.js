// =============================================================================
// departmentController.js — Department Management Operations
// =============================================================================
// Endpoints provided:
//   GET    /api/departments        — getAllDepartments : List all departments
//   POST   /api/departments        — createDepartment  : Create a new department
//   PUT    /api/departments/:id    — updateDepartment  : Update an existing department
//   DELETE /api/departments/:id    — deleteDepartment  : Delete a department (only if no wards)
//
// Access:
//   All endpoints protected by Admin role, except GET which might be used by WardAdmin too
// =============================================================================

const db = require('../../config/db');

// =============================================================================
// FUNCTION: getAllDepartments
// =============================================================================
const getAllDepartments = async (req, res) => {
  try {
    const sql = 'SELECT * FROM department ORDER BY departmentName ASC';
    const [departments] = await db.query(sql);
    
    return res.status(200).json({
      message: 'Departments retrieved successfully',
      departments
    });
  } catch (error) {
    console.error('Get all departments error:', error);
    return res.status(500).json({ message: 'Error retrieving departments' });
  }
};

// =============================================================================
// FUNCTION: createDepartment
// =============================================================================
const createDepartment = async (req, res) => {
  const { departmentName } = req.body;
  const adminId = req.user.id;

  if (!departmentName) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const insertSql = `
      INSERT INTO department (departmentName, createdBy, updatedBy)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(insertSql, [departmentName, adminId, adminId]);

    const [newDeptRows] = await db.query('SELECT * FROM department WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Department created successfully',
      department: newDeptRows[0]
    });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Error creating department' });
  }
};

// =============================================================================
// FUNCTION: updateDepartment
// =============================================================================
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { departmentName } = req.body;
  const adminId = req.user.id;

  if (!departmentName) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const updateSql = `
      UPDATE department 
      SET departmentName = ?, updatedBy = ?
      WHERE id = ?
    `;
    const [result] = await db.query(updateSql, [departmentName, adminId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const [updatedRows] = await db.query('SELECT * FROM department WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Department updated successfully',
      department: updatedRows[0]
    });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({ message: 'Error updating department' });
  }
};

// =============================================================================
// FUNCTION: deleteDepartment
// =============================================================================
const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deletion if wards exist in this department
    const checkWardsSql = 'SELECT id FROM ward WHERE departmentId = ? LIMIT 1';
    const [wards] = await db.query(checkWardsSql, [id]);

    if (wards.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department because it contains wards. Remove or reassign wards first.' 
      });
    }

    const deleteSql = 'DELETE FROM department WHERE id = ?';
    const [result] = await db.query(deleteSql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({ message: 'Error deleting department' });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
