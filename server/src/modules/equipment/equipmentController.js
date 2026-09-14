// =============================================================================
// equipmentController.js — HTTP Handler for Equipment
// =============================================================================

const equipmentService = require('./equipmentService');

const getEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.getAllEquipment(req.query.wardId);
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

const createEquipment = async (req, res) => {
  try {
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

const updateEquipment = async (req, res) => {
  try {
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

const logMaintenance = async (req, res) => {
  try {
    await equipmentService.logMaintenance(req.params.id, req.body, req.user.id);
    return res.status(201).json({ message: 'Maintenance logged successfully' });
  } catch (error) {
    if (error.message === 'Equipment not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required')) return res.status(400).json({ message: error.message });
    console.error('Log maintenance error:', error);
    return res.status(500).json({ message: 'Error logging maintenance' });
  }
};

const getMaintenanceLogs = async (req, res) => {
  try {
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
