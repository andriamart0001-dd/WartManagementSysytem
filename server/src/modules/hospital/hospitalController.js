// =============================================================================
// hospitalController.js — HTTP Handler for Hospitals
// =============================================================================

const hospitalService = require('./hospitalService');

const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    return res.status(200).json({
      message: 'Hospitals retrieved successfully',
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Error retrieving hospitals' });
  }
};

const createHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.createHospital(req.body, req.user.id);
    return res.status(201).json({
      message: 'Hospital added successfully',
      hospital
    });
  } catch (error) {
    if (error.message === 'Hospital name is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create hospital error:', error);
    return res.status(500).json({ message: 'Error adding hospital' });
  }
};

const updateHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      message: 'Hospital updated successfully',
      hospital
    });
  } catch (error) {
    if (error.message === 'Hospital not found') return res.status(404).json({ message: error.message });
    if (error.message === 'Hospital name is required') return res.status(400).json({ message: error.message });
    
    console.error('Update hospital error:', error);
    return res.status(500).json({ message: 'Error updating hospital' });
  }
};

const deleteHospital = async (req, res) => {
  try {
    await hospitalService.deleteHospital(req.params.id);
    return res.status(200).json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    if (error.message === 'Hospital not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('Cannot delete')) return res.status(400).json({ message: error.message });
    
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
