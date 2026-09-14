// =============================================================================
// departmentController.js — Department Management Operations
// =============================================================================

const wardService = require('./wardService');

const getAllDepartments = async (req, res) => {
  try {
    const departments = await wardService.getAllDepartments();
    return res.status(200).json({
      message: 'Departments retrieved successfully',
      departments
    });
  } catch (error) {
    console.error('Get all departments error:', error);
    return res.status(500).json({ message: 'Error retrieving departments' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const department = await wardService.createDepartment(req.body.departmentName, req.user.id);
    return res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    if (error.message === 'Department name is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Error creating department' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await wardService.updateDepartment(req.params.id, req.body.departmentName, req.user.id);
    return res.status(200).json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    if (error.message === 'Department not found') return res.status(404).json({ message: error.message });
    if (error.message === 'Department name is required') return res.status(400).json({ message: error.message });
    
    console.error('Update department error:', error);
    return res.status(500).json({ message: 'Error updating department' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await wardService.deleteDepartment(req.params.id);
    return res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    if (error.message === 'Department not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('Cannot delete')) return res.status(400).json({ message: error.message });
    
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
