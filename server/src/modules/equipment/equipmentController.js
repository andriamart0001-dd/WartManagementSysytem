// =============================================================================
// equipmentController.js — HTTP Handler for Equipment
// =============================================================================

const equipmentService = require('./equipmentService');
const { ROLES } = require('../../constants');

// Retrieve all equipment (restricted to assigned ward for Ward Admins)
const getEquipment = async (req, res) => {
  try {
    let targetWardId = req.query.wardId;

    // Ward Admins can only view equipment in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId) {
        return res.status(403).json({ 
          message: 'Access denied. You do not have an assigned ward.' 
        });
      }
      if (targetWardId && Number(targetWardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You are only authorized to view equipment in your assigned ward.' 
        });
      }
      targetWardId = req.user.assignedWardId;
    }

    const equipment = await equipmentService.getAllEquipment(targetWardId);
    return res.status(200).json({
      message: 'Equipment retrieved successfully',
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Get equipment error:', error);
    return res.status(500).json({ message: 'Error retrieving equipment' });
  }
};

// Register new equipment (restricted to assigned ward for Ward Admins)
const createEquipment = async (req, res) => {
  try {
    // Ward Admins can only register equipment in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId || Number(req.body.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only register equipment in your assigned ward.' 
        });
      }
    }

    const equipment = await equipmentService.createEquipment(req.body, req.user.id);
    return res.status(201).json({
      message: 'Equipment registered successfully',
      equipment
    });
  } catch (error) {
    if (error.message === 'Ward not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required')) return res.status(400).json({ message: error.message });
    console.error('Create equipment error:', error);
    return res.status(500).json({ message: 'Error registering equipment' });
  }
};

// Update existing equipment (quantities or thresholds)
const updateEquipment = async (req, res) => {
  try {
    // Ward Admins can only update equipment in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingEquipment = await equipmentService.getEquipmentById(req.params.id);
      if (!existingEquipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      if (Number(existingEquipment.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only modify equipment in your assigned ward.' 
        });
      }
    }

    const equipment = await equipmentService.updateEquipment(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      message: 'Equipment updated successfully',
      equipment
    });
  } catch (error) {
    if (error.message === 'Equipment not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('Invalid') || error.message.includes('No fields')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update equipment error:', error);
    return res.status(500).json({ message: 'Error updating equipment' });
  }
};

// Log a maintenance event for equipment
const logMaintenance = async (req, res) => {
  try {
    // Ward Admins can only log maintenance for equipment in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingEquipment = await equipmentService.getEquipmentById(req.params.id);
      if (!existingEquipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      if (Number(existingEquipment.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only log maintenance for equipment in your assigned ward.' 
        });
      }
    }

    await equipmentService.logMaintenance(req.params.id, req.body, req.user.id);
    return res.status(201).json({ message: 'Maintenance logged successfully' });
  } catch (error) {
    if (error.message === 'Equipment not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required')) return res.status(400).json({ message: error.message });
    console.error('Log maintenance error:', error);
    return res.status(500).json({ message: 'Error logging maintenance' });
  }
};

// Retrieve maintenance logs for a piece of equipment
const getMaintenanceLogs = async (req, res) => {
  try {
    // Ward Admins can only view logs for equipment in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingEquipment = await equipmentService.getEquipmentById(req.params.id);
      if (!existingEquipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      if (Number(existingEquipment.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only view maintenance logs for equipment in your assigned ward.' 
        });
      }
    }

    const logs = await equipmentService.getMaintenanceLogs(req.params.id);
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
