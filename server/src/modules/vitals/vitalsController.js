// =============================================================================
// vitalsController.js — HTTP Handler for Vitals
// =============================================================================

const vitalsService = require('./vitalsService');

const logVitals = async (req, res) => {
  try {
    await vitalsService.logVitals(req.params.id, req.body, req.user.id);
    return res.status(201).json({ message: 'Vitals logged successfully' });
  } catch (error) {
    if (error.message === 'Admission record not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required')) return res.status(400).json({ message: error.message });
    console.error('Log vitals error:', error);
    return res.status(500).json({ message: 'Error logging patient vitals' });
  }
};

const getVitals = async (req, res) => {
  try {
    const vitals = await vitalsService.getVitals(req.params.id);
    return res.status(200).json({
      message: 'Vitals retrieved successfully',
      count: vitals.length,
      vitals
    });
  } catch (error) {
    console.error('Get vitals error:', error);
    return res.status(500).json({ message: 'Error retrieving patient vitals' });
  }
};

module.exports = {
  logVitals,
  getVitals
};
