// =============================================================================
// wardController.js — Ward Management Operations
// =============================================================================

const wardService = require('./wardService');
const { ROLES } = require('../../constants');

const getAllWards = async (req, res) => {
  try {
    // If the logged-in user is a Ward Admin, restrict returned wards strictly to their assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN && req.user.assignedWardId) {
      const assignedWard = await wardService.getWardById(req.user.assignedWardId);
      return res.status(200).json({
        message: 'Wards retrieved successfully',
        wards: assignedWard ? [assignedWard] : []
      });
    }

    const wards = await wardService.getAllWards();
    return res.status(200).json({
      message: 'Wards retrieved successfully',
      wards
    });
  } catch (error) {
    console.error('Get all wards error:', error);
    return res.status(500).json({ message: 'Error retrieving wards' });
  }
};

const getWardById = async (req, res) => {
  try {
    // If Ward Admin, they can only view details of their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (Number(req.params.id) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only view details of your assigned ward.' 
        });
      }
    }

    const ward = await wardService.getWardById(req.params.id);
    return res.status(200).json({
      message: 'Ward retrieved successfully',
      ward
    });
  } catch (error) {
    if (error.message === 'Ward not found') return res.status(404).json({ message: error.message });
    console.error('Get ward by id error:', error);
    return res.status(500).json({ message: 'Error retrieving ward' });
  }
};

const createWard = async (req, res) => {
  try {
    const ward = await wardService.createWard(req.body, req.user.id);
    return res.status(201).json({
      message: 'Ward created successfully',
      ward
    });
  } catch (error) {
    if (error.message === 'Department not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('Invalid wardType')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create ward error:', error);
    return res.status(500).json({ message: 'Error creating ward' });
  }
};

const updateWard = async (req, res) => {
  try {
    // Ward Admins can only update their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId || Number(req.params.id) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only update your assigned ward.' 
        });
      }
    }

    const ward = await wardService.updateWard(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      message: 'Ward updated successfully',
      ward
    });
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ message: error.message });
    if (error.message.includes('Invalid') || error.message.includes('No fields')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update ward error:', error);
    return res.status(500).json({ message: 'Error updating ward' });
  }
};

const deleteWard = async (req, res) => {
  try {
    await wardService.deleteWard(req.params.id);
    return res.status(200).json({ message: 'Ward deleted successfully' });
  } catch (error) {
    if (error.message === 'Ward not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('Cannot delete')) return res.status(400).json({ message: error.message });
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
